import { useMemo, useState } from "react";
import LiveChat from "./components/LiveChat";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

const questions = [
  "Какой идеальный вечер для тебя?",
  "Что для тебя важнее в отношениях: страсть или дружба?",
  "Как ты показываешь заботу о близком человеке?",
  "Твоя мечта о совместном путешествии?",
  "Какие качества ты ценишь в партнере больше всего?"
];

function createEmptyAnswers(questionCount) {
  return Array.from({ length: questionCount }, () => "");
}

export default function App() {
  const [playerOne, setPlayerOne] = useState(createEmptyAnswers(questions.length));
  const [playerTwo, setPlayerTwo] = useState(createEmptyAnswers(questions.length));
  const [error, setError] = useState(OPENAI_API_KEY ? "" : "Укажите VITE_OPENAI_API_KEY для AI-анализа");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setError(OPENAI_API_KEY ? "" : "Укажите VITE_OPENAI_API_KEY для AI-анализа");
    setResult(null);

    if (!OPENAI_API_KEY) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        questions,
        playerOne,
        playerTwo,
        outputSchema: {
          compatibility: "integer 10-100",
          winner:
            "one of: Оба победили!, Победитель: Игрок 1, Победитель: Игрок 2, Ничья, но бонус у Игрока 1 за скорость в Telegram Mini App 🚀",
          bonus:
            "one of: 🎁 VIP-стикер пак + доступ к секретному раунду | 🎁 +15 монет в боте | 🎁 +5 монет за участие",
          analysis: [{ question: "string", score: "integer 0-100", note: "short russian sentence" }]
        }
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Ты оцениваешь совместимость ответов в dating-игре. Верни только валидный JSON с ключами: compatibility, winner, bonus, analysis. analysis должен содержать ровно 5 пунктов в порядке вопросов."
            },
            {
              role: "user",
              content: JSON.stringify(payload)
            }
          ]
        })
      });

      if (!response.ok) {
        const apiError = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${apiError}`);
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) {
        throw new Error("OpenAI вернул пустой ответ");
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.analysis) || parsed.analysis.length !== questions.length) {
        throw new Error("Невалидный формат analysis от OpenAI");
      }

      const sanitized = {
        compatibility: Math.max(10, Math.min(100, Math.round(Number(parsed.compatibility) || 10))),
        winner: typeof parsed.winner === "string" ? parsed.winner : "Оба победили!",
        bonus: typeof parsed.bonus === "string" ? parsed.bonus : "🎁 +5 монет за участие",
        analysis: parsed.analysis.map((item, index) => ({
          question: questions[index],
          score: Math.max(0, Math.min(100, Math.round(Number(item?.score) || 0))),
          note: typeof item?.note === "string" ? item.note : "Интересные различия и совпадения"
        }))
      };

      setResult(sanitized);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app">
      <header className="hero card">
        <p className="badge">Telegram Mini App</p>
        <h1>Dating Battle</h1>
        <p>Два игрока отвечают на одинаковые вопросы, OpenAI сравнивает ответы и выдаёт совместимость.</p>
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
        <button onClick={runBattle} disabled={isLoading || !OPENAI_API_KEY}>
          {isLoading ? "AI анализирует..." : "⚔️ Запустить дуэль"}
        </button>
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
