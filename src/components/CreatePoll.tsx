import {
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ResultsVisibility,
  VotingMethod,
} from "../types/poll";

type Props = {
  loading: boolean;

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
    showParticipantCount: boolean,
    parliamentarySeats: number | null
  ) => void;

  onBack: () => void;
};

const methodInfo: {
  id: VotingMethod;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: "plurality",
    icon: "☝️",
    title: "Один вариант",
    description: "Выберите один ответ",
  },
  {
    id: "multiple",
    icon: "☑️",
    title: "Несколько вариантов",
    description: "Можно выбрать несколько",
  },
  {
    id: "ranked",
    icon: "🏆",
    title: "Рейтинг",
    description: "Расставьте варианты по местам",
  },
  {
    id: "yes_no",
    icon: "👍",
    title: "Да / Нет",
    description: "Быстрый вопрос",
  },
  {
    id: "rating",
    icon: "⭐",
    title: "Оценка 1–5",
    description: "Оцените что-нибудь",
  },
  {
    id: "parliamentary",
    icon: "🏛️",
    title: "Парламентский",
    description: "Распределение мест с голосами за и против",
  },
];

const durationOptions = [
  {
    value: "none",
    label: "Без ограничения",
    ms: null,
  },
  {
    value: "1h",
    label: "1 час",
    ms: 60 * 60 * 1000,
  },
  {
    value: "6h",
    label: "6 часов",
    ms: 6 * 60 * 60 * 1000,
  },
  {
    value: "12h",
    label: "12 часов",
    ms: 12 * 60 * 60 * 1000,
  },
  {
    value: "1d",
    label: "1 день",
    ms: 24 * 60 * 60 * 1000,
  },
  {
    value: "3d",
    label: "3 дня",
    ms: 3 * 24 * 60 * 60 * 1000,
  },
  {
    value: "7d",
    label: "7 дней",
    ms: 7 * 24 * 60 * 60 * 1000,
  },
];

export default function CreatePoll({
  loading,
  onCreate,
  onBack,
}: Props) {
  const titleInputRef =
    useRef<HTMLInputElement>(null);

  const [title, setTitle] =
    useState("");

  const [titleError, setTitleError] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [votingMethod, setVotingMethod] =
    useState<VotingMethod>("plurality");

  const [options, setOptions] =
    useState<string[]>([
      "",
      "",
    ]);

  const [resultsVisibility, setResultsVisibility] =
    useState<ResultsVisibility>("always");

  const [duration, setDuration] =
    useState("none");

  const [allowRevoting, setAllowRevoting] =
    useState(true);

  const [maxChoices, setMaxChoices] =
    useState(1);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);

  const [showParticipantCount, setShowParticipantCount] =
    useState(true);

  const [parliamentarySeats, setParliamentarySeats] =
    useState(450);

  const activeMethod =
    methodInfo.find(
      (method) =>
        method.id === votingMethod
    );

  const needsCustomOptions =
    votingMethod !== "yes_no" &&
    votingMethod !== "rating";

  const minOptions =
    votingMethod === "ranked" ||
    votingMethod === "parliamentary"
      ? 2
      : 1;

  const validOptions = useMemo(
    () =>
      options
        .map((item) => item.trim())
        .filter(Boolean),
    [options]
  );

  function changeOption(
    index: number,
    value: string
  ) {
    setOptions((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? value
            : item
      )
    );
  }

  function addOption() {
    const max =
      votingMethod ===
      "parliamentary"
        ? 50
        : 20;

    if (
      options.length >= max
    ) {
      return;
    }

    setOptions((current) => [
      ...current,
      "",
    ]);
  }

  function removeOption(
    index: number
  ) {
    if (
      options.length <=
      minOptions
    ) {
      return;
    }

    setOptions((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  function selectMethod(
    method: VotingMethod
  ) {
    setVotingMethod(method);

    if (
      method === "yes_no"
    ) {
      setOptions([
        "Да",
        "Нет",
      ]);
    } else if (
      method === "rating"
    ) {
      setOptions([
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
    } else {
      setOptions((current) => {
        if (
          current.length >= 2
        ) {
          return current;
        }

        return [
          ...current,
          "",
        ];
      });
    }

    if (
      method !== "multiple"
    ) {
      setMaxChoices(1);
    }
  }

  function submit() {
    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      setTitleError(
        "Введите вопрос или название голосования."
      );

      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });

      return;
    }

    setTitleError("");

    if (
      cleanTitle.length >
      200
    ) {
      setTitleError(
        "Название слишком длинное."
      );

      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });

      return;
    }

    if (
      needsCustomOptions &&
      validOptions.length <
        minOptions
    ) {
      alert(
        `Добавьте минимум ${minOptions} варианта.`
      );
      return;
    }

    if (
      votingMethod ===
        "multiple" &&
      maxChoices >
        validOptions.length
    ) {
      alert(
        "Максимальное количество вариантов не может быть больше количества вариантов ответа."
      );
      return;
    }

    const durationConfig =
      durationOptions.find(
        (item) =>
          item.value ===
          duration
      );

    const endsAt =
      durationConfig?.ms
        ? new Date(
            Date.now() +
              durationConfig.ms
          ).toISOString()
        : null;

    const finalOptions =
      needsCustomOptions
        ? validOptions
        : options;

    onCreate(
      cleanTitle,
      description.trim(),
      finalOptions,
      votingMethod,
      resultsVisibility,
      endsAt,
      allowRevoting,
      votingMethod ===
      "multiple"
        ? maxChoices
        : 1,
      shuffleOptions,
      showParticipantCount,
      votingMethod ===
        "parliamentary"
        ? Math.max(
            1,
            Math.min(
              1000,
              Math.floor(
                parliamentarySeats
              )
            )
          )
        : null
    );
  }

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
          Новое голосование
        </div>

        <div className="header-spacer" />
      </div>

      <section className="form-content">
        <div className="form-intro">
          <div className="form-icon">
            🗳️
          </div>

          <div>
            <h1>
              Создадим голосование
            </h1>

            <p>
              Настройте вопрос так,
              как вам нужно.
            </p>
          </div>
        </div>

        <div className="form-section">
          <label className="field-label">
            Вопрос
          </label>

          <input
            ref={titleInputRef}
            className="text-input title-input"
            value={title}
            onChange={(event) => {
              setTitle(
                event.target.value
              );

              if (titleError) {
                setTitleError("");
              }
            }}
            placeholder="Например: Куда пойдём вечером?"
            maxLength={200}
            disabled={loading}
          />

          {titleError && (
            <div
              style={{
                marginTop: 8,
                marginBottom: 10,
                color: "#d93025",
                fontSize: 13,
              }}
            >
              {titleError}
            </div>
          )}

          <textarea
            className="text-input description-input"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Описание (необязательно)"
            maxLength={1000}
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <div className="section-heading-row">
            <div>
              <div className="field-label">
                Тип голосования
              </div>

              <div className="section-hint">
                {activeMethod?.description}
              </div>
            </div>
          </div>

          <div className="method-grid">
            {methodInfo.map(
              (method) => (
                <button
                  type="button"
                  key={method.id}
                  className={`method-card ${
                    votingMethod ===
                    method.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectMethod(
                      method.id
                    )
                  }
                  disabled={loading}
                >
                  <span className="method-icon">
                    {method.icon}
                  </span>

                  <span className="method-title">
                    {method.title}
                  </span>

                  <span className="method-description">
                    {method.description}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {votingMethod ===
          "parliamentary" && (
          <div className="form-section">
            <div className="field-label">
              Количество мест
            </div>

            <div className="section-hint">
              От 1 до 1000. Одно место
              соответствует одному
              квадратику в результатах.
            </div>

            <input
              className="text-input"
              type="number"
              min={1}
              max={1000}
              value={
                parliamentarySeats
              }
              onChange={(event) =>
                setParliamentarySeats(
                  Math.max(
                    1,
                    Math.min(
                      1000,
                      Number(
                        event.target
                          .value
                      ) || 1
                    )
                  )
                )
              }
              disabled={loading}
              style={{
                marginTop: 10,
              }}
            />
          </div>
        )}

        {needsCustomOptions && (
          <div className="form-section">
            <div className="section-heading-row">
              <div>
                <div className="field-label">
                  {votingMethod ===
                  "parliamentary"
                    ? "Партии"
                    : "Варианты ответа"}
                </div>

                <div className="section-hint">
                  {votingMethod ===
                  "ranked"
                    ? "Участник расставит их по порядку."
                    : votingMethod ===
                      "parliamentary"
                    ? "Для каждой партии участник сможет выбрать «За», «Против» или ничего."
                    : "Добавьте варианты, из которых будут выбирать."}
                </div>
              </div>

              <span className="count-badge">
                {validOptions.length}/
                {votingMethod ===
                "parliamentary"
                  ? 50
                  : 20}
              </span>
            </div>

            <div className="options-editor">
              {options.map(
                (
                  option,
                  index
                ) => (
                  <div
                    className="option-editor-row"
                    key={index}
                  >
                    <span className="option-number">
                      {index + 1}
                    </span>

                    <input
                      className="text-input option-input"
                      value={option}
                      onChange={(
                        event
                      ) =>
                        changeOption(
                          index,
                          event.target
                            .value
                        )
                      }
                      placeholder={
                        votingMethod ===
                        "parliamentary"
                          ? `Партия ${index + 1}`
                          : `Вариант ${index + 1}`
                      }
                      maxLength={200}
                      disabled={loading}
                    />

                    {options.length >
                      minOptions && (
                      <button
                        type="button"
                        className="remove-option"
                        onClick={() =>
                          removeOption(
                            index
                          )
                        }
                        disabled={
                          loading
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              className="add-option-button"
              onClick={addOption}
              disabled={
                loading ||
                options.length >=
                  (votingMethod ===
                  "parliamentary"
                    ? 50
                    : 20)
              }
            >
              ＋ Добавить{" "}
              {votingMethod ===
              "parliamentary"
                ? "партию"
                : "вариант"}
            </button>

            {votingMethod ===
              "multiple" && (
              <div className="inline-setting">
                <div>
                  <strong>
                    Максимум вариантов
                  </strong>

                  <span>
                    Сколько ответов можно
                    выбрать
                  </span>
                </div>

                <select
                  className="select-input small-select"
                  value={maxChoices}
                  onChange={(
                    event
                  ) =>
                    setMaxChoices(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  disabled={loading}
                >
                  {Array.from(
                    {
                      length:
                        Math.max(
                          1,
                          validOptions.length
                        ),
                    },
                    (
                      _,
                      index
                    ) => (
                      <option
                        key={
                          index + 1
                        }
                        value={
                          index + 1
                        }
                      >
                        {index + 1}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>
        )}

        {!needsCustomOptions && (
          <div className="preset-preview">
            <div className="field-label">
              Варианты
            </div>

            <div className="preset-options">
              {options.map(
                (option) => (
                  <div
                    className="preset-option"
                    key={option}
                  >
                    {votingMethod ===
                    "yes_no"
                      ? option ===
                        "Да"
                        ? "👍"
                        : "👎"
                      : "⭐"}{" "}
                    {option}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="field-label">
            Настройки
          </div>

          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-copy">
                <strong>
                  Показывать результаты
                </strong>

                <span>
                  Когда участник увидит
                  результаты
                </span>
              </div>

              <select
                className="select-input"
                value={
                  resultsVisibility
                }
                onChange={(event) =>
                  setResultsVisibility(
                    event.target
                      .value as ResultsVisibility
                  )
                }
                disabled={loading}
              >
                <option value="always">
                  Всегда
                </option>

                <option value="after_vote">
                  После голосования
                </option>

                <option value="after_expiration">
                  После окончания
                </option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-copy">
                <strong>
                  Длительность
                </strong>

                <span>
                  Когда голосование закончится
                </span>
              </div>

              <select
                className="select-input"
                value={duration}
                onChange={(event) =>
                  setDuration(
                    event.target.value
                  )
                }
                disabled={loading}
              >
                {durationOptions.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <label className="switch-row">
              <span className="setting-copy">
                <strong>
                  Разрешить повторное голосование
                </strong>

                <span>
                  Можно изменить свой ответ
                </span>
              </span>

              <input
                type="checkbox"
                checked={
                  allowRevoting
                }
                onChange={(event) =>
                  setAllowRevoting(
                    event.target
                      .checked
                  )
                }
                disabled={loading}
              />

              <span className="switch" />
            </label>

            <label className="switch-row">
              <span className="setting-copy">
                <strong>
                  Перемешивать варианты
                </strong>

                <span>
                  Порядок будет разным у участников
                </span>
              </span>

              <input
                type="checkbox"
                checked={
                  shuffleOptions
                }
                onChange={(event) =>
                  setShuffleOptions(
                    event.target
                      .checked
                  )
                }
                disabled={loading}
              />

              <span className="switch" />
            </label>

            <label className="switch-row">
              <span className="setting-copy">
                <strong>
                  Показывать число участников
                </strong>

                <span>
                  Например: 24 участника
                </span>
              </span>

              <input
                type="checkbox"
                checked={
                  showParticipantCount
                }
                onChange={(event) =>
                  setShowParticipantCount(
                    event.target
                      .checked
                  )
                }
                disabled={loading}
              />

              <span className="switch" />
            </label>
          </div>
        </div>

        <button
          type="button"
          className="primary-button create-button"
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? "Создаём…"
            : "Создать голосование"}
        </button>
      </section>
    </main>
  );
}
