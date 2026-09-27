type Props = {
  telegramName: string;
  onCreate: () => void;
  onMyPolls: () => void;
  loading: boolean;
};

export default function HomeScreen({
  telegramName,
  onCreate,
  onMyPolls,
  loading,
}: Props) {
  return (
    <main className="page home-page">
      <div className="home-glow glow-one" />
      <div className="home-glow glow-two" />

      <section className="home-content">
        <div className="brand-mark">
          <span>🗳️</span>
        </div>

        <div className="brand-label">
          SMARTVOTER
        </div>

        <h1 className="home-title">
          Голосуй.
          <br />
          Решай вместе.
        </h1>

        <p className="home-subtitle">
          Создавай красивые голосования
          и собирай мнения в Telegram.
        </p>

        <div className="welcome-card">
          <div className="welcome-avatar">
            {telegramName
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <div className="welcome-small">
              Добро пожаловать
            </div>

            <div className="welcome-name">
              {telegramName}
            </div>
          </div>
        </div>

        <div className="home-actions">
          <button
            className="primary-button big-button"
            onClick={onCreate}
            disabled={loading}
          >
            <span>＋</span>
            Создать голосование
          </button>

          <button
            className="secondary-button big-button"
            onClick={onMyPolls}
            disabled={loading}
          >
            <span>▤</span>
            Мои голосования
            <span className="button-arrow">
              →
            </span>
          </button>
        </div>

        <div className="feature-row">
          <div className="feature-item">
            <span>⚡</span>
            Быстро
          </div>

          <div className="feature-item">
            <span>🔒</span>
            Надёжно
          </div>

          <div className="feature-item">
            <span>📊</span>
            Результаты
          </div>
        </div>
      </section>
    </main>
  );
}
