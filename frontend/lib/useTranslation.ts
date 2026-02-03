'use client'

import { useCallback, useEffect } from 'react'
import { useLocaleStore } from '@/store/localeStore'
import { getTranslation } from '@/lib/translations'
import type { Locale } from '@/lib/translations'

export function useTranslation() {
  const { locale, setLocale, hydrate } = useLocaleStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'en' ? 'en' : 'ru'
    }
  }, [locale])

  const t = useCallback(
    (key: string) => getTranslation(locale as Locale, key),
    [locale]
  )

  return { t, locale: locale as Locale, setLocale }
}
