import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import "./style.css";

type Screen = "home" | "create" | "poll";

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [createdPollId, setCreatedPollId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
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

      // 1. Создаём голосование
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

      // 2. Создаём варианты
      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(
          validOptions.map((text, index) => ({
            poll_id: poll.id,
            text,
            position: index,
          }))
        );

      if (optionsError) {
        throw optionsError;
      }

      setCreatedPollId(poll.id);
      setOptions(validOptions);
      setScreen("poll");
    } catch (error: any) {
  console.error("SUPABASE ERROR:", error);

  alert(
    `Ошибка Supabase:\n\n${error?.message || JSON.stringify(error)}`
  );
}finally {
      setLoading(false);
    }
  };

  if (screen === "create") {
    return (
      <main className="app">
        <button className="back" onClick={() => setScreen("home")}>
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
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Вариант ${index + 1}`}
          />
        ))}

        <button className="secondary" onClick={addOption}>
          + Добавить вариант
        </button>

        <button
          className="primary"
          onClick={createPoll}
          disabled={loading}
        >
          {loading ? "Создаём..." : "Создать голосование"}
        </button>
      </main>
    );
  }

  if (screen === "poll") {
    return (
      <main className="app">
        <button className="back" onClick={() => setScreen("home")}>
          ← На главную
        </button>

        <h1>{title}</h1>

        <p className="subtitle">
          Выберите один вариант:
        </p>

        <div className="poll-options">
          {options.map((option, index) => (
            <button
              key={index}
              className="poll-option"
              onClick={() => alert(`Вы выбрали: ${option}`)}
            >
              {option}
            </button>
          ))}
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
        Создавай голосования с продвинутыми способами
        подсчёта голосов.
      </p>

      <button
        className="primary"
        onClick={() => setScreen("create")}
      >
        Создать голосование
      </button>

      <button
        className="secondary"
        onClick={() => alert("Здесь будут твои голосования")}
      >
        Мои голосования
      </button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
