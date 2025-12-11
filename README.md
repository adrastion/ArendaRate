# ArendRate

Платформа для отзывов об аренде жилья с интерактивной картой и системой модерации.

## Структура проекта

- `frontend/` - Next.js приложение (React + TypeScript)
- `backend/` - Express API сервер (Node.js + TypeScript)
- `shared/` - Общие TypeScript типы

## Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Установка

1. **Клонирование репозитория** (если есть)
```bash
git clone <repository-url>
cd ArendRate
```

2. **Установка зависимостей**
```bash
# Установка зависимостей для всего проекта
npm install

# Или установка по отдельности
cd backend && npm install
cd ../frontend && npm install
```

3. **Настройка базы данных PostgreSQL**
```bash
# Создайте базу данных
createdb arendrate

# Или через psql
psql -U postgres
CREATE DATABASE arendrate;
```

4. **Настройка переменных окружения**

Создайте файл `backend/.env` на основе `backend/.env.example`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/arendrate?schema=public"
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback
VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret
VK_CALLBACK_URL=http://localhost:3001/api/auth/vk/callback
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp
FRONTEND_URL=http://localhost:3000
```

Создайте файл `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Примечание:** Проект использует OpenStreetMap через Leaflet, поэтому API ключ не требуется.

5. **Настройка базы данных**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

6. **Запуск проекта**

Из корневой директории:
```bash
npm run dev
```

Или отдельно:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend будет доступен на http://localhost:3001
Frontend будет доступен на http://localhost:3000

## Технологический стек

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- Passport.js (OAuth: Яндекс ID, VK ID)
- JWT для аутентификации
- Multer для загрузки файлов

### Frontend
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Яндекс.Карты API
- React Hook Form + Zod для валидации
- Zustand для управления состоянием
- TanStack Query для работы с API

## Основные функции

### Для всех пользователей
- ✅ Интерактивная карта с метками зданий
- ✅ Поиск по адресу с автодополнением
- ✅ Просмотр агрегированной информации о количестве квартир и отзывов

### Для авторизованных пользователей
- ✅ Регистрация и вход (email/password, Яндекс ID, VK ID)
- ✅ Добавление отзывов с детальными оценками (6 критериев)
- ✅ Загрузка до 5 фотографий к отзыву
- ✅ Просмотр всех отзывов по квартирам
- ✅ Личный кабинет с управлением своими отзывами

### Для модераторов
- ✅ Панель модерации отзывов
- ✅ Одобрение/отклонение отзывов с указанием причины
- ✅ Просмотр всех отзывов на модерации

## Структура API

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получение текущего пользователя
- `GET /api/auth/yandex` - OAuth Яндекс
- `GET /api/auth/vk` - OAuth VK

### Адреса и квартиры
- `GET /api/addresses/search` - Поиск адресов
- `GET /api/addresses/map` - Получение меток для карты
- `GET /api/addresses/:id` - Получение адреса с квартирами
- `POST /api/addresses/apartments` - Создание/поиск квартиры
- `GET /api/apartments/:id` - Получение квартиры с отзывами

### Отзывы
- `POST /api/reviews` - Создание отзыва
- `GET /api/reviews/my` - Мои отзывы
- `GET /api/reviews/:id` - Получение отзыва

### Загрузка файлов
- `POST /api/upload/photos` - Загрузка фотографий
- `POST /api/upload/photos/link` - Связывание фото с отзывом

### Модерация
- `GET /api/moderation/pending` - Отзывы на модерации
- `POST /api/moderation/:id/approve` - Одобрить отзыв
- `POST /api/moderation/:id/reject` - Отклонить отзыв

## Настройка OAuth

### Яндекс ID
1. Перейдите на https://oauth.yandex.ru/
2. Создайте новое приложение
3. Получите Client ID и Client Secret
4. Добавьте callback URL: `http://localhost:3001/api/auth/yandex/callback`

### VK ID
1. Перейдите на https://dev.vk.com/
2. Создайте новое приложение
3. Получите Client ID и Client Secret
4. Добавьте redirect URI: `http://localhost:3001/api/auth/vk/callback`

### OpenStreetMap
Проект использует OpenStreetMap через библиотеку Leaflet. API ключ не требуется, карты загружаются бесплатно с публичных серверов. Геокодирование выполняется через Nominatim API (также бесплатно, но с ограничениями по количеству запросов).

## Разработка

### Добавление нового функционала
1. Backend: добавьте роуты в `backend/src/routes/`
2. Frontend: добавьте API методы в `frontend/lib/api.ts`
3. Обновите типы в `shared/types/` при необходимости

### Работа с базой данных
```bash
cd backend
npx prisma studio  # Визуальный редактор БД
npx prisma migrate dev  # Создание миграции
npx prisma generate  # Генерация Prisma Client
```

## Производственное развертывание

1. Установите переменные окружения для production
2. Соберите frontend: `cd frontend && npm run build`
3. Соберите backend: `cd backend && npm run build`
4. Запустите: `npm start` (нужно настроить скрипты)

## Лицензия

MIT

