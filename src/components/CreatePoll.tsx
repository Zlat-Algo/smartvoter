import { useState } from "react";

import type {
  Screen,
  VotingMethod,
  ResultsVisibility,
} from "../types/poll";

type Props = {
  loading: boolean;
  setScreen: (
    screen: Screen
  ) => void;
  onCreate: (
    title: string,
    options: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean
  ) => Promise<void>;
};

const titleExamples = [
  "Куда пойдём после школы?",
  "Как назовём команду?",
  "Кто станет админом?",
  "Что посмотрим вечером?",
  "Какой вариант выбрать?",
  "Где проведём встречу?",
  "Что будем делать на выходных?",
  "Какую игру запустим?",
  "Какой фильм посмотрим?",
  "Как лучше поступить?",
];

export default function CreatePoll({
  loading,
  setScreen,
  onCreate,
}: Props) {
  const [
    title,
    setTitle,
  ] = useState("");

  const [
    options,
    setOptions,
  ] = useState([
    "",
  ]);

  const [
    votingMethod,
    setVotingMethod,
  ] = useState<VotingMethod>(
    "plurality"
  );

  const [
    resultsVisibility,
    setResultsVisibility,
  ] =
    useState<ResultsVisibility>(
      "always"
    );

  const [
    duration,
    setDuration,
  ] = useState("none");

  const [
    allowRevoting,
    setAllowRevoting,
  ] = useState(true);

  const [
    example,
  ] = useState(
    () =>
      titleExamples[
        Math.floor(
          Math.random() *
            titleExamples.length
        )
      ]
  );

  const updateOption = (
    index: number,
    value: string
  ) => {
    let copy = [...options];

    copy[index] = value;

    while (
      copy.length > 1 &&
      !copy[
        copy.length - 1
      ].trim() &&
      !copy[
        copy.length - 2
      ].trim()
    ) {
      copy.pop();
    }

    if (
      copy[
        copy.length - 1
      ]?.trim() &&
      copy.length < 20
    ) {
      copy.push("");
    }

    if (copy.length === 0) {
      copy = [""];
    }

    setOptions(copy);
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

      now.setHours(
        now.getHours() +
          Number(duration)
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
        1
      ) {
        alert(
          "Добавьте хотя бы один вариант"
        );

        return;
      }

      await onCreate(
        title,
        validOptions,
        votingMethod,
        resultsVisibility,
        getEndsAt(),
        allowRevoting
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
        placeholder={`Например: ${example}`}
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

      <div className="mode-description">
        {votingMethod ===
        "plurality"
          ? "Выберите один вариант."
          : "Расставьте все варианты от самого желательного к наименее желательному."}
      </div>

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
        🔒 После голосования
      </button>

      <button
        type="button"
        className={
          resultsVisibility ===
          "after_expiration"
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setResultsVisibility(
            "after_expiration"
          )
        }
      >
        ⏰ После окончания
      </button>

      <label>
        Переголосование
      </label>

      <button
        type="button"
        className={
          allowRevoting
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setAllowRevoting(
            true
          )
        }
      >
        🔄 Разрешить переголосование
      </button>

      <button
        type="button"
        className={
          !allowRevoting
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setAllowRevoting(
            false
          )
        }
      >
        🔒 Запретить переголосование
      </button>

      <label>
        Срок голосования
      </label>

      <div className="duration-picker">
        <select
          value={duration}
          onChange={(e) =>
            setDuration(
              e.target.value
            )
          }
        >
          <option value="none">
            ♾️ Без ограничения
          </option>

          <option value="1">
            ⏱️ 1 час
          </option>

          <option value="24">
            📅 1 день
          </option>

          <option value="72">
            📅 3 дня
          </option>

          <option value="168">
            📅 7 дней
          </option>
        </select>
      </div>

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
