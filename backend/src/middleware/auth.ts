import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    role: UserRole;
  };
}

export const authenticate: RequestHandler = async (
  req,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw createError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user) {
      throw createError('User not found', 401);
    }
    if (user.isBlocked) {
      throw createError('Account is blocked', 403);
    }

    authReq.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Invalid token', 401));
    }
    next(error);
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(authReq.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const optionalAuth: RequestHandler = async (
  req,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });

      if (user) {
        authReq.user = user;
      }
    }

    next();
  } catch (error) {
    // В случае ошибки просто продолжаем без аутентификации
    next();
  }
};

