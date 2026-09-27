import { useState } from "react";

import type {
  VotingMethod,
  ResultsVisibility,
} from "../types/poll";

type Props = {
  loading: boolean;

  onBack: () => void;

  onCreate: (
    title: string,
    description: string,
    options: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean,
    maxChoices: number,
    shuffleOptions: boolean,
    showParticipantCount: boolean
  ) => Promise<void>;
};

const titleExamples = [
  "Куда пойдём сегодня?",
  "Какой вариант выбираем?",
  "Что будем делать дальше?",
  "Какой фильм посмотреть?",
  "Где устроим встречу?",
  "Как лучше провести выходные?",
];

const typeInfo: {
  type: VotingMethod;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    type: "plurality",
    icon: "🗳️",
    title: "Один вариант",
    description:
      "Каждый выбирает только один ответ.",
  },
  {
    type: "multiple",
    icon: "☑️",
    title: "Несколько вариантов",
    description:
      "Можно выбрать несколько ответов.",
  },
  {
    type: "ranked",
    icon: "🏆",
    title: "Ранжирование",
    description:
      "Расставьте варианты от лучшего к худшему.",
  },
  {
    type: "yes_no",
    icon: "👍",
    title: "Да / Нет",
    description:
      "Быстрое голосование из двух вариантов.",
  },
  {
    type: "rating",
    icon: "⭐",
    title: "Оценка 1–5",
    description:
      "Оцените вопрос по пятибалльной шкале.",
  },
];

export default function CreatePoll({
  loading,
  onBack,
  onCreate,
}: Props) {
  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [options, setOptions] =
    useState<string[]>([""]);

  const [votingMethod, setVotingMethod] =
    useState<VotingMethod>(
      "plurality"
    );

  const [
    resultsVisibility,
    setResultsVisibility,
  ] = useState<ResultsVisibility>(
    "always"
  );

  const [duration, setDuration] =
    useState("none");

  const [
    allowRevoting,
    setAllowRevoting,
  ] = useState(true);

  const [
    maxChoices,
    setMaxChoices,
  ] = useState(2);

  const [
    shuffleOptions,
    setShuffleOptions,
  ] = useState(false);

  const [
    showParticipantCount,
    setShowParticipantCount,
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
    const copy = [...options];

    copy[index] = value;

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
      if (duration === "none") {
        return null;
      }

      const end =
        new Date();

      end.setHours(
        end.getHours() +
          Number(duration)
      );

      return end.toISOString();
    };

  const getOptionsForType =
    () => {
      if (
        votingMethod ===
        "yes_no"
      ) {
        return [
          "Да",
          "Нет",
        ];
      }

      if (
        votingMethod ===
        "rating"
      ) {
        return [
          "1",
          "2",
          "3",
          "4",
          "5",
        ];
      }

      return options
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    };

  const submit = async () => {
    if (!title.trim()) {
      alert(
        "Введите название голосования."
      );
      return;
    }

    const validOptions =
      getOptionsForType();

    if (
      validOptions.length <
      1
    ) {
      alert(
        "Добавьте хотя бы один вариант."
      );
      return;
    }

    if (
      votingMethod ===
        "multiple" &&
      maxChoices >
        validOptions.length
    ) {
      setMaxChoices(
        validOptions.length
      );
    }

    await onCreate(
      title.trim(),
      description.trim(),
      validOptions,
      votingMethod,
      resultsVisibility,
      getEndsAt(),
      allowRevoting,
      votingMethod ===
        "multiple"
        ? Math.min(
            maxChoices,
            validOptions.length
          )
        : 1,
      shuffleOptions,
      showParticipantCount
    );
  };

  const customOptions =
    votingMethod !==
      "yes_no" &&
    votingMethod !==
      "rating";

  return (
    <main className="app">
      <button
        className="back"
        onClick={onBack}
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
          setTitle(e.target.value)
        }
        placeholder={`Например: ${randomExample}`}
      />

      <label>
        Описание
      </label>

      <textarea
        value={description}
        onChange={(e) =>
          setDescription(
            e.target.value
          )
        }
        placeholder="Необязательно. Добавьте контекст или пояснение."
        rows={3}
      />

      <label>
        Тип голосования
      </label>

      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {typeInfo.map(
          (item) => (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                setVotingMethod(
                  item.type
                )
              }
              style={{
                textAlign:
                  "left",
                padding:
                  "14px 15px",
                borderRadius:
                  16,
                border:
                  votingMethod ===
                  item.type
                    ? "2px solid currentColor"
                    : "1px solid rgba(128,128,128,0.22)",
                background:
                  votingMethod ===
                  item.type
                    ? "rgba(100,150,255,0.12)"
                    : "rgba(128,128,128,0.07)",
                color:
                  "inherit",
                cursor:
                  "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                {item.icon}{" "}
                {item.title}
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  opacity: 0.72,
                }}
              >
                {
                  item.description
                }
              </div>
            </button>
          )
        )}
      </div>

      {customOptions && (
        <>
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
        </>
      )}

      {votingMethod ===
        "yes_no" && (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background:
              "rgba(128,128,128,0.08)",
            marginBottom: 18,
          }}
        >
          👍 Да
          <br />
          👎 Нет
        </div>
      )}

      {votingMethod ===
        "rating" && (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background:
              "rgba(128,128,128,0.08)",
            marginBottom: 18,
          }}
        >
          ⭐ 1 — очень плохо
          <br />
          ⭐⭐ 2 — плохо
          <br />
          ⭐⭐⭐ 3 — нормально
          <br />
          ⭐⭐⭐⭐ 4 — хорошо
          <br />
          ⭐⭐⭐⭐⭐ 5 — отлично
        </div>
      )}

      {votingMethod ===
        "multiple" && (
        <>
          <label>
            Максимум вариантов
          </label>

          <select
            value={maxChoices}
            onChange={(e) =>
              setMaxChoices(
                Number(
                  e.target.value
                )
              )
            }
          >
            {Array.from(
              {
                length: Math.max(
                  1,
                  options.filter(
                    (x) =>
                      x.trim()
                  ).length
                ),
              },
              (_, index) =>
                index + 1
            ).map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              )
            )}
          </select>
        </>
      )}

      {votingMethod !==
        "rating" && (
        <button
          type="button"
          className={
            shuffleOptions
              ? "primary"
              : "secondary"
          }
          onClick={() =>
            setShuffleOptions(
              !shuffleOptions
            )
          }
        >
          🔀 Перемешивать варианты
        </button>
      )}

      <label>
        Результаты
      </label>

      <select
        value={
          resultsVisibility
        }
        onChange={(e) =>
          setResultsVisibility(
            e.target
              .value as ResultsVisibility
          )
        }
      >
        <option value="always">
          👀 Показывать сразу
        </option>

        <option value="after_vote">
          🔒 После голосования
        </option>

        <option value="after_expiration">
          ⏰ После окончания
        </option>
      </select>

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
            !allowRevoting
          )
        }
      >
        {allowRevoting
          ? "🔄 Можно изменить"
          : "🔒 Изменение запрещено"}
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
        type="button"
        className={
          showParticipantCount
            ? "primary"
            : "secondary"
        }
        onClick={() =>
          setShowParticipantCount(
            !showParticipantCount
          )
        }
      >
        {showParticipantCount
          ? "👥 Показывать участников"
          : "🙈 Скрыть участников"}
      </button>

      <button
        className="primary"
        onClick={submit}
        disabled={loading}
        style={{
          marginTop: 12,
        }}
      >
        {loading
          ? "Создаём..."
          : "Создать голосование"}
      </button>
    </main>
  );
}
