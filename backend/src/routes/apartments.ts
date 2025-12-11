import express from 'express';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Получение квартиры с отзывами
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const apartment = await prisma.apartment.findUnique({
      where: { id: req.params.id },
      include: {
        address: true,
        reviews: {
          where: {
            status: req.user ? 'APPROVED' : undefined,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            ratings: true,
            photos: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!apartment) {
      throw createError('Apartment not found', 404);
    }

    // Если пользователь не авторизован и есть отзывы, показать только количество
    if (!req.user) {
      return res.json({
        apartment: {
          id: apartment.id,
          number: apartment.number,
          address: apartment.address,
          reviewsCount: apartment.reviews.length,
          requiresAuth: true,
        },
      });
    }

    res.json({
      apartment: {
        id: apartment.id,
        number: apartment.number,
        address: apartment.address,
        reviews: apartment.reviews,
        reviewsCount: apartment.reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

