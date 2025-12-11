# Архитектура проекта ArendRate

## Общая структура

Проект разделен на три основные части:

1. **Backend** (`backend/`) - Express API сервер
2. **Frontend** (`frontend/`) - Next.js приложение
3. **Shared** (`shared/`) - Общие TypeScript типы

## Backend архитектура

### Структура директорий
```
backend/
├── src/
│   ├── index.ts              # Точка входа
│   ├── config/               # Конфигурация (Passport)
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # JWT аутентификация
│   │   └── errorHandler.ts  # Обработка ошибок
│   ├── routes/               # API маршруты
│   │   ├── auth.ts          # Аутентификация
│   │   ├── addresses.ts     # Адреса и квартиры
│   │   ├── apartments.ts    # Квартиры
│   │   ├── reviews.ts       # Отзывы
│   │   ├── moderation.ts    # Модерация
│   │   └── upload.ts        # Загрузка файлов
│   ├── services/             # Бизнес-логика
│   │   ├── authService.ts   # Логика аутентификации
│   │   └── addressService.ts # Логика работы с адресами
│   └── prisma/
│       └── seed.ts          # Начальные данные
├── prisma/
│   └── schema.prisma        # Схема базы данных
└── uploads/                  # Загруженные файлы
```

### Модели данных (Prisma Schema)

#### User
- Хранит информацию о пользователях
- Поддержка OAuth через yandexId и vkId
- Роли: GUEST, RENTER, MODERATOR, ADMIN

#### Address
- Хранит адреса зданий
- Координаты для карты
- Уникальность по комбинации country, city, street, building

#### Apartment
- Квартиры/помещения в зданиях
- Связь с Address
- Уникальность по addressId + number

#### Review
- Отзывы пользователей
- Статусы: PENDING, APPROVED, REJECTED
- Средний балл вычисляется из оценок по критериям

#### Rating
- Детальные оценки по 6 критериям
- Оценка от 1 до 5

#### Photo
- Фотографии к отзывам
- До 5 штук на отзыв

#### ModerationLog
- Логи действий модераторов
- История одобрений/отклонений

### API Endpoints

#### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `GET /api/auth/yandex` - OAuth Яндекс
- `GET /api/auth/vk` - OAuth VK

#### Адреса
- `GET /api/addresses/search?q=...` - Поиск
- `GET /api/addresses/map` - Метки для карты
- `GET /api/addresses/:id` - Детали адреса
- `POST /api/addresses/apartments` - Создать/найти квартиру

#### Отзывы
- `POST /api/reviews` - Создать отзыв
- `GET /api/reviews/my` - Мои отзывы
- `GET /api/reviews/:id` - Детали отзыва

#### Модерация
- `GET /api/moderation/pending` - Отзывы на модерации
- `POST /api/moderation/:id/approve` - Одобрить
- `POST /api/moderation/:id/reject` - Отклонить

### Безопасность

- JWT токены для аутентификации
- Хеширование паролей (bcrypt)
- Middleware для проверки ролей
- Валидация входных данных (express-validator)
- CORS настройки

## Frontend архитектура

### Структура директорий
```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Корневой layout
│   ├── page.tsx             # Главная страница (карта)
│   ├── login/               # Страница входа
│   ├── register/            # Страница регистрации
│   ├── apartment/[id]/      # Страница квартиры
│   ├── profile/             # Личный кабинет
│   ├── moderation/          # Панель модерации
│   └── auth/callback/       # OAuth callback
├── components/              # React компоненты
│   ├── MapPage.tsx          # Главная страница с картой
│   ├── Map.tsx              # Компонент карты
│   ├── Header.tsx           # Шапка сайта
│   ├── AddressSearch.tsx    # Поиск адресов
│   ├── ApartmentList.tsx    # Список квартир
│   ├── AddReviewModal.tsx   # Модалка добавления отзыва
│   └── ...
├── lib/                     # Утилиты
│   ├── api.ts              # API клиент
│   └── auth.ts             # Функции аутентификации
├── store/                   # Zustand stores
│   └── authStore.ts        # Состояние аутентификации
└── types/                   # TypeScript типы (реэкспорт из shared)
```

### Управление состоянием

- **Zustand** для глобального состояния (аутентификация)
- **TanStack Query** для кеширования API запросов
- Локальное состояние через React hooks

### Маршрутизация

Next.js App Router с динамическими маршрутами:
- `/` - Главная страница (карта)
- `/login` - Вход
- `/register` - Регистрация
- `/apartment/[id]` - Страница квартиры
- `/profile` - Личный кабинет
- `/moderation` - Модерация (только для модераторов)

### Компоненты

#### MapPage
Главный компонент, объединяющий:
- Карту с метками
- Поиск адресов
- Список квартир
- Модалку добавления отзыва

#### Map
Интеграция с OpenStreetMap через Leaflet:
- Отображение меток зданий
- Клики по меткам
- Цветовая индикация активных/неактивных меток
- Кастомные иконки маркеров с количеством квартир

#### AddReviewModal
Пошаговая форма:
1. Выбор адреса и номера квартиры
2. Оценки по 6 критериям
3. Комментарий (до 100 символов)
4. Период проживания
5. Загрузка фото (до 5 штук)

## Поток данных

### Создание отзыва

1. Пользователь заполняет форму на frontend
2. Frontend загружает фото на `/api/upload/photos`
3. Frontend создает квартиру через `/api/addresses/apartments` (если нужно)
4. Frontend создает отзыв через `/api/reviews`
5. Frontend связывает фото с отзывом через `/api/upload/photos/link`
6. Backend сохраняет отзыв со статусом PENDING
7. Модератор проверяет через `/api/moderation/pending`
8. Модератор одобряет/отклоняет отзыв

### Просмотр отзывов

1. Гость/Пользователь открывает карту
2. Frontend получает метки через `/api/addresses/map`
3. При клике на метку (для авторизованных) получает список квартир
4. При выборе квартиры загружает отзывы через `/api/apartments/:id`
5. Отображает только APPROVED отзывы (для неавторизованных)

## Интеграции

### OpenStreetMap (Leaflet)
- Используется для отображения карты
- Не требует API ключа
- Метки создаются программно через Leaflet API
- Геокодирование через Nominatim API (OpenStreetMap)

### OAuth провайдеры
- Яндекс ID
- VK ID
- Реализовано через Passport.js

## Масштабирование

### Текущие ограничения
- Файлы хранятся локально в `uploads/`
- Нет кеширования меток карты
- Нет пагинации для меток

### Возможные улучшения
- Хранилище файлов (S3, Cloudinary)
- Redis для кеширования
- Пагинация и виртуальная прокрутка меток
- WebSocket для реального времени
- Индексация и полнотекстовый поиск (Elasticsearch)
- CDN для статических файлов

## Безопасность

### Реализовано
- JWT аутентификация
- Хеширование паролей
- Валидация входных данных
- Проверка ролей на backend
- CORS защита

### Рекомендуется добавить
- Rate limiting
- Защита от SQL injection (Prisma защищает)
- Защита от XSS (React защищает)
- HTTPS в production
- Валидация размера файлов
- Проверка типов файлов

