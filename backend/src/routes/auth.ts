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

// OAuth VK ID
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

export default router;

