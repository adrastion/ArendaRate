import axios from 'axios';

interface YandexGeocodeResult {
  formatted_address: string;
  country_code: string;
  country: string;
  city?: string;
  street?: string;
  house?: string;
  geo_lat: string;
  geo_lon: string;
}

interface YandexGeocodeResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{
        GeoObject: {
          metaDataProperty: {
            GeocoderMetaData: {
              text: string;
              kind: string;
              Address: {
                country_code: string;
                formatted: string;
                Components: Array<{
                  kind: string;
                  name: string;
                }>;
              };
            };
          };
          Point: {
            pos: string; // "lon lat"
          };
        };
      }>;
    };
  };
}

export const yandexGeocoderService = {
  async searchAddresses(query: string): Promise<YandexGeocodeResult[]> {
    const apiKey = process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Yandex Geocoder API key not configured');
      return [];
    }

    try {
      const response = await axios.get<YandexGeocodeResponse>(
        'https://geocode-maps.yandex.ru/1.x/',
        {
          params: {
            apikey: apiKey,
            geocode: query,
            format: 'json',
            results: 10,
            kind: 'house', // Ищем дома
          },
        }
      );

      const results: YandexGeocodeResult[] = [];

      if (response.data?.response?.GeoObjectCollection?.featureMember) {
        for (const member of response.data.response.GeoObjectCollection.featureMember) {
          const geoObject = member.GeoObject;
          const address = geoObject.metaDataProperty?.GeocoderMetaData?.Address;
          const point = geoObject.Point?.pos;

          if (!address || !point) continue;

          // Парсим координаты (формат: "lon lat")
          const [lon, lat] = point.split(' ').map(Number);

          // Парсим компоненты адреса
          const components = address.Components || [];
          let country = '';
          let city = '';
          let street = '';
          let house = '';

          for (const component of components) {
            switch (component.kind) {
              case 'country':
                country = component.name;
                break;
              case 'locality':
              case 'area':
                if (!city) city = component.name;
                break;
              case 'street':
                street = component.name;
                break;
              case 'house':
                house = component.name;
                break;
            }
          }

          // Пропускаем, если нет дома
          if (!house || !city) continue;

          results.push({
            formatted_address: address.formatted || geoObject.metaDataProperty.GeocoderMetaData.text,
            country_code: address.country_code || 'RU',
            country: country || 'Россия',
            city,
            street,
            house,
            geo_lat: lat.toString(),
            geo_lon: lon.toString(),
          });
        }
      }

      return results;
    } catch (error: any) {
      console.error('Yandex Geocoder error:', error.response?.data || error.message);
      return [];
    }
  },
};

