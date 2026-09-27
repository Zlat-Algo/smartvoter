import { supabase } from "../supabase";
import { getTelegramInitData } from "./telegram";

export type AuthenticatedTelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type AuthResponse = {
  ok: boolean;
  user?: AuthenticatedTelegramUser;
  start_param?: string | null;
  error?: string;
};

export async function authenticateTelegram(): Promise<
  AuthenticatedTelegramUser
> {
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
          initData,
        },
      }
    );

  if (error) {
    console.error(
      "Telegram authentication error:",
      error
    );

    throw new Error(
      "TELEGRAM_AUTH_FAILED"
    );
  }

  const response =
    data as AuthResponse;

  if (
    !response.ok ||
    !response.user
  ) {
    console.error(
      "Telegram authentication rejected:",
      response.error
    );

    throw new Error(
      "TELEGRAM_AUTH_FAILED"
    );
  }

  return response.user;
}
