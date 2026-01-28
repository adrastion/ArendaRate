# Исправление ошибки "permission denied to create database" при миграциях

## Проблема

Prisma Migrate пытается создать shadow database для разработки, но у пользователя `arendrate_user` нет прав на создание баз данных.

## Решение 1: Использовать `prisma db push` (быстрое решение)

Для первоначальной настройки используйте `db push` вместо миграций:

```bash
cd ~/ArendRate/backend
npx prisma db push
npx prisma generate
```

Это создаст все таблицы напрямую без использования shadow database.

**После этого перезапустите backend:**
```bash
pm2 restart arendrate-backend
```

## Решение 2: Дать права на создание БД (для production миграций)

Если нужно использовать миграции в production:

```bash
# Войдите как postgres
sudo -u postgres psql

# Дайте права на создание БД (временно)
ALTER USER arendrate_user CREATEDB;

# Выйдите
\q
```

Затем создайте миграцию:
```bash
cd ~/ArendRate/backend
npx prisma migrate dev --name init
```

После создания миграции можно убрать права:
```bash
sudo -u postgres psql
ALTER USER arendrate_user NOCREATEDB;
\q
```

## Решение 3: Использовать production миграции (рекомендуется)

Для production используйте `migrate deploy`, который не требует shadow database:

```bash
cd ~/ArendRate/backend

# Сначала создайте миграцию с правами postgres
# Или используйте db push для создания схемы
npx prisma db push

# Затем создайте миграцию на основе текущей схемы
npx prisma migrate dev --create-only --name init

# Примените миграцию
npx prisma migrate deploy

# Сгенерируйте Prisma Client
npx prisma generate
```

## Решение 4: Создать shadow database вручную

```bash
# Создайте shadow database как postgres
sudo -u postgres psql
CREATE DATABASE arendrate_shadow;
GRANT ALL PRIVILEGES ON DATABASE arendrate_shadow TO arendrate_user;
\q

# Добавьте в DATABASE_URL параметр для shadow database
# Но это сложно, лучше использовать db push
```

## Рекомендуемый подход для production

Для production сервера лучше использовать `db push` для первоначальной настройки:

```bash
cd ~/ArendRate/backend

# 1. Создайте все таблицы напрямую
npx prisma db push

# 2. Сгенерируйте Prisma Client
npx prisma generate

# 3. Проверьте таблицы
cd ~
sudo -u postgres psql -d arendrate -c '\dt'

# 4. Перезапустите backend
pm2 restart arendrate-backend

# 5. Проверьте логи
pm2 logs arendrate-backend --lines 30
```

## Разница между `db push` и `migrate`

- **`prisma db push`** - синхронизирует схему с БД напрямую, без создания файлов миграций. Быстро, но не сохраняет историю изменений.
- **`prisma migrate dev`** - создает файлы миграций и применяет их. Требует shadow database для разработки.
- **`prisma migrate deploy`** - применяет существующие миграции. Не требует shadow database, подходит для production.

## Для production: создание миграций после db push

Если вы использовали `db push` и хотите создать миграции для истории:

```bash
cd ~/ArendRate/backend

# 1. Создайте миграцию на основе текущего состояния
npx prisma migrate dev --create-only --name init

# Это создаст файл миграции, но не применит его (так как схема уже синхронизирована)

# 2. Вручную отредактируйте миграцию или пометьте как примененную
npx prisma migrate resolve --applied init
```

Но для production это не обязательно - `db push` работает отлично.
