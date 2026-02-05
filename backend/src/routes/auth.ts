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
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, token } = await authService.register({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        dateOfBirth: new Date(req.body.dateOfBirth),
      });

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

// Получение текущего пользователя
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
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// OAuth Яндекс
router.get('/yandex', passport.authenticate('yandex'));

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
      res.redirect(`${frontendUrl}/auth/callback?token=${user.token}`);
    })(req, res, next);
  }
);

// OAuth VK ID (классический redirect flow — оставлен для совместимости)
router.get('/vk', passport.authenticate('vkid'));

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
      res.redirect(`${frontendUrl}/auth/callback?token=${user.token}`);
    })(req, res, next);
  }
);

// VK ID One Tap — обмен access_token на JWT (callback flow)
router.post(
  '/vk/token',
  [body('access_token').notEmpty().withMessage('access_token is required')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const accessToken = req.body.access_token as string;
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

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

