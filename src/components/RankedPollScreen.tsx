import {
  useMemo,
  useState,
} from "react";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import type {
  Poll,
  PollOption,
} from "../types/poll";

type Props = {
  poll: Poll;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  rankedScores: Record<string, number>;
  participantCount: number;
  now: number;
  onVote: (
    ids: string[]
  ) => void;
  onShare: () => void;
  onBack: () => void;
};

type SortableOptionProps = {
  option: PollOption;
  index: number;
  disabled: boolean;
};

function SortableOption({
  option,
  index,
  disabled,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: option.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(
      transform
    ),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rank-option"
      {...attributes}
    >
      <button
        type="button"
        className="rank-number"
        {...listeners}
        disabled={disabled}
        aria-label={`Место ${index + 1}`}
      >
        {index + 1}
      </button>

      <span className="rank-text">
        {option.text}
      </span>

      <span className="rank-dots">
        ⋮⋮
      </span>
    </div>
  );
}

function formatTimeLeft(
  endsAt: string | null,
  now: number
) {
  if (!endsAt) {
    return null;
  }

  const diff =
    new Date(endsAt).getTime() -
    now;

  if (diff <= 0) {
    return "Голосование завершено";
  }

  const minutes = Math.floor(
    diff / 60000
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

  return `Осталось ${Math.floor(
    hours / 24
  )} дн.`;
}

export default function RankedPollScreen({
  poll,
  options,
  voted,
  loading,
  rankedScores,
  participantCount,
  now,
  onVote,
  onShare,
  onBack,
}: Props) {
  const [orderedOptions, setOrderedOptions] =
    useState(options);

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

  const results = useMemo(() => {
    return [...options].sort(
      (a, b) =>
        (rankedScores[b.id] ??
          0) -
        (rankedScores[a.id] ??
          0)
    );
  }, [
    options,
    rankedScores,
  ]);

  function handleDragEnd(
    event: DragEndEvent
  ) {
    if (!canVote) {
      return;
    }

    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    setOrderedOptions(
      (current) => {
        const oldIndex =
          current.findIndex(
            (item) =>
              item.id ===
              active.id
          );

        const newIndex =
          current.findIndex(
            (item) =>
              item.id ===
              over.id
          );

        return arrayMove(
          current,
          oldIndex,
          newIndex
        );
      }
    );
  }

  function submit() {
    onVote(
      orderedOptions.map(
        (option) => option.id
      )
    );
  }

  function medal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  }

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
          Рейтинг
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
            РЕЙТИНГ
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

        {canVote && (
          <div className="selection-hint">
            Перетащите варианты так,
            чтобы сверху был ваш любимый.
          </div>
        )}

        {canVote && (
          <DndContext
            collisionDetection={
              closestCenter
            }
            onDragEnd={
              handleDragEnd
            }
          >
            <SortableContext
              items={orderedOptions.map(
                (option) =>
                  option.id
              )}
              strategy={
                verticalListSortingStrategy
              }
            >
              <div className="rank-options">
                {orderedOptions.map(
                  (
                    option,
                    index
                  ) => (
                    <SortableOption
                      key={option.id}
                      option={option}
                      index={index}
                      disabled={
                        loading ||
                        !canVote
                      }
                    />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!canVote && (
          <div className="rank-options">
            {orderedOptions.map(
              (
                option,
                index
              ) => (
                <div
                  className="rank-option readonly"
                  key={option.id}
                >
                  <span className="rank-number">
                    {index + 1}
                  </span>

                  <span className="rank-text">
                    {option.text}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {canVote && (
          <button
            type="button"
            className="primary-button vote-button"
            onClick={submit}
            disabled={loading}
          >
            {voted
              ? "Изменить рейтинг"
              : "Сохранить рейтинг"}
          </button>
        )}

        {voted &&
          !poll.allow_revoting &&
          !expired && (
            <div className="info-message">
              ✓ Ваш рейтинг принят
            </div>
          )}

        {expired && (
          <div className="closed-message">
            <span>✓</span>
            Голосование завершено
          </div>
        )}

        {shouldShowResults && (
          <div className="ranking-results">
            <div className="results-heading">
              Результаты
            </div>

            {results.map(
              (
                option,
                index
              ) => (
                <div
                  className={`result-rank-row ${
                    index < 3
                      ? "top-rank"
                      : ""
                  }`}
                  key={option.id}
                >
                  <span className="result-medal">
                    {medal(index)}
                  </span>

                  <span className="result-rank-text">
                    {option.text}
                  </span>

                  <strong>
                    {rankedScores[
                      option.id
                    ] ?? 0}
                  </strong>
                </div>
              )
            )}
          </div>
        )}

        {!shouldShowResults && (
          <div className="private-results-message">
            Результаты станут доступны
            позже.
          </div>
        )}
      </section>
    </main>
  );
}
