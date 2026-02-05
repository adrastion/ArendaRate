'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewApi, userApi, getUploadUrl, getAvatarUrl } from '@/lib/api'
import { Review } from '@/types'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { EditReviewModal } from '@/components/EditReviewModal'
import { useTranslation } from '@/lib/useTranslation'
import Link from 'next/link'

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, checkAuth, logout, setUser } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [emailDraft, setEmailDraft] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    let cancelled = false
    checkAuth().then(() => {
      if (cancelled) return
      const currentUser = useAuthStore.getState().user
      if (!currentUser) {
        router.push('/login')
        return
      }
      setEmailDraft(currentUser.email || '')
      loadReviews()
    })
    return () => { cancelled = true }
  }, [checkAuth])

  const saveEmail = async () => {
    setProfileError('')
    setProfileSuccess('')
    setEmailSaving(true)
    try {
      const res = await userApi.updateEmail(emailDraft)
      setUser(res.user)
      setProfileSuccess(t('profile.emailUpdated'))
    } catch (err: any) {
      setProfileError(err.response?.data?.message || t('profile.emailError'))
    } finally {
      setEmailSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setProfileError(t('profile.avatarInvalidType'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError(t('profile.avatarTooLarge'))
      return
    }
    setProfileError('')
    setProfileSuccess('')
    setAvatarUploading(true)
    try {
      const res = await userApi.updateAvatar(file)
      setUser(res.user)
      setProfileSuccess(t('profile.avatarUpdated'))
    } catch (err: any) {
      setProfileError(err.response?.data?.message || t('profile.avatarError'))
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const savePassword = async () => {
    setProfileError('')
    setProfileSuccess('')
    setPasswordSaving(true)
    try {
      await userApi.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setProfileSuccess(t('profile.passwordUpdated'))
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      setProfileError(err.response?.data?.message || t('profile.passwordError'))
    } finally {
      setPasswordSaving(false)
    }
  }

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
        return t('profile.statusPending')
      case 'APPROVED':
        return t('profile.statusApproved')
      case 'REJECTED':
        return t('profile.statusRejected')
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'
      case 'APPROVED':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('profile.myProfile')}</h1>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            {t('profile.logout')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar) ?? ''}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 sm:opacity-0 sm:hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                  className="sr-only"
                />
                <span className="text-white text-xs font-medium px-2 text-center">
                  {avatarUploading ? t('profile.saving') : t('profile.changeAvatar')}
                </span>
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 break-words">{user?.email || t('profile.emailNotSet')}</p>
            </div>
          </div>

          {(profileError || profileSuccess) && (
            <div className="mt-4">
              {profileError ? (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {profileError}
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                  {profileSuccess}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.emailLabel')}</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder={t('profile.emailPlaceholder')}
                  className="min-w-0 flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={saveEmail}
                  disabled={emailSaving}
                  className="shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {emailSaving ? t('profile.saving') : t('profile.save')}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">
                {t('profile.emailHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.passwordLabel')}</label>
              <div className="grid gap-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={savePassword}
                  disabled={passwordSaving || newPassword.length < 6}
                  className="w-fit px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {passwordSaving ? t('profile.saving') : t('profile.savePassword')}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 break-words">
                {t('profile.passwordHint')}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('profile.myReviews')} ({reviews.length})</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
            {t('profile.noReviews')}
            <div className="mt-4">
              <Link
                href="/map"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
              >
                {t('profile.addReviewLink')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                      <Link
                        href={`/apartment/${review.apartmentId}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {review.apartment.address.city},{' '}
                        {review.apartment.address.street},{' '}
                        {review.apartment.address.building}, {t('profile.aptAbbr')} {review.apartment.number}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('profile.period')}:{' '}
                      {format(new Date(review.periodFrom), 'dd.MM.yyyy')} -{' '}
                      {format(new Date(review.periodTo), 'dd.MM.yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
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

                <p className="mb-4 text-gray-900 dark:text-gray-100">{review.comment}</p>

                {review.status === 'REJECTED' && review.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>{t('profile.rejectionReason')}:</strong> {review.rejectionReason}
                    </p>
                  </div>
                )}

                {(review.photos?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-4 gap-2">
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

                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {t('profile.created')}:{' '}
                    {format(new Date(review.createdAt), 'dd.MM.yyyy HH:mm')}
                  </div>
                  {review.status !== 'PENDING' && (
                    <button
                      onClick={() => setEditingReview(review)}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      {t('profile.edit')}
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

