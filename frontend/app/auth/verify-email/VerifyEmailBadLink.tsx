'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'

export function VerifyEmailBadLink() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900 px-4">
      <p className="text-center text-gray-700 dark:text-gray-300 max-w-md">
        {t('common.verifyEmailBadLink')}
      </p>
      <Link
        href="/profile"
        className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
      >
        {t('common.verifyEmailToProfile')}
      </Link>
    </div>
  )
}
