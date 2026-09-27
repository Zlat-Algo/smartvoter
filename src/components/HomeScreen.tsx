type Props = {
  telegramName: string;
  onCreate: () => void;
  onMyPolls: () => void;
  loading?: boolean;
};

export default function HomeScreen({
  telegramName,
  onCreate,
  onMyPolls,
  loading = false,
}: Props) {
  return (
    <main className="app">
      <div className="logo">
        🗳️
      </div>

      <h1>
        SmartVoter
      </h1>

      <p className="subtitle">
        Привет, {telegramName}! Создавай
        голосования с продвинутыми способами
        подсчёта голосов.
      </p>

      <button
        className="primary"
        onClick={onCreate}
      >
        Создать голосование
      </button>

      <button
        className="secondary"
        onClick={onMyPolls}
        disabled={loading}
      >
        {loading
          ? "Загружаем..."
          : "Мои голосования"}
      </button>
    </main>
  );
}
