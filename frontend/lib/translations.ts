export const translations = {
  ru: {
    header: {
      reviews: 'Отзывы о жилье',
      about: 'О нас',
      thankYou: 'Сказать спасибо',
      moderation: 'Модерация',
      profile: 'Профиль',
      login: 'Вход',
      register: 'Регистрация',
      logout: 'Выход',
      theme: 'Тема',
      language: 'Язык',
    },
    common: {
      loading: 'Загрузка...',
      back: 'Назад',
      cancel: 'Отмена',
      save: 'Сохранить',
      send: 'Отправить',
      delete: 'Удалить',
      edit: 'Редактировать',
      close: 'Закрыть',
      noReviews: 'Нет отзывов',
      addReview: 'Добавить отзыв',
    },
  },
  en: {
    header: {
      reviews: 'Housing reviews',
      about: 'About',
      thankYou: 'Say thanks',
      moderation: 'Moderation',
      profile: 'Profile',
      login: 'Log in',
      register: 'Sign up',
      logout: 'Log out',
      theme: 'Theme',
      language: 'Language',
    },
    common: {
      loading: 'Loading...',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      send: 'Send',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      noReviews: 'No reviews',
      addReview: 'Add review',
    },
  },
} as const

export type Locale = keyof typeof translations

/** Get nested value by key path like "header.logout" */
export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.')
  let value: unknown = translations[locale]
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return key
    }
  }
  return typeof value === 'string' ? value : key
}
