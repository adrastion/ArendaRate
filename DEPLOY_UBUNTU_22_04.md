# Запуск ArendRate на облачном сервере Ubuntu 22.04 (без создания отдельного пользователя)

Инструкция рассчитана на работу под текущим пользователем сервера (например, `ubuntu`), без заведения отдельного системного юзера. Все команды выполняются на чистом сервере Ubuntu 22.04.

## 1. Подготовка ОС
```bash
sudo apt update
sudo apt install -y curl git build-essential ca-certificates \
  postgresql postgresql-contrib redis-server
sudo systemctl enable --now postgresql redis-server
```

## 2. Установка Node.js 18 LTS (NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # убедитесь, что v18.x
```

## 3. Клонирование проекта (или копирование уже имеющейся папки)
```bash
cd ~
# если репозиторий ещё не на сервере
git clone <repository-url> ArendRate
cd ~/ArendRate
```

## 4. Настройка PostgreSQL
Работаем под системным пользователем `postgres`, но остаёмся в текущем аккаунте.
```bash
sudo -u postgres psql
```
Внутри psql создайте БД и пользователя (замените пароли на свои):
```sql
CREATE DATABASE arendrate;
CREATE USER arendrate_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
\q
```

## 5. Переменные окружения
Создайте файл `backend/.env` (значения заменить своими, URL указывает на ваш сервер):
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://arendrate_user:strong_password@localhost:5432/arendrate?schema=public"
JWT_SECRET=change_me_in_prod
JWT_EXPIRES_IN=7d
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_CALLBACK_URL=https://<your-domain>/api/auth/yandex/callback
VK_CLIENT_ID=
VK_CLIENT_SECRET=
VK_CALLBACK_URL=https://<your-domain>/api/auth/vk/callback
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp
FRONTEND_URL=https://<your-domain>
```

Создайте `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://<your-domain>
PORT=3000
```

## 6. Установка зависимостей
```bash
cd ~/ArendRate
npm install
```

## 7. Миграции и Prisma Client
```bash
cd ~/ArendRate/backend
npx prisma migrate deploy
npx prisma generate
# при необходимости заполнить тестовыми данными
npm run db:seed
```

## 8. Сборка фронтенда и бэкенда
```bash
cd ~/ArendRate
npm run build
```

## 9. Запуск в production вручную (без менеджера процессов)
В двух tmux/screen вкладках:
```bash
# вкладка 1
cd ~/ArendRate/backend
NODE_ENV=production npm run start

# вкладка 2
cd ~/ArendRate/frontend
NODE_ENV=production npm run start
```
Бэкенд: порт 3001, фронтенд: порт 3000.

## 10. Автозапуск через systemd (тот же пользователь)
Замените `<user>` на вашего текущего пользователя и пути на фактические.

`/etc/systemd/system/arendrate-backend.service`:
```
[Unit]
Description=ArendRate Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=<user>
WorkingDirectory=/home/<user>/ArendRate/backend
EnvironmentFile=/home/<user>/ArendRate/backend/.env
ExecStart=/usr/bin/node /home/<user>/ArendRate/backend/dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/arendrate-frontend.service`:
```
[Unit]
Description=ArendRate Frontend
After=network.target arendrate-backend.service

[Service]
Type=simple
User=<user>
WorkingDirectory=/home/<user>/ArendRate/frontend
Environment=NODE_ENV=production
EnvironmentFile=/home/<user>/ArendRate/frontend/.env.local
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

Примените и запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now arendrate-backend.service
sudo systemctl enable --now arendrate-frontend.service
```
Проверка статуса:
```bash
sudo systemctl status arendrate-backend.service
sudo systemctl status arendrate-frontend.service
```

## 11. (Опционально) Nginx как обратный прокси
Если нужен доступ по 80/443, установите nginx и проксируйте на 3000/3001, настроив TLS (Let’s Encrypt). Пример серверного блока не приводится для краткости, но стандартный reverse-proxy подойдёт.

## 12. Обновление версии
```bash
cd ~/ArendRate
git pull
npm install
npm run build
cd backend && npx prisma migrate deploy && cd ..
sudo systemctl restart arendrate-backend.service arendrate-frontend.service
```

## 13. Быстрая проверка
- http://<сервер>:3000 — фронтенд
- http://<сервер>:3001/health (если добавите healthcheck) — бэкенд
- `redis-cli PING` → PONG
- `psql -d arendrate -c '\dt'` — таблицы созданы

## Примечания
- Загружаемые файлы пишутся в `backend/uploads`. Убедитесь, что папка существует и у текущего пользователя есть права на запись.
- Все команды выполняются без создания отдельного системного пользователя; используется текущий аккаунт.

