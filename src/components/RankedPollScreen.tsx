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
  rankedScores: Record<string, number>;
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

  const minutes = Math.floor(
    difference / 60000
  );

  const days = Math.floor(
    minutes / 1440
  );

  const hours = Math.floor(
    (minutes % 1440) / 60
  );

  const mins = minutes % 60;

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

function getPlace(
  score: number,
  sortedScores: number[]
) {
  const index =
    sortedScores.findIndex(
      (value) =>
        value === score
    );

  return index + 1;
}

function getResultStyle(
  place: number
) {
  if (place === 1) {
    return {
      background:
        "linear-gradient(135deg, #fff4b0 0%, #e8c547 100%)",
      border:
        "1px solid #d4af37",
      boxShadow:
        "0 4px 14px rgba(212, 175, 55, 0.25)",
      color: "#5c4700",
    };
  }

  if (place === 2) {
    return {
      background:
        "linear-gradient(135deg, #f2f2f2 0%, #c9c9c9 100%)",
      border:
        "1px solid #a9a9a9",
      boxShadow:
        "0 4px 14px rgba(150, 150, 150, 0.20)",
      color: "#404040",
    };
  }

  if (place === 3) {
    return {
      background:
        "linear-gradient(135deg, #f0d0b0 0%, #c98555 100%)",
      border:
        "1px solid #b87333",
      boxShadow:
        "0 4px 14px rgba(184, 115, 51, 0.20)",
      color: "#5a2f16",
    };
  }

  return {
    background:
      "rgba(128,128,128,0.10)",
    border:
      "1px solid transparent",
    boxShadow: "none",
    color: "inherit",
  };
}

function getPlaceEmoji(
  place: number
) {
  if (place === 1) {
    return "🥇";
  }

  if (place === 2) {
    return "🥈";
  }

  if (place === 3) {
    return "🥉";
  }

  return `${place}.`;
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

        if (
          oldIndex === -1 ||
          newIndex === -1
        ) {
          return items;
        }

        const copy = [
          ...items,
        ];

        const [
          movedItem,
        ] = copy.splice(
          oldIndex,
          1
        );

        copy.splice(
          newIndex,
          0,
          movedItem
        );

        return copy;
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

  const sortedScores =
    sortedResults.map(
      (option) =>
        option.score
    );

  const uniqueSortedScores =
    Array.from(
      new Set(
        sortedScores
      )
    );

  const timeText =
    getTimeText(
      poll.ends_at,
      now
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

      {timeText && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 18,
            padding:
              "10px 12px",
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
            : `⏳ ${timeText}`}
        </div>
      )}

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
                option
              ) => {
                const place =
                  getPlace(
                    option.score,
                    sortedScores
                  );

                const resultStyle =
                  getResultStyle(
                    place
                  );

                return (
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
                        "13px 14px",
                      borderRadius:
                        14,
                      background:
                        resultStyle.background,
                      border:
                        resultStyle.border,
                      boxShadow:
                        resultStyle.boxShadow,
                      color:
                        resultStyle.color,
                    }}
                  >
                    <strong
                      style={{
                        minWidth: 34,
                        fontSize:
                          place <=
                          3
                            ? 22
                            : 16,
                      }}
                    >
                      {getPlaceEmoji(
                        place
                      )}
                    </strong>

                    <span
                      style={{
                        flex: 1,
                        fontWeight:
                          place <=
                          3
                            ? 600
                            : 400,
                      }}
                    >
                      {
                        option.text
                      }
                    </span>

                    <strong
                      style={{
                        fontSize:
                          16,
                      }}
                    >
                      {option.score}{" "}
                      {option.score ===
                        1
                        ? "балл"
                        : option.score >=
                            2 &&
                          option.score <=
                            4
                        ? "балла"
                        : "баллов"}
                    </strong>
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
