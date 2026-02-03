'use client'

import { useLocaleStore } from '@/store/localeStore'
import type { Locale } from '@/store/localeStore'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()

  return (
    <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`min-w-[2.5rem] px-2 py-1.5 text-sm font-medium transition-colors ${
            locale === value
              ? 'bg-primary-600 text-white dark:bg-primary-500'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          aria-label={value === 'ru' ? 'Русский' : 'English'}
          title={value === 'ru' ? 'Русский' : 'English'}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
