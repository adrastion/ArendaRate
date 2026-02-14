import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { fillMarketerContract } from '../lib/marketerContract';

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
        fullName: profile.fullName,
        inn: profile.inn,
        passport: profile.passport,
        phone: profile.phone,
        contractAcceptedAt: profile.contractAcceptedAt?.toISOString() ?? null,
        promoCodes: profile.promoCodes,
        totalSales,
        earnings,
      },
    });
  } catch (e) {
    next(e);
  }
});

// Подписание договора (акцепт): передать ФИО, ИНН, паспорт, телефон; дата/время подставляются автоматически
router.patch(
  '/me/contract',
  marketerAuth,
  [
    body('fullName').trim().notEmpty().withMessage('ФИО обязательно'),
    body('inn').optional().trim(),
    body('passport').trim().notEmpty().withMessage('Паспорт обязателен'),
    body('phone').trim().notEmpty().withMessage('Телефон обязателен'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const userId = req.user!.id;
      const { fullName, inn, passport, phone } = req.body as { fullName: string; inn?: string; passport: string; phone: string };

      const profile = await prisma.marketerProfile.findUnique({ where: { userId } });
      if (!profile) throw createError('Marketer profile not found', 404);
      if (profile.contractAcceptedAt) throw createError('Договор уже подписан', 400);

      const updated = await prisma.marketerProfile.update({
        where: { userId },
        data: {
          fullName: fullName.trim(),
          inn: (inn as string)?.trim() || null,
          passport: passport.trim(),
          phone: phone.trim(),
          contractAcceptedAt: new Date(),
        },
      });

      res.json({
        marketer: {
          id: updated.id,
          email: updated.email,
          percentage: updated.percentage,
          fullName: updated.fullName,
          inn: updated.inn,
          passport: updated.passport,
          phone: updated.phone,
          contractAcceptedAt: updated.contractAcceptedAt?.toISOString() ?? null,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

// Текст подписанного договора (для просмотра в ЛК маркетолога)
router.get('/me/contract-text', marketerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.marketerProfile.findUnique({ where: { userId } });
    if (!profile) throw createError('Marketer profile not found', 404);
    if (!profile.contractAcceptedAt) throw createError('Договор не подписан', 400);

    const text = fillMarketerContract(
      {
        id: profile.id,
        email: profile.email,
        percentage: profile.percentage,
        fullName: profile.fullName,
        inn: profile.inn,
        passport: profile.passport,
        phone: profile.phone,
        contractAcceptedAt: profile.contractAcceptedAt,
      },
      { siteUrl: process.env.FRONTEND_URL }
    );
    res.json({ contractText: text });
  } catch (e) {
    next(e);
  }
});

export default router;
