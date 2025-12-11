import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  dateOfBirth: Date;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    // Проверка возраста (18+)
    const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    if (age < 18) {
      throw createError('You must be at least 18 years old', 400);
    }

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        role: 'RENTER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return { user, token };
  },

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw createError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  async findOrCreateOAuthUser(
    provider: 'yandex' | 'vk',
    providerId: string,
    email: string | null,
    name: string,
    avatar: string | null
  ) {
    const fieldName = provider === 'yandex' ? 'yandexId' : 'vkId';

    // Поиск существующего пользователя
    let user = await prisma.user.findUnique({
      where: { [fieldName]: providerId },
    });

    if (!user && email) {
      // Попытка найти по email
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Обновление OAuth ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [fieldName]: providerId, avatar: avatar || user.avatar },
        });
      }
    }

    // Создание нового пользователя
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          [fieldName]: providerId,
          role: 'RENTER',
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  },
};

