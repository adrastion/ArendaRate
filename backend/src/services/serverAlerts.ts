/**
 * Проверка нагрузки сервера и отправка алертов в Telegram при превышении порогов.
 * Запускается по крону каждые 5 минут. Cooldown — не слать повторный алерт чаще чем раз в N минут.
 */

import { getServerStatsRaw } from './serverStats';
import { sendTelegramMessage, getNotifyChatIds } from './telegram';

function parseNum(env: string | undefined, defaultVal: number): number {
  if (env === undefined || env === '') return defaultVal;
  const n = parseFloat(env);
  return Number.isFinite(n) ? n : defaultVal;
}

let lastAlertSentAt = 0;

export async function checkServerAlerts(): Promise<void> {
  const chatIds = getNotifyChatIds();
  if (chatIds.length === 0) return;

  const cpuThreshold = parseNum(process.env.ALERT_CPU_PERCENT, 90);
  const memThreshold = parseNum(process.env.ALERT_MEM_PERCENT, 90);
  const loadThreshold = parseNum(process.env.ALERT_LOAD_MAX, 2);
  const diskThreshold = parseNum(process.env.ALERT_DISK_PERCENT, 90);
  const cooldownMs = (parseNum(process.env.ALERT_COOLDOWN_MINUTES, 60) * 60) * 1000;

  const stats = await getServerStatsRaw();
  if (!stats) return;

  const exceeded: string[] = [];
  if (stats.cpuPercent >= cpuThreshold) exceeded.push(`CPU ${stats.cpuPercent.toFixed(1)}% (порог ${cpuThreshold}%)`);
  if (stats.memPercent >= memThreshold) exceeded.push(`ОЗУ ${stats.memPercent.toFixed(1)}% (порог ${memThreshold}%)`);
  if (stats.loadAvg >= loadThreshold) exceeded.push(`Load ${stats.loadAvg.toFixed(2)} (порог ${loadThreshold})`);
  if (stats.diskPercent >= diskThreshold) exceeded.push(`Диск ${stats.diskPercent.toFixed(1)}% (порог ${diskThreshold}%)`);

  if (exceeded.length === 0) return;
  if (Date.now() - lastAlertSentAt < cooldownMs) return;

  const text = [
    '⚠️ <b>Высокая нагрузка на сервер</b>',
    '',
    exceeded.join('\n'),
    '',
    'Проверьте сервер: /server в боте или консоль.',
  ].join('\n');

  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(chatId, text);
    } catch {
      // ignore
    }
  }
  lastAlertSentAt = Date.now();
}
