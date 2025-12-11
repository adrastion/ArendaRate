import express from 'express';
import { body, validationResult } from 'express-validator';
import { RatingCriterion, ReviewStatus } from '@prisma/client';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();

const RATING_CRITERIA = Object.values(RatingCriterion);

// Создание отзыва
router.post(
  '/',
  authenticate,
  [
    body('apartmentId').isUUID().withMessage('Invalid apartment ID'),
    body('comment')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Comment must be 1-100 characters'),
    body('periodFrom').isISO8601().withMessage('Invalid start date'),
    body('periodTo').isISO8601().withMessage('Invalid end date'),
    body('ratings')
      .isArray({ min: RATING_CRITERIA.length, max: RATING_CRITERIA.length })
      .withMessage(`Must provide ratings for all ${RATING_CRITERIA.length} criteria`),
    body('ratings.*.criterion')
      .isIn(RATING_CRITERIA)
      .withMessage('Invalid rating criterion'),
    body('ratings.*.score').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { apartmentId, comment, periodFrom, periodTo, ratings } = req.body;

      // Проверка, что квартира существует
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
      });

      if (!apartment) {
        throw createError('Apartment not found', 404);
      }

      // Проверка, что все критерии присутствуют
      const providedCriteria = ratings.map((r: any) => r.criterion);
      const missingCriteria = RATING_CRITERIA.filter(
        (c) => !providedCriteria.includes(c)
      );

      if (missingCriteria.length > 0) {
        throw createError(`Missing ratings for: ${missingCriteria.join(', ')}`, 400);
      }

      // Проверка дат
      const fromDate = new Date(periodFrom);
      const toDate = new Date(periodTo);

      if (fromDate >= toDate) {
        throw createError('Start date must be before end date', 400);
      }

      // Расчет среднего балла
      const averageRating =
        ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length;

      // Создание отзыва
      const review = await prisma.review.create({
        data: {
          userId: req.user!.id,
          apartmentId,
          comment,
          averageRating,
          periodFrom: fromDate,
          periodTo: toDate,
          status: ReviewStatus.PENDING,
          ratings: {
            create: ratings.map((r: any) => ({
              criterion: r.criterion,
              score: r.score,
            })),
          },
        },
        include: {
          ratings: true,
          apartment: {
            include: {
              address: true,
            },
          },
        },
      });

      res.status(201).json({ review });
    } catch (error) {
      next(error);
    }
  }
);

// Получение отзывов пользователя
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user!.id },
      include: {
        apartment: {
          include: {
            address: true,
          },
        },
        ratings: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

// Редактирование отзыва (только владелец)
router.put(
  '/:id',
  authenticate,
  [
    body('comment')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Comment must be 1-100 characters'),
    body('periodFrom').isISO8601().withMessage('Invalid start date'),
    body('periodTo').isISO8601().withMessage('Invalid end date'),
    body('ratings')
      .isArray({ min: RATING_CRITERIA.length, max: RATING_CRITERIA.length })
      .withMessage(`Must provide ratings for all ${RATING_CRITERIA.length} criteria`),
    body('ratings.*.criterion')
      .isIn(RATING_CRITERIA)
      .withMessage('Invalid rating criterion'),
    body('ratings.*.score').isInt({ min: 1, max: 5 }).withMessage('Score must be 1-5'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
        include: {
          ratings: true,
        },
      });

      if (!review) {
        throw createError('Review not found', 404);
      }

      // Проверка, что пользователь владеет отзывом
      if (review.userId !== req.user!.id) {
        throw createError('You can only edit your own reviews', 403);
      }

      const { comment, periodFrom, periodTo, ratings } = req.body;

      // Проверка дат
      const fromDate = new Date(periodFrom);
      const toDate = new Date(periodTo);

      if (fromDate >= toDate) {
        throw createError('Start date must be before end date', 400);
      }

      // Проверка, что все критерии присутствуют
      const providedCriteria = ratings.map((r: any) => r.criterion);
      const missingCriteria = RATING_CRITERIA.filter(
        (c) => !providedCriteria.includes(c)
      );

      if (missingCriteria.length > 0) {
        throw createError(`Missing ratings for: ${missingCriteria.join(', ')}`, 400);
      }

      // Расчет среднего балла
      const averageRating =
        ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length;

      // Обновление отзыва в транзакции
      const updatedReview = await prisma.$transaction(async (tx) => {
        // Удаляем старые оценки
        await tx.rating.deleteMany({
          where: { reviewId: review.id },
        });

        // Обновляем отзыв и меняем статус на PENDING
        const updated = await tx.review.update({
          where: { id: review.id },
          data: {
            comment,
            averageRating,
            periodFrom: fromDate,
            periodTo: toDate,
            status: ReviewStatus.PENDING, // Возвращаем на модерацию
            rejectionReason: null, // Очищаем причину отклонения
            publishedAt: null, // Очищаем дату публикации
            ratings: {
              create: ratings.map((r: any) => ({
                criterion: r.criterion,
                score: r.score,
              })),
            },
          },
          include: {
            ratings: true,
            apartment: {
              include: {
                address: true,
              },
            },
          },
        });

        return updated;
      });

      res.json({ review: updatedReview });
    } catch (error) {
      next(error);
    }
  }
);

// Получение конкретного отзыва
router.get('/:id', async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        apartment: {
          include: {
            address: true,
          },
        },
        ratings: true,
        photos: true,
      },
    });

    if (!review) {
      throw createError('Review not found', 404);
    }

    // Неавторизованные пользователи могут видеть только одобренные отзывы
    if (review.status !== ReviewStatus.APPROVED) {
      return res.status(403).json({ message: 'Review not available' });
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
});

export default router;

