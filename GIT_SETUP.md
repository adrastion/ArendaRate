# Инструкция по загрузке проекта на GitHub

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Нажмите кнопку "+" в правом верхнем углу
3. Выберите "New repository"
4. Заполните данные:
   - **Repository name**: `ArendRate` (или другое имя)
   - **Description**: "Платформа для отзывов об аренде жилья с интерактивной картой"
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** отмечайте "Initialize this repository with a README" (проект уже существует)
5. Нажмите "Create repository"

## Шаг 2: Инициализация Git в проекте (если еще не инициализирован)

```bash
cd /home/bes/ArendRate
git init
```

## Шаг 3: Добавление файлов в Git

```bash
# Добавить все файлы (кроме тех, что в .gitignore)
git add .

# Проверить, какие файлы будут добавлены
git status
```

## Шаг 4: Создание первого коммита

```bash
git commit -m "Initial commit: ArendRate project"
```

## Шаг 5: Подключение к удаленному репозиторию

Замените `YOUR_USERNAME` на ваш GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ArendRate.git
```

Или если используете SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/ArendRate.git
```

## Шаг 6: Отправка кода на GitHub

```bash
# Отправить код в main ветку
git branch -M main
git push -u origin main
```

Если возникнет ошибка с именем ветки, используйте:

```bash
git branch -M master
git push -u origin master
```

## Дальнейшая работа с Git

### Добавление изменений

```bash
# Просмотр изменений
git status

# Добавить файлы
git add .

# Создать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push
```

### Получение изменений

```bash
git pull
```

### Просмотр истории

```bash
git log
```

## Важные замечания

⚠️ **Внимание**: Файл `.gitignore` настроен так, чтобы НЕ загружать:
- `node_modules/` - зависимости
- `.env` файлы - переменные окружения с секретами
- `uploads/` - загруженные пользователями файлы
- `dist/`, `.next/` - скомпилированные файлы

⚠️ **Не забудьте**:
- Создать `.env` файлы на сервере вручную
- Установить зависимости через `npm install`
- Настроить переменные окружения из `.env.example`

## Если репозиторий уже существует на GitHub

Если вы хотите добавить код в существующий репозиторий:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Проблемы и решения

### Если Git не установлен

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# Проверить установку
git --version
```

### Если нужно игнорировать дополнительные файлы

Отредактируйте файл `.gitignore` в корне проекта.

### Если нужно удалить файлы из Git (но оставить локально)

```bash
git rm --cached filename
```

### Настройка Git (если еще не настроен)

```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
```

