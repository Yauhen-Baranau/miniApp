import { useState } from "react";

const botReplies = [
  "Звучит мило 💫",
  "Вот это chemistry 🔥",
  "Раскройте тему глубже 😉",
  "Классный мэтч, продолжайте!"
];

export default function LiveChat() {
  const [messages, setMessages] = useState([
    { from: "system", text: "Лайв-чат открыт. Начните знакомство после дуэли!" }
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { from: "you", text },
      { from: "opponent", text: botReplies[Math.floor(Math.random() * botReplies.length)] }
    ]);
    setInput("");
  };

  return (
    <section className="card chat-card">
      <h3>💬 Live-чат после дуэли</h3>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={`${msg.from}-${index}`} className={`bubble ${msg.from}`}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-input-wrap">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Напиши сообщение..."
          onKeyDown={(event) => event.key === "Enter" && send()}
        />
        <button onClick={send}>Отправить</button>
      </div>
    </section>
  );
}
