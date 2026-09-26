import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

type Screen = "home" | "create" | "poll";

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  };

  const createPoll = () => {
    if (!title.trim()) {
      alert("Введите название голосования");
      return;
    }

    const validOptions = options.filter((x) => x.trim());

    if (validOptions.length < 2) {
      alert("Добавьте хотя бы два варианта");
      return;
    }

    setOptions(validOptions);
    setScreen("poll");
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

        <button className="primary" onClick={createPoll}>
          Создать голосование
        </button>
      </main>
    );
  }

  if (screen === "poll") {
    return (
      <main className="app">
        <button className="back" onClick={() => setScreen("create")}>
          ← Назад
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
      </main>
    );
  }

  return (
    <main className="app">
      <div className="logo">🗳️</div>

      <h1>SmartVoter</h1>

      <p className="subtitle">
        Создавай голосования с продвинутыми способами подсчёта голосов.
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
