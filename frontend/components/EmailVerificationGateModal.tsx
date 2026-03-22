'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/useTranslation'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'

interface EmailVerificationGateModalProps {
  open: boolean
  onClose: () => void
}

export function EmailVerificationGateModal({ open, onClose }: EmailVerificationGateModalProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    if (open) setFeedback(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const hasEmail = !!user?.email

  const handleResend = async () => {
    if (!hasEmail) return
    setFeedback(null)
    setSending(true)
    try {
      await authApi.sendEmailVerification()
      setFeedback('ok')
    } catch {
      setFeedback('err')
    } finally {
      setSending(false)
    }
  }

  const goProfile = () => {
    onClose()
    router.push('/profile#profile-email-section')
  }

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center overflow-x-hidden p-4 sm:p-6 bg-black/55 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verify-gate-title"
      onClick={onClose}
    >
      <div
        className="relative min-w-0 w-full max-w-lg overflow-hidden rounded-2xl border border-sky-200/90 dark:border-sky-800/45 bg-gradient-to-br from-sky-50/98 via-white to-indigo-50/95 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/40 shadow-2xl shadow-sky-900/15 dark:shadow-black/40 ring-1 ring-black/[0.05] dark:ring-white/[0.07]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/25 to-indigo-400/15 dark:from-sky-500/10 dark:to-indigo-500/5"
          aria-hidden
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('common.close')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative max-h-[min(90vh,90dvh)] overflow-x-hidden overflow-y-auto overscroll-contain p-6 sm:p-8 pt-12 sm:pt-10">
          <div className="flex min-w-0 flex-col sm:flex-row gap-5 sm:items-start">
            <div
              className="mx-auto sm:mx-0 shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-600/30"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left space-y-3">
              <div>
                <h2
                  id="email-verify-gate-title"
                  className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight"
                >
                  {t('addReview.emailVerifyModalTitle')}
                </h2>
                <p className="mt-1.5 text-sm font-semibold text-sky-700 dark:text-sky-300">
                  {t('addReview.emailVerifyModalSubtitle')}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                {hasEmail ? t('addReview.emailVerifyModalBody') : t('addReview.emailVerifyModalBodyNoEmail')}
              </p>

              {feedback === 'ok' && (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 border border-emerald-200/80 dark:border-emerald-800/50">
                  {t('profile.verificationEmailSent')}
                </p>
              )}
              {feedback === 'err' && (
                <p className="text-sm font-medium text-red-700 dark:text-red-300 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 border border-red-200 dark:border-red-900/50">
                  {t('profile.verificationEmailError')}
                </p>
              )}
            </div>
          </div>

          <div className="relative mt-8 flex min-w-0 w-full flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-w-0 w-full shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors sm:w-auto"
            >
              {t('common.close')}
            </button>
            <button
              type="button"
              onClick={goProfile}
              className="min-w-0 w-full shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-sky-800 dark:text-sky-100 bg-white dark:bg-gray-800 border-2 border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-gray-700/80 transition-colors shadow-sm sm:w-auto"
            >
              {t('addReview.emailVerifyOpenProfile')}
            </button>
            {hasEmail ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className="min-w-0 w-full shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-sky-600/25 transition-all sm:w-auto"
              >
                {sending ? t('profile.saving') : t('profile.sendVerificationEmail')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
