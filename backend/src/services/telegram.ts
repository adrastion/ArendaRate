/**
 * Сервис уведомлений в Telegram (новые отзывы на модерацию).
 * Токен и chat IDs задаются через переменные окружения.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token && token !== 'your-telegram-bot-token' ? token : null;
}

function getNotifyChatIds(): string[] {
  const raw = process.env.TELEGRAM_NOTIFY_CHAT_IDS || process.env.TELEGRAM_ALLOWED_USER_IDS || '';
  if (!raw.trim()) return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

export interface ReviewForNotification {
  id: string;
  comment: string;
  averageRating: number;
  createdAt: Date;
  apartment: {
    number: string;
    address: {
      id: string;
      city: string;
      street: string;
      building: string;
    };
  };
}

/**
 * Отправить сообщение в чат (без парсинга режима).
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> }
): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Уведомить модераторов о новом отзыве (с кнопками Одобрить / Отклонить).
 */
export async function sendReviewNotification(review: ReviewForNotification): Promise<void> {
  const token = getBotToken();
  const chatIds = getNotifyChatIds();
  if (!token || chatIds.length === 0) return;

  const addr = review.apartment.address;
  const addressLine = [addr.city, addr.street, addr.building].filter(Boolean).join(', ');
  const frontUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const link = frontUrl ? `${frontUrl}/address/${addr.id}` : '';

  const text = [
    '🆕 <b>Новый отзыв на модерацию</b>',
    '',
    `📍 ${addressLine}, кв. ${review.apartment.number}`,
    `⭐ ${review.averageRating.toFixed(1)}`,
    `💬 ${review.comment}`,
    link ? `\n🔗 <a href="${link}">Открыть на сайте</a>` : '',
  ].filter(Boolean).join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Одобрить', callback_data: `approve:${review.id}` },
        { text: '❌ Отклонить', callback_data: `reject:${review.id}` },
      ],
    ],
  };

  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(chatId, text, replyMarkup);
    } catch {
      // ignore per-chat errors
    }
  }
}
