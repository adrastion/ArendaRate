# Установка SSL-сертификата Let's Encrypt для ArendRate

## Предварительные требования

1. ✅ Домен `arendrate.ru` должен указывать на IP вашего сервера
2. ✅ Порты 80 и 443 должны быть открыты в firewall
3. ✅ Nginx должен быть установлен и настроен
4. ✅ Сайт должен работать по HTTP (порт 80)

## Шаг 1: Проверка DNS

Убедитесь, что домен указывает на ваш сервер:

```bash
# Проверка A-записи
dig arendrate.ru +short
# или
nslookup arendrate.ru

# Должен вернуть IP вашего сервера
```

## Шаг 2: Открытие портов в firewall

```bash
# Проверьте статус firewall
sudo ufw status

# Если firewall активен, откройте порты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверьте статус
sudo ufw status
```

## Шаг 3: Установка Certbot

```bash
# Обновление списка пакетов
sudo apt update

# Установка certbot и плагина для Nginx
sudo apt install -y certbot python3-certbot-nginx

# Проверка установки
certbot --version
```

## Шаг 4: Получение SSL-сертификата

### Вариант 1: Автоматическая настройка (рекомендуется)

Certbot автоматически настроит Nginx:

```bash
# Получение сертификата для домена и www-поддомена
sudo certbot --nginx -d arendrate.ru -d www.arendrate.ru

# Certbot задаст несколько вопросов:
# 1. Email для уведомлений - введите ваш email
# 2. Согласие с условиями - введите 'Y'
# 3. Редирект HTTP на HTTPS - выберите '2' (рекомендуется)
```

Certbot автоматически:
- Получит сертификат
- Обновит конфигурацию Nginx
- Настроит редирект с HTTP на HTTPS

### Вариант 2: Ручная настройка

Если хотите настроить вручную:

```bash
# Получение сертификата без автоматической настройки Nginx
sudo certbot certonly --nginx -d arendrate.ru -d www.arendrate.ru

# После получения сертификата обновите конфигурацию Nginx вручную
```

## Шаг 5: Обновление конфигурации Nginx

Если использовали ручную настройку, обновите `/etc/nginx/sites-available/arendrate`:

```bash
sudo nano /etc/nginx/sites-available/arendrate
```

Замените содержимое на:

```nginx
# Редирект HTTP на HTTPS
server {
    listen 80;
    server_name arendrate.ru www.arendrate.ru;
    return 301 https://$server_name$request_uri;
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    server_name arendrate.ru www.arendrate.ru;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/arendrate.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arendrate.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

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

    # Загрузка файлов (uploads)
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X).

## Шаг 6: Проверка и перезапуск Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Если проверка прошла успешно, перезагрузите Nginx
sudo systemctl reload nginx

# Проверьте статус
sudo systemctl status nginx
```

## Шаг 7: Обновление переменных окружения

После установки SSL обновите переменные окружения:

**Backend (`backend/.env`):**
```bash
cd ~/ArendRate/backend
nano .env
```

Измените:
```env
FRONTEND_URL=https://arendrate.ru
```

**Frontend (`frontend/.env.local`):**
```bash
cd ~/ArendRate/frontend
nano .env.local
```

Измените:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
```

**Перезапустите процессы:**
```bash
pm2 restart arendrate-backend
pm2 restart arendrate-frontend
```

## Шаг 8: Проверка работы HTTPS

```bash
# Проверка сертификата
curl -I https://arendrate.ru

# Проверка через openssl
echo | openssl s_client -connect arendrate.ru:443 -servername arendrate.ru 2>/dev/null | openssl x509 -noout -dates

# Проверка в браузере
# Откройте https://arendrate.ru - должен быть зеленый замочек
```

## Шаг 9: Автоматическое обновление сертификата

Let's Encrypt сертификаты действительны 90 дней. Certbot автоматически настроит обновление, но проверьте:

```bash
# Проверка автоматического обновления
sudo certbot renew --dry-run

# Если команда выполнилась успешно, обновление настроено автоматически
```

Certbot создает systemd timer для автоматического обновления. Проверьте:

```bash
# Проверка таймера
sudo systemctl list-timers | grep certbot
```

## Решение проблем

### Проблема 1: Ошибка "Failed to obtain certificate"

**Причины:**
- Домен не указывает на сервер
- Порты 80/443 закрыты
- Nginx не запущен

**Решение:**
```bash
# Проверьте DNS
dig arendrate.ru +short

# Проверьте порты
sudo ufw status
sudo netstat -tlnp | grep -E '80|443'

# Проверьте Nginx
sudo systemctl status nginx
```

### Проблема 2: Ошибка "Connection refused"

**Причина:** Nginx не слушает на порту 80

**Решение:**
```bash
# Проверьте конфигурацию Nginx
sudo nginx -t

# Проверьте, что Nginx слушает на порту 80
sudo netstat -tlnp | grep :80

# Перезапустите Nginx
sudo systemctl restart nginx
```

### Проблема 3: Сертификат не обновляется автоматически

**Решение:**
```bash
# Вручную обновите сертификат
sudo certbot renew

# Проверьте таймер
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer
```

### Проблема 4: Смешанный контент (Mixed Content)

Если на сайте есть ошибки "Mixed Content", убедитесь, что все ресурсы загружаются по HTTPS:

```bash
# Проверьте frontend/.env.local
cd ~/ArendRate/frontend
cat .env.local
# NEXT_PUBLIC_API_URL должен быть https://
```

## Проверка безопасности SSL

После установки проверьте безопасность:

```bash
# Используйте онлайн-сервисы:
# - https://www.ssllabs.com/ssltest/analyze.html?d=arendrate.ru
# - https://securityheaders.com/?q=https://arendrate.ru
```

## Дополнительные настройки безопасности

### Улучшенная конфигурация SSL

Добавьте в блок `server` конфигурации Nginx:

```nginx
# Отключение старых протоколов
ssl_protocols TLSv1.2 TLSv1.3;

# Современные шифры
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/arendrate.ru/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

## Полезные команды

```bash
# Просмотр информации о сертификате
sudo certbot certificates

# Обновление сертификата вручную
sudo certbot renew

# Удаление сертификата
sudo certbot delete --cert-name arendrate.ru

# Проверка срока действия сертификата
echo | openssl s_client -connect arendrate.ru:443 -servername arendrate.ru 2>/dev/null | openssl x509 -noout -dates
```

## Итоговая проверка

После установки SSL выполните:

```bash
# 1. Проверка HTTPS
curl -I https://arendrate.ru

# 2. Проверка редиректа с HTTP на HTTPS
curl -I http://arendrate.ru

# 3. Проверка API через HTTPS
curl https://arendrate.ru/api/health

# 4. Проверка в браузере
# Откройте https://arendrate.ru
# Должен быть зеленый замочек в адресной строке
```

## Примечания

- Сертификаты Let's Encrypt действительны 90 дней
- Certbot автоматически обновляет сертификаты каждые 60 дней
- После обновления сертификата Nginx перезагружается автоматически
- Рекомендуется настроить мониторинг истечения сертификатов
