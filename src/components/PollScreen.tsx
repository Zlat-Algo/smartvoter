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

function getVotesText(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (
    lastTwo >= 11 &&
    lastTwo <= 14
  ) {
    return "голосов";
  }

  if (lastOne === 1) {
    return "голос";
  }

  if (
    lastOne >= 2 &&
    lastOne <= 4
  ) {
    return "голоса";
  }

  return "голосов";
}

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
  const maxVotes = Math.max(
    ...options.map(
      (option) =>
        voteCounts[option.id] || 0
    ),
    0
  );

  return (
    <main className="app">
      <button
        className="back"
        onClick={() =>
          setScreen("home")
        }
      >
        ← На главную
      </button>

      <h1>{title}</h1>

      <p className="subtitle">
        {voted
          ? "Ваш голос принят!"
          : "Выберите один вариант:"}
      </p>

      {!voted && (
        <div className="poll-options">
          {options.map((option) => (
            <button
              key={option.id}
              className="poll-option"
              onClick={() =>
                onVote(option.id)
              }
              disabled={loading}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      <button
        className="secondary"
        onClick={onShare}
      >
        📤 Поделиться голосованием
      </button>

      <h2>📊 Результаты</h2>

      <p className="subtitle">
        Всего{" "}
        {totalVotes}{" "}
        {getVotesText(totalVotes)}
      </p>

      <div className="results">
        {options.map((option) => {
          const count =
            voteCounts[option.id] || 0;

          const percentage =
            totalVotes > 0
              ? Math.round(
                  (count /
                    totalVotes) *
                    100
                )
              : 0;

          const isWinner =
            maxVotes > 0 &&
            count === maxVotes;

          return (
            <div
              className="result-card"
              key={option.id}
            >
              <div className="result-header">
                <span>
                  {isWinner
                    ? "🏆 "
                    : ""}
                  {option.text}
                </span>

                <strong>
                  {percentage}%
                </strong>
              </div>

              <div className="result-bar">
                <div
                  className="result-bar-fill"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="result-count">
                {count}{" "}
                {getVotesText(count)}
              </div>
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
