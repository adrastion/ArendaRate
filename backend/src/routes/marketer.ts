import express, { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();
const marketerAuth = [authenticate, requireRole('MARKETER')];

// Данные кабинета маркетолога: профиль, промокоды, статистика
router.get('/me', marketerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.marketerProfile.findUnique({
      where: { userId },
      include: {
        promoCodes: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, code: true, discountType: true, discountValue: true, usedCount: true, maxUses: true, isActive: true, createdAt: true },
        },
        purchases: { select: { amount: true } },
      },
    });
    if (!profile) throw createError('Marketer profile not found', 404);
    const totalSales = profile.purchases.reduce((s, p) => s + p.amount, 0);
    const earnings = (totalSales * profile.percentage) / 100;
    res.json({
      marketer: {
        id: profile.id,
        email: profile.email,
        percentage: profile.percentage,
        promoCodes: profile.promoCodes,
        totalSales,
        earnings,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
