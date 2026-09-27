declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;

        initData: string;

        initDataUnsafe?: {
          start_param?: string;
          user?: {
            id: number;
            first_name?: string;
            username?: string;
          };
        };

        openTelegramLink?: (
          url: string
        ) => void;
      };
    };
  }
}

export function initTelegram() {
  window.Telegram?.WebApp?.ready();
  window.Telegram?.WebApp?.expand();
}

export function getTelegramInitData(): string {
  return (
    window.Telegram?.WebApp
      ?.initData ?? ""
  );
}

/*
 * Временно оставляем получение ID
 * для существующего интерфейса.
 *
 * Позже записи в базу будут
 * проверяться сервером.
 */
export function getTelegramUserId(): number | null {
  return (
    window.Telegram?.WebApp
      ?.initDataUnsafe?.user?.id ??
    null
  );
}

export function getTelegramUserName(): string {
  return (
    window.Telegram?.WebApp
      ?.initDataUnsafe?.user
      ?.first_name ??
    "пользователь"
  );
}

export function getStartParam(): string | null {
  return (
    window.Telegram?.WebApp
      ?.initDataUnsafe?.start_param ??
    null
  );
}

export function sharePoll(
  pollId: string,
  _title: string
) {
  const query =
    `poll:${pollId}`;

  const inlineUrl =
    `https://t.me/${"smart_voter_bot"}?startapp=${encodeURIComponent(
      pollId
    )}`;

  const tg =
    window.Telegram?.WebApp;

  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(
      query,
      ["users", "groups"]
    );

    return;
  }

  window.open(
    `https://t.me/smart_voter_bot?startapp=${encodeURIComponent(
      pollId
    )}`,
    "_blank"
  );
}
