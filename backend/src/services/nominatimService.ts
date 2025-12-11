import axios from 'axios';

interface NominatimResult {
  formatted_address: string;
  country_code: string;
  country: string;
  city?: string;
  street?: string;
  house?: string;
  geo_lat: string;
  geo_lon: string;
}

interface NominatimResponseItem {
  place_id: number;
  licence: string;
  powered_by: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string]; // [min_lat, max_lat, min_lon, max_lon]
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
}

/**
 * Сервис для работы с Nominatim API (OpenStreetMap геокодер)
 * Документация: https://nominatim.org/release-docs/latest/api/Overview/
 * 
 * Важно: Nominatim имеет ограничения на количество запросов:
 * - Максимум 1 запрос в секунду
 * - Используйте User-Agent для идентификации
 * - Не используйте в production без собственного сервера Nominatim
 */
export const nominatimService = {
  /**
   * Поиск адресов через Nominatim
   * @param query - поисковый запрос
   * @param limit - максимальное количество результатов (по умолчанию 10)
   */
  async searchAddresses(query: string, limit: number = 10): Promise<NominatimResult[]> {
    try {
      // Важно: Nominatim требует задержку между запросами
      // В production лучше использовать собственный сервер или кэш
      
      const response = await axios.get<NominatimResponseItem[]>(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: limit,
            countrycodes: 'ru', // Ограничиваем поиск Россией
            extratags: 0,
            namedetails: 0,
          },
          headers: {
            'User-Agent': 'ArendRate/1.0 (https://github.com/yourusername/ArendRate)',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          // Таймаут для избежания долгих ожиданий
          timeout: 5000,
        }
      );

      const results: NominatimResult[] = [];

      if (Array.isArray(response.data)) {
        console.log(`Nominatim returned ${response.data.length} results for query: ${query}`);
        
        for (const item of response.data) {
          const address = item.address;
          if (!address) {
            console.log('Skipping item without address:', item.type, item.class);
            continue;
          }

          // Извлекаем компоненты адреса
          const country = address.country || 'Россия';
          const countryCode = address.country_code?.toUpperCase() || 'RU';
          
          // Город может быть в разных полях
          const city = address.city || address.town || address.village || address.municipality || '';
          const street = address.road || '';
          const house = address.house_number || '';

          // Пропускаем только если нет города (номер дома может отсутствовать для некоторых типов)
          if (!city) {
            console.log('Skipping item without city:', item.display_name);
            continue;
          }
          
          // Если есть номер дома - это дом, если нет - возможно это район, но всё равно можем показать

          // Формируем отформатированный адрес
          const addressParts: string[] = [];
          if (country) addressParts.push(country);
          if (city) addressParts.push(city);
          if (street) addressParts.push(street);
          if (house) addressParts.push(`д. ${house}`);
          
          const formattedAddress = addressParts.join(', ') || item.display_name;

          // Добавляем адрес, даже если нет номера дома
          results.push({
            formatted_address: formattedAddress,
            country_code: countryCode,
            country,
            city,
            street,
            house: house || '', // Пустая строка если нет номера дома
            geo_lat: item.lat,
            geo_lon: item.lon,
          });
          
          console.log(`Added address: ${formattedAddress}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Nominatim Geocoder error:', error.response?.data || error.message);
      
      // Если ошибка связана с лимитом запросов, возвращаем пустой массив
      if (error.response?.status === 429) {
        console.warn('Nominatim rate limit exceeded. Consider using your own Nominatim server.');
      }
      
      return [];
    }
  },

  /**
   * Обратное геокодирование (получение адреса по координатам)
   * @param lat - широта
   * @param lon - долгота
   */
  async reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
    try {
      const response = await axios.get<NominatimResponseItem>(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: lat.toString(),
            lon: lon.toString(),
            format: 'json',
            addressdetails: 1,
            'accept-language': 'ru',
          },
          headers: {
            'User-Agent': 'ArendRate/1.0 (https://github.com/yourusername/ArendRate)',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          timeout: 5000,
        }
      );

      const item = response.data;
      if (!item || !item.address) return null;

      const address = item.address;
      const country = address.country || 'Россия';
      const countryCode = address.country_code?.toUpperCase() || 'RU';
      const city = address.city || address.town || address.village || address.municipality || '';
      const street = address.road || '';
      const house = address.house_number || '';

      const addressParts: string[] = [];
      if (country) addressParts.push(country);
      if (city) addressParts.push(city);
      if (street) addressParts.push(street);
      if (house) addressParts.push(`д. ${house}`);
      
      const formattedAddress = addressParts.join(', ') || item.display_name;

      return {
        formatted_address: formattedAddress,
        country_code: countryCode,
        country,
        city,
        street,
        house,
        geo_lat: item.lat,
        geo_lon: item.lon,
      };
    } catch (error: any) {
      console.error('Nominatim Reverse Geocoder error:', error.response?.data || error.message);
      return null;
    }
  },
};

