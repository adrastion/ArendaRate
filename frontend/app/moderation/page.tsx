'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { moderationApi } from '@/lib/api'
import { Review, RATING_CRITERIA_LABELS, RatingCriterion } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'

export default function ModerationPage() {
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
      alert('Ошибка при одобрении отзыва')
    }
  }

  const handleReject = async (reviewId: string) => {
    const reason = prompt('Укажите причину отклонения:')
    if (!reason) return

    try {
      await moderationApi.rejectReview(reviewId, reason)
      setReviews(reviews.filter((r) => r.id !== reviewId))
    } catch (error) {
      alert('Ошибка при отклонении отзыва')
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.')) {
      return
    }

    try {
      await moderationApi.deleteReview(reviewId)
      setReviews(reviews.filter((r) => r.id !== reviewId))
      alert('Отзыв успешно удален')
    } catch (error: any) {
      alert(`Ошибка при удалении отзыва: ${error.response?.data?.message || error.message}`)
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Модерация отзывов</h1>
          <div className="text-sm text-gray-600">
            Показаны отзывы на модерации
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Нет отзывов на модерацию
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-2">
                      {review.apartment.address.city},{' '}
                      {review.apartment.address.street},{' '}
                      {review.apartment.address.building}, Кв.{' '}
                      {review.apartment.number}
                    </div>
                    <div className="text-sm text-gray-500">
                      Пользователь: {review.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Период:{' '}
                      {format(new Date(review.periodFrom), 'dd.MM.yyyy')} -{' '}
                      {format(new Date(review.periodTo), 'dd.MM.yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {review.averageRating.toFixed(1)}
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
                            <span className="font-semibold">{rating.score}/5</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {review.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {review.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={`${process.env.NEXT_PUBLIC_API_URL}${photo.url}`}
                        alt="Фото"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Отклонить
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Удалить
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
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Назад
            </button>
            <span className="px-4 py-2">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

