import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

const router = express.Router();

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
        data: { passwordHash },
      });

      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

