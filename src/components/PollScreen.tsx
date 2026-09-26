import type { PollOption, Screen } from "../types/poll";

type Props = {
  title: string;
  pollId: string;
  options: PollOption[];
  voteCounts: Record<string, number>;
  totalVotes: number;
  voted: boolean;
  loading: boolean;
  setScreen: (screen: Screen) => void;
  onVote: (optionId: string) => void;
  onShare: () => void;
};

export default function PollScreen({
  title,
  pollId,
  options,
  voteCounts,
  totalVotes,
  voted,
  loading,
  setScreen,
  onVote,
  onShare,
}: Props) {
  return (
    <main className="app">
      <button
        className="back"
        onClick={() => setScreen("home")}
      >
        ← На главную
      </button>

      <h1>{title}</h1>

      <p className="subtitle">
        {voted
          ? "Ваш голос принят!"
          : "Выберите один вариант:"}
      </p>

      <div className="poll-options">
        {options.map((option) => (
          <button
            key={option.id}
            className="poll-option"
            onClick={() => onVote(option.id)}
            disabled={voted || loading}
          >
            {option.text}
          </button>
        ))}
      </div>

      <button
        className="secondary"
        onClick={onShare}
      >
        📤 Поделиться голосованием
      </button>

      <h2>Результаты</h2>

      <p className="subtitle">
        Всего голосов: {totalVotes}
      </p>

      <div className="results">
        {options.map((option) => {
          const count =
            voteCounts[option.id] || 0;

          return (
            <div
              className="result-row"
              key={option.id}
            >
              <span>
                {option.text}
              </span>

              <strong>
                {count} голосов
              </strong>
            </div>
          );
        })}
      </div>

      <p className="poll-id">
        ID голосования: {pollId}
      </p>
    </main>
  );
}
