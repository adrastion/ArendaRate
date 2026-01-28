# Применение миграций Prisma

## Проблема

В базе данных есть только таблица `_prisma_migrations`, но нет основных таблиц (User, Address, и т.д.). Это означает, что миграции не были применены.

## Решение

### Шаг 1: Проверьте статус миграций

```bash
cd ~/ArendRate/backend
npx prisma migrate status
```

Это покажет, какие миграции применены, а какие нет.

### Шаг 2: Примените миграции

**Для production:**
```bash
cd ~/ArendRate/backend
npx prisma migrate deploy
```

**Если миграций нет, создайте их:**
```bash
cd ~/ArendRate/backend
npx prisma migrate dev --name init
```

### Шаг 3: Сгенерируйте Prisma Client

```bash
cd ~/ArendRate/backend
npx prisma generate
```

### Шаг 4: Проверьте таблицы

```bash
# Без sudo (чтобы избежать ошибки с директорией)
psql -U arendrate_user -d arendrate -h localhost -c '\dt'
# Введите пароль пользователя arendrate_user

# Или через postgres пользователя (но из другой директории)
cd ~
sudo -u postgres psql -d arendrate -c '\dt'
```

Должны быть таблицы:
- User
- Address
- Apartment
- Review
- Rating
- Photo
- ModerationLog

### Шаг 5: Перезапустите backend

```bash
pm2 restart arendrate-backend
pm2 logs arendrate-backend --lines 20
```

## Если миграций нет в папке migrations

Если папка `backend/prisma/migrations` пуста или не существует:

```bash
cd ~/ArendRate/backend
npx prisma migrate dev --name init
```

Это создаст первую миграцию на основе `schema.prisma` и применит её.

## Если возникают ошибки

### Ошибка: "Migration failed"

```bash
# Проверьте детали
cd ~/ArendRate/backend
npx prisma migrate status

# Если нужно, сбросьте (ВНИМАНИЕ: удалит данные!)
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Ошибка: "Database connection"

Проверьте `DATABASE_URL` в `.env`:
```bash
cd ~/ArendRate/backend
cat .env | grep DATABASE_URL
```

## Полная последовательность

```bash
# 1. Перейдите в backend
cd ~/ArendRate/backend

# 2. Проверьте статус миграций
npx prisma migrate status

# 3. Если миграций нет, создайте
npx prisma migrate dev --name init

# 4. Если миграции есть, примените
npx prisma migrate deploy

# 5. Сгенерируйте Prisma Client
npx prisma generate

# 6. Проверьте таблицы (из домашней директории)
cd ~
sudo -u postgres psql -d arendrate -c '\dt'

# 7. Перезапустите backend
pm2 restart arendrate-backend

# 8. Проверьте логи
pm2 logs arendrate-backend --lines 30
```
