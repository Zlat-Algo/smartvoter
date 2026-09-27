import {
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
  voteCounts: Record<string, number>;
  participantCount: number;
  now: number;
  onVote: (
    optionIds: string[]
  ) => void;
  onShare: () => void;
  onBack: () => void;
};

function formatTimeLeft(
  endsAt: string | null,
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

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 60) {
    return `Осталось ${minutes} мин.`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `Осталось ${hours} ч.`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `Осталось ${days} дн.`;
}

export default function PollScreen({
  poll,
  options,
  voted,
  loading,
  voteCounts,
  participantCount,
  now,
  onVote,
  onShare,
  onBack,
}: Props) {
  const [selected, setSelected] =
    useState<string[]>([]);

  const shuffledOptions =
    useMemo(() => {
      if (!poll.shuffle_options) {
        return options;
      }

      return [...options].sort(
        () => Math.random() - 0.5
      );
    }, [
      options,
      poll.shuffle_options,
    ]);

  const expired =
    Boolean(
      poll.ends_at &&
        new Date(
          poll.ends_at
        ).getTime() <= now
    );

  const canVote =
    !expired &&
    (!voted || poll.allow_revoting);

  const shouldShowResults =
    poll.results_visibility ===
      "always" ||
    (poll.results_visibility ===
      "after_vote" &&
      voted) ||
    (poll.results_visibility ===
      "after_expiration" &&
      expired);

  const maxChoices =
    poll.voting_method ===
    "multiple"
      ? Math.max(
          1,
          poll.max_choices
        )
      : 1;

  function toggleOption(
    optionId: string
  ) {
    if (!canVote) {
      return;
    }

    if (
      poll.voting_method !==
      "multiple"
    ) {
      setSelected([optionId]);
      return;
    }

    setSelected((current) => {
      if (
        current.includes(optionId)
      ) {
        return current.filter(
          (id) =>
            id !== optionId
        );
      }

      if (
        current.length >=
        maxChoices
      ) {
        return current;
      }

      return [
        ...current,
        optionId,
      ];
    });
  }

  function submit() {
    if (selected.length === 0) {
      alert(
        "Выберите хотя бы один вариант."
      );
      return;
    }

    onVote(selected);
  }

  function percentage(
    optionId: string
  ) {
    if (
      participantCount === 0
    ) {
      return 0;
    }

    return Math.round(
      ((voteCounts[optionId] ??
        0) /
        participantCount) *
        100
    );
  }

  const averageRating =
    poll.voting_method ===
    "rating" &&
    participantCount > 0
      ? options.reduce(
          (sum, option) =>
            sum +
            Number(option.text) *
              (voteCounts[
                option.id
              ] ?? 0),
          0
        ) / participantCount
      : 0;

  const timeLabel =
    formatTimeLeft(
      poll.ends_at,
      now
    );

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
          Голосование
        </div>

        <button
          className="share-button"
          onClick={onShare}
          disabled={loading}
        >
          ↗
        </button>
      </div>

      <section className="poll-content">
        <div className="poll-top">
          <div className="poll-type-badge">
            {poll.voting_method ===
            "plurality"
              ? "ОДИН ВАРИАНТ"
              : poll.voting_method ===
                "multiple"
              ? "НЕСКОЛЬКО ВАРИАНТОВ"
              : poll.voting_method ===
                "yes_no"
              ? "ДА / НЕТ"
              : "ОЦЕНКА"}
          </div>

          <h1 className="poll-title">
            {poll.title}
          </h1>

          {poll.description && (
            <p className="poll-description">
              {poll.description}
            </p>
          )}

          <div className="poll-meta">
            {poll.show_participant_count && (
              <span>
                👥{" "}
                {participantCount}{" "}
                {participantCount ===
                1
                  ? "участник"
                  : "участников"}
              </span>
            )}

            {timeLabel && (
              <span>
                ⏱️ {timeLabel}
              </span>
            )}
          </div>
        </div>

        {poll.voting_method ===
          "multiple" &&
          canVote && (
            <div className="selection-hint">
              Выберите до{" "}
              {maxChoices}{" "}
              вариантов
            </div>
          )}

        {poll.voting_method ===
          "rating" &&
          shouldShowResults &&
          participantCount > 0 && (
            <div className="rating-summary">
              <div className="rating-average">
                {averageRating.toFixed(
                  1
                )}
              </div>

              <div>
                <div className="rating-stars">
                  ⭐⭐⭐⭐⭐
                </div>

                <div className="rating-label">
                  средняя оценка
                </div>
              </div>
            </div>
          )}

        <div className="poll-options">
          {shuffledOptions.map(
            (option) => {
              const count =
                voteCounts[
                  option.id
                ] ?? 0;

              const percent =
                percentage(
                  option.id
                );

              const isSelected =
                selected.includes(
                  option.id
                );

              return (
                <button
                  type="button"
                  key={option.id}
                  className={`poll-option ${
                    isSelected
                      ? "selected"
                      : ""
                  } ${
                    !canVote
                      ? "readonly"
                      : ""
                  }`}
                  onClick={() =>
                    toggleOption(
                      option.id
                    )
                  }
                  disabled={
                    loading ||
                    !canVote
                  }
                >
                  {shouldShowResults && (
                    <div
                      className="result-fill"
                      style={{
                        width: `${percent}%`,
                      }}
                    />
                  )}

                  <div className="option-content">
                    <div className="option-check">
                      {isSelected
                        ? "✓"
                        : poll.voting_method ===
                          "multiple"
                        ? "○"
                        : ""}
                    </div>

                    <span className="option-text">
                      {option.text}
                    </span>

                    {shouldShowResults && (
                      <span className="option-percent">
                        {percent}%
                      </span>
                    )}
                  </div>

                  {shouldShowResults && (
                    <div className="option-subline">
                      {count}{" "}
                      {count === 1
                        ? "голос"
                        : "голосов"}
                    </div>
                  )}
                </button>
              );
            }
          )}
        </div>

        {canVote && (
          <button
            type="button"
            className="primary-button vote-button"
            onClick={submit}
            disabled={
              loading ||
              selected.length === 0
            }
          >
            {voted
              ? "Изменить голос"
              : "Проголосовать"}
          </button>
        )}

        {voted &&
          !poll.allow_revoting &&
          !expired && (
            <div className="info-message">
              ✓ Ваш голос принят
            </div>
          )}

        {expired && (
          <div className="closed-message">
            <span>✓</span>
            Голосование завершено
          </div>
        )}

        {!shouldShowResults && (
          <div className="private-results-message">
            Результаты станут доступны
            позже.
          </div>
        )}

        {poll.voting_method ===
          "multiple" &&
          shouldShowResults && (
            <div className="results-note">
              В голосовании можно было
              выбрать несколько вариантов,
              поэтому сумма процентов может
              быть больше 100%.
            </div>
          )}
      </section>
    </main>
  );
}
