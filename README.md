# TeamDash — Dashboard для тимлидов и менеджеров

Веб-приложение для контроля выполнения проектов: сравнение план/факт по трудозатратам, контроль сроков, AI-анализ рисков.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | Vue 3 (Composition API), Vite, Naive UI, Vue Router 4, Axios |
| Backend | NestJS 10, TypeScript, TypeORM, PostgreSQL |
| AI | OpenAI gpt-4o (structured outputs) |
| Инфраструктура | Docker (PostgreSQL), JWT-авторизация |

## Функциональность

### Dashboard объекта контроля
- KPI-карточки: baseline, факт, отклонение, использование бюджета
- График сравнения plan vs fact
- Таблицы по направлениям и ролям с цветовой индикацией рисков
- AI-сводка прямо на дашборде

### AI-анализ
- Генерация анализа на основе данных проекта (OpenAI gpt-4o)
- Общая сводка, основные риски, вопросы команде, рекомендации, обоснования
- Копирование готовой сводки в буфер

### Comparison
- Сравнение план/факт по направлениям, ролям, задачам оценки и Jira Epic
- Фильтрация, сортировка по уровню риска

### Контроль сроков
- Группировка эпиков: просрочено / сегодня / ≤ 3 дней / в норме / без срока
- Цветовая кодировка дней до дедлайна

### Раздел данных (5 вкладок)
- **Baseline** — импорт Excel с плановой оценкой
- **Jira** — импорт выгрузки структуры и ворклога
- **Сотрудники** — импорт ADUsers.xlsx, ручное создание и редактирование
- **Связи** — привязка задач оценки к Jira Epic
- **Ревью** — список проблем по данным

## Быстрый старт

### Требования
- Node.js 20+
- Docker Desktop

### 1. Запустить базу данных

```bash
docker compose up -d
```

### 2. Настроить окружение

```bash
cp backend/.env.example backend/.env
```

Заполнить в `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hackaton_db
JWT_SECRET=your_secret
JWT_EXPIRES_IN=24h
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
PORT=3000
```

### 3. Запустить backend

```bash
cd backend
npm install
npm run start:dev
```

### 4. Запустить frontend

```bash
cd frontend
npm install
npm run dev
```

Открыть: `http://localhost:5173`

## Структура проекта

```
├── backend/                # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # JWT-авторизация
│   │   │   ├── projects/   # Проекты
│   │   │   ├── control-objects/  # Объекты контроля
│   │   │   ├── employees/  # Справочник сотрудников
│   │   │   ├── baseline/   # Импорт плановой оценки
│   │   │   ├── jira/       # Импорт Jira-выгрузки
│   │   │   ├── links/      # Связи EstimateTask ↔ Epic
│   │   │   ├── analytics/  # Расчёт план/факт, рисков
│   │   │   └── ai/         # AI-анализ (OpenAI)
│   │   └── common/         # Guards, filters, enums
│   └── docker-compose.yml
├── frontend/               # Vue 3 SPA
│   └── src/
│       ├── pages/          # Страницы приложения
│       ├── api/            # Axios-клиент и методы
│       ├── stores/         # Pinia-сторы
│       └── router/         # Vue Router
└── docker-compose.yml
```

## API документация

После запуска бэкенда: `http://localhost:3000/api/docs` (Swagger UI)

## Импорт данных

| Файл | Формат | Раздел |
|------|--------|--------|
| ADUsers.xlsx | DisplayName, sAMAccountName, mail, MemberOf, Роль, Направление | Данные → Сотрудники |
| Шаблон плановой оценки.xlsx | EstimateTask, направление, роль, часы | Данные → Baseline |
| Jira structure.xlsx | Epic, Task, Story | Данные → Jira |
| Jira worklog.xlsx | Исполнитель, часы, дата | Данные → Jira |
