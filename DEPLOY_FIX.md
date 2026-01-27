# Исправление проблем с развертыванием ArendRate

## Проблема 1: ERR_CONNECTION_REFUSED при обращении к API

### Причина
Backend не запущен или не доступен на порту 3001.

### Решение

1. **Проверьте статус процессов PM2:**
```bash
pm2 ls
```

2. **Если backend не запущен, запустите его:**
```bash
cd ~/ArendRate/backend
pm2 start dist/index.js --name arendrate-backend
```

3. **Проверьте логи backend:**
```bash
pm2 logs arendrate-backend --lines 50
```

4. **Проверьте, что backend слушает на правильном порту:**
```bash
netstat -tlnp | grep 3001
# или
ss -tlnp | grep 3001
```

5. **Если порт не слушается, проверьте переменные окружения:**
```bash
cd ~/ArendRate/backend
cat .env | grep PORT
```

## Проблема 2: Ошибки Next.js Server Actions

### Причина
Next.js требует правильные заголовки `origin` и `host` при работе за reverse proxy.

### Решение

1. **Обновите `frontend/next.config.js`** (уже обновлен в проекте)

2. **Убедитесь, что переменные окружения настроены правильно:**
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

3. **Пересоберите frontend:**
```bash
cd ~/ArendRate/frontend
rm -rf .next
npm run build
pm2 restart arendrate-frontend
```

## Проблема 3: Настройка Nginx как reverse proxy

### Установка и настройка Nginx

1. **Установите Nginx:**
```bash
sudo apt update
sudo apt install -y nginx
```

2. **Скопируйте конфигурацию:**
```bash
sudo cp ~/ArendRate/nginx-arendrate.conf /etc/nginx/sites-available/arendrate
```

3. **Создайте симлинк:**
```bash
sudo ln -s /etc/nginx/sites-available/arendrate /etc/nginx/sites-enabled/
```

4. **Удалите дефолтную конфигурацию (если не нужна):**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

5. **Проверьте конфигурацию:**
```bash
sudo nginx -t
```

6. **Перезапустите Nginx:**
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

7. **Проверьте статус:**
```bash
sudo systemctl status nginx
```

## Проблема 4: Проверка всех сервисов

### Полная проверка

1. **Проверьте все процессы PM2:**
```bash
pm2 ls
pm2 status
```

Должны быть запущены:
- `arendrate-backend` (порт 3001)
- `arendrate-frontend` (порт 3000)

2. **Проверьте логи:**
```bash
pm2 logs arendrate-backend --lines 20
pm2 logs arendrate-frontend --lines 20
```

3. **Проверьте доступность портов:**
```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000
```

4. **Проверьте через Nginx:**
```bash
curl http://arendrate.ru/api/health
curl http://arendrate.ru
```

## Проблема 5: Обновление переменных окружения

### Backend (.env)

Убедитесь, что в `backend/.env` указан правильный FRONTEND_URL:

```env
FRONTEND_URL=https://arendrate.ru
# или для тестирования:
FRONTEND_URL=http://arendrate.ru
```

### Frontend (.env.local)

Убедитесь, что в `frontend/.env.local` указан правильный API URL:

```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
# или для тестирования:
NEXT_PUBLIC_API_URL=http://arendrate.ru/api
```

**Важно:** После изменения переменных окружения перезапустите процессы:
```bash
pm2 restart arendrate-backend
pm2 restart arendrate-frontend
```

## Быстрая диагностика

Выполните эту команду для проверки всех компонентов:

```bash
echo "=== PM2 процессы ==="
pm2 ls

echo -e "\n=== Порты ==="
netstat -tlnp | grep -E '3000|3001|80|443'

echo -e "\n=== Backend health ==="
curl -s http://localhost:3001/api/health || echo "Backend недоступен"

echo -e "\n=== Frontend ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Frontend недоступен"

echo -e "\n=== Nginx ==="
sudo systemctl status nginx --no-pager -l
```

## Настройка SSL (Let's Encrypt)

После того как все заработает на HTTP, настройте HTTPS:

```bash
# Установите certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d arendrate.ru -d www.arendrate.ru

# Автоматическое обновление
sudo certbot renew --dry-run
```

После получения сертификата обновите конфигурацию Nginx (раскомментируйте HTTPS блок в `nginx-arendrate.conf`).
