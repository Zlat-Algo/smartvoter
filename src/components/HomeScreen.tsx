import type { Screen } from "../types/poll";

type Props = {
  telegramName: string;
  loading: boolean;
  setScreen: (screen: Screen) => void;
  loadMyPolls: () => void;
};

export default function HomeScreen({
  telegramName,
  loading,
  setScreen,
  loadMyPolls,
}: Props) {
  return (
    <main className="app">
      <div className="logo">🗳️</div>

      <h1>SmartVoter</h1>

      <p className="subtitle">
        Привет, {telegramName}! Создавай голосования
        с продвинутыми способами подсчёта голосов.
      </p>

      <button
        className="primary"
        onClick={() => setScreen("create")}
      >
        Создать голосование
      </button>

      <button
        className="secondary"
        onClick={loadMyPolls}
        disabled={loading}
      >
        {loading ? "Загружаем..." : "Мои голосования"}
      </button>
    </main>
  );
}
