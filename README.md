# Dating Battle Telegram Mini App

Мини-приложение в игровом формате знакомств:
- 2 игрока отвечают на одинаковые вопросы.
- OpenAI API напрямую сравнивает ответы и формирует результат дуэли.
- Выводится процент совместимости, победитель и бонус.
- После дуэли открывается live-чат.

## Стек
- Frontend: React + Vite
- Backend: Node.js + Express (опционально, для других задач)

## Запуск
```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Режим без собственного сервера (только OpenAI)
Фронтенд отправляет запрос напрямую в OpenAI API и не использует endpoint `/api/duel`.

1. Получите API-ключ OpenAI в platform.openai.com.
2. Создайте файл `frontend/.env`:

```bash
VITE_OPENAI_API_KEY="<your_key>"
# необязательно, по умолчанию gpt-4o-mini
VITE_OPENAI_MODEL="gpt-4o-mini"
```

3. Запустите только фронтенд:

```bash
npm run dev --workspace frontend
```

> ⚠️ Важно: ключ в `VITE_...` попадает в браузер, поэтому используйте отдельный ограниченный ключ и лимиты бюджета.
