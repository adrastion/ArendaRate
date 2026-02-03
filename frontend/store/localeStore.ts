import { create } from 'zustand'

export type Locale = 'ru' | 'en'

const STORAGE_KEY = 'arendarate-locale'

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ru'
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  return stored === 'en' || stored === 'ru' ? stored : 'ru'
}

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  hydrate: () => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: typeof window !== 'undefined' ? getStoredLocale() : 'ru',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, locale)
    set({ locale })
  },
  hydrate: () => set({ locale: getStoredLocale() }),
}))
