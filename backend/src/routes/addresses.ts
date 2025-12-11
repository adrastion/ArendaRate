import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { optionalAuth, AuthRequest, authenticate } from '../middleware/auth';
import { addressService } from '../services/addressService';
import { nominatimService } from '../services/nominatimService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Поиск адресов
router.get(
  '/search',
  [
    query('q').trim().notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit'),
  ],
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const searchQuery = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      console.log('Searching addresses for query:', searchQuery, 'limit:', limit);

      // Поиск адресов в базе данных
      const dbAddresses = await prisma.address.findMany({
        where: {
          OR: [
            { city: { contains: searchQuery, mode: 'insensitive' } },
            { street: { contains: searchQuery, mode: 'insensitive' } },
            { building: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: {
          apartments: {
            include: {
              reviews: {
                // Для авторизованных пользователей показываем все отзывы (включая PENDING)
                // чтобы новые отзывы сразу появлялись на карте
                // Для неавторизованных - только APPROVED
                where: req.user ? undefined : {
                  status: 'APPROVED',
                },
              },
            },
          },
        },
      });

      console.log(`Found ${dbAddresses.length} addresses in database`);

      // Преобразуем адреса из БД
      const dbResults = dbAddresses.map((address) => {
        const apartmentsCount = address.apartments.length;
        const reviewsCount = address.apartments.reduce(
          (sum, apt) => sum + apt.reviews.length,
          0
        );

        return {
          id: address.id,
          country: address.country,
          city: address.city,
          street: address.street,
          building: address.building,
          latitude: address.latitude,
          longitude: address.longitude,
          apartmentsCount,
          reviewsCount,
          fromDatabase: true,
        };
      });

      // Если нашли меньше чем лимит, дополняем результатами из Nominatim (OpenStreetMap)
      let allResults = [...dbResults];
      
      if (dbResults.length < limit) {
        try {
          const nominatimResults = await nominatimService.searchAddresses(searchQuery, limit - dbResults.length);
          
          // Фильтруем дубликаты (по городу, улице, дому)
          const existingKeys = new Set(
            dbResults.map(a => `${a.city}|${a.street}|${a.building}`.toLowerCase())
          );

          for (const nominatimAddress of nominatimResults) {
            if (allResults.length >= limit) break;
            
            const key = `${nominatimAddress.city}|${nominatimAddress.street}|${nominatimAddress.house}`.toLowerCase();
            if (existingKeys.has(key)) continue;

            // Проверяем, есть ли этот адрес в БД (но не нашли через поиск)
            const existingAddress = await prisma.address.findUnique({
              where: {
                country_city_street_building: {
                  country: nominatimAddress.country,
                  city: nominatimAddress.city!,
                  street: nominatimAddress.street || '',
                  building: nominatimAddress.house,
                },
              },
              include: {
                apartments: {
                  include: {
                    reviews: {
                      // Для авторизованных показываем все отзывы (включая PENDING)
                      // Для неавторизованных - только APPROVED
                      where: req.user ? undefined : {
                        status: 'APPROVED',
                      },
                    },
                  },
                },
              },
            });

            if (existingAddress) {
              // Адрес есть в БД, используем данные из БД
              const apartmentsCount = existingAddress.apartments.length;
              const reviewsCount = existingAddress.apartments.reduce(
                (sum, apt) => sum + apt.reviews.length,
                0
              );
              
              allResults.push({
                id: existingAddress.id,
                country: existingAddress.country,
                city: existingAddress.city,
                street: existingAddress.street,
                building: existingAddress.building,
                latitude: existingAddress.latitude,
                longitude: existingAddress.longitude,
                apartmentsCount,
                reviewsCount,
                fromDatabase: true,
              });
              existingKeys.add(key);
            } else {
              // Новый адрес из Nominatim
              allResults.push({
                id: `nominatim_${nominatimAddress.geo_lat}_${nominatimAddress.geo_lon}`, // Временный ID
                country: nominatimAddress.country,
                city: nominatimAddress.city || '',
                street: nominatimAddress.street || '',
                building: nominatimAddress.house,
                latitude: parseFloat(nominatimAddress.geo_lat),
                longitude: parseFloat(nominatimAddress.geo_lon),
                apartmentsCount: 0,
                reviewsCount: 0,
                fromDatabase: false,
                formattedAddress: nominatimAddress.formatted_address,
              });
              existingKeys.add(key);
            }
          }

          console.log(`Added ${allResults.length - dbResults.length} addresses from Nominatim`);
        } catch (error) {
          console.error('Error fetching from Nominatim:', error);
          // Продолжаем работу только с результатами из БД
        }
      }

      console.log('Sending results:', allResults.length);
      console.log('Results details:', allResults.map(a => ({
        id: a.id,
        address: `${a.city}, ${a.street}, ${a.building}`,
        reviewsCount: a.reviewsCount,
        fromDatabase: a.fromDatabase
      })));
      res.json({ addresses: allResults });
    } catch (error) {
      console.error('Error in address search:', error);
      next(error);
    }
  }
);

// Создание или получение адреса
router.post(
  '/',
  authenticate,
  [
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('street').trim().notEmpty().withMessage('Street is required'),
    body('building').trim().notEmpty().withMessage('Building is required'),
    body('latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('longitude').optional().isFloat().withMessage('Invalid longitude'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { country, city, street, building, latitude, longitude } = req.body;

      const address = await addressService.findOrCreateAddress({
        country,
        city,
        street,
        building,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      res.json({ address });
    } catch (error) {
      next(error);
    }
  }
);

// Создание или получение квартиры
router.post(
  '/apartments',
  authenticate,
  [
    body('addressId').isUUID().withMessage('Invalid address ID'),
    body('apartmentNumber').trim().notEmpty().withMessage('Apartment number is required'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { addressId, apartmentNumber } = req.body;

      // Проверка существования адреса
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }

      // Поиск или создание квартиры
      const apartment = await addressService.findOrCreateApartment({
        addressId,
        number: apartmentNumber,
      });

      res.json({ apartment });
    } catch (error) {
      next(error);
    }
  }
);

// Получение адресов для карты (с агрегированными данными)
router.get('/map', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { bounds, zoom } = req.query;

    let addresses;

    if (bounds && typeof bounds === 'string') {
      // Фильтрация по границам карты
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(parseFloat);

      addresses = await prisma.address.findMany({
        where: {
          latitude: { gte: minLat, lte: maxLat },
          longitude: { gte: minLng, lte: maxLng },
        },
        include: {
          apartments: {
            include: {
              reviews: {
                // Для авторизованных пользователей показываем все отзывы (включая PENDING)
                // чтобы новые отзывы сразу появлялись на карте
                // Для неавторизованных - только APPROVED
                where: req.user ? undefined : {
                  status: 'APPROVED',
                },
              },
            },
          },
        },
      });
    } else {
      // Все адреса (для начальной загрузки)
      addresses = await prisma.address.findMany({
        include: {
          apartments: {
            include: {
              reviews: {
                // Для авторизованных пользователей показываем все отзывы (включая PENDING)
                // чтобы новые отзывы сразу появлялись на карте
                // Для неавторизованных - только APPROVED
                where: req.user ? undefined : {
                  status: 'APPROVED',
                },
              },
            },
          },
        },
      });
    }

    const markers = addresses
      .filter((addr) => addr.latitude && addr.longitude)
      .map((address) => {
        // Для авторизованных считаем все отзывы (включая PENDING)
        // Для неавторизованных - только APPROVED
        const allReviewsCount = address.apartments.reduce(
          (sum, apt) => sum + apt.reviews.length,
          0
        );

        // Для фильтрации используем APPROVED отзывы (чтобы не показывать адреса только с PENDING для неавторизованных)
        const approvedReviewsCount = address.apartments.reduce(
          (sum, apt) => sum + apt.reviews.filter(r => r.status === 'APPROVED').length,
          0
        );

        // Для авторизованных показываем маркер если есть хотя бы один отзыв любого статуса
        // Для неавторизованных - только если есть APPROVED отзывы
        const shouldShow = req.user 
          ? allReviewsCount > 0 
          : approvedReviewsCount > 0;

        if (!shouldShow) {
          return null;
        }

        return {
          id: address.id,
          latitude: address.latitude!,
          longitude: address.longitude!,
          apartmentsCount: address.apartments.length,
          reviewsCount: req.user ? allReviewsCount : approvedReviewsCount, // Для авторизованных показываем все, для остальных - только APPROVED
          isActive: !!req.user, // Активна только для авторизованных
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null); // Убираем null значения

    res.json({ markers });
  } catch (error) {
    next(error);
  }
});

// Получение конкретного адреса
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = await prisma.address.findUnique({
      where: { id: req.params.id },
      include: {
        apartments: {
          include: {
            reviews: {
              where: {
                status: req.user ? 'APPROVED' : undefined,
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const apartments = address.apartments.map((apt) => ({
      id: apt.id,
      number: apt.number,
      reviewsCount: apt.reviews.length,
    }));

    res.json({
      address: {
        id: address.id,
        country: address.country,
        city: address.city,
        street: address.street,
        building: address.building,
        latitude: address.latitude,
        longitude: address.longitude,
      },
      apartments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
