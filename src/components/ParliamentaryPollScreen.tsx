import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Poll,
  PollOption,
  ParliamentaryResults,
} from "../types/poll";

type Stance =
  | "for"
  | "against"
  | "neutral";

type Props = {
  poll: Poll;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  results: ParliamentaryResults | null;
  now: number;
  onVote: (
    forOptionIds: string[],
    againstOptionIds: string[]
  ) => void;
  onShare: () => void;
  onBack: () => void;
};

function getPartyColor(
  optionIndex: number
) {
  return `hsl(${(
    (optionIndex * 137.508) %
    360
  )} 70% 55%)`;
}

function formatDate(
  value: string
) {
  return new Date(value).toLocaleString(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getTimeLeft(
  endsAt: string,
  now: number
) {
  const difference =
    new Date(endsAt).getTime() - now;

  if (difference <= 0) {
    return "Голосование завершено";
  }

  const totalMinutes = Math.floor(
    difference / 60000
  );

  const days = Math.floor(
    totalMinutes / 1440
  );

  const hours = Math.floor(
    (totalMinutes % 1440) / 60
  );

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `Осталось ${days} д. ${hours} ч.`;
  }

  if (hours > 0) {
    return `Осталось ${hours} ч. ${minutes} мин.`;
  }

  return `Осталось ${Math.max(
    minutes,
    1
  )} мин.`;
}

export default function ParliamentaryPollScreen({
  poll,
  options,
  voted,
  loading,
  results,
  now,
  onVote,
  onShare,
  onBack,
}: Props) {
  const [stances, setStances] =
    useState<Record<string, Stance>>(
      {}
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    const initial: Record<
      string,
      Stance
    > = {};

    for (const option of options) {
      initial[option.id] = "neutral";
    }

    setStances(initial);
    setError("");
  }, [poll.id, options]);

  const isExpired =
    poll.ends_at !== null &&
    new Date(poll.ends_at).getTime() <=
      now;

  const canRevote =
    poll.allow_revoting;

  const canVote =
    !loading &&
    !isExpired &&
    (!voted || canRevote);

  const resultsVisible =
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
      isExpired
    );

  const groupedAllocation =
    useMemo(() => {
      if (!results) {
        return [];
      }

      return [...options]
        .sort(
          (a, b) =>
            a.position - b.position
        )
        .flatMap((option) => {
          const count =
            results.seatCounts[
              option.id
            ] ?? 0;

          return Array.from(
            { length: count },
            () => option.id
          );
        });
    }, [options, results]);

  const sortedOptions =
    useMemo(() => {
      return [...options].sort(
        (a, b) =>
          a.position - b.position
      );
    }, [options]);

  function setStance(
    optionId: string,
    stance: Stance
  ) {
    if (!canVote) {
      return;
    }

    setError("");

    setStances((current) => ({
      ...current,
      [optionId]: stance,
    }));
  }

  function handleSubmit() {
    if (!canVote) {
      return;
    }

    const forOptionIds =
      options
        .filter(
          (option) =>
            stances[option.id] === "for"
        )
        .map((option) => option.id);

    const againstOptionIds =
      options
        .filter(
          (option) =>
            stances[option.id] ===
            "against"
        )
        .map((option) => option.id);

    if (
      forOptionIds.length === 0 &&
      againstOptionIds.length === 0
    ) {
      setError(
        "Выберите хотя бы одну партию: «За» или «Против»."
      );
      return;
    }

    setError("");

    onVote(
      forOptionIds,
      againstOptionIds
    );
  }

  return (
    <div className="page">
      <div className="screen-header">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          disabled={loading}
        >
          ←
        </button>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginBottom: 4,
            }}
          >
            Парламентское голосование
          </div>

          <h1
            style={{
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {poll.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={onShare}
          disabled={loading}
          style={{
            border: "none",
            background:
              "rgba(127,127,127,0.12)",
            borderRadius: 12,
            minWidth: 44,
            minHeight: 44,
            fontSize: 20,
            cursor: "pointer",
          }}
          aria-label="Поделиться"
        >
          ↗
        </button>
      </div>

      <div className="form-content">
        {poll.description && (
          <div
            className="form-intro"
            style={{
              marginBottom: 16,
            }}
          >
            {poll.description}
          </div>
        )}

        <div
          className="form-section"
          style={{
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div
              style={{
                padding:
                  "8px 12px",
                borderRadius: 10,
                background:
                  "rgba(127,127,127,0.12)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🏛️ {poll.parliamentary_seats ?? 450} мест
            </div>

            {poll.ends_at && (
              <div
                style={{
                  padding:
                    "8px 12px",
                  borderRadius: 10,
                  background:
                    isExpired
                      ? "rgba(220,53,69,0.12)"
                      : "rgba(127,127,127,0.12)",
                  fontSize: 14,
                }}
              >
                {isExpired
                  ? "Голосование завершено"
                  : getTimeLeft(
                      poll.ends_at,
                      now
                    )}
              </div>
            )}
          </div>

          {poll.ends_at && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                opacity: 0.6,
              }}
            >
              Окончание:{" "}
              {formatDate(
                poll.ends_at
              )}
            </div>
          )}
        </div>

        <div
          className="form-section"
          style={{
            marginBottom: 20,
          }}
        >
          <div className="field-label">
            Голосование
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              opacity: 0.7,
              marginBottom: 14,
            }}
          >
            Для каждой партии выберите
            «За», «Против» или
            «Нейтрально». Можно одобрить
            и отклонить несколько партий.
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {sortedOptions.map(
              (option, index) => {
                const stance =
                  stances[
                    option.id
                  ] ?? "neutral";

                const partyColor =
                  getPartyColor(index);

                return (
                  <div
                    key={option.id}
                    style={{
                      border:
                        "1px solid rgba(127,127,127,0.2)",
                      borderRadius: 14,
                      padding: 12,
                      background:
                        "rgba(127,127,127,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 9,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          minWidth: 12,
                          borderRadius: 3,
                          backgroundColor:
                            partyColor,
                        }}
                      />

                      <strong
                        style={{
                          wordBreak:
                            "break-word",
                          lineHeight: 1.3,
                        }}
                      >
                        {option.text}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: 7,
                      }}
                    >
                      <button
                        type="button"
                        disabled={
                          !canVote
                        }
                        onClick={() =>
                          setStance(
                            option.id,
                            "for"
                          )
                        }
                        style={{
                          minHeight: 44,
                          borderRadius: 10,
                          border:
                            "1px solid rgba(40,167,69,0.35)",
                          background:
                            stance ===
                            "for"
                              ? "rgba(40,167,69,0.18)"
                              : "transparent",
                          color:
                            "inherit",
                          fontWeight:
                            stance ===
                            "for"
                              ? 700
                              : 500,
                          cursor:
                            canVote
                              ? "pointer"
                              : "default",
                        }}
                      >
                        За
                      </button>

                      <button
                        type="button"
                        disabled={
                          !canVote
                        }
                        onClick={() =>
                          setStance(
                            option.id,
                            "neutral"
                          )
                        }
                        style={{
                          minHeight: 44,
                          borderRadius: 10,
                          border:
                            "1px solid rgba(127,127,127,0.3)",
                          background:
                            stance ===
                            "neutral"
                              ? "rgba(127,127,127,0.16)"
                              : "transparent",
                          color:
                            "inherit",
                          fontWeight:
                            stance ===
                            "neutral"
                              ? 700
                              : 500,
                          cursor:
                            canVote
                              ? "pointer"
                              : "default",
                        }}
                      >
                        Нейтрально
                      </button>

                      <button
                        type="button"
                        disabled={
                          !canVote
                        }
                        onClick={() =>
                          setStance(
                            option.id,
                            "against"
                          )
                        }
                        style={{
                          minHeight: 44,
                          borderRadius: 10,
                          border:
                            "1px solid rgba(220,53,69,0.35)",
                          background:
                            stance ===
                            "against"
                              ? "rgba(220,53,69,0.16)"
                              : "transparent",
                          color:
                            "inherit",
                          fontWeight:
                            stance ===
                            "against"
                              ? 700
                              : 500,
                          cursor:
                            canVote
                              ? "pointer"
                              : "default",
                        }}
                      >
                        Против
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 11,
                borderRadius: 10,
                background:
                  "rgba(220,53,69,0.1)",
                color:
                  "rgb(190,40,55)",
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {voted &&
            !poll.allow_revoting &&
            !isExpired && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  opacity: 0.65,
                  lineHeight: 1.4,
                }}
              >
                Вы уже проголосовали.
                Повторное голосование
                отключено.
              </div>
            )}

          {isExpired && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                opacity: 0.65,
              }}
            >
              Голосование завершено.
            </div>
          )}

          {!isExpired &&
            (!voted ||
              poll.allow_revoting) && (
              <button
                type="button"
                className="primary-button"
                onClick={handleSubmit}
                disabled={!canVote}
                style={{
                  width: "100%",
                  marginTop: 14,
                }}
              >
                {loading
                  ? "Сохранение…"
                  : voted &&
                    poll.allow_revoting
                  ? "Изменить голос"
                  : "Проголосовать"}
              </button>
            )}
        </div>

        <div className="form-section">
          <div className="field-label">
            Результаты
          </div>

          {!resultsVisible ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background:
                  "rgba(127,127,127,0.08)",
                fontSize: 14,
                lineHeight: 1.5,
                opacity: 0.75,
              }}
            >
              {poll.results_visibility ===
              "after_vote"
                ? "Результаты станут доступны после вашего голосования."
                : "Результаты станут доступны после окончания голосования."}
            </div>
          ) : !results ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                background:
                  "rgba(127,127,127,0.08)",
                fontSize: 14,
                opacity: 0.7,
              }}
            >
              Загрузка результатов…
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    padding:
                      "8px 12px",
                    borderRadius: 10,
                    background:
                      "rgba(127,127,127,0.12)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  🏛️ {results.seats} мест
                </div>

                {poll.show_participant_count && (
                  <div
                    style={{
                      padding:
                        "8px 12px",
                      borderRadius: 10,
                      background:
                        "rgba(127,127,127,0.12)",
                      fontSize: 14,
                    }}
                  >
                    👥{" "}
                    {
                      results.participantCount
                    }{" "}
                    участников
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: 16,
                  fontSize: 13,
                  lineHeight: 1.45,
                  opacity: 0.65,
                }}
              >
                Каждый мандат
                распределяется
                последовательно по сумме
                позиций голосов «За» и
                «Против».
              </div>

              <div
                style={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(12px, 1fr))",
                    gap: 3,
                    width: "100%",
                  }}
                >
                  {groupedAllocation.map(
                    (
                      optionId,
                      index
                    ) => {
                      const optionIndex =
                        sortedOptions.findIndex(
                          (option) =>
                            option.id ===
                            optionId
                        );

                      const option =
                        sortedOptions[
                          optionIndex
                        ];

                      return (
                        <div
                          key={`${optionId}-${index}`}
                          title={
                            option?.text ??
                            "Партия"
                          }
                          aria-label={
                            option?.text ??
                            "Партия"
                          }
                          style={{
                            width: "100%",
                            aspectRatio:
                              "1",
                            borderRadius: 3,
                            backgroundColor:
                              getPartyColor(
                                Math.max(
                                  optionIndex,
                                  0
                                )
                              ),
                          }}
                        />
                      );
                    }
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 9,
                }}
              >
                {sortedOptions.map(
                  (option, index) => {
                    const count =
                      results.seatCounts[
                        option.id
                      ] ?? 0;

                    return (
                      <div
                        key={option.id}
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 9,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 13,
                            height: 13,
                            minWidth: 13,
                            borderRadius: 3,
                            backgroundColor:
                              getPartyColor(
                                index
                              ),
                          }}
                        />

                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            wordBreak:
                              "break-word",
                            lineHeight: 1.3,
                          }}
                        >
                          {option.text}
                        </span>

                        <strong
                          style={{
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {count}{" "}
                          {count === 1
                            ? "место"
                            : count >= 2 &&
                                count <= 4
                              ? "места"
                              : "мест"}
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
