import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import "./style.css";

type Screen = "home" | "create" | "poll";

type PollOption = {
  id: string;
  text: string;
  position: number;
};

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const [createdPollId, setCreatedPollId] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  };

  const loadResults = async () => {
    if (!createdPollId) return;

    const { data, error } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", createdPollId);

    if (error) {
      console.error("RESULTS ERROR:", error);
      return;
    }

    const counts: Record<string, number> = {};

    for (const vote of data || []) {
      counts[vote.option_id] = (counts[vote.option_id] || 0) + 1;
    }

    setVoteCounts(counts);
  };

  const createPoll = async () => {
    if (!title.trim()) {
      alert("Введите название голосования");
      return;
    }

    const validOptions = options
      .map((option) => option.trim())
      .filter(Boolean);

    if (validOptions.length < 2) {
      alert("Добавьте хотя бы два варианта");
      return;
    }

    try {
      setLoading(true);

      // Создаём голосование
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: title.trim(),
          voting_method: "plurality",
        })
        .select()
        .single();

      if (pollError) {
        throw pollError;
      }

      // Создаём варианты
      const { data: createdOptions, error: optionsError } =
        await supabase
          .from("poll_options")
          .insert(
            validOptions.map((text, index) => ({
              poll_id: poll.id,
              text,
              position: index,
            }))
          )
          .select();

      if (optionsError) {
        throw optionsError;
      }

      if (!createdOptions) {
        throw new Error("Варианты голосования не создались");
      }

      setCreatedPollId(poll.id);

      setPollOptions(
        [...createdOptions].sort(
          (a, b) => a.position - b.position
        )
      );

      setOptions(validOptions);
      setVoteCounts({});
      setVoted(false);
      setScreen("poll");
    } catch (error: any) {
      console.error("SUPABASE ERROR:", error);

      alert(
        `Ошибка Supabase:\n\n${
          error?.message || JSON.stringify(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const vote = async (optionId: string) => {
    if (!createdPollId) {
      alert("Не найдено голосование");
      return;
    }

    if (voted) {
      alert("Вы уже голосовали!");
      return;
    }

    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          poll_id: createdPollId,
          option_id: optionId,
          telegram_user_id: Date.now(),
        });

      if (error) {
        if (error.code === "23505") {
          alert("Вы уже голосовали!");
        } else {
          console.error("VOTE ERROR:", error);
          alert(`Ошибка: ${error.message}`);
        }

        return;
      }

      setVoted(true);

      // Загружаем актуальные результаты
      await loadResults();

      alert("Голос принят! 🗳️");
    } catch (error: any) {
      console.error("VOTE ERROR:", error);

      alert(
        `Не удалось отправить голос:\n\n${
          error?.message || JSON.stringify(error)
        }`
      );
    }
  };

  const totalVotes = Object.values(voteCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (screen === "create") {
    return (
      <main className="app">
        <button
          className="back"
          onClick={() => setScreen("home")}
        >
          ← Назад
        </button>

        <h1>Создать голосование</h1>

        <label>Название</label>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Кто будет админом?"
        />

        <label>Варианты</label>

        {options.map((option, index) => (
          <input
            key={index}
            value={option}
            onChange={(e) =>
              updateOption(index, e.target.value)
            }
            placeholder={`Вариант ${index + 1}`}
          />
        ))}

        <button
          className="secondary"
          onClick={addOption}
        >
          + Добавить вариант
        </button>

        <button
          className="primary"
          onClick={createPoll}
          disabled={loading}
        >
          {loading
            ? "Создаём..."
            : "Создать голосование"}
        </button>
      </main>
    );
  }

  if (screen === "poll") {
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
            : "Выберите один вариант:"}
        </p>

        <div className="poll-options">
          {pollOptions.map((option) => (
            <button
              key={option.id}
              className="poll-option"
              onClick={() => vote(option.id)}
              disabled={voted}
            >
              {option.text}
            </button>
          ))}
        </div>

        <h2>Результаты</h2>

        <p className="subtitle">
          Всего голосов: {totalVotes}
        </p>

        <div className="results">
          {pollOptions.map((option) => {
            const count = voteCounts[option.id] || 0;

            return (
              <div
                className="result-row"
                key={option.id}
              >
                <span>{option.text}</span>
                <strong>{count}</strong>
              </div>
            );
          })}
        </div>

        {createdPollId && (
          <p className="poll-id">
            ID голосования: {createdPollId}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="app">
      <div className="logo">🗳️</div>

      <h1>SmartVoter</h1>

      <p className="subtitle">
        Создавай голосования с продвинутыми
        способами подсчёта голосов.
      </p>

      <button
        className="primary"
        onClick={() => setScreen("create")}
      >
        Создать голосование
      </button>

      <button
        className="secondary"
        onClick={() =>
          alert("Здесь будут твои голосования")
        }
      >
        Мои голосования
      </button>
    </main>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
