'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'
import { useAuthStore } from '@/store/authStore'
import { needsEmailVerificationForReview } from '@/lib/reviewEligibility'
import { EmailVerificationGateModal } from '@/components/EmailVerificationGateModal'

interface AddReviewButtonProps {
  onClick: () => void
}

export function AddReviewButton({ onClick }: AddReviewButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [showEmailGate, setShowEmailGate] = useState(false)

  const handleClick = () => {
    if (needsEmailVerificationForReview(user)) {
      setShowEmailGate(true)
      return
    }
    onClick()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-3 md:px-6 md:py-3 rounded-lg shadow-lg font-medium flex items-center justify-center space-x-0 md:space-x-2 transition-colors w-12 h-12 md:w-auto md:h-auto"
        aria-label={t('common.addReview')}
      >
        <svg
          className="w-6 h-6 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="hidden md:inline">{t('common.addReview')}</span>
      </button>
      <EmailVerificationGateModal open={showEmailGate} onClose={() => setShowEmailGate(false)} />
    </>
  )
}

