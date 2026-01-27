# Быстрое исправление проблем с развертыванием

## Проблема: ERR_CONNECTION_REFUSED и ошибки Next.js

### Шаг 1: Проверьте, запущен ли backend

```bash
pm2 ls
```

Если `arendrate-backend` не запущен или показывает ошибку:

```bash
cd ~/ArendRate/backend
pm2 start dist/index.js --name arendrate-backend
pm2 logs arendrate-backend --lines 20
```

### Шаг 2: Обновите переменные окружения

**Backend:**
```bash
cd ~/ArendRate/backend
nano .env
```

Убедитесь, что есть:
```env
FRONTEND_URL=https://arendrate.ru
PORT=3001
```

**Frontend:**
```bash
cd ~/ArendRate/frontend
nano .env.local
```

Убедитесь, что есть:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
```

### Шаг 3: Пересоберите frontend (важно!)

```bash
cd ~/ArendRate/frontend
rm -rf .next
npm run build
pm2 restart arendrate-frontend
```

### Шаг 4: Настройте Nginx

```bash
# Установите Nginx (если не установлен)
sudo apt install -y nginx

# Скопируйте конфигурацию
sudo cp ~/ArendRate/nginx-arendrate.conf /etc/nginx/sites-available/arendrate

# Создайте симлинк
sudo ln -s /etc/nginx/sites-available/arendrate /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию
sudo rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите Nginx
sudo systemctl restart nginx
```

### Шаг 5: Перезапустите все процессы

```bash
pm2 restart all
pm2 save
```

### Шаг 6: Проверьте работу

```bash
# Проверка backend
curl http://localhost:3001/api/health

# Проверка frontend
curl http://localhost:3000

# Проверка через домен
curl http://arendrate.ru/api/health
```

### Если проблемы остались

1. Проверьте логи:
```bash
pm2 logs arendrate-backend --lines 50
pm2 logs arendrate-frontend --lines 50
sudo tail -f /var/log/nginx/error.log
```

2. Проверьте, что порты слушаются:
```bash
netstat -tlnp | grep -E '3000|3001|80'
```

3. Проверьте firewall:
```bash
sudo ufw status
# Если нужно, откройте порты:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

4. См. подробную инструкцию в `DEPLOY_FIX.md`
