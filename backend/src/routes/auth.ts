import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { authService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Регистрация
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('userType').optional().isIn(['renter', 'landlord']),
    body('landlordPlan.planType').optional().isInt({ min: 1 }),
    body('landlordPlan.amount').optional().isInt({ min: 0 }),
    body('landlordPlan.promoCode').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const registerData: Parameters<typeof authService.register>[0] = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        dateOfBirth: new Date(req.body.dateOfBirth),
        userType: req.body.userType || 'renter',
      };

      if (req.body.userType === 'landlord' && req.body.landlordPlan) {
        registerData.landlordPlan = {
          planType: req.body.landlordPlan.planType,
          amount: req.body.landlordPlan.amount,
          promoCode: req.body.landlordPlan.promoCode,
        };
      }

      const { user, token } = await authService.register(registerData);

      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

// Вход
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, token } = await authService.login({
        email: req.body.email,
        password: req.body.password,
      });

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

// Получение текущего пользователя (включая данные арендодателя)
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prisma } = await import('../lib/prisma');

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        isBlocked: true,
        passwordChangeRequired: true,
        linkedLandlordId: true,
        landlordSubscription: {
          select: { id: true, responsesRemaining: true },
        },
        landlordApartments: {
          select: {
            id: true,
            apartmentId: true,
            apartment: {
              include: {
                address: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const { landlordSubscription, landlordApartments, ...rest } = user;
    let hasLinkedRenter = false;
    let displayEmail = rest.email;
    if (rest.role === 'LANDLORD') {
      const linked = await prisma.user.findFirst({
        where: { linkedLandlordId: rest.id },
        select: { id: true, email: true },
      });
      hasLinkedRenter = !!linked;
      if (linked?.email) {
        displayEmail = linked.email;
      } else if (rest.email?.includes('@internal.arendrate')) {
        // Не показывать внутренний email привязанного аккаунта арендодателя
        displayEmail = null;
      }
    }
    const promoSettings = await prisma.systemSettings.findUnique({
      where: { key: 'promo_code_field_enabled' },
    });
    const promoCodeFieldEnabled = promoSettings?.value !== 'false';

    const response = {
      ...rest,
      email: displayEmail,
      landlordResponseCount: landlordSubscription?.responsesRemaining ?? null,
      landlordApartments: landlordApartments ?? [],
      hasLinkedRenter,
      promoCodeFieldEnabled,
    };
    res.json({ user: response });
  } catch (error) {
    next(error);
  }
});

// Переключение на привязанный аккаунт (арендатор ↔ арендодатель)
router.post('/switch-to-linked', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await authService.switchToLinked(req.user!.id);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Создание аккаунта арендодателя и привязка к текущему арендатору
router.post(
  '/link-landlord',
  authenticate,
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('landlordPlan.planType').isInt({ min: 1 }).withMessage('Invalid plan'),
    body('landlordPlan.amount').isInt({ min: 0 }).withMessage('Invalid amount'),
    body('landlordPlan.promoCode').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { user, token } = await authService.linkLandlord(req.user!.id, {
        password: req.body.password,
        landlordPlan: req.body.landlordPlan,
      });
      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

// Создание аккаунта арендатора и привязка к текущему арендодателю (после принятия соглашения)
router.post(
  '/create-linked-renter',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const acceptTerms = req.body?.acceptTerms;
      if (acceptTerms !== true && acceptTerms !== 'true' && acceptTerms !== 1) {
        return res.status(400).json({
          message: 'Необходимо принять пользовательское соглашение',
        });
      }
      const { prisma } = await import('../lib/prisma');
      const landlord = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true, role: true },
      });
      if (!landlord || landlord.role !== 'LANDLORD') {
        return res.status(403).json({ message: 'Only landlords can create a linked renter account' });
      }
      const { user, token } = await authService.createLinkedRenter(req.user!.id, landlord.name);
      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

// Сохраняем userType в сессии перед редиректом на OAuth (для арендодателя)
function saveOAuthUserType(req: Request, res: Response, next: NextFunction) {
  const userType = req.query.userType as string | undefined;
  if (userType === 'landlord' && req.session) {
    (req.session as any).oauthUserType = 'landlord';
  }
  next();
}

// OAuth Яндекс
router.get('/yandex', saveOAuthUserType, passport.authenticate('yandex'));

router.get(
  '/yandex/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('yandex', { session: false }, (err: any, user: any) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (err) {
        console.error('Yandex OAuth error:', err);
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
      if (!user?.token) {
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
      const needLandlordPlan = (req.session as any)?.oauthUserType === 'landlord';
      if (needLandlordPlan && req.session) {
        delete (req.session as any).oauthUserType;
        return res.redirect(`${frontendUrl}/auth/callback?token=${user.token}&needLandlordPlan=1`);
      }
      res.redirect(`${frontendUrl}/auth/callback?token=${user.token}`);
    })(req, res, next);
  }
);

// OAuth VK ID (классический redirect flow)
router.get('/vk', saveOAuthUserType, passport.authenticate('vkid'));

router.get(
  '/vk/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('vkid', { session: false }, (err: any, user: any) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (err) {
        console.error('VK OAuth error:', err);
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
      if (!user?.token) {
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
      const needLandlordPlan = (req.session as any)?.oauthUserType === 'landlord';
      if (needLandlordPlan && req.session) {
        delete (req.session as any).oauthUserType;
        return res.redirect(`${frontendUrl}/auth/callback?token=${user.token}&needLandlordPlan=1`);
      }
      res.redirect(`${frontendUrl}/auth/callback?token=${user.token}`);
    })(req, res, next);
  }
);

// VK ID One Tap — обмен access_token на JWT (callback flow)
router.post(
  '/vk/token',
  [
    body('access_token').notEmpty().withMessage('access_token is required'),
    body('userType').optional().isIn(['renter', 'landlord']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const accessToken = req.body.access_token as string;
      const userType = req.body.userType as string | undefined;
      const clientId = process.env.VK_CLIENT_ID;

      if (!clientId) {
        return res.status(500).json({ message: 'VK OAuth is not configured' });
      }

      // Проверка токена и получение данных пользователя через VK ID API
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('access_token', accessToken);

      const vkResponse = await fetch('https://id.vk.ru/oauth2/user_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!vkResponse.ok) {
        const errData = await vkResponse.json().catch(() => ({}));
        console.error('VK user_info error:', vkResponse.status, errData);
        return res.status(401).json({ message: 'Invalid or expired VK token' });
      }

      const vkUser = (await vkResponse.json()) as { user?: { user_id: string; first_name?: string; last_name?: string; email?: string; avatar?: string } };
      const userData = vkUser.user;

      if (!userData?.user_id) {
        return res.status(401).json({ message: 'Invalid VK user data' });
      }

      const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim() || 'User';
      const { user, token } = await authService.findOrCreateOAuthUser(
        'vk',
        String(userData.user_id),
        userData.email || null,
        name,
        userData.avatar || null
      );

      const needLandlordPlan = userType === 'landlord';
      res.json(needLandlordPlan ? { user, token, needLandlordPlan: true } : { user, token });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

