/**
 * Склонение для русского языка: одна форма для 1, 21, 31…; вторая для 2–4, 22–24…; третья для 0, 5–20, 25–30…
 */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function pluralApartments(n: number): string {
  return pluralRu(n, 'квартира', 'квартиры', 'квартир')
}

export function pluralReviews(n: number): string {
  return pluralRu(n, 'отзыв', 'отзыва', 'отзывов')
}
