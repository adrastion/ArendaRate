/**
 * Сбор метрик нагрузки сервера (CPU, память, диск, load average) для отправки в Telegram.
 */

import si from 'systeminformation';

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} ГБ`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(2)} МБ`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d} д`);
  if (h > 0) parts.push(`${h} ч`);
  parts.push(`${m} мин`);
  return parts.join(' ');
}

/**
 * Собирает текущую нагрузку и возвращает текст для Telegram (HTML).
 */
export async function getServerStatsText(): Promise<string> {
  try {
    const [load, mem, cpu, fs, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.currentLoad(), // cpu already in load on Linux
      si.fsSize().then((mounts) => mounts.find((m) => m.mount === '/') || mounts[0]),
      si.time(),
    ]);

    const loadAvg = load.avgLoad !== undefined ? load.avgLoad.toFixed(2) : '—';
    const cpuUsage = load.currentLoad !== undefined ? `${load.currentLoad.toFixed(1)}%` : '—';
    // На Linux считаем занятость как (total - available), как в команде free — без учёта кэша/буферов
    const memUsedBytes = mem.total && mem.available != null ? mem.total - mem.available : mem.used ?? 0;
    const memUsed = mem.total ? formatBytes(memUsedBytes) : '—';
    const memTotal = mem.total ? formatBytes(mem.total) : '—';
    const memPercent = mem.total && mem.total > 0 ? ((memUsedBytes / mem.total) * 100).toFixed(1) : '—';
    const diskUsed = fs ? `${((fs.used / fs.size) * 100).toFixed(1)}%` : '—';
    const diskFree = fs ? formatBytes(fs.available) : '—';
    const diskTotal = fs ? formatBytes(fs.size) : '—';
    const uptime = time.uptime !== undefined ? formatUptime(time.uptime) : '—';

    return [
      '🖥 <b>Нагрузка на сервер</b>',
      '',
      `📈 Load average: <b>${loadAvg}</b>`,
      `⚙️ CPU: <b>${cpuUsage}</b>`,
      `💾 Память: <b>${memPercent}%</b> (${memUsed} / ${memTotal})`,
      `💿 Диск: <b>${diskUsed}</b> занято, свободно ${diskFree} из ${diskTotal}`,
      `⏱ Uptime: <b>${uptime}</b>`,
    ].join('\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `🖥 <b>Нагрузка на сервер</b>\n\n⚠️ Ошибка сбора: ${msg}`;
  }
}
