# Быстрый старт ArendRate на Windows

## 📋 Чек-лист установки

### ✅ Шаг 1: Проверка инструментов

Проверьте, что установлены:
- [ ] Node.js 18+ (`node --version`)
- [ ] npm (`npm --version`)
- [ ] PostgreSQL (`psql --version` или через pgAdmin)

**Если не установлено:**
- Node.js: https://nodejs.org/ (скачайте LTS версию)
- PostgreSQL: https://www.postgresql.org/download/windows/

### ✅ Шаг 2: Установка зависимостей

```powershell
# В корневой папке проекта
cd C:\Users\besms\Documents\projects\ArendaRate
npm install

# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### ✅ Шаг 3: Настройка базы данных

1. **Создайте базу данных и пользователя:**
   - Откройте pgAdmin
   - Создайте базу данных `arendrate`
   - Создайте пользователя `arendrate_user` с паролем

2. **Настройте .env файл:**
   ```powershell
   cd backend
   copy .env.example .env
   ```
   
   Откройте `backend/.env` и измените:
   ```env
   DATABASE_URL="postgresql://arendrate_user:ВАШ_ПАРОЛЬ@localhost:5432/arendrate?schema=public"
   JWT_SECRET="любая-случайная-строка-для-безопасности"
   ```

3. **Примените миграции:**
   ```powershell
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### ✅ Шаг 4: Запуск

```powershell
# Из корневой папки проекта
cd C:\Users\besms\Documents\projects\ArendaRate
npm run dev
```

Откройте в браузере:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/health

---

📖 **Подробная инструкция:** См. `SETUP_WINDOWS.md`
