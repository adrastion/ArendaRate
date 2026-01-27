# Быстрое исправление проблемы с регистрацией

## Пошаговая проверка

### 1. Проверьте, что backend запущен

```bash
pm2 ls
```

Если `arendrate-backend` не запущен или показывает ошибку:
```bash
cd ~/ArendRate/backend
pm2 start dist/index.js --name arendrate-backend
pm2 logs arendrate-backend --lines 20
```

### 2. Проверьте доступность backend

```bash
# Локально
curl http://localhost:3001/api/health

# Через домен
curl http://arendrate.ru/api/health
```

Если локально работает, а через домен нет - проблема в Nginx.

### 3. Проверьте переменные окружения

**Backend:**
```bash
cd ~/ArendRate/backend
cat .env | grep FRONTEND_URL
```

Должно быть:
```env
FRONTEND_URL=https://arendrate.ru
# или для HTTP:
FRONTEND_URL=http://arendrate.ru
```

**Frontend:**
```bash
cd ~/ArendRate/frontend
cat .env.local
```

Должно быть:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
# или для HTTP:
NEXT_PUBLIC_API_URL=http://arendrate.ru/api
```

**Важно:** URL должны совпадать по протоколу (оба http или оба https)!

### 4. Перезапустите все после изменения переменных

```bash
pm2 restart arendrate-backend
pm2 restart arendrate-frontend
```

### 5. Проверьте конфигурацию Nginx

```bash
sudo cat /etc/nginx/sites-available/arendrate | grep -A 10 "location /api"
```

Должно быть:
```nginx
location /api {
    proxy_pass http://localhost:3001;
    ...
}
```

Если конфигурация правильная, перезагрузите Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Тест регистрации через curl

```bash
curl -X POST http://arendrate.ru/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User",
    "dateOfBirth": "2000-01-01"
  }'
```

Если это работает, но в браузере не работает - проблема в CORS или frontend конфигурации.

## Частые ошибки

### ERR_CONNECTION_REFUSED
→ Backend не запущен. Запустите: `pm2 start arendrate-backend`

### CORS error в консоли браузера
→ Неправильный FRONTEND_URL в backend/.env. Исправьте и перезапустите backend.

### 404 на /api/auth/register
→ Nginx не проксирует /api. Проверьте конфигурацию Nginx.

### Frontend использует localhost вместо домена
→ Неправильный NEXT_PUBLIC_API_URL в frontend/.env.local. Исправьте и пересоберите frontend.

## Полное исправление (если ничего не помогает)

```bash
# 1. Остановите все
pm2 stop all

# 2. Проверьте и исправьте переменные окружения
cd ~/ArendRate/backend
nano .env
# Убедитесь, что FRONTEND_URL=https://arendrate.ru (или http://)

cd ~/ArendRate/frontend
nano .env.local
# Убедитесь, что NEXT_PUBLIC_API_URL=https://arendrate.ru/api (или http://)

# 3. Пересоберите frontend (если меняли .env.local)
cd ~/ArendRate/frontend
rm -rf .next
npm run build

# 4. Перезапустите все
pm2 restart all

# 5. Проверьте логи
pm2 logs arendrate-backend --lines 30
```

## Проверка в браузере

1. Откройте консоль разработчика (F12)
2. Перейдите на вкладку Network
3. Попробуйте зарегистрироваться
4. Найдите запрос к `/api/auth/register`
5. Проверьте:
   - Какой URL используется (должен быть `https://arendrate.ru/api/auth/register`)
   - Какой статус ответа (должен быть 201 или 400, не 404 или 500)
   - Что в Response (если есть ошибка, она будет там)
