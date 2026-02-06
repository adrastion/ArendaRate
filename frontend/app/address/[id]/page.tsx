'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { addressApi, moderationApi, getUploadUrl, getAvatarUrl } from '@/lib/api'
import { getScoreViewClasses } from '@/lib/ratingColors'
import { Address, Apartment, Review } from '@/types'
import { RatingCriterion, UserRole } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { AddReviewButton } from '@/components/AddReviewButton'
import { AddReviewModal } from '@/components/AddReviewModal'
import { ReviewActions } from '@/components/ReviewActions'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'
import { pluralReviewsLocale, pluralApartmentsLocale } from '@/lib/pluralize'

type ApartmentWithReviews = Apartment & { reviews: Review[] }

export default function AddressPage() {
  const { t, locale } = useTranslation()
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
    if (!confirm(t('address.deleteConfirm'))) {
      return
    }
    setDeletingReviewId(reviewId)
    try {
      await moderationApi.deleteReview(reviewId)
      await loadAddress()
      alert(t('address.deleteSuccess'))
    } catch (error: any) {
      console.error('Error deleting review:', error)
      alert(`${t('address.deleteError')}: ${error.response?.data?.message || error.message || ''}`)
    } finally {
      setDeletingReviewId(null)
    }
  }

  const isModerator = user && (user.role === 'MODERATOR' || user.role === 'ADMIN')
  const isLandlord = user?.role === UserRole.LANDLORD
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
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('address.addressNotFound')}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('address.backToMap')}
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
                    {totalReviews} {pluralReviewsLocale(totalReviews, locale)}
                    {' · '}
                    {apartments.length} {pluralApartmentsLocale(apartments.length, locale)}
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">{t('address.noReviews')}</span>
                )}
              </p>
            </div>
            {user && user.role !== UserRole.LANDLORD && (
              <AddReviewButton
                onClick={() => setShowAddReview(true)}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {totalReviews === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('address.noReviewsYet')}</p>
              {user && user.role !== UserRole.LANDLORD && (
                <AddReviewButton onClick={() => setShowAddReview(true)} />
              )}
            </div>
          ) : (
            apartments.map((apartment) =>
              apartment.reviews.length > 0 ? (
                <div key={apartment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {t('address.apartment')} {apartment.number}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {apartment.reviews.map((review) => (
                      <div key={review.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {review.user?.avatar ? (
                              <img
                                src={getAvatarUrl(review.user?.avatar) ?? review.user?.avatar ?? ''}
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
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{review.user?.name ?? t('address.user')}</div>
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
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('ratings.of5')}</div>
                              </div>
                              {isModerator && (
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={deletingReviewId === review.id}
                                  className="ml-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title={t('address.deleteReview')}
                                >
                                  {deletingReviewId === review.id ? t('address.deleting') : '✕'}
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
                                    <div className="flex space-x-1">
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <span
                                          key={score}
                                          className={getScoreViewClasses(score, score <= rating.score)}
                                          title={score === 1 ? t('ratings.bad') : score === 5 ? t('ratings.good') : undefined}
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
                              <a
                                key={photo.id}
                                href={getUploadUrl(photo.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getUploadUrl(photo.url)}
                                  alt={t('address.photoAlt')}
                                  className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {user && (
                          <ReviewActions
                            reviewId={review.id}
                            apartmentId={apartment.id}
                            canReply={!!(isLandlord && user?.landlordApartments?.some((la: { apartmentId: string }) => la.apartmentId === apartment.id))}
                            landlordResponse={(review as any).landlordResponse}
                            onReplySuccess={loadAddress}
                          />
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
