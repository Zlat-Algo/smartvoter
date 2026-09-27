import { supabase } from "../supabase";
import { getTelegramInitData } from "./telegram";

type ApiResponse = {
  ok: boolean;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  error?: string;
};

export async function authenticateTelegram() {
  const initData =
    getTelegramInitData();

  if (!initData) {
    throw new Error(
      "TELEGRAM_NOT_AVAILABLE"
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "telegram-api",
      {
        body: {
          action: "auth",
          initData,
        },
      }
    );

  if (error) {
    console.error(
      "Telegram auth error:",
      error
    );

    throw new Error(
      "TELEGRAM_AUTH_FAILED"
    );
  }

  const response =
    data as ApiResponse;

  if (
    !response.ok ||
    !response.user
  ) {
    console.error(
      "Telegram auth rejected:",
      response.error
    );

    throw new Error(
      "TELEGRAM_AUTH_FAILED"
    );
  }

  return response.user;
}
