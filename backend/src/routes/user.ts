import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { applyPromoCode, incrementPromoUsage } from '../services/promoService';
import { getSubscriptionPlans, getPlanPrice } from '../lib/subscriptionPlans';
import { createYookassaPayment } from '../services/yookassaService';

const router = express.Router();

// --- Арендодатель: добавить квартиру (адрес сдаваемого жилья) ---
router.post(
  '/me/landlord-apartments',
  authenticate,
  [body('apartmentId').isUUID().withMessage('Invalid apartment ID')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'LANDLORD') {
        throw createError('Only landlords can add rental apartments', 403);
      }
      const apartmentId = req.body.apartmentId;
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        include: { address: true },
      });
      if (!apartment) throw createError('Apartment not found', 404);
      await prisma.landlordApartment.upsert({
        where: {
          landlordId_apartmentId: {
            landlordId: userId,
            apartmentId,
          },
        },
        create: { landlordId: userId, apartmentId },
        update: {},
      });
      const list = await prisma.landlordApartment.findMany({
        where: { landlordId: userId },
        include: {
          apartment: { include: { address: true } },
        },
      });
      res.json({ landlordApartments: list });
    } catch (error) {
      next(error);
    }
  }
);

// --- Арендодатель: убрать квартиру ---
router.delete(
  '/me/landlord-apartments/:apartmentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const apartmentId = req.params.apartmentId;
      await prisma.landlordApartment.deleteMany({
        where: { landlordId: userId, apartmentId },
      });
      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

// --- Арендодатель: отзывы по моим квартирам (с ответом и без) ---
router.get(
  '/me/landlord-reviews',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'LANDLORD') {
        throw createError('Only landlords can view landlord reviews', 403);
      }
      const myApartmentIds = (
        await prisma.landlordApartment.findMany({
          where: { landlordId: userId },
          select: { apartmentId: true },
        })
      ).map((r) => r.apartmentId);
      if (myApartmentIds.length === 0) {
        return res.json({ answered: [], unanswered: [] });
      }
      const reviews = await prisma.review.findMany({
        where: {
          apartmentId: { in: myApartmentIds },
          status: 'APPROVED',
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          apartment: { include: { address: true } },
          ratings: true,
          photos: true,
          landlordResponse: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      const answered = reviews.filter((r) => r.landlordResponse != null);
      const unanswered = reviews.filter((r) => r.landlordResponse == null);
      res.json({ answered, unanswered });
    } catch (error) {
      next(error);
    }
  }
);

// --- Арендодатель: создать платёж ЮKassa (редирект на оплату) ---
router.post(
  '/me/landlord-create-payment',
  authenticate,
  [
    body('planType').isInt({ min: 1 }),
    body('amount').isInt({ min: 0 }),
    body('promoCode').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'LANDLORD') throw createError('Only landlords can create payment', 403);

      const plans = await getSubscriptionPlans();
      const planType = req.body.planType as number;
      let amount = req.body.amount as number;
      const promoCode = (req.body.promoCode as string)?.trim() || undefined;

      const expectedPrice = getPlanPrice(plans, planType);
      if (expectedPrice == null || amount !== expectedPrice) throw createError('Invalid plan or amount', 400);

      let promoCodeId: string | null = null;
      let marketerId: string | null = null;
      if (promoCode) {
        const applied = await applyPromoCode(promoCode, amount);
        if (applied) {
          amount = applied.finalAmount;
          promoCodeId = applied.promoCodeId;
          marketerId = applied.marketerId;
        }
      }

      let subscription = await prisma.landlordSubscription.findUnique({ where: { landlordId: userId } });
      if (!subscription) {
        subscription = await prisma.landlordSubscription.create({
          data: { landlordId: userId, responsesRemaining: 0 },
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const returnUrl = `${frontendUrl.replace(/\/$/, '')}/profile?payment=done`;

      const payment = await createYookassaPayment({
        amountRub: amount,
        description: `ArendaRate: ${planType} ответов на отзывы`,
        returnUrl,
        metadata: {
          landlordId: userId,
          subscriptionId: subscription.id,
          planType: String(planType),
          amount: String(amount),
          ...(promoCodeId && { promoCodeId }),
          ...(marketerId && { marketerId }),
        },
      });

      if (!payment) {
        throw createError('Payment provider not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.', 503);
      }

      await prisma.pendingYookassaPayment.create({
        data: {
          yookassaPaymentId: payment.id,
          landlordId: userId,
          planType,
          amount,
          subscriptionId: subscription.id,
          promoCodeId: promoCodeId ?? undefined,
          marketerId: marketerId ?? undefined,
          status: 'PENDING',
        },
      });

      res.json({ confirmationUrl: payment.confirmationUrl, paymentId: payment.id });
    } catch (error) {
      next(error);
    }
  }
);

// --- Арендодатель: докупить ответы (мгновенно, если ЮKassa не настроена — для тестов) ---
router.post(
  '/me/landlord-top-up',
  authenticate,
  [
    body('planType').isInt({ min: 1 }),
    body('amount').isInt({ min: 0 }),
    body('promoCode').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'LANDLORD') throw createError('Only landlords can top up responses', 403);

      const plans = await getSubscriptionPlans();
      const planType = req.body.planType as number;
      let amount = req.body.amount as number;
      const promoCode = (req.body.promoCode as string)?.trim() || undefined;

      const expectedPrice = getPlanPrice(plans, planType);
      if (expectedPrice == null || amount !== expectedPrice) throw createError('Invalid plan or amount for this plan', 400);

      let promoCodeId: string | null = null;
      let marketerId: string | null = null;
      if (promoCode) {
        const applied = await applyPromoCode(promoCode, amount);
        if (applied) {
          amount = applied.finalAmount;
          promoCodeId = applied.promoCodeId;
          marketerId = applied.marketerId;
        }
      }

      let subscription = await prisma.landlordSubscription.findUnique({ where: { landlordId: userId } });
      if (!subscription) {
        subscription = await prisma.landlordSubscription.create({
          data: { landlordId: userId, responsesRemaining: 0 },
        });
      }

      await prisma.$transaction([
        prisma.landlordSubscription.update({
          where: { id: subscription.id },
          data: { responsesRemaining: { increment: planType } },
        }),
        prisma.landlordSubscriptionPurchase.create({
          data: {
            subscriptionId: subscription.id,
            planType,
            amount,
            responsesGranted: planType,
            promoCodeId: promoCodeId ?? undefined,
            marketerId: marketerId ?? undefined,
          },
        }),
      ]);
      if (promoCodeId) await incrementPromoUsage(promoCodeId);

      const updated = await prisma.landlordSubscription.findUnique({
        where: { id: subscription.id },
        select: { responsesRemaining: true },
      });
      res.json({ responsesRemaining: updated?.responsesRemaining ?? subscription.responsesRemaining + planType });
    } catch (error) {
      next(error);
    }
  }
);

// Обновить email текущего пользователя
router.put(
  '/me/email',
  authenticate,
  [body('email').isEmail().withMessage('Invalid email')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = String(req.body.email).toLowerCase().trim();
      if (!email) throw createError('Email is required', 400);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user!.id) {
        throw createError('User with this email already exists', 400);
      }

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { email },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
);

// Сменить/установить пароль (для OAuth пользователей тоже)
router.put(
  '/me/password',
  authenticate,
  [
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('currentPassword').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, passwordHash: true },
      });

      if (!user) throw createError('User not found', 404);

      // Если пароль уже установлен — требуем currentPassword
      if (user.passwordHash) {
        if (!currentPassword) throw createError('Current password is required', 400);
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) throw createError('Invalid current password', 401);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { passwordHash, passwordChangeRequired: false },
      });

      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

