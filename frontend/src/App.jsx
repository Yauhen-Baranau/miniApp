import { useEffect, useMemo, useState } from "react";
import LiveChat from "./components/LiveChat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function createEmptyAnswers(questionCount) {
  return Array.from({ length: questionCount }, () => "");
}

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [playerOne, setPlayerOne] = useState([]);
  const [playerTwo, setPlayerTwo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await fetch(`${API_URL}/api/questions`);
        if (!response.ok) throw new Error("Не удалось загрузить вопросы");
        const data = await response.json();
        setQuestions(data.questions);
        setPlayerOne(createEmptyAnswers(data.questions.length));
        setPlayerTwo(createEmptyAnswers(data.questions.length));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const progress = useMemo(() => {
    const allAnswers = [...playerOne, ...playerTwo];
    const answered = allAnswers.filter((item) => item.trim().length > 0).length;
    const total = allAnswers.length || 1;
    return Math.round((answered / total) * 100);
  }, [playerOne, playerTwo]);

  const updateAnswer = (setter, answers, index, value) => {
    const next = [...answers];
    next[index] = value;
    setter(next);
  };

  const runBattle = async () => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/duel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerOne, playerTwo })
      });

      if (!response.ok) throw new Error("Ошибка при расчёте совместимости");

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <main className="app"><div className="card">Загрузка Dating Battle...</div></main>;
  }

  return (
    <main className="app">
      <header className="hero card">
        <p className="badge">Telegram Mini App</p>
        <h1>Dating Battle</h1>
        <p>Два игрока отвечают на одинаковые вопросы, AI сравнивает ответы и выдаёт совместимость.</p>
        <div className="progress-wrap">
          <span>Заполнено: {progress}%</span>
          <div className="progress"><div style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      {error && <section className="card error">{error}</section>}

      <section className="cards-grid">
        <div className="card">
          <h2>Игрок 1</h2>
          {questions.map((question, index) => (
            <label key={`p1-${index}`}>
              <span>{question}</span>
              <textarea
                value={playerOne[index] || ""}
                onChange={(event) => updateAnswer(setPlayerOne, playerOne, index, event.target.value)}
                placeholder="Твой ответ"
              />
            </label>
          ))}
        </div>

        <div className="card">
          <h2>Игрок 2</h2>
          {questions.map((question, index) => (
            <label key={`p2-${index}`}>
              <span>{question}</span>
              <textarea
                value={playerTwo[index] || ""}
                onChange={(event) => updateAnswer(setPlayerTwo, playerTwo, index, event.target.value)}
                placeholder="Ответ соперника"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="card action-card">
        <button onClick={runBattle}>⚔️ Запустить дуэль</button>
      </section>

      {result && (
        <section className="card result-card">
          <h2>Результат дуэли</h2>
          <p className="compatibility">Совместимость: <strong>{result.compatibility}%</strong></p>
          <p>{result.winner}</p>
          <p>{result.bonus}</p>
          <div className="analysis-list">
            {result.analysis.map((item, index) => (
              <article key={`analysis-${index}`}>
                <h4>{item.question}</h4>
                <p>{item.score}% — {item.note}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {result && <LiveChat />}
    </main>
  );
}
