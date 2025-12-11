# Исправление проблемы с множественными соединениями к БД

## Проблема
При каждом создании нового экземпляра PrismaClient открывалось новое соединение с PostgreSQL.
При большом количестве запросов это приводило к ошибке "Too many database connections opened".

## Решение
Реализован Singleton pattern для PrismaClient:
- Создан единый экземпляр в `src/lib/prisma.ts`
- Все роуты и сервисы используют этот экземпляр
- В development режиме экземпляр сохраняется в `global.prisma`

## Если проблема повторится

### Вариант 1: Увеличить лимит подключений в PostgreSQL
```sql
-- Подключитесь как superuser
sudo -u postgres psql

-- Увеличить max_connections
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();

-- Или в postgresql.conf
max_connections = 200
```

### Вариант 2: Использовать connection pooling
Добавьте в DATABASE_URL параметры:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=5&pool_timeout=20"
```

### Вариант 3: Использовать PgBouncer
Для production рекомендуется использовать connection pooler (PgBouncer).
