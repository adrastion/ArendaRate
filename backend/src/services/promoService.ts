import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

export interface ApplyPromoResult {
  promoCodeId: string;
  marketerId: string | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Проверяет промокод и возвращает итоговую сумму и данные для записи покупки.
 * Код ищется без учёта регистра и пробелов.
 */
export async function applyPromoCode(
  code: string | undefined,
  originalAmount: number
): Promise<{ promoCodeId: string; marketerId: string | null; finalAmount: number } | null> {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  if (!trimmed) return null;

  const promo = await prisma.promoCode.findFirst({
    where: {
      code: { equals: trimmed, mode: 'insensitive' },
      isActive: true,
    },
    include: { marketer: { select: { id: true } } },
  });

  if (!promo) {
    throw createError('Промокод не найден или недействителен', 400);
  }

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    throw createError('Промокод исчерпан', 400);
  }

  let discountAmount = 0;
  if (promo.discountType === 'PERCENT') {
    discountAmount = Math.round((originalAmount * promo.discountValue) / 100);
  } else if (promo.discountType === 'FIXED') {
    discountAmount = Math.min(promo.discountValue, originalAmount);
  }
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    promoCodeId: promo.id,
    marketerId: promo.marketerId ?? null,
    finalAmount,
  };
}

/**
 * Увеличивает счётчик использований промокода (вызывать после создания покупки).
 */
export async function incrementPromoUsage(promoCodeId: string): Promise<void> {
  await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { usedCount: { increment: 1 } },
  });
}
