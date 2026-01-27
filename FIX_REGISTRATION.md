# Исправление проблемы с регистрацией

## Диагностика проблемы

### Шаг 1: Проверьте, запущен ли backend

```bash
pm2 ls
```

Должен быть запущен процесс `arendrate-backend`. Если нет:

```bash
cd ~/ArendRate/backend
pm2 start dist/index.js --name arendrate-backend
pm2 logs arendrate-backend --lines 20
```

### Шаг 2: Проверьте доступность backend локально

```bash
# Проверка health endpoint
curl http://localhost:3001/api/health

# Должен вернуть: {"status":"ok","timestamp":"..."}
```

Если не работает, проверьте логи:
```bash
pm2 logs arendrate-backend --lines 50
```

### Шаг 3: Проверьте доступность через домен

```bash
# Через Nginx
curl http://arendrate.ru/api/health

# Должен вернуть тот же ответ
```

Если не работает, проверьте конфигурацию Nginx:

```bash
# Проверьте, что Nginx запущен
sudo systemctl status nginx

# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи Nginx
sudo tail -f /var/log/nginx/error.log
```

### Шаг 4: Проверьте переменные окружения

**Backend (`backend/.env`):**
```bash
cd ~/ArendRate/backend
cat .env | grep FRONTEND_URL
```

Должно быть:
```env
FRONTEND_URL=https://arendrate.ru
# или для тестирования без SSL:
FRONTEND_URL=http://arendrate.ru
```

**Frontend (`frontend/.env.local`):**
```bash
cd ~/ArendRate/frontend
cat .env.local
```

Должно быть:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
# или для тестирования без SSL:
NEXT_PUBLIC_API_URL=http://arendrate.ru/api
```

**Важно:** После изменения переменных окружения перезапустите процессы:
```bash
pm2 restart arendrate-backend
pm2 restart arendrate-frontend
```

### Шаг 5: Проверьте конфигурацию Nginx

Убедитесь, что в `/etc/nginx/sites-available/arendrate` правильно настроен блок для `/api`:

```nginx
# Backend API
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

После изменений:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 6: Проверьте CORS настройки backend

В `backend/src/index.ts` должно быть:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

Убедитесь, что `FRONTEND_URL` в `.env` совпадает с вашим доменом.

### Шаг 7: Тест регистрации через curl

```bash
# Тест регистрации напрямую через backend
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User",
    "dateOfBirth": "2000-01-01"
  }'
```

Если это работает, но через браузер не работает - проблема в Nginx или CORS.

### Шаг 8: Проверьте логи в браузере

Откройте консоль разработчика (F12) в браузере и попробуйте зарегистрироваться. Проверьте:

1. **Network tab** - какой URL используется для запроса
2. **Console tab** - есть ли ошибки JavaScript
3. **Response** - что возвращает сервер

## Частые проблемы и решения

### Проблема 1: ERR_CONNECTION_REFUSED

**Причина:** Backend не запущен или недоступен

**Решение:**
```bash
pm2 restart arendrate-backend
pm2 logs arendrate-backend
```

### Проблема 2: CORS ошибка

**Причина:** Неправильный FRONTEND_URL в backend/.env

**Решение:**
```bash
cd ~/ArendRate/backend
nano .env
# Убедитесь, что FRONTEND_URL=https://arendrate.ru (или http://)
pm2 restart arendrate-backend
```

### Проблема 3: 404 Not Found на /api/auth/register

**Причина:** Nginx не проксирует /api правильно

**Решение:**
Проверьте конфигурацию Nginx (см. Шаг 5)

### Проблема 4: 500 Internal Server Error

**Причина:** Ошибка в backend (база данных, валидация и т.д.)

**Решение:**
```bash
pm2 logs arendrate-backend --lines 50
# Ищите ошибки в логах
```

### Проблема 5: Frontend использует неправильный URL

**Причина:** NEXT_PUBLIC_API_URL не установлен или неправильный

**Решение:**
```bash
cd ~/ArendRate/frontend
# Проверьте .env.local
cat .env.local

# Если неправильно, исправьте:
nano .env.local
# Добавьте: NEXT_PUBLIC_API_URL=https://arendrate.ru/api

# Пересоберите frontend
rm -rf .next
npm run build
pm2 restart arendrate-frontend
```

## Полная диагностика одной командой

Выполните эту команду для проверки всех компонентов:

```bash
echo "=== PM2 процессы ==="
pm2 ls

echo -e "\n=== Backend health (локально) ==="
curl -s http://localhost:3001/api/health || echo "❌ Backend недоступен локально"

echo -e "\n=== Backend health (через домен) ==="
curl -s http://arendrate.ru/api/health || echo "❌ Backend недоступен через домен"

echo -e "\n=== Тест регистрации (локально) ==="
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","dateOfBirth":"2000-01-01"}' \
  | head -c 200 || echo "❌ Регистрация не работает"

echo -e "\n=== Переменные окружения ==="
echo "Backend FRONTEND_URL:"
grep FRONTEND_URL ~/ArendRate/backend/.env || echo "❌ Не найдено"
echo "Frontend NEXT_PUBLIC_API_URL:"
grep NEXT_PUBLIC_API_URL ~/ArendRate/frontend/.env.local || echo "❌ Не найдено"

echo -e "\n=== Nginx статус ==="
sudo systemctl status nginx --no-pager -l | head -5
```

## Быстрое исправление

Если ничего не помогает, выполните полный перезапуск:

```bash
# Остановите все
pm2 stop all

# Проверьте переменные окружения
cd ~/ArendRate/backend
cat .env | grep -E "FRONTEND_URL|PORT"

cd ~/ArendRate/frontend
cat .env.local

# Перезапустите все
pm2 restart all

# Проверьте логи
pm2 logs arendrate-backend --lines 20
pm2 logs arendrate-frontend --lines 20
```
