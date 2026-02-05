# Запуск ArendRate на облачном сервере Ubuntu 22.04 с pm2 (без создания отдельного пользователя)

Инструкция рассчитана на работу под текущим пользователем сервера (например, `ubuntu`), без заведения отдельного системного юзера. Все команды выполняются на чистом сервере Ubuntu 22.04.

## 1. Подготовка ОС
```bash
sudo apt update
sudo apt install -y curl git build-essential ca-certificates \
  postgresql postgresql-contrib redis-server
sudo systemctl enable --now postgresql redis-server
```

## 2. Установка Node.js 18 LTS (NodeSource)

**Важно:** Если на сервере уже установлена старая версия Node.js, сначала удалите её.

### 2.1. Удаление старой версии Node.js (если установлена)
```bash
# Проверьте текущую версию
node -v

# Если версия меньше 18.x, удалите старую версию
sudo apt remove -y nodejs npm
sudo apt purge -y nodejs npm
sudo apt autoremove -y

# Удалите репозитории NodeSource (если были добавлены ранее)
sudo rm -f /etc/apt/sources.list.d/nodesource.list
sudo rm -f /etc/apt/sources.list.d/nodesource.list.save
```

### 2.2. Установка Node.js 18 LTS
```bash
# Добавление репозитория NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Обновление списка пакетов
sudo apt update

# Установка Node.js 18
sudo apt install -y nodejs

# Проверка версии (должно быть v18.x.x)
node -v
npm -v
```

**Если после установки всё ещё показывается старая версия:**
```bash
# Проверьте, какой node используется
which node
# Должно быть: /usr/bin/node

# Если показывает другой путь, проверьте PATH
echo $PATH

# Перезагрузите сессию или выполните:
hash -r
source ~/.bashrc

# Проверьте версию снова
node -v
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
CREATE USER arendrate_user WITH PASSWORD '0408';
GRANT ALL PRIVILEGES ON DATABASE arendrate TO arendrate_user;
\q
```

## 5. Переменные окружения
Создайте файл `backend/.env` (значения заменить своими, URL указывает на ваш сервер):
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://arendrate_user:0408@localhost:5432/arendrate?schema=public"
JWT_SECRET=change_me_in_prod
JWT_EXPIRES_IN=7d
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_CALLBACK_URL=https://arendrate.ru/api/auth/yandex/callback
VK_CLIENT_ID=
VK_CLIENT_SECRET=
VK_CALLBACK_URL=https://arendrate.ru/api/auth/vk/callback
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp
FRONTEND_URL=https://arendrate.ru
```

Создайте `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru
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

**Важно:** Перед запуском через PM2 необходимо собрать проект.

```bash
cd ~/ArendRate

# Установка зависимостей (если ещё не установлены)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Генерация Prisma Client (обязательно перед сборкой)
cd ~/ArendRate/backend
npx prisma generate

# Сборка backend (TypeScript → JavaScript)
npm run build

# Проверка, что файл dist/index.js создан
ls -la dist/index.js

# Сборка frontend
cd ~/ArendRate/frontend
npm run build

# Вернуться в корень
cd ~/ArendRate
```

## 9. Установка pm2 (процесс-менеджер)
```bash
sudo npm install -g pm2
pm2 -v
```

## 10. Запуск приложений через pm2

**Перед запуском убедитесь, что:**
- ✅ Проект собран (выполнен шаг 8)
- ✅ Файл `backend/dist/index.js` существует
- ✅ Prisma Client сгенерирован
- ✅ Переменные окружения настроены

```bash
# Backend
cd ~/ArendRate/backend 

# Проверка наличия собранного файла
if [ ! -f "dist/index.js" ]; then
  echo "Ошибка: файл dist/index.js не найден. Выполните: npm run build"
  exit 1
fi

# Запуск через PM2
NODE_ENV=production pm2 start dist/index.js --name arendrate-backend

# Frontend
cd ~/ArendRate/frontend
NODE_ENV=production pm2 start npm --name arendrate-frontend -- run start

# Проверка списка процессов
pm2 ls

# Просмотр логов (для проверки работы)
pm2 logs arendrate-backend --lines 50
```

## 11. Автозапуск pm2 при перезагрузке
```bash
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```
Команда выведет `sudo ...` строку — выполните её, затем снова `pm2 save`.

## 12. Логи и управление
- Логи бэкенда: `pm2 logs arendrate-backend`
- Логи фронтенда: `pm2 logs arendrate-frontend`
- Перезапуск: `pm2 restart arendrate-backend` / `pm2 restart arendrate-frontend`
- Остановка: `pm2 stop <name>` или `pm2 delete <name>`

## 13. (Опционально) Nginx как обратный прокси
Если нужен доступ по 80/443, установите nginx и проксируйте на 3000/3001, настроив TLS (Let’s Encrypt). Используйте `nginx-arendrate.conf` из репозитория. **Важно:** в конфиге задан `client_max_body_size 10M` для загрузки фото — без этого мобильные фото могут давать ошибку 413. После изменения конфига: `sudo nginx -t && sudo systemctl reload nginx`.

## 14. Обновление версии
```bash
cd ~/ArendRate
git pull
npm install
npm run build
cd backend && npx prisma migrate deploy && cd ..
sudo systemctl restart arendrate-backend.service arendrate-frontend.service
```

## 15. Быстрая проверка

### Локальная проверка (на сервере)
```bash
# Backend health check
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000

# Проверка процессов PM2
pm2 ls

# Проверка портов
netstat -tlnp | grep -E '3000|3001|80|443'
```

### Проверка через домен
- http://arendrate.ru — фронтенд
- http://arendrate.ru/api/health — бэкенд
- `redis-cli PING` → PONG
- `psql -d arendrate -c '\dt'` — таблицы созданы

### Диагностика проблем

Если что-то не работает, см. файл `DEPLOY_FIX.md` для подробных инструкций по решению проблем.

## Примечания
- Загружаемые файлы пишутся в `backend/uploads`. Убедитесь, что папка существует и у текущего пользователя есть права на запись.
- Все команды выполняются без создания отдельного системного пользователя; используется текущий аккаунт.