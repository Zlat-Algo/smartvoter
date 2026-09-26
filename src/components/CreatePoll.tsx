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
    endsAt: string | null,
    allowRevoting: boolean
  ) => Promise<void>;
};

const titleExamples = [
  "Кто будет админом?",
  "Куда пойдём сегодня?",
  "Как лучше провести выходные?",
  "Какой вариант выбираем?",
  "Что будем делать дальше?",
  "Какой фильм посмотреть?",
  "Где устроим встречу?",
];

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

  const [
    allowRevoting,
    setAllowRevoting,
  ] = useState(true);

  const randomExample =
    titleExamples[
      Math.floor(
        Math.random() *
          titleExamples.length
      )
    ];

  const updateOption = (
    index: number,
    value: string
  ) => {
    let copy = [
      ...options,
    ];

    copy[index] =
      value;

    while (
      copy.length > 1 &&
      !copy[
        copy.length - 1
      ].trim()
    ) {
      copy.pop();
    }

    if (
      copy.length < 20 &&
      copy[
        copy.length - 1
      ]?.trim()
    ) {
      copy.push("");
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
        title.trim(),
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
        placeholder={`Например: ${randomExample}`}
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

      <div
        style={{
          marginTop: 8,
          marginBottom: 18,
          padding:
            "10px 12px",
          borderRadius: 12,
          background:
            "rgba(128,128,128,0.08)",
          lineHeight: 1.45,
          fontSize: 14,
          opacity: 0.82,
        }}
      >
        {votingMethod ===
        "plurality"
          ? "Выберите один вариант ответа."
          : "Расставьте варианты от самого желательного к наименее желательному."}
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
        Изменение голоса
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
        🔄 Можно изменить
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
        🔒 Нельзя изменить
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
        style={{
          width: "100%",
          padding:
            "13px 14px",
          borderRadius: 14,
          border:
            "1px solid rgba(128,128,128,0.25)",
          background:
            "rgba(128,128,128,0.10)",
          color:
            "inherit",
          fontSize: 16,
          outline: "none",
          marginBottom: 8,
        }}
      >
        <option value="none">
          ♾️ Без ограничения
        </option>

        <option value="1">
          ⏱️ 1 час
        </option>

        <option value="6">
          ⏱️ 6 часов
        </option>

        <option value="12">
          ⏱️ 12 часов
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
