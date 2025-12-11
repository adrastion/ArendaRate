-- Скрипт для выдачи прав пользователю arendrate_user
-- Выполните: sudo -u postgres psql -d arendrate -f fix_permissions.sql

-- Дать права на схему public
GRANT ALL PRIVILEGES ON SCHEMA public TO arendrate_user;
GRANT CREATE ON SCHEMA public TO arendrate_user;

-- Дать права на все существующие таблицы
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO arendrate_user;

-- Дать права на все существующие последовательности
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO arendrate_user;

-- Дать права на будущие таблицы и последовательности
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arendrate_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO arendrate_user;

-- Сделать пользователя владельцем схемы (опционально, но полезно)
ALTER SCHEMA public OWNER TO arendrate_user;

