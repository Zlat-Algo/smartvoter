import type { Poll, Screen } from "../types/poll";

type Props = {
  polls: Poll[];
  loading: boolean;
  setScreen: (screen: Screen) => void;
  openPoll: (poll: Poll) => void;
};

export default function MyPolls({
  polls,
  loading,
  setScreen,
  openPoll,
}: Props) {
  return (
    <main className="app">
      <button
        className="back"
        onClick={() => setScreen("home")}
      >
        ← На главную
      </button>

      <h1>Мои голосования</h1>

      {loading ? (
        <p className="subtitle">Загружаем...</p>
      ) : polls.length === 0 ? (
        <p className="subtitle">
          У тебя пока нет голосований.
        </p>
      ) : (
        <div className="poll-list">
          {polls.map((poll) => (
            <button
              key={poll.id}
              className="poll-card"
              onClick={() => openPoll(poll)}
            >
              <strong>{poll.title}</strong>

              <span>
                Метод: обычное голосование
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
