import { useState } from "react";

import type {
  Screen,
  VotingMethod,
  ResultsVisibility,
} from "../types/poll";

type Props = {
  loading: boolean;
  setScreen: (screen: Screen) => void;
  onCreate: (
    title: string,
    options: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null
  ) => Promise<void>;
};

export default function CreatePoll({
  loading,
  setScreen,
  onCreate,
}: Props) {
  const [title, setTitle] =
    useState("");

  const [options, setOptions] =
    useState([
      "",
      "",
    ]);

  const [votingMethod, setVotingMethod] =
    useState<VotingMethod>(
      "plurality"
    );

  const [
    resultsVisibility,
    setResultsVisibility,
  ] =
    useState<ResultsVisibility>(
      "always"
    );

  const [duration, setDuration] =
    useState("none");

  const updateOption = (
    index: number,
    value: string
  ) => {
    const copy = [...options];

    copy[index] = value;

    if (
      value.trim() &&
      index ===
        options.length - 1
    ) {
      copy.push("");
    }

    setOptions(copy);
  };

  const addOption = () => {
    if (options.length >= 20) {
      alert(
        "Можно добавить максимум 20 вариантов."
      );

      return;
    }

    setOptions([
      ...options,
      "",
    ]);
  };

  const removeEmptyLastOption = () => {
    if (
      options.length > 2 &&
      !options[
        options.length - 1
      ].trim()
    ) {
      setOptions(
        options.slice(
          0,
          -1
        )
      );
    }
  };

  const getEndsAt =
    (): string | null => {
      if (
        duration ===
        "none"
      ) {
        return null;
      }

      const now =
        new Date();

      const hours =
        Number(
          duration
        );

      now.setHours(
        now.getHours() +
          hours
      );

      return now.toISOString();
    };

  const submit =
    async () => {
      if (!title.trim()) {
        alert(
          "Введите название голосования"
        );

        return;
      }

      const validOptions =
        options
          .map(
            (option) =>
              option.trim()
          )
          .filter(Boolean);

      if (
        validOptions.length <
        2
      ) {
        alert(
          "Добавьте хотя бы два варианта"
        );

        return;
      }

      await onCreate(
        title,
        validOptions,
        votingMethod,
        resultsVisibility,
        getEndsAt()
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
        ← Назад
      </button>

      <h1>
        Создать голосование
      </h1>

      <label>
        Название
      </label>

      <input
        value={title}
        onChange={(e) =>
          setTitle(
            e.target.value
          )
        }
        placeholder="Например: Кто будет админом?"
      />

      <label>
        Тип голосования
      </label>

      <button
        type="button"
        className={
          votingMethod ===
          "plurality"
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setVotingMethod(
            "plurality"
          )
        }
      >
        🗳️ Обычное
      </button>

      <button
        type="button"
        className={
          votingMethod ===
          "ranked"
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setVotingMethod(
            "ranked"
          )
        }
      >
        🏆 Ранжирование
      </button>

      <p className="subtitle">
        {votingMethod ===
        "plurality"
          ? "Выберите один вариант."
          : "Расставьте все варианты от самого желательного к наименее желательному."}
      </p>

      <label>
        Варианты
      </label>

      {options.map(
        (
          option,
          index
        ) => (
          <input
            key={index}
            value={option}
            onChange={(e) =>
              updateOption(
                index,
                e.target.value
              )
            }
            placeholder={`Вариант ${
              index + 1
            }`}
          />
        )
      )}

      {options.length <
        20 && (
        <button
          className="secondary"
          onClick={
            addOption
          }
        >
          + Добавить вариант
        </button>
      )}

      {options.length >
        2 &&
        !options[
          options.length - 1
        ].trim() && (
          <button
            className="secondary"
            onClick={
              removeEmptyLastOption
            }
          >
            − Убрать пустой вариант
          </button>
        )}

      <label>
        Результаты
      </label>

      <button
        type="button"
        className={
          resultsVisibility ===
          "always"
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setResultsVisibility(
            "always"
          )
        }
      >
        👀 Показывать сразу
      </button>

      <button
        type="button"
        className={
          resultsVisibility ===
          "after_vote"
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setResultsVisibility(
            "after_vote"
          )
        }
      >
        🔒 Показывать после голосования
      </button>

      <label>
        Срок голосования
      </label>

      <select
        value={duration}
        onChange={(e) =>
          setDuration(
            e.target.value
          )
        }
      >
        <option value="none">
          Без ограничения
        </option>

        <option value="1">
          1 час
        </option>

        <option value="24">
          1 день
        </option>

        <option value="72">
          3 дня
        </option>

        <option value="168">
          7 дней
        </option>
      </select>

      <button
        className="primary"
        onClick={submit}
        disabled={loading}
      >
        {loading
          ? "Создаём..."
          : "Создать голосование"}
      </button>
    </main>
  );
}
