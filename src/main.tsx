import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main className="app">
      <div className="logo">🗳️</div>

      <h1>SmartVoter</h1>

      <p className="subtitle">
        Создавай голосования, которые умеют больше обычных опросов Telegram.
      </p>

      <button className="primary">
        Создать голосование
      </button>

      <button className="secondary">
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
