import {
  useEffect,
  useState,
} from "react";

import type {
  Poll,
  Screen,
} from "../types/poll";

type Props = {
  polls: Poll[];
  loading: boolean;
  setScreen: (screen: Screen) => void;
  openPoll: (pollId: string) => void;
  onDeletePoll: (
    pollId: string
  ) => Promise<void>;
};

function getTimeText(
  endsAt: string | null | undefined,
  now: number
) {
  if (!endsAt) {
    return "Без ограничения";
  }

  const end =
    new Date(endsAt).getTime();

  const difference =
    end - now;

  if (difference <= 0) {
    return "Голосование завершено";
  }

  const totalMinutes =
    Math.floor(
      difference / 60000
    );

  const days =
    Math.floor(
      totalMinutes / 1440
    );

  const hours =
    Math.floor(
      (totalMinutes % 1440) / 60
    );

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `Осталось: ${days} д ${hours} ч`;
  }

  if (hours > 0) {
    return `Осталось: ${hours} ч ${minutes} мин`;
  }

  return `Осталось: ${Math.max(
    1,
    minutes
  )} мин`;
}

function isExpired(
  endsAt: string | null | undefined,
  now: number
) {
  if (!endsAt) {
    return false;
  }

  return (
    new Date(endsAt).getTime() <=
    now
  );
}

export default function MyPolls({
  polls,
  loading,
  setScreen,
  openPoll,
  onDeletePoll,
}: Props) {
  const [now, setNow] =
    useState(Date.now());

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now());
      }, 30000);

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  const handleDelete =
    async (
      poll: Poll
    ) => {
      const confirmed =
        window.confirm(
          `Удалить голосование «${poll.title}»?\n\nЭто действие нельзя отменить.`
        );

      if (!confirmed) {
        return;
      }

      await onDeletePoll(
        poll.id
      );
    };

  return (
    <main className="app">
      <button
        className="back"
        onClick={() =>
          setScreen("home")
        }
      >
        ← Назад
      </button>

      <h1>
        Мои голосования
      </h1>

      {loading && (
        <p className="subtitle">
          Загружаем...
        </p>
      )}

      {!loading &&
        polls.length === 0 && (
          <p className="subtitle">
            У тебя пока нет
            созданных голосований.
          </p>
        )}

      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: 12,
          marginTop: 16,
        }}
      >
        {polls.map(
          (poll) => {
            const expired =
              isExpired(
                poll.ends_at,
                now
              );

            return (
              <div
                key={poll.id}
                className="poll-card"
                style={{
                  position:
                    "relative",
                  opacity:
                    expired ? 0.72 : 1,
                  border:
                    expired
                      ? "1px solid rgba(255, 90, 90, 0.45)"
                      : undefined,
                }}
              >
                <button
                  className="poll-card-open"
                  onClick={() =>
                    openPoll(
                      poll.id
                    )
                  }
                  style={{
                    width: "100%",
                    textAlign:
                      "left",
                    background:
                      "transparent",
                    border: "none",
                    padding: 0,
                    color:
                      "inherit",
                    cursor:
                      "pointer",
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        700,
                      fontSize:
                        17,
                      paddingRight:
                        45,
                    }}
                  >
                    {poll.title}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize:
                        14,
                      opacity:
                        0.75,
                    }}
                  >
                    {poll.voting_method ===
                    "ranked"
                      ? "🏆 Ранжирование"
                      : "🗳️ Обычное"}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize:
                        14,
                    }}
                  >
                    👥 Участников:{" "}
                    {poll.participant_count ??
                      0}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize:
                        14,
                      fontWeight:
                        expired
                          ? 600
                          : 500,
                    }}
                  >
                    {expired
                      ? "🔴 Голосование завершено"
                      : `⏳ ${getTimeText(
                          poll.ends_at,
                          now
                        )}`}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      poll
                    )
                  }
                  aria-label="Удалить голосование"
                  style={{
                    position:
                      "absolute",
                    top: 10,
                    right: 10,
                    width: 34,
                    height: 34,
                    border: "none",
                    borderRadius:
                      10,
                    background:
                      "rgba(255, 80, 80, 0.12)",
                    cursor:
                      "pointer",
                    fontSize:
                      17,
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          }
        )}
      </div>
    </main>
  );
}
