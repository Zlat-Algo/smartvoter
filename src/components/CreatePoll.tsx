import { useState } from "react";
import type { Screen } from "../types/poll";

type Props = {
  loading: boolean;
  setScreen: (screen: Screen) => void;
  onCreate: (
    title: string,
    options: string[]
  ) => Promise<void>;
};

export default function CreatePoll({
  loading,
  setScreen,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (
    index: number,
    value: string
  ) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  };

  const submit = async () => {
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

    await onCreate(title, validOptions);
  };

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
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Создаём..." : "Создать голосование"}
      </button>
    </main>
  );
}
