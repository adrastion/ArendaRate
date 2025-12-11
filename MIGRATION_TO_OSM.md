# Миграция с Яндекс.Карт на OpenStreetMap

Проект был успешно мигрирован с Яндекс.Карт на OpenStreetMap (OSM) с использованием библиотеки Leaflet.

## Что изменилось

### Backend
- ✅ Заменен `yandexGeocoderService` на `nominatimService`
- ✅ Обновлен маршрут `/api/addresses/search` для использования Nominatim API
- ✅ Добавлен метод `reverseGeocode` для обратного геокодирования

### Frontend
- ✅ Компонент `Map.tsx` переписан для работы с Leaflet
- ✅ Удалены зависимости от Яндекс.Карт API
- ✅ Добавлены зависимости: `leaflet`, `react-leaflet`, `@types/leaflet`
- ✅ Обновлены стили в `globals.css` для Leaflet

### Документация
- ✅ Обновлены `README.md`, `SETUP.md`, `ARCHITECTURE.md`
- ✅ Удалены инструкции по получению API ключа Яндекс.Карт

## Преимущества OpenStreetMap

1. **Бесплатно**: Не требуется API ключ
2. **Открытость**: Открытые данные и код
3. **Гибкость**: Можно использовать собственный сервер карт
4. **Глобальность**: Работает по всему миру

## Ограничения Nominatim

Nominatim API имеет ограничения:
- Максимум 1 запрос в секунду
- Для production рекомендуется развернуть собственный сервер Nominatim

## Установка зависимостей

После миграции выполните:

```bash
cd frontend
npm install
```

Зависимости уже добавлены в `package.json`:
- `leaflet`
- `react-leaflet@^4.2.1`
- `@types/leaflet`

## Конфигурация

**Больше не требуется:**
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`
- `YANDEX_MAPS_API_KEY`
- `YANDEX_GEOCODER_API_KEY`

Можно удалить эти переменные из `.env` файлов.

## Производственное развертывание

Для production рекомендуется:

1. **Использовать собственный сервер Nominatim** или кэшировать результаты
2. **Использовать собственный сервер тайлов OSM** или CDN (например, Mapbox, MapTiler)
3. **Настроить rate limiting** для запросов геокодирования

## Откат на Яндекс.Карты

Если нужно вернуться на Яндекс.Карты:

1. Восстановите файл `yandexGeocoderService.ts` из git истории
2. Обновите `Map.tsx` для работы с Яндекс.Картами
3. Восстановите `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` в `.env.local`
4. Обновите зависимости в `package.json`

