'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewApi } from '@/lib/api'
import { Review } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { EditReviewModal } from '@/components/EditReviewModal'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  useEffect(() => {
    checkAuth().then(() => {
      if (!user) {
        router.push('/login')
        return
      }
      loadReviews()
    })
  }, [user])

  const loadReviews = async () => {
    try {
      const response = await reviewApi.getMyReviews()
      setReviews(response.reviews)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'На модерации'
      case 'APPROVED':
        return 'Одобрен'
      case 'REJECTED':
        return 'Отклонен'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Мой профиль</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold">Мои отзывы ({reviews.length})</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            У вас пока нет отзывов
            <div className="mt-4">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Добавить отзыв
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-2">
                      <Link
                        href={`/apartment/${review.apartmentId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {review.apartment.address.city},{' '}
                        {review.apartment.address.street},{' '}
                        {review.apartment.address.building}, Кв.{' '}
                        {review.apartment.number}
                      </Link>
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
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(
                        review.status
                      )}`}
                    >
                      {getStatusLabel(review.status)}
                    </span>
                  </div>
                </div>

                <p className="mb-4">{review.comment}</p>

                {review.status === 'REJECTED' && review.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="text-sm text-red-700">
                      <strong>Причина отклонения:</strong> {review.rejectionReason}
                    </p>
                  </div>
                )}

                {review.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
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

                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-400">
                    Создан:{' '}
                    {format(new Date(review.createdAt), 'dd.MM.yyyy HH:mm')}
                  </div>
                  {review.status !== 'PENDING' && (
                    <button
                      onClick={() => setEditingReview(review)}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      Редактировать
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editingReview && (
          <EditReviewModal
            review={editingReview}
            onClose={() => setEditingReview(null)}
            onSuccess={() => {
              loadReviews()
              setEditingReview(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

