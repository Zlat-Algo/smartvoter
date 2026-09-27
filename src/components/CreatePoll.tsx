import { useRef, useState } from "react";
import type {
  ResultsVisibility,
  VotingMethod,
} from "../types/poll";

type Props = {
  onCreate: (
    title: string,
    optionTexts: string[],
    votingMethod: VotingMethod,
    resultsVisibility: ResultsVisibility,
    endsAt: string | null,
    allowRevoting: boolean,
    description: string,
    maxChoices: number,
    shuffleOptions: boolean,
    showParticipantCount: boolean
  ) => void;
  onBack: () => void;
};

const DURATION_OPTIONS = [
  { value: "none", label: "Без ограничения" },
  { value: "1h", label: "1 час" },
  { value: "6h", label: "6 часов" },
  { value: "12h", label: "12 часов" },
  { value: "1d", label: "1 день" },
  { value: "3d", label: "3 дня" },
  { value: "7d", label: "7 дней" },
];

export default function CreatePoll({
  onCreate,
  onBack,
}: Props) {
  const titleInputRef =
    useRef<HTMLInputElement>(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [votingMethod, setVotingMethod] =
    useState<VotingMethod>("plurality");

  const [options, setOptions] =
    useState<string[]>(["", ""]);

  const [resultsVisibility, setResultsVisibility] =
    useState<ResultsVisibility>("always");

  const [allowRevoting, setAllowRevoting] =
    useState(true);

  const [duration, setDuration] =
    useState("none");

  const [maxChoices, setMaxChoices] =
    useState(1);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);

  const [showParticipantCount, setShowParticipantCount] =
    useState(true);

  const [titleError, setTitleError] =
    useState("");

  const [optionsError, setOptionsError] =
    useState("");

  function updateOption(
    index: number,
    value: string
  ) {
    setOptions((current) =>
      current.map((option, i) =>
        i === index ? value : option
      )
    );

    if (optionsError) {
      setOptionsError("");
    }
  }

  function addOption() {
    if (options.length >= 20) {
      return;
    }

    setOptions((current) => [
      ...current,
      "",
    ]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      return;
    }

    setOptions((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  function calculateEndsAt():
    string | null {
    if (duration === "none") {
      return null;
    }

    const now = new Date();

    const durations: Record<
      string,
      number
    > = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "3d": 3 * 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const milliseconds =
      durations[duration];

    if (!milliseconds) {
      return null;
    }

    return new Date(
      now.getTime() + milliseconds
    ).toISOString();
  }

  function handleMethodChange(
    method: VotingMethod
  ) {
    setVotingMethod(method);

    if (method === "multiple") {
      setMaxChoices(
        Math.min(
          Math.max(maxChoices, 1),
          options.length
        )
      );
    }

    if (
      method === "yes_no" ||
      method === "rating"
    ) {
      setOptionsError("");
    }
  }

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      setTitleError(
        "Введите название голосования."
      );

      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });

      return;
    }

    setTitleError("");

    let optionTexts: string[];

    if (votingMethod === "yes_no") {
      optionTexts = ["Да", "Нет"];
    } else if (votingMethod === "rating") {
      optionTexts = [
        "1",
        "2",
        "3",
        "4",
        "5",
      ];
    } else {
      optionTexts = options
        .map((option) =>
          option.trim()
        )
        .filter(Boolean);

      if (optionTexts.length < 2) {
        setOptionsError(
          "Добавьте минимум 2 варианта ответа."
        );
        return;
      }

      if (
        new Set(
          optionTexts.map((option) =>
            option.toLowerCase()
          )
        ).size !== optionTexts.length
      ) {
        setOptionsError(
          "Варианты ответа не должны повторяться."
        );
        return;
      }
    }

    setOptionsError("");

    const actualMaxChoices =
      votingMethod === "multiple"
        ? Math.min(
            Math.max(maxChoices, 1),
            optionTexts.length
          )
        : 1;

    onCreate(
      trimmedTitle,
      optionTexts,
      votingMethod,
      resultsVisibility,
      calculateEndsAt(),
      allowRevoting,
      description.trim(),
      actualMaxChoices,
      shuffleOptions,
      showParticipantCount
    );
  }

  return (
    <main
      className="app"
      style={{
        paddingBottom: 32,
      }}
    >
      <button
        type="button"
        className="secondary"
        onClick={onBack}
        style={{
          marginBottom: 16,
        }}
      >
        ← Назад
      </button>

      <h1>
        Создать голосование
      </h1>

      <form onSubmit={handleSubmit}>
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Название
        </label>

        <input
          ref={titleInputRef}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);

            if (titleError) {
              setTitleError("");
            }
          }}
          placeholder="Например: Куда пойдём вечером?"
          maxLength={200}
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: titleError
              ? 6
              : 16,
          }}
        />

        {titleError && (
          <div
            role="alert"
            style={{
              color: "#d93025",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {titleError}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Описание
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Необязательно"
          maxLength={1000}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 16,
            resize: "vertical",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Способ голосования
        </label>

        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            className={
              votingMethod ===
              "plurality"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              handleMethodChange(
                "plurality"
              )
            }
          >
            Один вариант
          </button>

          <button
            type="button"
            className={
              votingMethod ===
              "multiple"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              handleMethodChange(
                "multiple"
              )
            }
          >
            Несколько вариантов
          </button>

          <button
            type="button"
            className={
              votingMethod === "ranked"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              handleMethodChange(
                "ranked"
              )
            }
          >
            Ранжирование
          </button>

          <button
            type="button"
            className={
              votingMethod === "yes_no"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              handleMethodChange(
                "yes_no"
              )
            }
          >
            Да / Нет
          </button>

          <button
            type="button"
            className={
              votingMethod === "rating"
                ? "primary"
                : "secondary"
            }
            onClick={() =>
              handleMethodChange(
                "rating"
              )
            }
          >
            Оценка 1–5
          </button>
        </div>

        {votingMethod !== "yes_no" &&
          votingMethod !== "rating" && (
            <>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Варианты ответа
              </label>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {options.map(
                  (option, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems:
                          "center",
                      }}
                    >
                      <input
                        value={option}
                        onChange={(
                          event
                        ) =>
                          updateOption(
                            index,
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={`Вариант ${index + 1}`}
                        maxLength={200}
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      />

                      {options.length >
                        2 && (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            removeOption(
                              index
                            )
                          }
                          aria-label={`Удалить вариант ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              {optionsError && (
                <div
                  role="alert"
                  style={{
                    color: "#d93025",
                    fontSize: 13,
                    marginBottom: 10,
                  }}
                >
                  {optionsError}
                </div>
              )}

              {options.length <
                20 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={addOption}
                  style={{
                    marginBottom: 20,
                  }}
                >
                  + Добавить вариант
                </button>
              )}
            </>
          )}

        {votingMethod ===
          "multiple" && (
          <div
            style={{
              marginBottom: 20,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Максимум вариантов
            </label>

            <select
              value={Math.min(
                maxChoices,
                Math.max(
                  options.length,
                  1
                )
              )}
              onChange={(event) =>
                setMaxChoices(
                  Number(
                    event.target.value
                  )
                )
              }
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
              }}
            >
              {Array.from(
                {
                  length: Math.max(
                    options.length,
                    1
                  ),
                },
                (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                  >
                    {index + 1}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Когда закончится
        </label>

        <select
          value={duration}
          onChange={(event) =>
            setDuration(
              event.target.value
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        >
          {DURATION_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Результаты
        </label>

        <select
          value={resultsVisibility}
          onChange={(event) =>
            setResultsVisibility(
              event.target
                .value as ResultsVisibility
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        >
          <option value="always">
            Всегда показывать
          </option>

          <option value="after_vote">
            После голосования
          </option>

          <option value="after_expiration">
            После окончания
          </option>
        </select>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {votingMethod !==
            "yes_no" &&
            votingMethod !==
              "rating" && (
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems:
                    "center",
                }}
              >
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
                />
                Перемешивать варианты
              </label>
            )}

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
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
            />
            Показывать количество участников
          </label>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
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
            />
            Разрешить переголосование
          </label>
        </div>

        <button
          type="submit"
          className="primary"
          style={{
            width: "100%",
          }}
        >
          Создать голосование
        </button>
      </form>
    </main>
  );
}
