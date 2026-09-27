import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

const APP_URL =
  "https://smartvoter-tau.vercel.app";

const BOT_USERNAME =
  "smart_voter_bot";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_KEY;

type TelegramInlineQuery = {
  id: string;
  query: string;
  from: {
    id: number;
  };
};

type TelegramUpdate = {
  inline_query?: TelegramInlineQuery;
};

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

async function telegramApi(
  method: string,
  body: Record<
    string,
    unknown
  >
) {
  if (!BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN_MISSING"
    );
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          body
        ),
      }
    );

  const data =
    await response.json();

  if (!data.ok) {
    throw new Error(
      data.description ??
        "Telegram API error"
    );
  }

  return data;
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

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /"/g,
      "&quot;"
    );
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

function extractPollId(
  query: string
) {
  const value =
    query.trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "poll:"
    )
  ) {
    return value.slice(5).trim();
  }

  if (
    value.startsWith(
      "poll "
    )
  ) {
    return value.slice(5).trim();
  }

  return value;
}

function buildMessageText(
  poll: Poll,
  options: PollOption[]
) {
  const lines: string[] = [];

  lines.push(
    `🗳️ <b>${escapeHtml(
      poll.title
    )}</b>`
  );

  if (
    poll.description
  ) {
    lines.push(
      escapeHtml(
        poll.description
      )
    );
  }

  lines.push("");

  lines.push(
    `📊 ${escapeHtml(
      methodName(
        poll.voting_method
      )
    )}`
  );

  if (
    poll.voting_method ===
      "parliamentary" &&
    poll.parliamentary_seats
  ) {
    lines.push(
      `🏛️ ${poll.parliamentary_seats} мест`
    );
  }

  if (
    poll.results_visibility !==
    "always"
  ) {
    lines.push("");
    lines.push(
      "👇 Откройте голосование и оставьте свой голос."
    );
  } else {
    lines.push("");
    lines.push(
      "📈 Результаты доступны в голосовании."
    );
  }

  if (options.length > 0) {
    lines.push("");

    for (
      const option of options.slice(
        0,
        5
      )
    ) {
      lines.push(
        `• ${escapeHtml(
          option.text
        )}`
      );
    }

    if (
      options.length > 5
    ) {
      lines.push(
        `• … и ещё ${
          options.length - 5
        }`
      );
    }
  }

  return lines.join(
    "\n"
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (
    req.method !==
    "POST"
  ) {
    res.status(405).send(
      "Method Not Allowed"
    );
    return;
  }

  try {
    const update =
      req.body as TelegramUpdate;

    const inlineQuery =
      update.inline_query;

    if (!inlineQuery) {
      res.status(200).json({
        ok: true,
      });

      return;
    }

    const pollId =
      extractPollId(
        inlineQuery.query
      );

    if (!pollId) {
      await telegramApi(
        "answerInlineQuery",
        {
          inline_query_id:
            inlineQuery.id,

          results: [],

          cache_time: 1,

          is_personal: true,

          button: {
            text:
              "🗳️ Выбрать голосование",

            start_parameter:
              "share",
          },
        }
      );

      res.status(200).json({
        ok: true,
      });

      return;
    }

    const loaded =
      await getPoll(
        pollId
      );

    if (!loaded) {
      await telegramApi(
        "answerInlineQuery",
        {
          inline_query_id:
            inlineQuery.id,

          results: [],

          cache_time: 1,

          is_personal: true,
        }
      );

      res.status(200).json({
        ok: true,
      });

      return;
    }

    const {
      poll,
      options,
    } = loaded;

    const imageUrl =
      `${APP_URL}/api/poll-card?id=${encodeURIComponent(
        poll.id
      )}`;

    const startUrl =
      `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(
        poll.id
      )}`;

    const messageText =
      buildMessageText(
        poll,
        options
      );

    await telegramApi(
      "answerInlineQuery",
      {
        inline_query_id:
          inlineQuery.id,

        cache_time: 30,

        is_personal: true,

        results: [
          {
            type: "photo",

            id:
              `poll_${poll.id}`,

            photo_url:
              imageUrl,

            thumbnail_url:
              imageUrl,

            photo_width: 1200,

            photo_height: 675,

            title:
              poll.title,

            description:
              poll.results_visibility ===
              "always"
                ? "Результаты голосования"
                : "Откройте и проголосуйте",

            caption:
              messageText,

            parse_mode:
              "HTML",

            show_caption_above_media:
              false,

            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text:
                      "🗳️ Открыть голосование",

                    url:
                      startUrl,
                  },
                ],
              ],
            },
          },
        ],
      }
    );

    res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "telegram-webhook error:",
      error
    );

    res.status(200).json({
      ok: false,
    });
  }
}
