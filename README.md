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


## Подключение реального ИИ (OpenAI)
Бэкенд уже умеет использовать OpenAI для расчёта совместимости в `POST /api/duel`.

1. Получите API-ключ OpenAI.
2. Перед запуском задайте переменные окружения:

```bash
export OPENAI_API_KEY="<your_key>"
# необязательно, по умолчанию gpt-4o-mini
export OPENAI_MODEL="gpt-4o-mini"
```

Если ключ не задан или API временно недоступен, сервер автоматически переключится на локальный fallback-алгоритм.
