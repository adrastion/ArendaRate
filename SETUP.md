# Инструкция по настройке проекта ArendRate

## Пошаговая установка

### 1. Подготовка окружения

#### Установка PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (через Homebrew)
brew install postgresql
brew services start postgresql

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE arendrate;
CREATE USER arendrate_user WITH PASSWORD '0408';
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
\q
```

#### Установка Node.js
Убедитесь, что у вас установлен Node.js версии 18 или выше:
```bash
node --version  # должно быть v18.x.x или выше
```

### 2. Клонирование и установка зависимостей

```bash
cd /path/to/ArendRate
npm install
```

### 3. Настройка базы данных

#### Создание .env файла для backend
```bash
cd backend
cp .env.example .env
```

Отредактируйте `backend/.env`:
```env
DATABASE_URL="postgresql://arendrate_user:your_password@localhost:5432/arendrate?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

#### Применение миграций
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

#### (Опционально) Заполнение тестовыми данными
```bash
npm run db:seed
```

### 4. Настройка frontend

```bash
cd frontend
```

Создайте файл `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Примечание:** Проект использует OpenStreetMap через Leaflet, поэтому API ключ не требуется. Карты загружаются бесплатно с публичных серверов OpenStreetMap.

### 5. Настройка OAuth (опционально, для полного функционала)

#### Яндекс ID
1. Перейдите на https://oauth.yandex.ru/
2. Нажмите "Зарегистрировать новое приложение"
3. Заполните форму:
   - Название: ArendRate
   - Платформы: Web-сервисы
   - Redirect URI: `http://localhost:3001/api/auth/yandex/callback`
4. Скопируйте Client ID и Client Secret
5. Добавьте в `backend/.env`:
   ```env
   YANDEX_CLIENT_ID=your-client-id
   YANDEX_CLIENT_SECRET=your-client-secret
   ```

#### VK ID
1. Перейдите на https://dev.vk.com/
2. Создайте новое приложение (тип: Веб-сайт)
3. В настройках добавьте Redirect URI: `http://localhost:3001/api/auth/vk/callback`
4. Скопируйте Application ID (Client ID) и Secure key (Client Secret)
5. Добавьте в `backend/.env`:
   ```env
   VK_CLIENT_ID=your-app-id
   VK_CLIENT_SECRET=your-secure-key
   ```

### 6. Запуск проекта

#### Вариант 1: Одновременный запуск (рекомендуется)
Из корневой директории:
```bash
npm run dev
```

#### Вариант 2: Раздельный запуск
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 7. Проверка работы

1. Откройте http://localhost:3000 в браузере
2. Проверьте, что карта загружается
3. Зарегистрируйте нового пользователя
4. Попробуйте добавить тестовый отзыв

### 8. Создание первого модератора

Через Prisma Studio:
```bash
cd backend
npx prisma studio
```

Или через SQL:
```sql
UPDATE "User" SET role = 'MODERATOR' WHERE email = 'your-email@example.com';
```

## Решение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте правильность DATABASE_URL в `.env`
- Проверьте права доступа пользователя БД

### Ошибка миграций
```bash
cd backend
npx prisma migrate reset  # ВНИМАНИЕ: удалит все данные
npx prisma migrate dev
```

### Проблемы с картой
- Проверьте, что Leaflet загружается корректно (откройте консоль браузера)
- Если карта не отображается, проверьте доступность серверов OpenStreetMap
- Убедитесь, что все зависимости установлены (`npm install` в папке `frontend`)

### Ошибки OAuth
- Проверьте правильность callback URL в настройках приложения
- Убедитесь, что URL совпадают в `.env` и настройках OAuth приложения
- Проверьте, что приложение активировано в панели разработчика

## Полезные команды

```bash
# Backend
cd backend
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run db:migrate   # Применить миграции
npm run db:studio    # Открыть Prisma Studio
npm run db:seed      # Заполнить тестовыми данными

# Frontend
cd frontend
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run start        # Запуск production версии
```

## Следующие шаги

После успешной установки:
1. Изучите структуру проекта в README.md
2. Настройте production переменные окружения
3. Настройте CI/CD для автоматического деплоя
4. Добавьте мониторинг и логирование

