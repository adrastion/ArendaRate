/**
 * Цвета оценок 1–5: градиент от красного (плохо) к зелёному (хорошо).
 * Используется при создании/редактировании отзыва и при просмотре отзывов.
 */

/** Классы для кнопки/ячейки оценки при выборе (форма создания/редактирования) */
export function getScoreButtonClasses(score: number, selected: boolean): string {
  const base = 'w-12 h-12 rounded-lg border-2 flex items-center justify-center font-medium'
  const filled: Record<number, string> = {
    1: 'bg-red-500 border-red-500 text-white',
    2: 'bg-orange-500 border-orange-500 text-white',
    3: 'bg-amber-500 border-amber-500 text-gray-900',
    4: 'bg-lime-500 border-lime-500 text-gray-900',
    5: 'bg-green-500 border-green-500 text-white',
  }
  const unfilled: Record<number, string> = {
    1: 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50',
    2: 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50',
    3: 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    4: 'border-lime-400 bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 hover:bg-lime-100 dark:hover:bg-lime-900/50',
    5: 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50',
  }
  const s = Math.max(1, Math.min(5, score))
  return `${base} ${selected ? filled[s] : unfilled[s]}`
}

/** Классы для ячейки оценки при просмотре отзыва (заполнена до текущего балла или нет) */
export function getScoreViewClasses(score: number, filled: boolean): string {
  const base = 'w-6 h-6 rounded flex items-center justify-center text-xs font-medium'
  if (!filled) {
    return `${base} bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400`
  }
  const filledColors: Record<number, string> = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-500 text-white',
    3: 'bg-amber-500 text-gray-900',
    4: 'bg-lime-500 text-gray-900',
    5: 'bg-green-500 text-white',
  }
  const s = Math.max(1, Math.min(5, score))
  return `${base} ${filledColors[s]}`
}
