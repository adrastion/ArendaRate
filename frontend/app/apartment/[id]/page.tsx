'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apartmentApi, moderationApi } from '@/lib/api'
import { Apartment, Review } from '@/types'
import { RATING_CRITERIA_LABELS, RatingCriterion } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'

export default function ApartmentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [apartment, setApartment] = useState<
    (Apartment & { reviews: Review[] }) | null
  >(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadApartment()
  }, [params.id, checkAuth])

  const loadApartment = async () => {
    try {
      const response = await apartmentApi.getById(params.id as string)
      setApartment(response.apartment)
    } catch (error) {
      console.error('Error loading apartment:', error)
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
      // Обновляем список отзывов, удаляя удаленный отзыв
      if (apartment) {
        setApartment({
          ...apartment,
          reviews: apartment.reviews.filter((r) => r.id !== reviewId),
        })
      }
      alert('Отзыв успешно удален')
    } catch (error: any) {
      console.error('Error deleting review:', error)
      alert(`Ошибка при удалении отзыва: ${error.response?.data?.message || error.message || 'Попробуйте еще раз'}`)
    } finally {
      setDeletingReviewId(null)
    }
  }

  const isModerator = user && (user.role === 'MODERATOR' || user.role === 'ADMIN')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Квартира не найдена</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Вернуться на карту
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Квартира {apartment.number}
          </h1>
          <p className="text-gray-600">
            {apartment.address.city}, {apartment.address.street},{' '}
            {apartment.address.building}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {apartment.reviews.length > 0 ? (
              <>
                {apartment.reviews.length}{' '}
                {apartment.reviews.length === 1 ? 'отзыв' : apartment.reviews.length < 5 ? 'отзыва' : 'отзывов'}
              </>
            ) : (
              <span className="text-gray-400">Нет отзывов</span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {apartment.reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 mb-2">Пока нет отзывов об этой квартире</p>
              <p className="text-sm text-gray-400">Нет отзывов</p>
            </div>
          ) : (
            apartment.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {review.user.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-10 h-10 rounded-full"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                        {review.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{review.user.name}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(review.periodFrom), 'dd.MM.yyyy')} -{' '}
                        {format(new Date(review.periodTo), 'dd.MM.yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="text-2xl font-bold text-primary-600">
                          {review.averageRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">из 5</div>
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

                <p className="mb-4">{review.comment}</p>

                {review.ratings.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleReviewExpansion(review.id)}
                      className="text-sm text-primary-600 hover:text-primary-700 mb-2"
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
                            <span className="text-gray-600">
                              {RATING_CRITERIA_LABELS[rating.criterion]}
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <span
                                  key={score}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                                    score <= rating.score
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-200 text-gray-500'
                                  }`}
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

                    {review.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {review.photos.map((photo) => (
                          <img
                            key={photo.id}
                            src={`${process.env.NEXT_PUBLIC_API_URL}${photo.url}`}
                            alt="Фото квартиры"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                            loading="lazy"
                            decoding="async"
                            onClick={() => {
                              // TODO: Открыть полноэкранное просмотр
                            }}
                          />
                        ))}
                      </div>
                    )}

                <div className="text-xs text-gray-400 mt-4">
                  {format(new Date(review.createdAt), 'dd.MM.yyyy')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

