import express, { Request, Response } from 'express';
import { ReviewStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendTelegramMessage } from '../services/telegram';

const router = express.Router();

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token && token !== 'your-telegram-bot-token' ? token : null;
}

function getAllowedUserIds(): Set<number> {
  const raw = process.env.TELEGRAM_ALLOWED_USER_IDS || '';
  const ids = raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  return new Set(ids);
}

/** Ожидание причины отклонения: telegramUserId -> reviewId */
const pendingRejects = new Map<number, string>();

async function getBotModeratorId(): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'MODERATOR'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function answerCallbackQuery(callbackQueryId: string, text?: string, alert = false): Promise<void> {
  const token = getBotToken();
  if (!token) return;
  await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || undefined,
      show_alert: alert,
    }),
  });
}

async function editMessageText(chatId: number, messageId: number, text: string): Promise<void> {
  const token = getBotToken();
  if (!token) return;
  await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

router.post('/', async (req: Request, res: Response) => {
  res.status(200).send(); // всегда отвечаем 200 Telegram

  const token = getBotToken();
  const allowed = getAllowedUserIds();
  if (!token || allowed.size === 0) return;

  const update = req.body as {
    message?: {
      from?: { id: number; username?: string };
      chat?: { id: number };
      text?: string;
      message_id?: number;
    };
    callback_query?: {
      id: string;
      from: { id: number };
      message?: { chat: { id: number }; message_id: number };
      data?: string;
    };
  };

  const processUpdate = async () => {
    // Обычное сообщение: команда /users или /stats, либо причина отклонения
    if (update.message) {
      const fromId = update.message.from?.id;
      const chatId = update.message.chat?.id;
      const text = (update.message.text || '').trim();
      if (fromId === undefined || chatId === undefined) return;
      if (!allowed.has(fromId)) return;

      // Проверка ожидания причины отклонения
      const pendingReviewId = pendingRejects.get(fromId);
      if (pendingReviewId && text) {
        pendingRejects.delete(fromId);
        const moderatorId = await getBotModeratorId();
        if (moderatorId) {
          await prisma.review.update({
            where: { id: pendingReviewId },
            data: {
              status: ReviewStatus.REJECTED,
              rejectionReason: text.slice(0, 500),
            },
          });
          await prisma.moderationLog.create({
            data: {
              reviewId: pendingReviewId,
              moderatorId,
              action: 'REJECTED',
              reason: text.slice(0, 500),
            },
          });
        }
        await sendTelegramMessage(chatId.toString(), '❌ Отзыв отклонён.');
        return;
      }

      if (text === '/users' || text === '/stats' || text === '/start') {
        const [usersCount, pendingCount, onMapCount] = await Promise.all([
          prisma.user.count(),
          prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
          prisma.review.count({ where: { status: { in: [ReviewStatus.APPROVED, ReviewStatus.PENDING] } } }),
        ]);
        const reply = [
          '📊 <b>Статистика</b>',
          '',
          `👥 Зарегистрировано пользователей: <b>${usersCount}</b>`,
          `📝 Отзывов на карте: <b>${onMapCount}</b>`,
          `⏳ Отзывов на модерации: <b>${pendingCount}</b>`,
          '',
          'Команды: /users или /stats — эта сводка.',
        ].join('\n');
        await sendTelegramMessage(chatId.toString(), reply);
      }
      return;
    }

    // Нажатие кнопки (одобрить / отклонить)
    if (update.callback_query) {
      const { id: queryId, from, message, data } = update.callback_query;
      if (!allowed.has(from.id) || !data) return;

      const chatId = message?.chat?.id;
      const messageId = message?.message_id;
      if (chatId === undefined || messageId === undefined) return;

      if (data.startsWith('approve:')) {
        const reviewId = data.slice('approve:'.length);
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.status !== ReviewStatus.PENDING) {
          await answerCallbackQuery(queryId, 'Отзыв уже обработан.', true);
          return;
        }
        const moderatorId = await getBotModeratorId();
        if (moderatorId) {
          await prisma.review.update({
            where: { id: reviewId },
            data: { status: ReviewStatus.APPROVED, publishedAt: new Date() },
          });
          await prisma.moderationLog.create({
            data: { reviewId, moderatorId, action: 'APPROVED' },
          });
        }
        await answerCallbackQuery(queryId, 'Одобрено.');
        await editMessageText(chatId, messageId, '✅ Отзыв одобрен.');
        return;
      }

      if (data.startsWith('reject:')) {
        const reviewId = data.slice('reject:'.length);
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.status !== ReviewStatus.PENDING) {
          await answerCallbackQuery(queryId, 'Отзыв уже обработан.', true);
          return;
        }
        pendingRejects.set(from.id, reviewId);
        await answerCallbackQuery(queryId, 'Отправьте причину отклонения следующим сообщением.', true);
        await editMessageText(chatId, messageId, '⏳ Ожидаю причину отклонения. Отправьте текстом в чат.');
      }
    }
  };

  processUpdate().catch((err) => {
    console.error('Telegram webhook error:', err);
  });
});

export default router;
