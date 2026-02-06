'use client'

import { useState } from 'react'
import { reviewApi } from '@/lib/api'
import { useTranslation } from '@/lib/useTranslation'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'

interface ReviewActionsProps {
  reviewId: string
  apartmentId: string
  canReply: boolean
  landlordResponse?: { text: string } | null
  onReplySuccess?: () => void
}

export function ReviewActions({
  reviewId,
  apartmentId,
  canReply,
  landlordResponse,
  onReplySuccess,
}: ReviewActionsProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [replyText, setReplyText] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  if (!user) return null

  const handleReply = async () => {
    if (!replyText.trim()) return
    setLoading(true)
    try {
      await reviewApi.reply(reviewId, replyText.trim())
      setShowReplyForm(false)
      setReplyText('')
      onReplySuccess?.()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async () => {
    const reason = window.prompt(t('review.reportReason'))
    if (reason === null) return
    try {
      await reviewApi.report(reviewId, reason || undefined)
      setReportSent(true)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
      {landlordResponse ? (
        <p className="text-gray-600 dark:text-gray-400 italic">Ответ арендодателя: {landlordResponse.text}</p>
      ) : canReply ? (
        <>
          {!showReplyForm ? (
            <button
              type="button"
              onClick={() => setShowReplyForm(true)}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('review.reply')}
            </button>
          ) : (
            <div className="w-full mt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('landlord.replyPlaceholder')}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={loading || !replyText.trim()}
                  className="px-2 py-1 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
                >
                  {loading ? '...' : t('common.send')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplyForm(false); setReplyText('') }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
      <button
        type="button"
        onClick={() => reviewApi.vote(reviewId, 1).then(() => onReplySuccess?.())}
        className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      >
        {t('review.like')}
      </button>
      <button
        type="button"
        onClick={() => reviewApi.vote(reviewId, -1).then(() => onReplySuccess?.())}
        className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      >
        {t('review.dislike')}
      </button>
      <button
        type="button"
        onClick={handleReport}
        disabled={reportSent}
        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
      >
        {reportSent ? t('review.reportSent') : t('review.report')}
      </button>
    </div>
  )
}
