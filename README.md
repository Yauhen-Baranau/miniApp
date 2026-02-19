# Dating Battle Telegram Mini App

Мини-приложение в игровом формате знакомств:
- 2 игрока отвечают на одинаковые вопросы.
- Node.js API сравнивает ответы по лексике и тону (AI-like scoring).
- Выводится процент совместимости, победитель и бонус.
- После дуэли открывается live-чат.

## Стек
- Frontend: React + Vite
- Backend: Node.js + Express

## Запуск
```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

Чтобы указать другой адрес API, задайте `VITE_API_URL`.
