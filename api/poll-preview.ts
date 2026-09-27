import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_KEY;

const APP_URL =
  "https://smartvoter-tau.vercel.app";

const BOT_URL =
  "https://t.me/smart_voter_bot";

type Poll = {
  id: string;
  title: string;
  description: string;
  voting_method: string;
  created_at: string;
  results_visibility: string;
  ends_at: string | null;
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

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPartyColor(
  index: number
) {
  return `hsl(${(
    (index * 137.508) %
    360
  ).toFixed(0)} 70% 55%)`;
}

function methodName(
  method: string
) {
  switch (method) {
    case "plurality":
      return "Один выбор";

    case "multiple":
      return "Несколько вариантов";

    case "ranked":
      return "Ранжирование";

    case "yes_no":
      return "Да / Нет";

    case "rating":
      return "Оценка";

    case "parliamentary":
      return "Парламентское голосование";

    default:
      return "Голосование";
  }
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

async function loadPoll(
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

async function loadNormalResults(
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

async function loadParliamentaryResults(
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
        forIds: new Set<string>(),
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
      const partyId =
        option.id;

      let score = 0;

      for (const user of users.values()) {
        if (
          user.forIds.has(
            partyId
          )
        ) {
          let blockSeats = 0;

          for (const approvedId of user.forIds) {
            blockSeats +=
              seatCounts[
                approvedId
              ] ?? 0;
          }

          const partySeats =
            seatCounts[
              partyId
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
            partyId
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
          partyId;
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

function buildNormalResultsHtml(
  options: PollOption[],
  counts: Record<
    string,
    number
  >
) {
  return options
    .slice()
    .sort(
      (a, b) =>
        a.position - b.position
    )
    .map(
      (option, index) => {
        const count =
          counts[
            option.id
          ] ?? 0;

        return `
          <div class="result-row">
            <div class="party-dot"
                 style="background:${getPartyColor(
                   index
                 )}"></div>

            <div class="result-name">
              ${escapeHtml(
                option.text
              )}
            </div>

            <div class="result-count">
              ${count}
            </div>
          </div>
        `;
      }
    )
    .join("");
}

function buildParliamentaryResultsHtml(
  options: PollOption[],
  seatCounts: Record<
    string,
    number
  >
) {
  return options
    .slice()
    .sort(
      (a, b) =>
        a.position - b.position
    )
    .map(
      (option, index) => {
        const count =
          seatCounts[
            option.id
          ] ?? 0;

        return `
          <div class="result-row">
            <div class="party-dot"
                 style="background:${getPartyColor(
                   index
                 )}"></div>

            <div class="result-name">
              ${escapeHtml(
                option.text
              )}
            </div>

            <div class="result-count">
              ${count}
            </div>
          </div>
        `;
      }
    )
    .join("");
}

function buildSeatGrid(
  options: PollOption[],
  seatCounts: Record<
    string,
    number
  >
) {
  return options
    .slice()
    .sort(
      (a, b) =>
        a.position - b.position
    )
    .flatMap(
      (option, index) =>
        Array.from(
          {
            length:
              seatCounts[
                option.id
              ] ?? 0,
          },
          () => `
            <span
              class="seat"
              style="background:${getPartyColor(
                index
              )}"
            ></span>
          `
        )
    )
    .join("");
}

function renderPage(
  poll: Poll,
  options: PollOption[],
  resultsHtml: string,
  participantCount: number,
  seatGrid: string,
  resultsAreVisible: boolean
) {
  const title =
    poll.title ||
    "Голосование";

  const description =
    poll.description ||
    `${methodName(
      poll.voting_method
    )} в SmartVoter`;

  const startUrl =
    `${BOT_URL}?startapp=${encodeURIComponent(
      poll.id
    )}`;

  const previewDescription =
    resultsAreVisible
      ? `Результаты голосования${
          poll.show_participant_count
            ? ` · ${participantCount} участников`
            : ""
        }`
      : `Проголосуйте в SmartVoter · ${methodName(
          poll.voting_method
        )}`;

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>
    ${escapeHtml(title)} — SmartVoter
  </title>

  <meta
    name="description"
    content="${escapeHtml(
      previewDescription
    )}"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:site_name"
    content="SmartVoter"
  />

  <meta
    property="og:title"
    content="${escapeHtml(
      title
    )}"
  />

  <meta
    property="og:description"
    content="${escapeHtml(
      previewDescription
    )}"
  />

  <meta
    property="og:url"
    content="${APP_URL}/poll/${encodeURIComponent(
      poll.id
    )}"
  />

  <meta
    name="twitter:card"
    content="summary"
  />

  <meta
    name="twitter:title"
    content="${escapeHtml(
      title
    )}"
  />

  <meta
    name="twitter:description"
    content="${escapeHtml(
      previewDescription
    )}"
  />

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      background:
        linear-gradient(
          145deg,
          #f5f7fb,
          #ffffff
        );
      color: #15171a;
    }

    .page {
      width: min(
        100%,
        680px
      );
      margin: 0 auto;
      padding: 32px 18px 48px;
    }

    .brand {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      opacity: .55;
      margin-bottom: 12px;
    }

    .card {
      background: rgba(
        255,
        255,
        255,
        .92
      );
      border: 1px solid
        rgba(
          20,
          25,
          35,
          .09
        );
      border-radius: 24px;
      padding: 24px;
      box-shadow:
        0 12px 40px
        rgba(
          20,
          25,
          35,
          .08
        );
    }

    h1 {
      margin: 0;
      font-size: clamp(
        26px,
        7vw,
        42px
      );
      line-height: 1.08;
      word-break: break-word;
    }

    .description {
      margin-top: 14px;
      color: #626871;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }

    .stat {
      padding: 9px 12px;
      border-radius: 12px;
      background: #f0f2f5;
      font-size: 14px;
      font-weight: 650;
    }

    .section-title {
      margin-top: 26px;
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
      opacity: .55;
    }

    .results {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .result-row {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .party-dot {
      width: 13px;
      height: 13px;
      min-width: 13px;
      border-radius: 4px;
    }

    .result-name {
      flex: 1;
      min-width: 0;
      word-break: break-word;
      line-height: 1.3;
    }

    .result-count {
      font-weight: 800;
      white-space: nowrap;
    }

    .seats {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fill,
          minmax(12px, 1fr)
        );
      gap: 3px;
      margin-top: 4px;
    }

    .seat {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 3px;
    }

    .question-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .question {
      padding: 12px 14px;
      border-radius: 12px;
      background: #f3f4f6;
      line-height: 1.35;
      word-break: break-word;
    }

    .button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50px;
      margin-top: 24px;
      padding: 12px 18px;
      border-radius: 14px;
      background: #111827;
      color: white;
      text-decoration: none;
      font-weight: 800;
      text-align: center;
    }

    .hint {
      margin-top: 12px;
      text-align: center;
      color: #737981;
      font-size: 12px;
      line-height: 1.4;
    }
  </style>
</head>

<body>
  <main class="page">
    <div class="brand">
      SmartVoter
    </div>

    <section class="card">
      <h1>
        ${escapeHtml(title)}
      </h1>

      ${
        description
          ? `
            <div class="description">
              ${escapeHtml(
                description
              )}
            </div>
          `
          : ""
      }

      <div class="stats">
        <div class="stat">
          🗳️ ${escapeHtml(
            methodName(
              poll.voting_method
            )
          )}
        </div>

        ${
          poll.voting_method ===
            "parliamentary" &&
          poll.parliamentary_seats
            ? `
              <div class="stat">
                🏛️ ${
                  poll.parliamentary_seats
                } мест
              </div>
            `
            : ""
        }

        ${
          poll.show_participant_count &&
          resultsAreVisible
            ? `
              <div class="stat">
                👥 ${participantCount} участников
              </div>
            `
            : ""
        }
      </div>

      <div class="section-title">
        ${
          resultsAreVisible
            ? "Результаты"
            : "Варианты"
        }
      </div>

      ${
        resultsAreVisible
          ? `
            ${
              seatGrid
                ? `
                  <div class="seats">
                    ${seatGrid}
                  </div>
                `
                : ""
            }

            <div
              class="results"
              style="margin-top:16px"
            >
              ${resultsHtml}
            </div>
          `
          : `
            <div class="question-list">
              ${options
                .slice()
                .sort(
                  (a, b) =>
                    a.position -
                    b.position
                )
                .map(
                  (option) => `
                    <div class="question">
                      • ${escapeHtml(
                        option.text
                      )}
                    </div>
                  `
                )
                .join("")}
            </div>
          `
      }

      <a
        class="button"
        href="${startUrl}"
      >
        🗳️ Открыть голосование
      </a>

      <div class="hint">
        SmartVoter · голосуйте прямо в Telegram
      </div>
    </section>
  </main>
</body>
</html>`;
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
        "Poll ID is required"
      );
      return;
    }

    const loaded =
      await loadPoll(pollId);

    if (!loaded) {
      res.status(404).send(
        "Голосование не найдено"
      );
      return;
    }

    const {
      poll,
      options,
    } = loaded;

    const resultsAreVisible =
      poll.results_visibility ===
      "always";

    let resultsHtml = "";
    let participantCount = 0;
    let seatGrid = "";

    if (
      resultsAreVisible &&
      poll.voting_method ===
        "parliamentary"
    ) {
      const seats =
        poll.parliamentary_seats ??
        450;

      const results =
        await loadParliamentaryResults(
          pollId,
          options,
          seats
        );

      participantCount =
        results.participantCount;

      resultsHtml =
        buildParliamentaryResultsHtml(
          options,
          results.seatCounts
        );

      seatGrid =
        buildSeatGrid(
          options,
          results.seatCounts
        );
    } else if (
      resultsAreVisible
    ) {
      const results =
        await loadNormalResults(
          pollId
        );

      participantCount =
        results.participantCount;

      resultsHtml =
        buildNormalResultsHtml(
          options,
          results.counts
        );
    }

    const html =
      renderPage(
        poll,
        options,
        resultsHtml,
        participantCount,
        seatGrid,
        resultsAreVisible
      );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=300"
    );

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.status(200).send(html);
  } catch (error) {
    console.error(
      "Poll preview error:",
      error
    );

    res.status(500).send(
      "Не удалось создать превью голосования."
    );
  }
}
