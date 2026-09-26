import {
  useEffect,
  useState,
} from "react";

import type {
  Poll,
  PollOption,
  Screen,
} from "../types/poll";

type Props = {
  poll: Poll;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  now: number;
  voteCounts: Record<
    string,
    number
  >;
  setScreen: (screen: Screen) => void;
  onVote: (
    optionId: string
  ) => Promise<void>;
  onShare: () => void;
};

function getTimeText(
  endsAt: string | null | undefined
) {
  if (!endsAt) {
    return "Без ограничения";
  }

  const difference =
    new Date(
      endsAt
    ).getTime() - Date.now();

  if (difference <= 0) {
    return "Голосование завершено";
  }

  const minutes =
    Math.floor(
      difference / 60000
    );

  const days =
    Math.floor(
      minutes / 1440
    );

  const hours =
    Math.floor(
      (minutes % 1440) / 60
    );

  const mins =
    minutes % 60;

  if (days > 0) {
    return `${days} д ${hours} ч`;
  }

  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }

  return `${Math.max(
    1,
    mins
  )} мин`;
}

export default function PollScreen({
  poll,
  options,
  voted,
  loading,
  now,
  voteCounts,
  setScreen,
  onVote,
  onShare,
}: Props) {
  const [selectedOption, setSelectedOption] =
    useState<string | null>(
      null
    );

  const pollExpired =
    !!poll.ends_at &&
    new Date(
      poll.ends_at
    ).getTime() <= now;

  const showResults =
    poll.results_visibility ===
      "always" ||
    voted ||
    pollExpired;

  const totalVotes =
    Object.values(
      voteCounts
    ).reduce(
      (sum, count) =>
        sum + count,
      0
    );

  const submit = async () => {
    if (!selectedOption) {
      alert(
        "Выберите вариант."
      );
      return;
    }

    await onVote(
      selectedOption
    );

    setSelectedOption(null);
  };

  useEffect(() => {
    setSelectedOption(null);
  }, [poll.id]);

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
        {poll.title}
      </h1>

      <div
        style={{
          marginTop: 8,
          marginBottom: 18,
          padding: "10px 12px",
          borderRadius: 12,
          background:
            pollExpired
              ? "rgba(255, 80, 80, 0.10)"
              : "rgba(100, 150, 255, 0.10)",
          fontSize: 14,
        }}
      >
        {pollExpired
          ? "🔴 Голосование завершено"
          : `⏳ Осталось: ${getTimeText(
              poll.ends_at
            )}`}
      </div>

      {!pollExpired &&
        (!voted ||
          poll.allow_revoting) && (
          <>
            {voted &&
              poll.allow_revoting && (
                <p className="subtitle">
                  Ты уже голосовал.
                  Можно изменить свой
                  выбор.
                </p>
              )}

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 10,
              }}
            >
              {options.map(
                (option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={
                      selectedOption ===
                      option.id
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() =>
                      setSelectedOption(
                        option.id
                      )
                    }
                  >
                    {option.text}
                  </button>
                )
              )}
            </div>

            <button
              className="primary"
              onClick={submit}
              disabled={
                loading ||
                !selectedOption
              }
              style={{
                marginTop: 14,
              }}
            >
              {loading
                ? "Сохраняем..."
                : voted
                ? "Изменить голос"
                : "Проголосовать"}
            </button>
          </>
        )}

      {voted &&
        !poll.allow_revoting &&
        !pollExpired && (
          <p className="subtitle">
            ✅ Ваш голос принят.
          </p>
        )}

      {showResults && (
        <section
          style={{
            marginTop: 24,
          }}
        >
          <h2>
            Результаты
          </h2>

          <p className="subtitle">
            Всего голосов:{" "}
            {totalVotes}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 10,
            }}
          >
            {options.map(
              (option) => {
                const count =
                  voteCounts[
                    option.id
                  ] ?? 0;

                const percent =
                  totalVotes > 0
                    ? Math.round(
                        (count /
                          totalVotes) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={option.id}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        marginBottom:
                          4,
                      }}
                    >
                      <span>
                        {
                          option.text
                        }
                      </span>

                      <strong>
                        {count} ·{" "}
                        {percent}%
                      </strong>
                    </div>

                    <div
                      style={{
                        height: 8,
                        borderRadius:
                          999,
                        background:
                          "rgba(128,128,128,0.18)",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height:
                            "100%",
                          borderRadius:
                            999,
                          background:
                            "currentColor",
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {!showResults &&
        !pollExpired && (
          <p
            className="subtitle"
            style={{
              marginTop: 22,
            }}
          >
            Результаты будут
            доступны после
            голосования.
          </p>
        )}

      <button
        className="secondary"
        onClick={onShare}
        style={{
          marginTop: 24,
        }}
      >
        📤 Поделиться
      </button>
    </main>
  );
}
