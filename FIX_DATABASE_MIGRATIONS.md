# Исправление ошибки "The table `public.User` does not exist"

## Проблема

Ошибка возникает, когда таблицы в базе данных не созданы. Это означает, что миграции Prisma не были применены.

## Решение

### Шаг 1: Проверьте подключение к базе данных

```bash
cd ~/ArendRate/backend
cat .env | grep DATABASE_URL
```

Убедитесь, что `DATABASE_URL` правильный и база данных существует.

### Шаг 2: Проверьте существование базы данных

```bash
# Подключитесь к PostgreSQL
sudo -u postgres psql

# Проверьте список баз данных
\l

# Проверьте, существует ли база arendrate
# Если нет, создайте:
CREATE DATABASE arendrate;
\q
```

### Шаг 3: Примените миграции

**Для production (рекомендуется):**
```bash
cd ~/ArendRate/backend
npx prisma migrate deploy
```

**Для development (если нужно создать новую миграцию):**
```bash
cd ~/ArendRate/backend
npx prisma migrate dev --name init
```

### Шаг 4: Сгенерируйте Prisma Client

```bash
cd ~/ArendRate/backend
npx prisma generate
```

### Шаг 5: Проверьте созданные таблицы

```bash
# Через psql
sudo -u postgres psql -d arendrate
\dt
# Должны быть таблицы: User, Address, Apartment, Review, Rating, Photo, ModerationLog
\q
```

Или через Prisma Studio:
```bash
cd ~/ArendRate/backend
npx prisma studio
# Откроется в браузере на http://localhost:5555
```

### Шаг 6: Перезапустите backend

```bash
pm2 restart arendrate-backend
pm2 logs arendrate-backend --lines 20
```

## Если миграции не применяются

### Вариант 1: Сброс и создание заново (ВНИМАНИЕ: удалит все данные!)

```bash
cd ~/ArendRate/backend
npx prisma migrate reset
# Это удалит все данные и создаст базу заново
```

### Вариант 2: Проверка состояния миграций

```bash
cd ~/ArendRate/backend
npx prisma migrate status
```

Это покажет, какие миграции применены, а какие нет.

### Вариант 3: Создание миграции вручную

Если миграций нет в папке `prisma/migrations`:

```bash
cd ~/ArendRate/backend
npx prisma migrate dev --name init
```

Это создаст первую миграцию на основе `schema.prisma`.

## Проверка после исправления

```bash
# 1. Проверьте таблицы
sudo -u postgres psql -d arendrate -c '\dt'

# 2. Проверьте логи backend
pm2 logs arendrate-backend --lines 20

# 3. Попробуйте зарегистрироваться через API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User",
    "dateOfBirth": "2000-01-01"
  }'
```

## Частые ошибки

### Ошибка: "Database does not exist"

**Решение:**
```bash
sudo -u postgres psql
CREATE DATABASE arendrate;
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
\q
```

### Ошибка: "User does not have permission"

**Решение:**
```bash
sudo -u postgres psql -d arendrate
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO arendrate_user;
\q
```

### Ошибка: "Migration failed"

**Решение:**
```bash
# Проверьте логи
cd ~/ArendRate/backend
npx prisma migrate status

# Если нужно, откатите миграцию
npx prisma migrate resolve --rolled-back <migration_name>

# Или сбросьте все (ВНИМАНИЕ: удалит данные!)
npx prisma migrate reset
```

## Полная последовательность команд

Если ничего не помогает, выполните полную настройку:

```bash
# 1. Перейдите в backend
cd ~/ArendRate/backend

# 2. Проверьте .env
cat .env | grep DATABASE_URL

# 3. Примените миграции
npx prisma migrate deploy

# 4. Сгенерируйте Prisma Client
npx prisma generate

# 5. Проверьте таблицы
sudo -u postgres psql -d arendrate -c '\dt'

# 6. Перезапустите backend
pm2 restart arendrate-backend

# 7. Проверьте логи
pm2 logs arendrate-backend --lines 30
```
