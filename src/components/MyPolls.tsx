import type { Poll } from "../types/poll";

type Props = {
  polls: Poll[];
  now: number;
  loading: boolean;
  onOpen: (
    pollId: string
  ) => void;
  onDelete: (
    pollId: string
  ) => void;
  onBack: () => void;
};

function methodName(
  method: string
) {
  switch (method) {
    case "plurality":
      return "Один вариант";

    case "multiple":
      return "Несколько вариантов";

    case "ranked":
      return "Рейтинг";

    case "yes_no":
      return "Да / Нет";

    case "rating":
      return "Оценка 1–5";

    default:
      return "Голосование";
  }
}

function status(
  poll: Poll,
  now: number
) {
  if (
    poll.ends_at &&
    new Date(
      poll.ends_at
    ).getTime() <= now
  ) {
    return "Завершено";
  }

  return "Активно";
}

export default function MyPolls({
  polls,
  now,
  loading,
  onOpen,
  onDelete,
  onBack,
}: Props) {
  return (
    <main className="page">
      <div className="screen-header">
        <button
          className="back-button"
          onClick={onBack}
          disabled={loading}
        >
          ←
        </button>

        <div className="screen-header-title">
          Мои голосования
        </div>

        <div className="header-spacer" />
      </div>

      <section className="my-polls-content">
        <div className="my-polls-intro">
          <div>
            <div className="eyebrow">
              ВАШИ ОПРОСЫ
            </div>

            <h1>
              Все голосования
            </h1>

            <p>
              Открывайте, делитесь
              или удаляйте созданные
              вами опросы.
            </p>
          </div>

          <div className="poll-count-big">
            {polls.length}
          </div>
        </div>

        {polls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🗳️
            </div>

            <h2>
              Пока ничего нет
            </h2>

            <p>
              Создайте первое
              голосование, чтобы оно
              появилось здесь.
            </p>
          </div>
        ) : (
          <div className="my-polls-list">
            {polls.map(
              (poll) => (
                <article
                  className="my-poll-card"
                  key={poll.id}
                >
                  <button
                    type="button"
                    className="my-poll-main"
                    onClick={() =>
                      onOpen(
                        poll.id
                      )
                    }
                    disabled={
                      loading
                    }
                  >
                    <div className="my-poll-card-top">
                      <span className="poll-mini-icon">
                        🗳️
                      </span>

                      <span
                        className={`status-badge ${
                          status(
                            poll,
                            now
                          ) ===
                          "Активно"
                            ? "active"
                            : "finished"
                        }`}
                      >
                        {status(
                          poll,
                          now
                        )}
                      </span>
                    </div>

                    <h2 className="my-poll-title">
                      {poll.title}
                    </h2>

                    {poll.description && (
                      <p className="my-poll-description">
                        {
                          poll.description
                        }
                      </p>
                    )}

                    <div className="my-poll-meta">
                      <span>
                        {
                          methodName(
                            poll.voting_method
                          )
                        }
                      </span>

                      <span>
                        👥{" "}
                        {
                          poll.participant_count ??
                          0
                        }
                      </span>

                      <span>
                        Открыть →
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="delete-poll-button"
                    onClick={() =>
                      onDelete(
                        poll.id
                      )
                    }
                    disabled={
                      loading
                    }
                    aria-label="Удалить голосование"
                  >
                    🗑️
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}
