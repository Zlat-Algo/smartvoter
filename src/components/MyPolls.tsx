import type { Poll, Screen } from "../types/poll";

type Props = {
  polls: Poll[];
  loading: boolean;
  setScreen: (screen: Screen) => void;
  openPoll: (poll: Poll) => void;
};

function getParticipantsText(
  count: number
): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (
    lastTwo >= 11 &&
    lastTwo <= 14
  ) {
    return "участников";
  }

  if (lastOne === 1) {
    return "участник";
  }

  if (
    lastOne >= 2 &&
    lastOne <= 4
  ) {
    return "участника";
  }

  return "участников";
}

function formatDate(
  dateString: string
): string {
  const date = new Date(
    dateString
  );

  return date.toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

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
        onClick={() =>
          setScreen("home")
        }
      >
        ← На главную
      </button>

      <h1>
        Мои голосования
      </h1>

      {loading ? (
        <p className="subtitle">
          Загружаем...
        </p>
      ) : polls.length === 0 ? (
        <p className="subtitle">
          У тебя пока нет
          голосований.
        </p>
      ) : (
        <div className="poll-list">
          {polls.map((poll) => {
            const isRanked =
              poll.voting_method ===
              "ranked";

            const participants =
              poll.participant_count ??
              0;

            return (
              <button
                key={poll.id}
                className="poll-card"
                onClick={() =>
                  openPoll(poll)
                }
              >
                <strong>
                  {isRanked
                    ? "🏆 "
                    : "🗳️ "}
                  {poll.title}
                </strong>

                <span>
                  {isRanked
                    ? "Ранжирование 🏆"
                    : "Обычное голосование 🗳️"}
                </span>

                <span>
                  👥{" "}
                  {participants}{" "}
                  {getParticipantsText(
                    participants
                  )}
                </span>

                <span>
                  📅{" "}
                  {formatDate(
                    poll.created_at
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
