/**
 * Ежедневная сводка в Telegram: новые пользователи, отзывы, одобрено/отклонено за последние 24 часа.
 * Запускается по расписанию в 19:00 серверного времени.
 */

import { prisma } from '../lib/prisma';
import { sendTelegramMessage, getNotifyChatIds } from './telegram';
import { getServerStatsText } from './serverStats';

export async function sendDailyDigest(): Promise<void> {
  const chatIds = getNotifyChatIds();
  if (chatIds.length === 0) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [newUsers, newReviews, approvedCount, rejectedCount, serverBlock] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.review.count({ where: { createdAt: { gte: since } } }),
    prisma.moderationLog.count({ where: { action: 'APPROVED', createdAt: { gte: since } } }),
    prisma.moderationLog.count({ where: { action: 'REJECTED', createdAt: { gte: since } } }),
    getServerStatsText(),
  ]);

  const text = [
    '📊 <b>Итоги за 24 часа</b>',
    '',
    `👥 Новых пользователей: <b>${newUsers}</b>`,
    `📝 Новых отзывов: <b>${newReviews}</b>`,
    `✅ Одобрено: <b>${approvedCount}</b>`,
    `❌ Отклонено: <b>${rejectedCount}</b>`,
    '',
    '—',
    '',
    serverBlock,
  ].join('\n');

  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(chatId, text);
    } catch {
      // ignore per-chat errors
    }
  }
}
