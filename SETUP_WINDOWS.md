# Инструкция по установке ArendRate на Windows

## Шаг 1: Установка необходимых инструментов

### 1.1. Установка Node.js

1. Скачайте Node.js версии 18 или выше с официального сайта:
   - https://nodejs.org/
   - Рекомендуется LTS версия (Long Term Support)

2. Запустите установщик и следуйте инструкциям
   - Убедитесь, что опция "Add to PATH" включена

3. Проверьте установку:
   ```powershell
   node --version
   npm --version
   ```
   Должны отображаться версии (например, v18.x.x и 9.x.x)

### 1.2. Установка PostgreSQL

1. Скачайте PostgreSQL с официального сайта:
   - https://www.postgresql.org/download/windows/
   - Или используйте установщик: https://www.postgresql.org/download/windows/installer/

2. Запустите установщик:
   - Выберите все компоненты (включая pgAdmin)
   - Запомните пароль для пользователя `postgres` (он понадобится!)
   - Порт по умолчанию: 5432

3. После установки PostgreSQL должен автоматически запуститься как служба Windows

4. Проверьте установку:
   ```powershell
   psql --version
   ```
   Если команда не найдена, добавьте PostgreSQL в PATH:
   - Обычно: `C:\Program Files\PostgreSQL\<версия>\bin`
   - Добавьте в переменную окружения PATH через "Система" → "Дополнительные параметры системы" → "Переменные среды"

## Шаг 2: Настройка базы данных

### 2.1. Создание базы данных и пользователя

Откройте **pgAdmin** (установлен вместе с PostgreSQL) или используйте командную строку:

**Вариант 1: Через pgAdmin**
1. Запустите pgAdmin
2. Подключитесь к серверу (пароль, который вы указали при установке)
3. Правой кнопкой на "Databases" → "Create" → "Database"
   - Name: `arendrate`
4. Правой кнопкой на "Login/Group Roles" → "Create" → "Login/Group Role"
   - General → Name: `arendrate_user`
   - Definition → Password: `your_password` (замените на свой)
   - Privileges → включите "Can login?"

**Вариант 2: Через командную строку (psql)**
```powershell
# Подключитесь к PostgreSQL (введите пароль postgres пользователя)
psql -U postgres

# В psql выполните:
CREATE DATABASE arendrate;
CREATE USER arendrate_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
\q
```

## Шаг 3: Установка зависимостей проекта

### 3.1. Установка зависимостей корневого проекта

Откройте PowerShell или командную строку в корневой папке проекта:

```powershell
# Перейдите в папку проекта (если еще не там)
cd C:\Users\besms\Documents\projects\ArendaRate

# Установите зависимости корневого проекта
npm install
```

### 3.2. Установка зависимостей backend

```powershell
cd backend
npm install
```

### 3.3. Установка зависимостей frontend

```powershell
cd ..\frontend
npm install
```

## Шаг 4: Настройка переменных окружения

### 4.1. Настройка backend/.env

1. Скопируйте файл `.env.example` в `.env`:
   ```powershell
   cd ..\backend
   copy .env.example .env
   ```

2. Откройте `backend/.env` в текстовом редакторе и измените:

   ```env
   # Обязательные настройки
   DATABASE_URL="postgresql://arendrate_user:your_password@localhost:5432/arendrate?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
   
   # Остальные настройки можно оставить по умолчанию
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

   **Важно:** Замените `your_password` на пароль, который вы указали при создании пользователя БД!

### 4.2. Настройка frontend/.env.local

```powershell
cd ..\frontend
```

Создайте файл `.env.local` со следующим содержимым:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Шаг 5: Настройка базы данных (Prisma)

### 5.1. Применение миграций

```powershell
cd ..\backend
npx prisma migrate dev --name init
```

Эта команда:
- Создаст все таблицы в базе данных
- Сгенерирует Prisma Client

### 5.2. Генерация Prisma Client

```powershell
npx prisma generate
```

### 5.3. (Опционально) Заполнение тестовыми данными

```powershell
npm run db:seed
```

## Шаг 6: Запуск проекта

### Вариант 1: Одновременный запуск (рекомендуется)

Из корневой папки проекта:

```powershell
cd C:\Users\besms\Documents\projects\ArendaRate
npm run dev
```

Это запустит и backend, и frontend одновременно.

### Вариант 2: Раздельный запуск

Откройте **два** окна PowerShell:

**Окно 1 - Backend:**
```powershell
cd C:\Users\besms\Documents\projects\ArendaRate\backend
npm run dev
```

**Окно 2 - Frontend:**
```powershell
cd C:\Users\besms\Documents\projects\ArendaRate\frontend
npm run dev
```

## Шаг 7: Проверка работы

1. Откройте браузер и перейдите на:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/health

2. Вы должны увидеть:
   - Карту с метками (если есть данные)
   - Возможность зарегистрироваться/войти

3. Проверьте консоль - не должно быть ошибок

## Шаг 8: Создание первого модератора

После регистрации первого пользователя, сделайте его модератором:

**Через Prisma Studio (рекомендуется):**
```powershell
cd backend
npx prisma studio
```

В открывшемся браузере:
1. Перейдите в таблицу `User`
2. Найдите вашего пользователя
3. Измените поле `role` на `MODERATOR`
4. Сохраните

**Или через SQL:**
```powershell
psql -U postgres -d arendrate
```

```sql
UPDATE "User" SET role = 'MODERATOR' WHERE email = 'your-email@example.com';
\q
```

## Решение проблем

### Ошибка: "node не является внутренней или внешней командой"
- Убедитесь, что Node.js установлен и добавлен в PATH
- Перезапустите PowerShell/командную строку после установки Node.js

### Ошибка: "psql не является внутренней или внешней командой"
- Добавьте PostgreSQL в PATH:
  - `C:\Program Files\PostgreSQL\<версия>\bin`
- Или используйте pgAdmin вместо командной строки

### Ошибка подключения к базе данных
- Убедитесь, что PostgreSQL запущен:
  - Откройте "Службы" (Services) → найдите "postgresql" → убедитесь, что статус "Выполняется"
- Проверьте правильность DATABASE_URL в `.env`
- Проверьте, что пользователь `arendrate_user` существует и имеет правильный пароль

### Ошибка миграций Prisma
```powershell
cd backend
npx prisma migrate reset  # ВНИМАНИЕ: удалит все данные!
npx prisma migrate dev
```

### Порт уже занят
Если порт 3000 или 3001 занят:
- Измените PORT в `backend/.env`
- Измените NEXT_PUBLIC_API_URL в `frontend/.env.local`
- Или завершите процесс, использующий порт:
  ```powershell
  # Найти процесс на порту 3001
  netstat -ano | findstr :3001
  # Завершить процесс (замените PID на номер из предыдущей команды)
  taskkill /PID <PID> /F
  ```

### Карта не загружается
- Откройте консоль браузера (F12) и проверьте ошибки
- Убедитесь, что все зависимости установлены: `cd frontend && npm install`

## Полезные команды

```powershell
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
1. Изучите структуру проекта в `README.md`
2. Настройте OAuth (Яндекс ID, VK ID) для полного функционала (опционально)
3. Начните разработку!

---

**Примечание:** OAuth настройка (Яндекс ID, VK ID) опциональна. Проект будет работать и без них, просто вход через email/password будет доступен.
