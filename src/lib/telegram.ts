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
        openTelegramLink?: (url: string) => void;
      };
    };
  }
}

export function initTelegram() {
  window.Telegram?.WebApp?.ready();
  window.Telegram?.WebApp?.expand();
}

export function getTelegramUserId(): number | null {
  return (
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id ??
    null
  );
}

export function getTelegramUserName(): string {
  return (
    window.Telegram?.WebApp?.initDataUnsafe?.user
      ?.first_name ?? "пользователь"
  );
}

export function getStartParam(): string | null {
  return (
    window.Telegram?.WebApp?.initDataUnsafe?.start_param ??
    null
  );
}

export function sharePoll(
  pollId: string,
  title: string
) {
  const pollLink =
    `https://t.me/smart_voter_bot?startapp=${pollId}`;

  const shareUrl =
    `https://t.me/share/url?url=${encodeURIComponent(
      pollLink
    )}&text=${encodeURIComponent(
      `🗳️ Голосование: ${title}`
    )}`;

  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(shareUrl);
    return;
  }

  navigator.clipboard
    .writeText(pollLink)
    .then(() => {
      alert(`Ссылка скопирована:\n\n${pollLink}`);
    })
    .catch(() => {
      alert(`Ссылка на голосование:\n\n${pollLink}`);
    });
}
