import {
  useEffect,
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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
  rankedScores: Record<
    string,
    number
  >;
  rankedParticipantCount: number;
  setScreen: (screen: Screen) => void;
  onVote: (
    optionIds: string[]
  ) => Promise<void>;
  onShare: () => void;
};

type SortableOptionProps = {
  option: PollOption;
  index: number;
};

function SortableOption({
  option,
  index,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: option.id,
  });

  const style = {
    transform: CSS.Transform.toString(
      transform
    ),
    transition,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "13px 14px",
    borderRadius: 14,
    background:
      "rgba(128,128,128,0.10)",
    touchAction: "none",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <strong
        style={{
          minWidth: 28,
          opacity: 0.7,
        }}
      >
        {index + 1}.
      </strong>

      <span>
        {option.text}
      </span>
    </div>
  );
}

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

export default function RankedPollScreen({
  poll,
  options,
  voted,
  loading,
  now,
  rankedScores,
  rankedParticipantCount,
  setScreen,
  onVote,
  onShare,
}: Props) {
  const [
    orderedOptions,
    setOrderedOptions,
  ] = useState(options);

  useEffect(() => {
    setOrderedOptions(
      options
    );
  }, [options]);

  const pollExpired =
    !!poll.ends_at &&
    new Date(
      poll.ends_at
    ).getTime() <= now;

  const showResults =
    poll.results_visibility ===
      "always" ||
    (poll.results_visibility ===
      "after_vote" &&
      voted) ||
    pollExpired;

  const canEdit =
    !pollExpired &&
    (!voted ||
      poll.allow_revoting);

  const handleDragEnd = (
    event: DragEndEvent
  ) => {
    const {
      active,
      over,
    } = event;

    if (!over) {
      return;
    }

    if (
      active.id ===
      over.id
    ) {
      return;
    }

    setOrderedOptions(
      (items) => {
        const oldIndex =
          items.findIndex(
            (item) =>
              item.id ===
              active.id
          );

        const newIndex =
          items.findIndex(
            (item) =>
              item.id ===
              over.id
          );

        return arrayMove(
          items,
          oldIndex,
          newIndex
        );
      }
    );
  };

  const submit = async () => {
    await onVote(
      orderedOptions.map(
        (option) =>
          option.id
      )
    );
  };

  const sortedResults =
    options
      .map((option) => ({
        ...option,
        score:
          rankedScores[
            option.id
          ] ?? 0,
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      );

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

      {canEdit && (
        <>
          <p
            className="subtitle"
            style={{
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            {voted
              ? "Измени порядок вариантов и сохрани новый голос."
              : "Перетащи варианты в порядке от самого желательного к наименее желательному."}
          </p>

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
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: 10,
                }}
              >
                {orderedOptions.map(
                  (
                    option,
                    index
                  ) => (
                    <SortableOption
                      key={
                        option.id
                      }
                      option={
                        option
                      }
                      index={
                        index
                      }
                    />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>

          <button
            className="primary"
            onClick={submit}
            disabled={loading}
            style={{
              marginTop: 16,
            }}
          >
            {loading
              ? "Сохраняем..."
              : voted
              ? "Изменить голос"
              : "Сохранить порядок"}
          </button>
        </>
      )}

      {voted &&
        !poll.allow_revoting &&
        !pollExpired && (
          <p className="subtitle">
            ✅ Ваш порядок принят.
          </p>
        )}

      {showResults && (
        <section
          style={{
            marginTop: 26,
          }}
        >
          <h2>
            Результаты
          </h2>

          <p className="subtitle">
            Участников:{" "}
            {rankedParticipantCount}
          </p>

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 10,
            }}
          >
            {sortedResults.map(
              (
                option,
                index
              ) => (
                <div
                  key={
                    option.id
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 10,
                    padding:
                      "12px 14px",
                    borderRadius:
                      14,
                    background:
                      "rgba(128,128,128,0.10)",
                  }}
                >
                  <strong>
                    {index + 1}.
                  </strong>

                  <span
                    style={{
                      flex: 1,
                    }}
                  >
                    {
                      option.text
                    }
                  </span>

                  <strong>
                    {option.score}
                  </strong>
                </div>
              )
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
            Результаты станут
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
