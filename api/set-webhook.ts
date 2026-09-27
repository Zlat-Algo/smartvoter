import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

const WEBHOOK_URL =
  "https://smartvoter-tau.vercel.app/api/telegram-webhook";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    res.status(405).send(
      "Method Not Allowed"
    );
    return;
  }

  try {
    if (!BOT_TOKEN) {
      res.status(500).json({
        ok: false,
        error:
          "TELEGRAM_BOT_TOKEN is not configured",
      });
      return;
    }

    const response =
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            url: WEBHOOK_URL,
          }),
        }
      );

    const data =
      await response.json();

    res.status(
      data.ok ? 200 : 500
    ).json(data);
  } catch (error) {
    console.error(
      "setWebhook error:",
      error
    );

    res.status(500).json({
      ok: false,
      error:
        "Failed to set webhook",
    });
  }
}
