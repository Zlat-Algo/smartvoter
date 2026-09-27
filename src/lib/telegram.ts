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
  title: string
) {
  const previewUrl =
    `https://smartvoter-tau.vercel.app/poll/${encodeURIComponent(
      pollId
    )}`;

  const telegramUrl =
    `https://t.me/smart_voter_bot?startapp=${encodeURIComponent(
      pollId
    )}`;

  const shareText =
    `🗳️ ${title}\n\nОткрыть голосование:`;

  const shareUrl =
    `https://t.me/share/url?url=${encodeURIComponent(
      previewUrl
    )}&text=${encodeURIComponent(
      shareText
    )}`;

  const tg =
    window.Telegram?.WebApp;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(
      shareUrl
    );
    return;
  }

  window.open(
    shareUrl,
    "_blank"
  );
}
