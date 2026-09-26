import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabase";
import "./style.css";

type Screen = "home" | "create" | "poll" | "myPolls";

type PollOption = {
  id: string;
  text: string;
  position: number;
};

type Poll = {
  id: string;
  title: string;
  voting_method: string;
  creator_telegram_id: number | null;
  created_at: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const [createdPollId, setCreatedPollId] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  const [myPolls, setMyPolls] = useState<Poll[]>([]);

  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  const telegramUserId =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;

  const telegramName =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ??
    "пользователь";

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  };

  const loadResults = async (pollId: string) => {
    const { data, error } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", pollId);

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

  const openPoll = async (poll: Poll) => {
    try {
      setLoading(true);

      const { data: optionsData, error } = await supabase
        .from("poll_options")
        .select("id, text, position")
        .eq("poll_id", poll.id)
        .order("position");

      if (error) {
        throw error;
      }

      setCreatedPollId(poll.id);
      setTitle(poll.title);
      setPollOptions(optionsData || []);
      setVoteCounts({});
      setVoted(false);

      await loadResults(poll.id);

      setScreen("poll");
    } catch (error: any) {
      console.error("OPEN POLL ERROR:", error);

      alert(
        `Не удалось открыть голосование:\n\n${
          error?.message || JSON.stringify(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMyPolls = async () => {
    if (!telegramUserId) {
      alert("Не удалось определить Telegram-пользователя");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("polls")
        .select(
          "id, title, voting_method, creator_telegram_id, created_at"
        )
        .eq("creator_telegram_id", telegramUserId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setMyPolls(data || []);
      setScreen("myPolls");
    } catch (error: any) {
      console.error("MY POLLS ERROR:", error);

      alert(
        `Не удалось загрузить голосования:\n\n${
          error?.message || JSON.stringify(error)
        }`
      );
    } finally {
      setLoading(false);
    }
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
          creator_telegram_id: telegramUserId,
        })
        .select()
        .single();

      if (pollError) {
        throw pollError;
      }

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
        throw new Error("Варианты не создались");
      }

      const sortedOptions = [...createdOptions].sort(
        (a, b) => a.position - b.position
      );

      setCreatedPollId(poll.id);
      setPollOptions(sortedOptions);
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

    if (!telegramUserId) {
      alert("Не удалось определить Telegram-пользователя");
      return;
    }

    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          poll_id: createdPollId,
          option_id: optionId,
          telegram_user_id: telegramUserId,
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

      await loadResults(createdPollId);

      alert(`Голос принят, ${telegramName}! 🗳️`);
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
          {loading ? "Создаём..." : "Создать голосование"}
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

  if (screen === "myPolls") {
    return (
      <main className="app">
        <button
          className="back"
          onClick={() => setScreen("home")}
        >
          ← На главную
        </button>

        <h1>Мои голосования</h1>

        {loading ? (
          <p className="subtitle">Загружаем...</p>
        ) : myPolls.length === 0 ? (
          <p className="subtitle">
            У тебя пока нет голосований.
          </p>
        ) : (
          <div className="poll-list">
            {myPolls.map((poll) => (
              <button
                key={poll.id}
                className="poll-card"
                onClick={() => openPoll(poll)}
              >
                <strong>{poll.title}</strong>

                <span>
                  Метод: обычное голосование
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app">
      <div className="logo">🗳️</div>

      <h1>SmartVoter</h1>

      <p className="subtitle">
        Привет, {telegramName}! Создавай голосования
        с продвинутыми способами подсчёта голосов.
      </p>

      <button
        className="primary"
        onClick={() => setScreen("create")}
      >
        Создать голосование
      </button>

      <button
        className="secondary"
        onClick={loadMyPolls}
        disabled={loading}
      >
        {loading ? "Загружаем..." : "Мои голосования"}
      </button>
    </main>
  );
}

window.Telegram?.WebApp?.ready();
window.Telegram?.WebApp?.expand();

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
