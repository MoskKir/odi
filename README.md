# ODI Platform

Платформа для проведения организационно-деятельностных игр (ОДИ) с AI-ботами.

## Стек

**Frontend:** Vite, React 18, TypeScript, Tailwind CSS 4, BlueprintJS 5, Redux Toolkit, React Router

**Backend:** NestJS (monorepo), TypeORM, PostgreSQL, Redis, Kafka (KRaft), Socket.IO, OpenRouter API

## Структура проекта

```
odi/
├── frontend/          # React SPA (Chameleon UI)
│   └── src/
│       ├── views/     # Landing, Auth, GameList, MissionControl, Game, Master, Admin
│       ├── components/
│       ├── layouts/
│       ├── store/     # Redux Toolkit slices
│       └── hooks/
│
├── backend/           # NestJS микросервисы
│   ├── apps/
│   │   ├── gateway/   # REST API + WebSocket (порт 3000)
│   │   ├── auth/      # Аутентификация, JWT, пользователи
│   │   ├── game/      # Сессии, фазы, сценарии, доска
│   │   ├── ai/        # OpenRouter, промпты ботов, анализ эмоций
│   │   └── chat/      # Сообщения, история
│   └── libs/
│       ├── common/    # DTO, enums, Kafka topics
│       └── database/  # Entities, миграции, сиды
│
└── README.md
```

## Требования

- Node.js >= 18
- Docker & Docker Compose

## Быстрый старт

### 1. Инфраструктура

```bash
cd backend
docker compose up -d
```

Запустит PostgreSQL (5432), Redis (6379), Kafka (9092).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env     # настроить OPENROUTER_API_KEY
npm run migration:run    # создать таблицы
npm run seed             # заполнить начальные данные
```

Запуск всех сервисов (каждый в отдельном терминале):

```bash
npm run start:dev        # Gateway (порт 3000)
npm run start:auth       # Auth сервис
npm run start:game       # Game сервис
npm run start:ai         # AI сервис
npm run start:chat       # Chat сервис
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # порт 5173
```

Открыть http://localhost:5173

## Команды

### Frontend

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с HMR |
| `npm run build` | Production сборка |
| `npm run preview` | Предпросмотр сборки |

### Backend

| Команда | Описание |
|---------|----------|
| `npm run start:dev` | Gateway (watch mode) |
| `npm run start:auth` | Auth сервис (watch mode) |
| `npm run start:game` | Game сервис (watch mode) |
| `npm run start:ai` | AI сервис (watch mode) |
| `npm run start:chat` | Chat сервис (watch mode) |
| `npm run build` | Сборка всех сервисов |
| `npm run start:prod` | Production-запуск Gateway |
| `npm run migration:run` | Применить миграции |
| `npm run migration:revert` | Откатить последнюю миграцию |
| `npm run migration:generate` | Сгенерировать миграцию из entities |
| `npm run seed` | Заполнить базу начальными данными |

### Docker (только инфраструктура)

| Команда | Описание |
|---------|----------|
| `cd backend && docker compose up -d` | Запуск PostgreSQL + Redis + Kafka |
| `cd backend && docker compose down` | Остановка |
| `cd backend && docker compose down -v` | Остановка + удаление данных |

## Запуск через Docker (всё приложение)

Полный запуск всей платформы в Docker — без установки Node.js.

### Требования

- Docker >= 20.10
- Docker Compose >= 2.0

### Инструкция

**1. Настроить переменные окружения:**

```bash
cp backend/.env.example backend/.env
```

Открыть `backend/.env` и указать `OPENROUTER_API_KEY` (обязательно) и `JWT_SECRET` (рекомендуется сменить).

**2. Запустить все сервисы:**

```bash
docker compose up -d --build
```

Это запустит:
- PostgreSQL, Redis, Kafka (инфраструктура)
- Gateway, Auth, Game, AI, Chat (бекенд-микросервисы)
- Frontend (nginx на порту 80)
- Миграции + seed (одноразовый контейнер)

**3. Дождаться готовности:**

```bash
docker compose logs -f migrate
```

Когда увидите `All seeds completed successfully` — платформа готова.

**4. Открыть приложение:**

- Приложение: http://localhost
- API: http://localhost/api
- Вход: `admin@odi.dev` / `admin123`

### Управление

| Команда | Описание |
|---------|----------|
| `docker compose up -d --build` | Собрать и запустить всё |
| `docker compose down` | Остановить все сервисы |
| `docker compose down -v` | Остановить + удалить данные |
| `docker compose logs -f gateway` | Логи gateway |
| `docker compose logs -f` | Логи всех сервисов |
| `docker compose restart gateway` | Перезапустить сервис |
| `docker compose ps` | Статус контейнеров |

## Переменные окружения (backend/.env)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт PostgreSQL | `5432` |
| `DB_NAME` | Имя базы | `odi` |
| `DB_USER` | Пользователь БД | `odi` |
| `DB_PASSWORD` | Пароль БД | `odi_secret` |
| `REDIS_HOST` | Хост Redis | `localhost` |
| `REDIS_PORT` | Порт Redis | `6379` |
| `KAFKA_BROKERS` | Адрес Kafka | `localhost:9092` |
| `JWT_SECRET` | Секрет для JWT | - |
| `JWT_EXPIRES_IN` | Время жизни токена | `7d` |
| `OPENROUTER_API_KEY` | API ключ OpenRouter | - |
| `OPENROUTER_DEFAULT_MODEL` | Модель по умолчанию | `anthropic/claude-sonnet-4-20250514` |
| `PORT` | Порт Gateway | `3000` |

## Начальные данные (seed)

После `npm run seed` будут созданы:

- **Админ:** admin@odi.dev / admin123
- **5 сценариев:** Бизнес-стратегия, Креативный штурм, Командообразование, Питч инвестору, Исследование проблемы
- **8 AI-ботов:** Модератор, Критик, Визионер, Аналитик, Миротворец, Провокатор, Хранитель, Эксперт
- **Системные настройки:** название платформы, лимиты, feature-флаги

## Страницы (Frontend)

| URL | Страница | Доступ |
|-----|----------|--------|
| `/` | Лендинг | Публичный |
| `/login` | Вход | Публичный |
| `/register` | Регистрация | Публичный |
| `/dashboard` | Мои игры | Авторизованный |
| `/mission` | Центр управления миссией | Авторизованный |
| `/game/:viewMode` | Игровой экран (board, theatre, graph, hq, aquarium, terminal) | Авторизованный |
| `/master` | Панель мастера игры | Авторизованный |
| `/admin` | Админ-панель (дашборд) | Авторизованный |
| `/admin/users` | Управление пользователями | Авторизованный |
| `/admin/sessions` | Управление сессиями | Авторизованный |
| `/admin/bots` | Настройка AI-ботов | Авторизованный |
| `/admin/scenarios` | Управление сценариями | Авторизованный |
| `/admin/system` | Системные настройки | Авторизованный |

## API (Backend)

Все эндпоинты за префиксом `/api`.

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |
| GET | `/api/games` | Список игр |
| POST | `/api/games` | Создать игру |
| GET | `/api/games/:id` | Детали игры |
| PATCH | `/api/games/:id/status` | Сменить статус |
| POST | `/api/games/:id/join` | Присоединиться |
| POST | `/api/games/:id/phase/advance` | Следующая фаза |
| GET | `/api/games/:id/messages` | История чата |
| POST | `/api/games/:id/messages` | Отправить сообщение |
| GET | `/api/scenarios` | Список сценариев |
| GET | `/api/bots` | Список ботов |
| GET | `/api/admin/users` | Пользователи (админ) |
| GET | `/api/admin/settings` | Настройки (админ) |
| PUT | `/api/admin/settings` | Обновить настройки (админ) |

## WebSocket

Namespace: `/game` (Socket.IO)

| Событие | Направление | Описание |
|---------|-------------|----------|
| `session:join` | Client -> Server | Подключиться к сессии |
| `session:leave` | Client -> Server | Выйти из сессии |
| `chat:send` | Client -> Server | Отправить сообщение |
| `emotion:set` | Client -> Server | Установить эмоцию |
| `board:add` | Client -> Server | Добавить карточку |
| `board:vote` | Client -> Server | Голосовать |
| `chat:message` | Server -> Client | Новое сообщение |
| `session:status` | Server -> Client | Изменение статуса сессии |
| `phase:update` | Server -> Client | Смена фазы |
| `emotion:snapshot` | Server -> Client | Обновление эмоций команды |

## Архитектура

```
                    ┌──────────────┐
                    │   Frontend   │
                    │  (React SPA) │
                    └──────┬───────┘
                           │ HTTP + WebSocket
                    ┌──────▼───────┐
                    │   Gateway    │
                    │ (REST + WS)  │
                    └──────┬───────┘
                           │ Kafka
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
     │    Auth     │ │   Game   │ │    Chat     │
     │  (JWT/Users)│ │(Sessions)│ │ (Messages)  │
     └──────┬──────┘ └────┬─────┘ └──────┬──────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    └──────────────┘

                    ┌──────────────┐
                    │   AI Service │──── OpenRouter API
                    └──────────────┘
```
