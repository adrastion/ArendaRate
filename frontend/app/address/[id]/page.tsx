'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { addressApi, moderationApi } from '@/lib/api'
import { getScoreViewClasses } from '@/lib/ratingColors'
import { Address, Apartment, Review } from '@/types'
import { RATING_CRITERIA_LABELS, RatingCriterion } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { AddReviewButton } from '@/components/AddReviewButton'
import { AddReviewModal } from '@/components/AddReviewModal'
import { useAuthStore } from '@/store/authStore'

type ApartmentWithReviews = Apartment & { reviews: Review[] }

export default function AddressPage() {
  const params = useParams()
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [address, setAddress] = useState<Address | null>(null)
  const [apartments, setApartments] = useState<ApartmentWithReviews[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [showAddReview, setShowAddReview] = useState(false)

  useEffect(() => {
    checkAuth()
    loadAddress()
  }, [params.id, checkAuth])

  const loadAddress = async () => {
    try {
      const response = await addressApi.getByIdWithReviews(params.id as string)
      setAddress(response.address)
      setApartments(response.apartments)
    } catch (error) {
      console.error('Error loading address:', error)
    } finally {
      setIsLoading(false)
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

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.')) {
      return
    }
    setDeletingReviewId(reviewId)
    try {
      await moderationApi.deleteReview(reviewId)
      await loadAddress()
      alert('Отзыв успешно удален')
    } catch (error: any) {
      console.error('Error deleting review:', error)
      alert(`Ошибка при удалении отзыва: ${error.response?.data?.message || error.message || 'Попробуйте еще раз'}`)
    } finally {
      setDeletingReviewId(null)
    }
  }

  const isModerator = user && (user.role === 'MODERATOR' || user.role === 'ADMIN')
  const totalReviews = apartments.reduce((sum, apt) => sum + apt.reviews.length, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Адрес не найден</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Вернуться на карту
          </button>
        </div>
      </div>
    )
  }

  const initialAddressForModal = {
    id: address.id,
    country: address.country,
    city: address.city,
    street: address.street,
    building: address.building,
    latitude: address.latitude ?? undefined,
    longitude: address.longitude ?? undefined,
    fromDatabase: true,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {address.city}, {address.street}, {address.building}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalReviews > 0 ? (
                  <>
                    {totalReviews}{' '}
                    {totalReviews === 1 ? 'отзыв' : totalReviews < 5 ? 'отзыва' : 'отзывов'}
                    {' · '}
                    {apartments.length}{' '}
                    {apartments.length === 1 ? 'квартира' : apartments.length < 5 ? 'квартиры' : 'квартир'}
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">Нет отзывов</span>
                )}
              </p>
            </div>
            {user && (
              <AddReviewButton
                onClick={() => setShowAddReview(true)}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {totalReviews === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Пока нет отзывов по этому дому</p>
              {user && (
                <AddReviewButton onClick={() => setShowAddReview(true)} />
              )}
            </div>
          ) : (
            apartments.map((apartment) =>
              apartment.reviews.length > 0 ? (
                <div key={apartment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Квартира {apartment.number}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {apartment.reviews.map((review) => (
                      <div key={review.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {review.user?.avatar ? (
                              <img
                                src={review.user.avatar}
                                alt={review.user.name}
                                className="w-10 h-10 rounded-full"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                {(review.user?.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{review.user?.name ?? 'Пользователь'}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {format(new Date(review.periodFrom), 'dd.MM.yyyy')} —{' '}
                                {format(new Date(review.periodTo), 'dd.MM.yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                  {review.averageRating.toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">из 5</div>
                              </div>
                              {isModerator && (
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={deletingReviewId === review.id}
                                  className="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Удалить отзыв"
                                >
                                  {deletingReviewId === review.id ? 'Удаление...' : '✕'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="mb-4 text-gray-900 dark:text-gray-100">{review.comment}</p>

                        {review.ratings?.length > 0 && (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleReviewExpansion(review.id)}
                              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-2"
                            >
                              {expandedReviews.has(review.id)
                                ? 'Скрыть детальные оценки'
                                : 'Показать детальные оценки'}
                            </button>
                            {expandedReviews.has(review.id) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                {review.ratings.map((rating) => (
                                  <div
                                    key={rating.id}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-gray-600 dark:text-gray-300">
                                      {RATING_CRITERIA_LABELS[rating.criterion as RatingCriterion]}
                                    </span>
                                    <div className="flex space-x-1">
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <span
                                          key={score}
                                          className={getScoreViewClasses(score, score <= rating.score)}
                                          title={score === 1 ? 'Плохо' : score === 5 ? 'Отлично' : undefined}
                                        >
                                          {score}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {review.photos?.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                            {review.photos.map((photo) => (
                              <img
                                key={photo.id}
                                src={`${process.env.NEXT_PUBLIC_API_URL}${photo.url}`}
                                alt="Фото квартиры"
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                          {format(new Date(review.createdAt), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      </div>

      {showAddReview && (
        <AddReviewModal
          onClose={() => setShowAddReview(false)}
          onSuccess={() => {
            loadAddress()
            setShowAddReview(false)
          }}
          initialAddress={initialAddressForModal}
        />
      )}
    </div>
  )
}
