# Исправление ошибки "Cannot GET /api/api/auth/register"

## Проблема

Ошибка `Cannot GET /api/api/auth/register` возникает из-за двойного `/api` в URL.

## Причина

В `frontend/lib/api.ts` к `NEXT_PUBLIC_API_URL` добавлялся еще один `/api`, что приводило к двойному пути.

## Решение

Исправление уже внесено в код. Теперь нужно:

### 1. Проверьте переменную окружения

```bash
cd ~/ArendRate/frontend
cat .env.local
```

Должно быть:
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
```

**Важно:** URL должен заканчиваться на `/api` для production или быть без `/api` для localhost.

### 2. Пересоберите frontend

```bash
cd ~/ArendRate/frontend
rm -rf .next
npm run build
pm2 restart arendrate-frontend
```

### 3. Проверьте работу

Откройте браузер и попробуйте зарегистрироваться. URL должен быть:
- ✅ Правильно: `https://arendrate.ru/api/auth/register`
- ❌ Неправильно: `https://arendrate.ru/api/api/auth/register`

## Формат переменных окружения

### Для production (с доменом):
```env
NEXT_PUBLIC_API_URL=https://arendrate.ru/api
```

### Для localhost (разработка):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Код автоматически определит, нужно ли добавлять `/api`:
- Если URL заканчивается на `/api` - использует как есть
- Если нет - добавляет `/api`

## Проверка в браузере

1. Откройте консоль разработчика (F12)
2. Перейдите на вкладку Network
3. Попробуйте зарегистрироваться
4. Найдите запрос к `/api/auth/register`
5. Проверьте URL - должен быть без двойного `/api`

## Если проблема осталась

1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Перезагрузите страницу (Ctrl+F5)
3. Проверьте логи:
```bash
pm2 logs arendrate-frontend --lines 50
```
