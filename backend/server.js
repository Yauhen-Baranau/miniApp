import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 4000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json());

const questions = [
  "Какой идеальный вечер для тебя?",
  "Что для тебя важнее в отношениях: страсть или дружба?",
  "Как ты показываешь заботу о близком человеке?",
  "Твоя мечта о совместном путешествии?",
  "Какие качества ты ценишь в партнере больше всего?"
];

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

const overlapScore = (a, b) => {
  const setA = new Set(normalize(a));
  const setB = new Set(normalize(b));

  if (!setA.size || !setB.size) return 0;

  const intersection = [...setA].filter((word) => setB.has(word)).length;
  const union = new Set([...setA, ...setB]).size;

  return intersection / union;
};

const toneWords = {
  romantic: ["люб", "роман", "неж", "обним", "сердц", "страст"],
  active: ["спорт", "движ", "актив", "танц", "поход", "путеш"],
  calm: ["уют", "дом", "кино", "книга", "спокой", "чай"]
};

const toneScore = (a, b) => {
  const detectTone = (text) => {
    const lower = text.toLowerCase();
    const result = Object.entries(toneWords).map(([tone, words]) => ({
      tone,
      score: words.reduce((acc, token) => acc + (lower.includes(token) ? 1 : 0), 0)
    }));
    result.sort((x, y) => y.score - x.score);
    return result[0].score > 0 ? result[0].tone : "neutral";
  };

  return detectTone(a) === detectTone(b) ? 1 : 0.45;
};

const pickWinner = (compatibility, firstLength, secondLength) => {
  if (compatibility >= 75) return "Оба победили!";

  if (firstLength === secondLength) {
    return "Ничья, но бонус у Игрока 1 за скорость в Telegram Mini App 🚀";
  }

  return firstLength > secondLength ? "Победитель: Игрок 1" : "Победитель: Игрок 2";
};

const buildFallbackResult = (playerOne, playerTwo) => {
  const pairs = questions.map((question, index) => {
    const a = playerOne[index] || "";
    const b = playerTwo[index] || "";

    const lexical = overlapScore(a, b);
    const tone = toneScore(a, b);

    const total = lexical * 0.65 + tone * 0.35;

    return {
      question,
      playerOne: a,
      playerTwo: b,
      lexical,
      tone,
      total
    };
  });

  const average = pairs.reduce((acc, item) => acc + item.total, 0) / pairs.length;
  const compatibility = Math.round(Math.max(10, average * 100));

  const totalLengthOne = playerOne.join(" ").length;
  const totalLengthTwo = playerTwo.join(" ").length;

  const winner = pickWinner(compatibility, totalLengthOne, totalLengthTwo);

  const bonus =
    compatibility >= 80
      ? "🎁 VIP-стикер пак + доступ к секретному раунду"
      : compatibility >= 60
      ? "🎁 +15 монет в боте"
      : "🎁 +5 монет за участие";

  return {
    compatibility,
    winner,
    bonus,
    analysis: pairs.map((item) => ({
      question: item.question,
      score: Math.round(item.total * 100),
      note:
        item.total >= 0.75
          ? "Очень похожие взгляды"
          : item.total >= 0.5
          ? "Есть хорошие точки пересечения"
          : "Контрастные ответы — есть интрига"
    }))
  };
};

const getAiResult = async (playerOne, playerTwo) => {
  if (!openai) return null;

  const prompt = {
    questions,
    playerOne,
    playerTwo,
    outputSchema: {
      compatibility: "integer 10-100",
      winner:
        "one of: Оба победили!, Победитель: Игрок 1, Победитель: Игрок 2, Ничья, но бонус у Игрока 1 за скорость в Telegram Mini App 🚀",
      bonus:
        "one of: 🎁 VIP-стикер пак + доступ к секретному раунду | 🎁 +15 монет в боте | 🎁 +5 монет за участие",
      analysis: [
        {
          question: "string",
          score: "integer 0-100",
          note: "short russian sentence"
        }
      ]
    }
  };

  const completion = await openai.chat.completions.create({
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
        content: JSON.stringify(prompt)
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.analysis) || parsed.analysis.length !== questions.length) {
    return null;
  }

  const compatibility = Number(parsed.compatibility);
  if (!Number.isFinite(compatibility)) {
    return null;
  }

  return {
    compatibility: Math.max(10, Math.min(100, Math.round(compatibility))),
    winner: typeof parsed.winner === "string" ? parsed.winner : "Оба победили!",
    bonus: typeof parsed.bonus === "string" ? parsed.bonus : "🎁 +5 монет за участие",
    analysis: parsed.analysis.map((item, index) => ({
      question: questions[index],
      score: Math.max(0, Math.min(100, Math.round(Number(item?.score) || 0))),
      note: typeof item?.note === "string" ? item.note : "Интересные различия и совпадения"
    }))
  };
};

app.get("/api/questions", (_, res) => {
  res.json({ questions });
});

app.post("/api/duel", async (req, res) => {
  const { playerOne = [], playerTwo = [] } = req.body;

  if (!Array.isArray(playerOne) || !Array.isArray(playerTwo)) {
    return res.status(400).json({ error: "Некорректный формат ответов" });
  }

  try {
    const aiResult = await getAiResult(playerOne, playerTwo);
    if (aiResult) {
      return res.json(aiResult);
    }
  } catch (error) {
    console.error("AI scoring failed, using fallback:", error.message);
  }

  return res.json(buildFallbackResult(playerOne, playerTwo));
});

app.listen(PORT, () => {
  console.log(`Dating Battle backend running on http://localhost:${PORT}`);
});
