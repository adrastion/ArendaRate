import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { applyPromoCode, incrementPromoUsage } from './promoService';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  dateOfBirth: Date;
  userType?: 'renter' | 'landlord';
  landlordPlan?: { planType: number; amount: number; promoCode?: string };
}

export interface LoginData {
  email: string;
  password: string;
}

export const getJwtToken = (userId: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw createError('JWT secret is not configured', 500);
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  return jwt.sign({ userId }, secret, { expiresIn });
};

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

    const isLandlord = data.userType === 'landlord' && data.landlordPlan;
    const role = isLandlord ? 'LANDLORD' : 'RENTER';

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        role,
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

    // Для арендодателя: создаём подписку и покупку
    if (isLandlord && data.landlordPlan) {
      const { planType, amount, promoCode } = data.landlordPlan;
      let finalAmount = amount;
      let promoCodeId: string | null = null;
      let marketerId: string | null = null;
      if (promoCode) {
        const applied = await applyPromoCode(promoCode, amount);
        if (applied) {
          finalAmount = applied.finalAmount;
          promoCodeId = applied.promoCodeId;
          marketerId = applied.marketerId;
        }
      }
      const subscription = await prisma.landlordSubscription.create({
        data: {
          landlordId: user.id,
          responsesRemaining: planType,
        },
      });
      await prisma.landlordSubscriptionPurchase.create({
        data: {
          subscriptionId: subscription.id,
          planType,
          amount: finalAmount,
          responsesGranted: planType,
          promoCodeId: promoCodeId ?? undefined,
          marketerId: marketerId ?? undefined,
        },
      });
      if (promoCodeId) await incrementPromoUsage(promoCodeId);
    }

    // Генерация JWT токена
    const token = getJwtToken(user.id);

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

    const token = getJwtToken(user.id);

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
    const providerWhere: Prisma.UserWhereUniqueInput =
      fieldName === 'yandexId'
        ? { yandexId: providerId }
        : { vkId: providerId };

    // Поиск существующего пользователя
    let user = await prisma.user.findUnique({
      where: providerWhere,
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

    const token = getJwtToken(user.id);

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

  /** Переключение на привязанный аккаунт (арендатор ↔ арендодатель). Возвращает user и token для другого аккаунта. */
  async switchToLinked(userId: string) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, linkedLandlordId: true },
    });
    if (!current) throw createError('User not found', 404);

    let targetId: string | null = null;
    if (current.role === 'RENTER' && current.linkedLandlordId) {
      targetId = current.linkedLandlordId;
    } else if (current.role === 'LANDLORD') {
      const linkedRenter = await prisma.user.findFirst({
        where: { linkedLandlordId: userId },
        select: { id: true },
      });
      targetId = linkedRenter?.id ?? null;
    }

    if (!targetId) {
      throw createError('No linked account to switch to', 400);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });
    if (!target) throw createError('Linked account not found', 404);

    const token = getJwtToken(target.id);
    return { user: target, token };
  },

  /** Создание аккаунта арендодателя и привязка к текущему арендатору (тот же человек). */
  async linkLandlord(
    renterId: string,
    data: { password: string; landlordPlan: { planType: number; amount: number; promoCode?: string } }
  ) {
    const renter = await prisma.user.findUnique({
      where: { id: renterId },
      select: { id: true, email: true, name: true, role: true, linkedLandlordId: true },
    });
    if (!renter) throw createError('User not found', 404);
    if (renter.role !== 'RENTER') throw createError('Only renters can link a landlord account', 403);
    if (renter.linkedLandlordId) throw createError('Landlord account already linked', 400);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const linkedEmail = `linked-${renterId}@internal.arendrate`;
    const landlordUser = await prisma.user.create({
      data: {
        email: linkedEmail,
        passwordHash,
        name: renter.name,
        role: 'LANDLORD',
      },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });

    let finalAmount = data.landlordPlan.amount;
    let promoCodeId: string | null = null;
    let marketerId: string | null = null;
    if (data.landlordPlan.promoCode) {
      const applied = await applyPromoCode(data.landlordPlan.promoCode, data.landlordPlan.amount);
      if (applied) {
        finalAmount = applied.finalAmount;
        promoCodeId = applied.promoCodeId;
        marketerId = applied.marketerId;
      }
    }
    const subscription = await prisma.landlordSubscription.create({
      data: {
        landlordId: landlordUser.id,
        responsesRemaining: data.landlordPlan.planType,
      },
    });
    await prisma.landlordSubscriptionPurchase.create({
      data: {
        subscriptionId: subscription.id,
        planType: data.landlordPlan.planType,
        amount: finalAmount,
        responsesGranted: data.landlordPlan.planType,
        promoCodeId: promoCodeId ?? undefined,
        marketerId: marketerId ?? undefined,
      },
    });
    if (promoCodeId) await incrementPromoUsage(promoCodeId);

    await prisma.user.update({
      where: { id: renterId },
      data: { linkedLandlordId: landlordUser.id },
    });

    const token = getJwtToken(landlordUser.id);
    return { user: { ...landlordUser, email: renter.email }, token };
  },

  /** Создание аккаунта арендатора и привязка к текущему арендодателю (тот же человек). */
  async createLinkedRenter(landlordId: string, landlordName: string) {
    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
      select: { id: true, name: true, role: true },
    });
    if (!landlord) throw createError('User not found', 404);
    if (landlord.role !== 'LANDLORD') throw createError('Only landlords can create a linked renter account', 403);

    const existing = await prisma.user.findFirst({
      where: { linkedLandlordId: landlordId },
      select: { id: true },
    });
    if (existing) throw createError('Linked renter account already exists', 400);

    const linkedEmail = `linked-${landlordId}@internal.arendrate`;
    const renterUser = await prisma.user.create({
      data: {
        email: linkedEmail,
        name: landlordName,
        role: 'RENTER',
        linkedLandlordId: landlordId,
      },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });

    const token = getJwtToken(renterUser.id);
    return { user: { ...renterUser, email: null }, token };
  },
};

