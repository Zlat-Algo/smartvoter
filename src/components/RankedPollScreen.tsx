import { useState } from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import type { DragEndEvent } from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import type {
  PollOption,
  Screen,
} from "../types/poll";

type Props = {
  title: string;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  setScreen: (screen: Screen) => void;
  onVote: (
    orderedOptions: PollOption[]
  ) => void;
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
    isDragging,
  } = useSortable({
    id: option.id,
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),
    transition,
    touchAction:
      disabled
        ? "auto"
        : "none",
    opacity: isDragging
      ? 0.6
      : 1,
    cursor: disabled
      ? "default"
      : "grab",
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      className="poll-option"
      style={style}
      disabled={disabled}
      {...attributes}
      {...listeners}
    >
      <strong>
        {index + 1}.
      </strong>

      <span>
        ☰
      </span>

      <span>
        {option.text}
      </span>
    </button>
  );
}

export default function RankedPollScreen({
  title,
  options,
  voted,
  loading,
  setScreen,
  onVote,
}: Props) {
  const [
    orderedOptions,
    setOrderedOptions,
  ] = useState<PollOption[]>(
    options
  );

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 8,
          },
        }
      ),

      useSensor(
        TouchSensor,
        {
          activationConstraint: {
            delay: 150,
            tolerance: 5,
          },
        }
      )
    );

  const handleDragEnd = (
    event: DragEndEvent
  ) => {
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

    const oldIndex =
      orderedOptions.findIndex(
        (option) =>
          option.id ===
          active.id
      );

    const newIndex =
      orderedOptions.findIndex(
        (option) =>
          option.id ===
          over.id
      );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    setOrderedOptions(
      arrayMove(
        orderedOptions,
        oldIndex,
        newIndex
      )
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
        ← На главную
      </button>

      <h1>
        {title}
      </h1>

      <p className="subtitle">
        {voted
          ? "Ваш голос принят!"
          : "Расставьте варианты по порядку предпочтения:"}
      </p>

      {!voted && (
        <p className="subtitle">
          🥇 Сверху — самый желательный вариант.
          <br />
          Последний — наименее желательный.
        </p>
      )}

      <DndContext
        sensors={sensors}
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
          <div className="poll-options">
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
                  disabled={
                    voted ||
                    loading
                  }
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {!voted && (
        <button
          className="primary"
          onClick={() =>
            onVote(
              orderedOptions
            )
          }
          disabled={loading}
        >
          {loading
            ? "Отправляем..."
            : "Проголосовать"}
        </button>
      )}
    </main>
  );
}
