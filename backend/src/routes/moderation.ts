import express from 'express';
import { body, validationResult } from 'express-validator';
import { ReviewStatus } from '@prisma/client';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Все маршруты требуют роль модератора или админа
router.use(authenticate);
router.use(requireRole('MODERATOR', 'ADMIN'));

// Получение списка отзывов на модерацию
router.get('/pending', async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: ReviewStatus.PENDING },
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
        orderBy: { createdAt: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Одобрение отзыва
router.post(
  '/:id/approve',
  async (req: AuthRequest, res, next) => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
      });

      if (!review) {
        throw createError('Review not found', 404);
      }

      if (review.status !== ReviewStatus.PENDING) {
        throw createError('Review is not pending moderation', 400);
      }

      const updatedReview = await prisma.review.update({
        where: { id: req.params.id },
        data: {
          status: ReviewStatus.APPROVED,
          publishedAt: new Date(),
        },
      });

      // Создание лога модерации
      await prisma.moderationLog.create({
        data: {
          reviewId: review.id,
          moderatorId: req.user!.id,
          action: 'APPROVED',
        },
      });

      res.json({ review: updatedReview });
    } catch (error) {
      next(error);
    }
  }
);

// Отклонение отзыва
router.post(
  '/:id/reject',
  [
    body('reason')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Rejection reason is required'),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
      });

      if (!review) {
        throw createError('Review not found', 404);
      }

      if (review.status !== ReviewStatus.PENDING) {
        throw createError('Review is not pending moderation', 400);
      }

      const updatedReview = await prisma.review.update({
        where: { id: req.params.id },
        data: {
          status: ReviewStatus.REJECTED,
          rejectionReason: req.body.reason,
        },
      });

      // Создание лога модерации
      await prisma.moderationLog.create({
        data: {
          reviewId: review.id,
          moderatorId: req.user!.id,
          action: 'REJECTED',
          reason: req.body.reason,
        },
      });

      res.json({ review: updatedReview });
    } catch (error) {
      next(error);
    }
  }
);

// Управление пользователями (для админов)
router.get('/users', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count(),
    ]);

    res.json({
      users: users.map((user) => ({
        ...user,
        reviewsCount: user._count.reviews,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Удаление отзыва (любого статуса)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        ratings: true,
        photos: true,
      },
    });

    if (!review) {
      throw createError('Review not found', 404);
    }

    // Создаем лог модерации об удалении перед удалением отзыва
    await prisma.moderationLog.create({
      data: {
        reviewId: review.id,
        moderatorId: req.user!.id,
        action: 'DELETED',
        reason: `Отзыв удален модератором (был ${review.status})`,
      },
    }).catch(() => {
      // Игнорируем ошибку, если не удалось создать лог
    });

    // Благодаря onDelete: Cascade в Prisma схеме, при удалении Review
    // автоматически удалятся связанные Rating и Photo
    await prisma.review.delete({
      where: { id: review.id },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Блокировка пользователя (для админов)
router.post(
  '/users/:id/block',
  requireRole('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      // В данном случае блокировку можно реализовать через изменение роли
      // или добавление поля isBlocked в модель User
      // Здесь просто пример
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      // TODO: Реализовать блокировку пользователя
      res.json({ message: 'User blocking not yet implemented' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

