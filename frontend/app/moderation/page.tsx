'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { moderationApi, getUploadUrl } from '@/lib/api'
import { Review } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'

export default function ModerationPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkAuth().then(() => {
      if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
        router.push('/')
        return
      }
      loadReviews()
    })
  }, [page, user])

  const loadReviews = async () => {
    try {
      const response = await moderationApi.getPendingReviews(page, 20)
      setReviews(response.reviews)
      setTotalPages(response.pagination.pages)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (reviewId: string) => {
    try {
      await moderationApi.approveReview(reviewId)
      setReviews(reviews.filter((r) => r.id !== reviewId))
    } catch (error) {
      alert(t('moderation.approveError'))
    }
  }

  const handleReject = async (reviewId: string) => {
    const reason = prompt(t('moderation.rejectPrompt'))
    if (!reason) return

    try {
      await moderationApi.rejectReview(reviewId, reason)
      setReviews(reviews.filter((r) => r.id !== reviewId))
    } catch (error) {
      alert(t('moderation.rejectError'))
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('moderation.deleteConfirm'))) {
      return
    }

    try {
      await moderationApi.deleteReview(reviewId)
      setReviews(reviews.filter((r) => r.id !== reviewId))
      alert(t('moderation.deleteSuccess'))
    } catch (error: any) {
      alert(`${t('moderation.deleteError')}: ${error.response?.data?.message || error.message}`)
    }
  }

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('moderation.title')}</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('moderation.subtitle')}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
            {t('moderation.noPending')}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                      {review.apartment.address.city},{' '}
                      {review.apartment.address.street},{' '}
                      {review.apartment.address.building}, {t('profile.aptAbbr')}{' '}
                      {review.apartment.number}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('moderation.user')}: {review.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('moderation.period')}:{' '}
                      {format(new Date(review.periodFrom), 'dd.MM.yyyy')} -{' '}
                      {format(new Date(review.periodTo), 'dd.MM.yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {review.averageRating.toFixed(1)}
                    </div>
                  </div>
                </div>

                <p className="mb-4 text-gray-900 dark:text-gray-100">{review.comment}</p>

                {review.ratings.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleReviewExpansion(review.id)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-2"
                    >
                      {expandedReviews.has(review.id)
                        ? t('address.hideRatings')
                        : t('address.showRatings')}
                    </button>
                    {expandedReviews.has(review.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {review.ratings.map((rating) => (
                          <div
                            key={rating.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-600 dark:text-gray-300">
                              {t(`ratings.${rating.criterion}`)}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{rating.score}/5</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(review.photos?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {review.photos?.map((photo) => (
                      <a
                        key={photo.id}
                        href={getUploadUrl(photo.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        title={t('profile.openPhoto')}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getUploadUrl(photo.url)}
                          alt={t('profile.photo')}
                          className="w-full h-24 object-cover rounded-lg"
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('moderation.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('moderation.reject')}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('moderation.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('moderation.back')}
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              {t('moderation.pageOf')} {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('moderation.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

