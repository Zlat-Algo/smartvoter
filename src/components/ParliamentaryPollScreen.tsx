import {
  useMemo,
  useState,
} from "react";

import type {
  ParliamentaryStance,
  Poll,
  PollOption,
} from "../types/poll";

type Props = {
  poll: Poll;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  allocation: string[];
  counts: Record<string, number>;
  participantCount: number;
  now: number;

  onVote: (
    votes: {
      optionId: string;
      stance: "for" | "against";
    }[]
  ) => void;

  onShare: () => void;
  onBack: () => void;
};

export default function ParliamentaryPollScreen({
  poll,
  options,
  voted,
  loading,
  allocation,
  counts,
  participantCount,
  now,
  onVote,
  onShare,
  onBack,
}: Props) {
  const [stances, setStances] =
    useState<
      Record<
        string,
        ParliamentaryStance
      >
    >({});

  const [voteError, setVoteError] =
    useState("");

  const expired =
    !!poll.ends_at &&
    new Date(
      poll.ends_at
    ).getTime() <= now;

  const canSeeResults =
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
      expired
    );

  const hasActiveChoice =
    Object.values(stances).some(
      (stance) =>
        stance === "for" ||
        stance === "against"
    );

  const optionMap = useMemo(
    () =>
      new Map(
        options.map(
          (option) => [
            option.id,
            option,
          ]
        )
      ),
    [options]
  );

  function setStance(
    optionId: string,
    stance: ParliamentaryStance
  ) {
    if (
      loading ||
      (voted &&
        !poll.allow_revoting)
    ) {
      return;
    }

    setVoteError("");

    setStances((current) => ({
      ...current,
      [optionId]:
        current[optionId] === stance
          ? "none"
          : stance,
    }));
  }

  function submit() {
    if (
      expired ||
      loading
    ) {
      return;
    }

    if (
      voted &&
      !poll.allow_revoting
    ) {
      return;
    }

    if (!hasActiveChoice) {
      setVoteError(
        "Выберите хотя бы одну партию: «За» или «Против»."
      );
      return;
    }

    const votes =
      Object.entries(stances)
        .filter(
          (
            [, stance]
          ) =>
            stance === "for" ||
            stance === "against"
        )
        .map(
          ([
            optionId,
            stance,
          ]) => ({
            optionId,
            stance:
              stance as
                | "for"
                | "against",
          })
        );

    onVote(votes);
  }

  function formatNumber(
    value: number
  ) {
    return new Intl.NumberFormat(
      "ru-RU"
    ).format(value);
  }

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
          Парламентское голосование
        </div>

        <div className="header-spacer" />
      </div>

      <section className="form-content">
        <div className="form-intro">
          <div className="form-icon">
            🏛️
          </div>

          <div>
            <h1>
              {poll.title}
            </h1>

            {poll.description && (
              <p>
                {poll.description}
              </p>
            )}
          </div>
        </div>

        <div
          className="settings-card"
          style={{
            marginBottom: 18,
          }}
        >
          <div className="setting-row">
            <div className="setting-copy">
              <strong>
                Мест в парламенте
              </strong>

              <span>
                Одно место = один
                квадрат
              </span>
            </div>

            <strong>
              {formatNumber(
                poll.parliamentary_seats ??
                  0
              )}
            </strong>
          </div>

          {poll.show_participant_count && (
            <div className="setting-row">
              <div className="setting-copy">
                <strong>
                  Участники
                </strong>

                <span>
                  Проголосовали
                </span>
              </div>

              <strong>
                {formatNumber(
                  participantCount
                )}
              </strong>
            </div>
          )}
        </div>

        {!expired && (
          <div className="form-section">
            <div className="field-label">
              Ваша позиция
            </div>

            <div className="section-hint">
              Для каждой партии выберите
              «За», «Против» или ничего.
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 12,
              }}
            >
              {options.map(
                (option) => {
                  const stance =
                    stances[
                      option.id
                    ] ??
                    "none";

                  return (
                    <div
                      key={option.id}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        border:
                          "1px solid var(--tg-theme-hint-color, rgba(0,0,0,.1))",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 10,
                        }}
                      >
                        {option.text}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr 1fr",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          className={
                            stance ===
                            "for"
                              ? "primary-button"
                              : "secondary-button"
                          }
                          onClick={() =>
                            setStance(
                              option.id,
                              "for"
                            )
                          }
                          disabled={
                            loading ||
                            (
                              voted &&
                              !poll.allow_revoting
                            )
                          }
                        >
                          За
                        </button>

                        <button
                          type="button"
                          className={
                            stance ===
                            "none"
                              ? "primary-button"
                              : "secondary-button"
                          }
                          onClick={() =>
                            setStance(
                              option.id,
                              "none"
                            )
                          }
                          disabled={
                            loading ||
                            (
                              voted &&
                              !poll.allow_revoting
                            )
                          }
                        >
                          —
                        </button>

                        <button
                          type="button"
                          className={
                            stance ===
                            "against"
                              ? "primary-button"
                              : "secondary-button"
                          }
                          onClick={() =>
                            setStance(
                              option.id,
                              "against"
                            )
                          }
                          disabled={
                            loading ||
                            (
                              voted &&
                              !poll.allow_revoting
                            )
                          }
                        >
                          Против
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {voteError && (
              <div
                style={{
                  color: "#d93025",
                  fontSize: 13,
                  marginTop: 10,
                }}
              >
                {voteError}
              </div>
            )}

            <button
              type="button"
              className="primary-button create-button"
              onClick={submit}
              disabled={
                loading ||
                (
                  voted &&
                  !poll.allow_revoting
                )
              }
              style={{
                marginTop: 14,
              }}
            >
              {loading
                ? "Сохраняем…"
                : voted
                ? "Изменить голос"
                : "Проголосовать"}
            </button>
          </div>
        )}

        {expired && (
          <div
            className="settings-card"
            style={{
              marginBottom: 18,
            }}
          >
            <strong>
              Голосование завершено
            </strong>
          </div>
        )}

        {canSeeResults && (
          <div className="form-section">
            <div className="field-label">
              Состав парламента
            </div>

            <div className="section-hint">
              {formatNumber(
                allocation.length
              )}{" "}
              из{" "}
              {formatNumber(
                poll.parliamentary_seats ??
                  0
              )}{" "}
              мест распределено
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(16px, 1fr))",
                gap: 3,
                marginTop: 14,
                maxWidth: 520,
              }}
            >
              {allocation.map(
                (
                  optionId,
                  index
                ) => {
                  const option =
                    optionMap.get(
                      optionId
                    );

                  return (
                    <div
                      key={`${optionId}-${index}`}
                      title={
                        option?.text ??
                        "Партия"
                      }
                      style={{
                        width: "100%",
                        aspectRatio:
                          "1",
                        borderRadius:
                          3,
                        background:
                          getPartyColor(
                            optionId,
                            options
                          ),
                      }}
                    />
                  );
                }
              )}
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                marginTop: 18,
              }}
            >
              {options
                .filter(
                  (option) =>
                    (
                      counts[
                        option.id
                      ] ?? 0
                    ) > 0
                )
                .map(
                  (option) => (
                    <div
                      key={option.id}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          flexShrink: 0,
                          background:
                            getPartyColor(
                              option.id,
                              options
                            ),
                        }}
                      />

                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {option.text}
                      </span>

                      <strong>
                        {
                          counts[
                            option.id
                          ]
                        }
                      </strong>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={onShare}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 8,
          }}
        >
          Поделиться
        </button>
      </section>
    </main>
  );
}

function getPartyColor(
  optionId: string,
  options: PollOption[]
) {
  const index =
    options.findIndex(
      (option) =>
        option.id === optionId
    );

  const colors = [
    "#4F46E5",
    "#DB2777",
    "#059669",
    "#D97706",
    "#0891B2",
    "#7C3AED",
    "#DC2626",
    "#65A30D",
    "#9333EA",
    "#0284C7",
  ];

  return (
    colors[
      Math.max(
        0,
        index
      ) %
        colors.length
    ]
  );
}
