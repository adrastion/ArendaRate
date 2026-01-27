# Исправление пути к конфигурации Nginx

## Проблема
Файл `nginx-arendrate.conf` не найден по указанному пути.

## Решение

### Вариант 1: Найдите правильный путь к проекту

```bash
# Найдите, где находится проект
find ~ -name "ArendRate" -type d 2>/dev/null
# или
find ~ -name "ArendaRate" -type d 2>/dev/null
# или
ls -la ~ | grep -i arend
```

### Вариант 2: Проверьте текущее расположение

```bash
# Если вы находитесь в корне проекта
pwd
ls -la | grep nginx

# Если файл есть, скопируйте оттуда
sudo cp nginx-arendrate.conf /etc/nginx/sites-available/arendrate
```

### Вариант 3: Создайте конфигурацию вручную

Если файл не найден, создайте его напрямую:

```bash
sudo nano /etc/nginx/sites-available/arendrate
```

Вставьте следующую конфигурацию:

```nginx
# Конфигурация Nginx для ArendRate
server {
    listen 80;
    server_name arendrate.ru www.arendrate.ru;

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

### Вариант 4: Если проект в другом месте

```bash
# Если проект находится в /root/ArendRate (с заглавной R)
sudo cp /root/ArendRate/nginx-arendrate.conf /etc/nginx/sites-available/arendrate

# Или если в /root/ArendaRate (без заглавной R)
sudo cp /root/ArendaRate/nginx-arendrate.conf /etc/nginx/sites-available/arendrate

# Или если в домашней директории пользователя
sudo cp ~/ArendRate/nginx-arendrate.conf /etc/nginx/sites-available/arendrate
```

## После создания конфигурации

```bash
# Создайте симлинк
sudo ln -s /etc/nginx/sites-available/arendrate /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию (если не нужна)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите Nginx
sudo systemctl restart nginx
```
