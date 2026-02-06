import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();
const adminAuth = [authenticate, requireRole('ADMIN')];

const PROMO_FIELD_KEY = 'promo_code_field_enabled';

// Список пользователей
router.get(
  '/users',
  adminAuth,
  [query('search').optional().isString(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const search = (req.query.search as string)?.trim() || '';
      const page = Math.max(1, parseInt((req.query.page as string) || '1'));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isBlocked: true,
            createdAt: true,
            landlordSubscription: { select: { responsesRemaining: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);
      res.json({
        users: users.map((u) => ({
          ...u,
          landlordResponseCount: u.landlordSubscription?.responsesRemaining ?? null,
        })),
        total,
        page,
        limit,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Блокировка пользователя
router.patch(
  '/users/:id/block',
  adminAuth,
  [param('id').isUUID(), body('isBlocked').isBoolean()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      await prisma.user.update({
        where: { id: req.params.id },
        data: { isBlocked: req.body.isBlocked },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

// Подписка арендодателя: установить кол-во ответов или создать подписку
router.patch(
  '/users/:id/subscription',
  adminAuth,
  [param('id').isUUID(), body('responsesRemaining').optional().isInt({ min: 0 })],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const userId = req.params.id;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user) throw createError('User not found', 404);
      if (user.role !== 'LANDLORD') throw createError('User is not a landlord', 400);
      const responsesRemaining = req.body.responsesRemaining as number | undefined;
      let sub = await prisma.landlordSubscription.findUnique({ where: { landlordId: userId } });
      if (!sub) {
        sub = await prisma.landlordSubscription.create({
          data: { landlordId: userId, responsesRemaining: responsesRemaining ?? 0 },
        });
      } else if (responsesRemaining !== undefined) {
        await prisma.landlordSubscription.update({
          where: { id: sub.id },
          data: { responsesRemaining },
        });
        sub = { ...sub, responsesRemaining };
      }
      res.json({ subscription: { id: sub.id, responsesRemaining: sub.responsesRemaining } });
    } catch (e) {
      next(e);
    }
  }
);

// Создать промокод
router.post(
  '/promo',
  adminAuth,
  [
    body('code').trim().notEmpty(),
    body('discountType').isIn(['PERCENT', 'FIXED']),
    body('discountValue').isInt({ min: 1 }),
    body('maxUses').optional().isInt({ min: 1 }),
    body('marketerId').optional().isUUID(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { code, discountType, discountValue, maxUses, marketerId } = req.body;
      const existing = await prisma.promoCode.findUnique({ where: { code: code.trim() } });
      if (existing) throw createError('Promo code already exists', 400);
      if (marketerId) {
        const m = await prisma.marketerProfile.findUnique({ where: { id: marketerId } });
        if (!m) throw createError('Marketer not found', 400);
      }
      const promo = await prisma.promoCode.create({
        data: { code: code.trim(), discountType, discountValue, maxUses: maxUses ?? null, marketerId: marketerId ?? null },
      });
      res.status(201).json({ promo });
    } catch (e) {
      next(e);
    }
  }
);

// Список маркетологов
router.get('/marketers', adminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const marketers = await prisma.marketerProfile.findMany({
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { promoCodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ marketers });
  } catch (e) {
    next(e);
  }
});

// Создать маркетолога (User MARKETER + MarketerProfile, одноразовый пароль генерируется на сервере)
router.post(
  '/marketers',
  adminAuth,
  [
    body('email').isEmail(),
    body('percentage').isFloat({ min: 0, max: 100 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, percentage } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email }, include: { marketerProfile: true } });
      if (existingUser) throw createError('User with this email already exists', 400);
      const oneTimePassword = crypto.randomBytes(6).toString('hex');
      const passwordHash = await bcrypt.hash(oneTimePassword, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash,
          role: 'MARKETER',
          passwordChangeRequired: true,
        },
      });
      const marketer = await prisma.marketerProfile.create({
        data: { userId: user.id, email, percentage },
      });
      res.status(201).json({
        user: { id: user.id, email: user.email },
        marketer: { id: marketer.id, percentage },
        oneTimePassword,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Статистика покупок
router.get('/stats/purchases', adminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const purchases = await prisma.landlordSubscriptionPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        subscription: { select: { landlordId: true, landlord: { select: { email: true, name: true } } } },
        promoCode: { select: { code: true } },
        marketer: { select: { email: true, percentage: true } },
      },
    });
    const totalAmount = purchases.reduce((s, p) => s + p.amount, 0);
    res.json({ purchases, totalAmount });
  } catch (e) {
    next(e);
  }
});

// Статистика маркетологов (заработок по каждому)
router.get('/stats/marketers', adminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const marketers = await prisma.marketerProfile.findMany({
      include: {
        user: { select: { name: true } },
        purchases: { select: { amount: true } },
      },
    });
    const stats = marketers.map((m) => {
      const totalSales = m.purchases.reduce((s, p) => s + p.amount, 0);
      const earnings = (totalSales * m.percentage) / 100;
      return { id: m.id, email: m.email, percentage: m.percentage, totalSales, earnings };
    });
    res.json({ marketers: stats });
  } catch (e) {
    next(e);
  }
});

// Настройки: получить
router.get('/settings', adminAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemSettings.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    res.json({ settings: map });
  } catch (e) {
    next(e);
  }
});

// Настройки: установить (вкл/выкл поле промокода)
router.patch(
  '/settings',
  adminAuth,
  [body('key').trim().notEmpty(), body('value').isString()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { key, value } = req.body;
      await prisma.systemSettings.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
