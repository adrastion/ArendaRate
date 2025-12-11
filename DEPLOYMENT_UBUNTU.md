# Развертывание ArendRate на Ubuntu 22.04

Инструкция для нового сервера Ubuntu 22.04 (production или staging). Предполагается, что у вас есть SSH‑доступ с sudo.

## 1. Базовые зависимости
```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential postgresql postgresql-contrib redis-server

# Node.js 18 LTS (через NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка
node -v  # >= 18
npm -v
psql --version  # >= 14
redis-server --version
```

## 2. Системный пользователь и директория проекта
```bash
sudo useradd -m -s /bin/bash arendrate || true
sudo mkdir -p /opt/arendrate
sudo chown -R arendrate:arendrate /opt/arendrate
```
Далее работаем под пользователем `arendrate`:
```bash
sudo -iu arendrate
cd /opt/arendrate
```

## 3. Получение кода и установка зависимостей
```bash
git clone <REPO_URL> .
npm install          # установит workspaces (frontend + backend)
```

## 4. Настройка PostgreSQL
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE arendrate;
CREATE USER arendrate_user WITH PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
SQL
```

## 5. Переменные окружения
Создайте `backend/.env` на основе примера:
```bash
cat > /opt/arendrate/backend/.env <<'EOF'
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://arendrate_user:change_me@localhost:5432/arendrate?schema=public"
JWT_SECRET=change-this-secret
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
EOF
```

Создайте `frontend/.env.local`:
```bash
cat > /opt/arendrate/frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_URL=https://<your-domain>
EOF
```

## 6. Подготовка базы данных
```bash
cd /opt/arendrate/backend
npx prisma migrate deploy
npx prisma generate
# (опционально) начальные данные
npm run db:seed
```

## 7. Сборка production
```bash
cd /opt/arendrate
npm run build        # собирает backend и frontend
```

## 8. Запуск приложений
### Вариант A: PM2 (проще)
```bash
sudo npm install -g pm2

cd /opt/arendrate/backend
pm2 start dist/index.js --name arendrate-api

cd /opt/arendrate/frontend
pm2 start "npm start" --name arendrate-web -- --port 3000 --hostname 0.0.0.0

pm2 save
pm2 startup systemd -u arendrate --hp /home/arendrate
```

### Вариант B: systemd (без сторонних утилит)
Создайте юниты:
```bash
sudo tee /etc/systemd/system/arendrate-api.service > /dev/null <<'EOF'
[Unit]
Description=ArendRate API
After=network.target postgresql.service redis-server.service

[Service]
User=arendrate
WorkingDirectory=/opt/arendrate/backend
EnvironmentFile=/opt/arendrate/backend/.env
ExecStart=/usr/bin/node /opt/arendrate/backend/dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/arendrate-web.service > /dev/null <<'EOF'
[Unit]
Description=ArendRate Frontend
After=network.target arendrate-api.service

[Service]
User=arendrate
WorkingDirectory=/opt/arendrate/frontend
EnvironmentFile=/opt/arendrate/frontend/.env.local
ExecStart=/usr/bin/npm start -- --port 3000 --hostname 0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now arendrate-api arendrate-web
```

## 9. Nginx (reverse proxy, HTTPS)
Установите и настройте SSL (например, через certbot) и проксирование:
```bash
sudo apt-get install -y nginx
sudo apt-get install -y certbot python3-certbot-nginx
```
Пример серверного блока (замените домен):
```
server {
    server_name your-domain;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Примените конфиг и выпустите сертификат:
```bash
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/your-domain
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain
```

## 10. Каталог загрузок и права
```bash
mkdir -p /opt/arendrate/backend/uploads
chown -R arendrate:arendrate /opt/arendrate/backend/uploads
```

## 11. Проверка
- API: `curl -I http://127.0.0.1:3001/api/health` (если есть health‑маршрут) или любой публичный эндпоинт.
- Frontend: `curl -I http://127.0.0.1:3000`
- Логи: `pm2 logs arendrate-api` / `journalctl -u arendrate-api -f`

## 12. Обновления
```bash
sudo -iu arendrate
cd /opt/arendrate
git pull
npm install
npm run build
pm2 restart arendrate-api arendrate-web   # или systemctl restart arendrate-api arendrate-web
```

## 13. Частые проблемы
- Подключение к БД: убедитесь, что `DATABASE_URL` верный и PostgreSQL запущен (`sudo systemctl status postgresql`).
- Миграции: при несовпадении схемы используйте `npx prisma migrate deploy` или (сброс) `npx prisma migrate reset` *после* бэкапа.
- Redis: проверьте, что `redis-server` активен (`sudo systemctl status redis-server`).
- OAuth: домены и callback‑URL должны совпадать с `.env` и настройками провайдеров.

