import { useState } from "react";
import type { PollOption } from "../types/poll";

type Props = {
  title: string;
  options: PollOption[];
  voted: boolean;
  loading: boolean;
  setScreen: (screen: "home" | "create" | "poll" | "myPolls") => void;
  onVote: (orderedOptions: PollOption[]) => void;
};

export default function RankedPollScreen({
  title,
  options,
  voted,
  loading,
  setScreen,
  onVote,
}: Props) {
  const [orderedOptions, setOrderedOptions] =
    useState<PollOption[]>(options);

  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const moveOption = (
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) {
      return;
    }

    const copy = [...orderedOptions];

    const [moved] = copy.splice(fromIndex, 1);

    copy.splice(toIndex, 0, moved);

    setOrderedOptions(copy);
  };

  const handleDragStart = (
    index: number
  ) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    event: React.DragEvent,
    index: number
  ) => {
    event.preventDefault();

    if (
      draggedIndex === null ||
      draggedIndex === index
    ) {
      return;
    }

    moveOption(draggedIndex, index);

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) {
      return;
    }

    moveOption(index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index === orderedOptions.length - 1) {
      return;
    }

    moveOption(index, index + 1);
  };

  return (
    <main className="app">
      <button
        className="back"
        onClick={() => setScreen("home")}
      >
        ← На главную
      </button>

      <h1>{title}</h1>

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

      <div className="ranked-options">
        {orderedOptions.map((option, index) => (
          <div
            key={option.id}
            className={`ranked-card ${
              draggedIndex === index
                ? "dragging"
                : ""
            }`}
            draggable={!voted}
            onDragStart={() =>
              handleDragStart(index)
            }
            onDragOver={(event) =>
              handleDragOver(event, index)
            }
            onDragEnd={handleDragEnd}
          >
            <div className="rank-number">
              {index + 1}
            </div>

            <div className="drag-handle">
              ☰
            </div>

            <div className="ranked-text">
              {option.text}
            </div>

            {!voted && (
              <div className="rank-buttons">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={
                    index ===
                    orderedOptions.length - 1
                  }
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!voted && (
        <button
          className="primary"
          onClick={() =>
            onVote(orderedOptions)
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
