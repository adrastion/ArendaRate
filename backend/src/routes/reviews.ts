import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { RatingCriterion, ReviewStatus } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { sendReviewNotification } from '../services/telegram';

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
  async (req: Request, res: Response, next: NextFunction) => {
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

      // Арендодатель не может оставлять отзывы
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { role: true },
      });
      if (user?.role === 'LANDLORD') {
        throw createError('Landlords cannot leave reviews', 403);
      }
      // Проверка: арендатор не может оставить отзыв на квартиру привязанного арендодателя
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { linkedLandlordId: true },
      });
      if (currentUser?.linkedLandlordId) {
        const landlordRentsThis = await prisma.landlordApartment.findUnique({
          where: {
            landlordId_apartmentId: { landlordId: currentUser.linkedLandlordId, apartmentId },
          },
        });
        if (landlordRentsThis) {
          throw createError('You cannot review apartments of your linked landlord account', 403);
        }
      }
      // Один отзыв на одну квартиру (уникальность в схеме)

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

      // Уведомление модераторов в Telegram (если настроен бот)
      sendReviewNotification(review).catch((err) => {
        console.error('Telegram notification failed:', err);
      });

      res.status(201).json({ review });
    } catch (error) {
      next(error);
    }
  }
);

// Получение отзывов пользователя
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
  async (req: Request, res: Response, next: NextFunction) => {
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

// Ответ арендодателя на отзыв
router.post(
  '/:id/reply',
  authenticate,
  [body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Reply must be 1-500 characters')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const reviewId = req.params.id;
      const userId = req.user!.id;
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { apartment: true },
      });
      if (!review) throw createError('Review not found', 404);
      if (review.status !== ReviewStatus.APPROVED) throw createError('Review is not approved', 400);

      const isLandlordOfApartment = await prisma.landlordApartment.findUnique({
        where: {
          landlordId_apartmentId: { landlordId: userId, apartmentId: review.apartmentId },
        },
      });
      if (!isLandlordOfApartment) throw createError('Only the landlord of this apartment can reply', 403);

      const subscription = await prisma.landlordSubscription.findUnique({
        where: { landlordId: userId },
      });
      if (!subscription || subscription.responsesRemaining < 1) {
        throw createError('No response credits left', 403);
      }

      const existing = await prisma.reviewResponse.findUnique({
        where: { reviewId },
      });
      if (existing) throw createError('Already replied to this review', 400);

      await prisma.$transaction([
        prisma.reviewResponse.create({
          data: { reviewId, landlordId: userId, text: req.body.text },
        }),
        prisma.landlordSubscription.update({
          where: { landlordId: userId },
          data: { responsesRemaining: { decrement: 1 } },
        }),
      ]);

      const updated = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          landlordResponse: true,
          user: { select: { id: true, name: true, avatar: true } },
          apartment: { include: { address: true } },
          ratings: true,
          photos: true,
        },
      });
      res.json({ review: updated });
    } catch (error) {
      next(error);
    }
  }
);

// Лайк/дизлайк отзыва (1 = like, -1 = dislike)
router.post(
  '/:id/vote',
  authenticate,
  [body('vote').isIn([1, -1]).withMessage('Vote must be 1 or -1')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const reviewId = req.params.id;
      const userId = req.user!.id;
      const vote = req.body.vote as number;

      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) throw createError('Review not found', 404);
      if (review.status !== ReviewStatus.APPROVED) throw createError('Review not available', 400);

      await prisma.reviewVote.upsert({
        where: {
          reviewId_userId: { reviewId, userId },
        },
        create: { reviewId, userId, vote },
        update: { vote },
      });
      const votes = await prisma.reviewVote.groupBy({
        by: ['vote'],
        where: { reviewId },
        _count: true,
      });
      const likes = votes.find((v) => v.vote === 1)?._count ?? 0;
      const dislikes = votes.find((v) => v.vote === -1)?._count ?? 0;
      res.json({ likes, dislikes });
    } catch (error) {
      next(error);
    }
  }
);

// Жалоба на отзыв
router.post(
  '/:id/report',
  authenticate,
  [body('reason').optional().trim().isLength({ max: 500 })],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewId = req.params.id;
      const userId = req.user!.id;
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) throw createError('Review not found', 404);

      await prisma.reviewReport.create({
        data: { reviewId, userId, reason: req.body.reason || null },
      });
      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

// Получение конкретного отзыва
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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
        landlordResponse: true,
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

