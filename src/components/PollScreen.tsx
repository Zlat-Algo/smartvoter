import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Poll,
  PollOption,
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
  onBack: () => void;
  onVote: (
    optionIds: string[]
  ) => Promise<void>;
  onShare: () => void;
};

function getTimeText(
  endsAt: string | null | undefined,
  now: number
) {
  if (!endsAt) {
    return null;
  }

  const difference =
    new Date(endsAt).getTime() -
    now;

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
    return `Осталось: ${days} д ${hours} ч`;
  }

  if (hours > 0) {
    return `Осталось: ${hours} ч ${mins} мин`;
  }

  return `Осталось: ${Math.max(
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
  onBack,
  onVote,
  onShare,
}: Props) {
  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<string[]>(
    []
  );

  const pollExpired =
    !!poll.ends_at &&
    new Date(
      poll.ends_at
    ).getTime() <= now;

  const canVote =
    !pollExpired &&
    (!voted ||
      poll.allow_revoting);

  const showResults =
    poll.results_visibility ===
      "always" ||
    (
      poll.results_visibility ===
        "after_vote" &&
      voted
    ) ||
    (
      poll.results_visibility ===
        "after_expiration" &&
      pollExpired
    );

  const displayOptions =
    useMemo(() => {
      if (
        !poll.shuffle_options
      ) {
        return options;
      }

      return [
        ...options,
      ].sort(
        () =>
          Math.random() -
          0.5
      );
    }, [
      options,
      poll.shuffle_options,
    ]);

  const totalVotes =
    poll.voting_method ===
    "multiple"
      ? new Set(
          Object.keys(
            voteCounts
          ).flatMap(
            (optionId) =>
              voteCounts[
                optionId
              ] > 0
                ? Array(
                    voteCounts[
                      optionId
                    ]
                  ).fill(
                    optionId
                  )
                : []
          )
        ).size
      : Object.values(
          voteCounts
        ).reduce(
          (
            sum,
            count
          ) =>
            sum + count,
          0
        );

  const participantCount =
    poll.voting_method ===
      "multiple"
      ? Math.max(
          ...Object.values(
            voteCounts
          ),
          0
        )
      : totalVotes;

  useEffect(() => {
    setSelectedOptions([]);
  }, [poll.id]);

  const toggleOption = (
    optionId: string
  ) => {
    if (
      poll.voting_method ===
        "plurality" ||
      poll.voting_method ===
        "yes_no" ||
      poll.voting_method ===
        "rating"
    ) {
      setSelectedOptions([
        optionId,
      ]);

      return;
    }

    setSelectedOptions(
      (current) => {
        if (
          current.includes(
            optionId
          )
        ) {
          return current.filter(
            (id) =>
              id !== optionId
          );
        }

        if (
          current.length >=
          poll.max_choices
        ) {
          return current;
        }

        return [
          ...current,
          optionId,
        ];
      }
    );
  };

  const submit = async () => {
    if (
      selectedOptions.length ===
      0
    ) {
      alert(
        "Выберите вариант."
      );
      return;
    }

    await onVote(
      selectedOptions
    );

    setSelectedOptions([]);
  };

  const timeText =
    getTimeText(
      poll.ends_at,
      now
    );

  return (
    <main className="app">
      <button
        className="back"
        onClick={onBack}
      >
        ← Назад
      </button>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h1>
            {poll.title}
          </h1>

          {poll.description && (
            <p className="subtitle">
              {
                poll.description
              }
            </p>
          )}
        </div>
      </div>

      {timeText && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 18,
            padding: "10px 12px",
            borderRadius: 12,
            background:
              pollExpired
                ? "rgba(255,80,80,0.10)"
                : "rgba(100,150,255,0.10)",
          }}
        >
          {pollExpired
            ? "🔴 Голосование завершено"
            : `⏳ ${timeText}`}
        </div>
      )}

      {poll.voting_method ===
        "multiple" &&
        canVote && (
          <p className="subtitle">
            Можно выбрать до{" "}
            {poll.max_choices}{" "}
            вариантов.
          </p>
        )}

      {canVote && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: 10,
            }}
          >
            {displayOptions.map(
              (option) => {
                const selected =
                  selectedOptions.includes(
                    option.id
                  );

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      toggleOption(
                        option.id
                      )
                    }
                    style={{
                      width: "100%",
                      textAlign:
                        "left",
                      padding:
                        "15px 16px",
                      borderRadius:
                        16,
                      border:
                        selected
                          ? "2px solid currentColor"
                          : "1px solid rgba(128,128,128,0.22)",
                      background:
                        selected
                          ? "rgba(100,150,255,0.13)"
                          : "rgba(128,128,128,0.07)",
                      color:
                        "inherit",
                      fontSize: 16,
                      cursor:
                        "pointer",
                    }}
                  >
                    <span>
                      {selected
                        ? "✓ "
                        : ""}
                      {poll.voting_method ===
                        "rating" &&
                        "⭐ "}
                      {
                        option.text
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <button
            className="primary"
            onClick={submit}
            disabled={
              loading ||
              selectedOptions.length ===
                0
            }
            style={{
              marginTop: 16,
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
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              background:
                "rgba(50,180,100,0.10)",
            }}
          >
            ✅ Ваш голос принят.
          </div>
        )}

      {showResults && (
        <section
          style={{
            marginTop: 28,
          }}
        >
          <h2>
            Результаты
          </h2>

          {poll.show_participant_count && (
            <p className="subtitle">
              👥 Участников:{" "}
              {participantCount}
            </p>
          )}

          {poll.voting_method ===
            "rating" ? (
            <RatingResults
              options={
                options
              }
              counts={
                voteCounts
              }
            />
          ) : (
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: 12,
              }}
            >
              {options.map(
                (option) => {
                  const count =
                    voteCounts[
                      option.id
                    ] ?? 0;

                  const denominator =
                    poll.voting_method ===
                    "multiple"
                      ? Math.max(
                          participantCount,
                          1
                        )
                      : Math.max(
                          totalVotes,
                          1
                        );

                  const percent =
                    Math.round(
                      (count /
                        denominator) *
                        100
                    );

                  return (
                    <div
                      key={
                        option.id
                      }
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: 5,
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
                          height: 9,
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
                            width: `${Math.min(
                              percent,
                              100
                            )}%`,
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
          )}
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
            🔒 Результаты пока
            скрыты согласно
            настройкам голосования.
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

function RatingResults({
  options,
  counts,
}: {
  options: PollOption[];
  counts: Record<
    string,
    number
  >;
}) {
  let total = 0;
  let sum = 0;

  options.forEach(
    (option) => {
      const value =
        Number(option.text);

      const count =
        counts[option.id] ??
        0;

      total += count;
      sum +=
        value * count;
    }
  );

  const average =
    total > 0
      ? (
          sum / total
        ).toFixed(1)
      : "—";

  return (
    <div>
      <div
        style={{
          padding: 18,
          borderRadius: 18,
          background:
            "rgba(255,190,50,0.12)",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          ⭐ {average}
        </div>

        <div
          style={{
            opacity: 0.7,
          }}
        >
          Средняя оценка
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: 8,
        }}
      >
        {options.map(
          (option) => (
            <div
              key={option.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                padding:
                  "10px 12px",
                borderRadius: 12,
                background:
                  "rgba(128,128,128,0.08)",
              }}
            >
              <span>
                ⭐ {option.text}
              </span>

              <strong>
                {counts[
                  option.id
                ] ?? 0}
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}
