```tsx
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
      console.error(error);
      return;
    }

    const counts: Record<string, number> = {};

    data.forEach((vote) => {
      counts[vote.option_id] = (counts[vote.option_id] || 0) + 1;
    });

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

  const vote = async (optionIndex: number) => {
    if (!createdPollId) {
      alert("Не найдено голосование");
      return;
    }

    if (voted) {
      alert("Вы уже голосовали!");
      return;
    }

    try {
      const { data: option, error: optionError } = await supabase
        .from("poll_options")
        .select("id")
        .eq("poll_id", createdPollId)
        .eq("position", optionIndex)
        .single();

      if (optionError || !option) {
        console.error(optionError);
        alert("Не удалось найти вариант");
        return;
      }

      const { error } = await supabase.from("votes").insert({
        poll_id: createdPollId,
        option_id: option.id,
        telegram_user_id: Date.now(),
      });

      if (error) {
        if (error.code === "23505") {
          alert("Вы уже голосовали!");
        } else {
          console.error(error);
          alert(`Ошибка: ${error.message}`);
        }

        return;
      }

      setVoted(true);

      await loadResults();

      alert("Голос принят! 🗳️");
    } catch (error: any) {
      console.error(error);

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
              updateOption(index, e.
```
