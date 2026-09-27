import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import sharp from "sharp";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_KEY;

type Poll = {
  id: string;
  title: string;
  description: string;
  voting_method: string;
  results_visibility: string;
  parliamentary_seats: number | null;
  show_participant_count: boolean;
};

type PollOption = {
  id: string;
  text: string;
  position: number;
};

type Vote = {
  option_id: string;
  telegram_user_id: number;
};

type ParliamentaryVote = {
  option_id: string;
  telegram_user_id: number;
  stance: "for" | "against";
};

function escapeXml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(
      /'/g,
      "&apos;"
    );
}

function partyColor(
  index: number
) {
  return `hsl(${(
    (index * 137.508) %
    360
  ).toFixed(0)} 70% 55%)`;
}

async function supabaseGet<T>(
  table: string,
  query: string
): Promise<T[]> {
  if (
    !SUPABASE_URL ||
    !SUPABASE_KEY
  ) {
    throw new Error(
      "SUPABASE_ENV_MISSING"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization:
            `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `SUPABASE_${response.status}`
    );
  }

  return response.json();
}

async function getPoll(
  pollId: string
) {
  const polls =
    await supabaseGet<Poll>(
      "polls",
      `select=*&id=eq.${encodeURIComponent(
        pollId
      )}&limit=1`
    );

  if (!polls[0]) {
    return null;
  }

  const options =
    await supabaseGet<PollOption>(
      "poll_options",
      `select=*&poll_id=eq.${encodeURIComponent(
        pollId
      )}&order=position.asc`
    );

  return {
    poll: polls[0],
    options,
  };
}

async function getNormalResults(
  pollId: string
) {
  const votes =
    await supabaseGet<Vote>(
      "votes",
      `select=option_id,telegram_user_id&poll_id=eq.${encodeURIComponent(
        pollId
      )}`
    );

  const counts: Record<
    string,
    number
  > = {};

  const participants =
    new Set<number>();

  for (const vote of votes) {
    counts[vote.option_id] =
      (counts[vote.option_id] ?? 0) +
      1;

    participants.add(
      vote.telegram_user_id
    );
  }

  return {
    counts,
    participantCount:
      participants.size,
  };
}

async function getParliamentaryResults(
  pollId: string,
  options: PollOption[],
  seats: number
) {
  const votes =
    await supabaseGet<ParliamentaryVote>(
      "parliamentary_votes",
      `select=option_id,telegram_user_id,stance&poll_id=eq.${encodeURIComponent(
        pollId
      )}`
    );

  const users = new Map<
    number,
    {
      forIds: Set<string>;
      againstIds: Set<string>;
    }
  >();

  for (const vote of votes) {
    let user =
      users.get(
        vote.telegram_user_id
      );

    if (!user) {
      user = {
        forIds:
          new Set<string>(),
        againstIds:
          new Set<string>(),
      };

      users.set(
        vote.telegram_user_id,
        user
      );
    }

    if (vote.stance === "for") {
      user.forIds.add(
        vote.option_id
      );
    } else {
      user.againstIds.add(
        vote.option_id
      );
    }
  }

  const seatCounts: Record<
    string,
    number
  > = {};

  for (const option of options) {
    seatCounts[option.id] = 0;
  }

  for (
    let seat = 0;
    seat < seats;
    seat++
  ) {
    let bestOptionId: string | null =
      null;

    let bestScore =
      -Infinity;

    let bestPosition =
      Infinity;

    for (const option of options) {
      let score = 0;

      for (const user of users.values()) {
        if (
          user.forIds.has(
            option.id
          )
        ) {
          let blockSeats = 0;

          for (
            const approvedId of
              user.forIds
          ) {
            blockSeats +=
              seatCounts[
                approvedId
              ] ?? 0;
          }

          const partySeats =
            seatCounts[
              option.id
            ] ?? 0;

          const position =
            (
              1 /
                (blockSeats + 1) +
              1 /
                (partySeats + 1)
            ) /
            2;

          score += position;
        } else if (
          user.againstIds.has(
            option.id
          )
        ) {
          let opposedSeats = 0;

          for (
            const opposedId of
              user.againstIds
          ) {
            opposedSeats +=
              seatCounts[
                opposedId
              ] ?? 0;
          }

          const position =
            -1 /
            (seats -
              opposedSeats);

          score += position;
        }
      }

      if (
        score > bestScore ||
        (
          score === bestScore &&
          option.position <
            bestPosition
        )
      ) {
        bestScore = score;
        bestOptionId =
          option.id;
        bestPosition =
          option.position;
      }
    }

    if (bestOptionId) {
      seatCounts[
        bestOptionId
      ] =
        (seatCounts[
          bestOptionId
        ] ?? 0) + 1;
    }
  }

  return {
    seatCounts,
    participantCount:
      users.size,
  };
}

function wrapText(
  text: string,
  maxLength: number
) {
  if (text.length <= maxLength) {
    return [text];
  }

  const words =
    text.split(/\s+/);

  const lines: string[] = [];

  let current = "";

  for (const word of words) {
    if (
      (
        current +
        " " +
        word
      ).trim().length >
      maxLength
    ) {
      if (current) {
        lines.push(current);
      }

      current = word;
    } else {
      current =
        `${current} ${word}`.trim();
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

function buildSvg(
  poll: Poll,
  options: PollOption[],
  results: {
    counts?: Record<string, number>;
    seatCounts?: Record<
      string,
      number
    >;
    participantCount: number;
  } | null
) {
  const width = 1200;
  const height = 675;

  const titleLines =
    wrapText(
      poll.title ||
        "Голосование",
      32
    );

  const titleSvg =
    titleLines
      .map(
        (line, index) =>
          `<text
            x="70"
            y="${115 + index * 54}"
            font-size="48"
            font-weight="800"
            fill="#17191d"
          >${escapeXml(
            line
          )}</text>`
      )
      .join("");

  const visibleResults =
    poll.results_visibility ===
      "always" &&
    results !== null;

  let content = "";

  if (
    visibleResults &&
    poll.voting_method ===
      "parliamentary" &&
    results?.seatCounts
  ) {
    const sorted =
      [...options].sort(
        (a, b) =>
          a.position -
          b.position
      );

    let x = 70;
    let y = 330;

    const squareSize = 18;
    const gap = 4;
    const maxPerRow = 48;

    const seats: string[] = [];

    for (
      const option of sorted
    ) {
      const count =
        results.seatCounts[
          option.id
        ] ?? 0;

      const index =
        sorted.indexOf(
          option
        );

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const seatIndex =
          seats.length;

        const col =
          seatIndex %
          maxPerRow;

        const row =
          Math.floor(
            seatIndex /
              maxPerRow
          );

        const sx =
          x +
          col *
            (squareSize + gap);

        const sy =
          y +
          row *
            (squareSize + gap);

        seats.push(`
          <rect
            x="${sx}"
            y="${sy}"
            width="${squareSize}"
            height="${squareSize}"
            rx="4"
            fill="${partyColor(
              index
            )}"
          />
        `);
      }
    }

    content = `
      <text
        x="70"
        y="285"
        font-size="25"
        font-weight="700"
        fill="#555b64"
      >
        ${poll.parliamentary_seats ?? 450} мест
        ${
          poll.show_participant_count
            ? ` · ${results.participantCount} участников`
            : ""
        }
      </text>

      ${seats.join("")}
    `;
  } else if (
    visibleResults &&
    results?.counts
  ) {
    const sorted =
      [...options].sort(
        (a, b) =>
          (
            results.counts?.[
              b.id
            ] ?? 0
          ) -
          (
            results.counts?.[
              a.id
            ] ?? 0
          )
      );

    content =
      sorted
        .slice(0, 5)
        .map(
          (
            option,
            index
          ) => {
            const count =
              results.counts?.[
                option.id
              ] ?? 0;

            const y =
              325 +
              index * 54;

            return `
              <rect
                x="70"
                y="${y - 22}"
                width="18"
                height="18"
                rx="5"
                fill="${partyColor(
                  option.position
                )}"
              />

              <text
                x="105"
                y="${y - 5}"
                font-size="25"
                font-weight="650"
                fill="#22252a"
              >
                ${escapeXml(
                  option.text
                )}
              </text>

              <text
                x="1080"
                y="${y - 5}"
                text-anchor="end"
                font-size="27"
                font-weight="800"
                fill="#17191d"
              >
                ${count}
              </text>
            `;
          }
        )
        .join("");
  } else {
    content =
      options
        .slice(0, 5)
        .map(
          (
            option,
            index
          ) => {
            const y =
              325 +
              index * 54;

            return `
              <rect
                x="70"
                y="${y - 22}"
                width="18"
                height="18"
                rx="5"
                fill="${partyColor(
                  index
                )}"
              />

              <text
                x="105"
                y="${y - 5}"
                font-size="25"
                font-weight="650"
                fill="#22252a"
              >
                ${escapeXml(
                  option.text
                )}
              </text>
            `;
          }
        )
        .join("");
  }

  const badge =
    visibleResults
      ? "Результаты"
      : "Голосование";

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <defs>
        <linearGradient
          id="background"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#eef2ff"
          />

          <stop
            offset="100%"
            stop-color="#ffffff"
          />
        </linearGradient>
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#background)"
      />

      <circle
        cx="1080"
        cy="90"
        r="120"
        fill="#6366f1"
        opacity="0.08"
      />

      <circle
        cx="80"
        cy="650"
        r="150"
        fill="#14b8a6"
        opacity="0.06"
      />

      <text
        x="70"
        y="58"
        font-size="20"
        font-weight="800"
        letter-spacing="3"
        fill="#6366f1"
      >
        SMARTVOTER
      </text>

      <text
        x="1130"
        y="58"
        text-anchor="end"
        font-size="18"
        font-weight="700"
        fill="#70757d"
      >
        ${badge}
      </text>

      ${titleSvg}

      ${content}

      <text
        x="70"
        y="625"
        font-size="18"
        font-weight="600"
        fill="#777d86"
      >
        Откройте голосование в Telegram
      </text>
    </svg>
  `;

  return svg;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const pollId =
      typeof req.query.id ===
      "string"
        ? req.query.id
        : "";

    if (!pollId) {
      res.status(400).send(
        "Missing poll id"
      );
      return;
    }

    const loaded =
      await getPoll(pollId);

    if (!loaded) {
      res.status(404).send(
        "Poll not found"
      );
      return;
    }

    const {
      poll,
      options,
    } = loaded;

    let results = null;

    if (
      poll.results_visibility ===
      "always"
    ) {
      if (
        poll.voting_method ===
        "parliamentary"
      ) {
        results =
          await getParliamentaryResults(
            pollId,
            options,
            poll.parliamentary_seats ??
              450
          );
      } else {
        const normal =
          await getNormalResults(
            pollId
          );

        results = {
          counts:
            normal.counts,
          participantCount:
            normal.participantCount,
        };
      }
    }

    const svg =
      buildSvg(
        poll,
        options,
        results
      );

    const jpeg =
      await sharp(
        Buffer.from(svg)
      )
        .jpeg({
          quality: 88,
        })
        .toBuffer();

    res.setHeader(
      "Content-Type",
      "image/jpeg"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=300"
    );

    res.status(200).send(
      jpeg
    );
  } catch (error) {
    console.error(
      "poll-card error:",
      error
    );

    res.status(500).send(
      "Failed to generate image"
    );
  }
}
