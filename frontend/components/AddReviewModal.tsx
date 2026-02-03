'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { reviewApi, uploadApi, addressApi } from '@/lib/api'
import { getScoreButtonClasses } from '@/lib/ratingColors'
import { RatingCriterion, RATING_CRITERIA_LABELS } from '@/types'
import { format } from 'date-fns'

const reviewSchema = z.object({
  addressId: z.string().min(1, 'Выберите адрес'),
  apartmentNumber: z.string().min(1, 'Введите номер квартиры'),
  comment: z.string().min(1, 'Комментарий обязателен').max(100, 'Максимум 100 символов'),
  periodFrom: z.string().min(1, 'Укажите дату начала'),
  periodTo: z.string().min(1, 'Укажите дату окончания'),
  ratings: z.record(z.number().min(1).max(5)),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface AddReviewModalProps {
  onClose: () => void
  onSuccess?: () => void
  initialApartmentId?: string | null
  initialAddress?: {
    id: string
    country: string
    city: string
    street: string
    building: string
    latitude?: number
    longitude?: number
    fromDatabase?: boolean
  } | null
}

export function AddReviewModal({
  onClose,
  onSuccess,
  initialApartmentId,
  initialAddress,
}: AddReviewModalProps) {
  const [step, setStep] = useState(initialAddress ? 2 : 1) // Если адрес уже выбран, начинаем со 2 шага
  const [photos, setPhotos] = useState<File[]>([])
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addressSearchQuery, setAddressSearchQuery] = useState('')
  const [addressResults, setAddressResults] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any>(initialAddress || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      ratings: {},
      addressId: initialAddress?.id || '',
    },
  })

  const ratings = watch('ratings')

  // Если передан начальный адрес, устанавливаем его значения
  useEffect(() => {
    if (initialAddress) {
      setValue('addressId', initialAddress.id)
      setSelectedAddress(initialAddress)
    }
  }, [initialAddress, setValue])

  // Поиск адресов
  useEffect(() => {
    if (addressSearchQuery.length < 3) {
      setAddressResults([])
      return
    }

    const timeout = setTimeout(async () => {
      try {
        console.log('Searching for address:', addressSearchQuery)
        const response = await addressApi.search(addressSearchQuery)
        console.log('Address search response:', response)
        if (response && response.addresses) {
          setAddressResults(response.addresses)
        } else {
          console.warn('Unexpected response format:', response)
          setAddressResults([])
        }
      } catch (error: any) {
        console.error('Address search error:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
        setAddressResults([])
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [addressSearchQuery])

  const handleAddressSelect = async (address: any, apartmentNumber: string) => {
    try {
      // Если адрес из Nominatim (не из БД), создаем его в БД
      let addressId = address.id
      if (!address.fromDatabase) {
        try {
          const createdAddress = await addressApi.create({
            country: address.country,
            city: address.city,
            street: address.street,
            building: address.building,
            latitude: address.latitude,
            longitude: address.longitude,
          })
          addressId = createdAddress.address.id
        } catch (error: any) {
          console.error('Error creating address:', error)
          alert('Ошибка при сохранении адреса. Попробуйте еще раз.')
          return
        }
      }

      setSelectedAddress({ ...address, id: addressId, fromDatabase: true })
      setValue('addressId', addressId)
      setValue('apartmentNumber', apartmentNumber)
      setAddressSearchQuery('')
      setAddressResults([])
      setStep(2)
    } catch (error: any) {
      console.error('Error in handleAddressSelect:', error)
      alert('Произошла ошибка. Попробуйте еще раз.')
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + photos.length > 5) {
      alert('Можно загрузить максимум 5 фотографий')
      return
    }
    setPhotos([...photos, ...files])
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setUploadedPhotoUrls(uploadedPhotoUrls.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    let uploadedUrls: string[] = []
    
    try {
      // Проверка, что все критерии оценены
      const allCriteria = Object.values(RatingCriterion)
      const missingCriteria = allCriteria.filter(c => !data.ratings[c] || data.ratings[c] < 1 || data.ratings[c] > 5)
      
      if (missingCriteria.length > 0) {
        alert(`Пожалуйста, оцените все критерии: ${missingCriteria.map(c => RATING_CRITERIA_LABELS[c]).join(', ')}`)
        setIsSubmitting(false)
        return
      }

      // Загрузка фотографий
      if (photos.length > 0) {
        try {
          const uploadResponse = await uploadApi.uploadPhotos(photos)
          uploadedUrls = uploadResponse.photos.map((p) => p.url)
          setUploadedPhotoUrls(uploadedUrls)
        } catch (uploadError: any) {
          console.error('Photo upload error:', uploadError)
          alert(`Ошибка при загрузке фотографий: ${uploadError.response?.data?.message || uploadError.message}`)
          setIsSubmitting(false)
          return
        }
      }

      // Получение или создание квартиры
      let apartmentResponse
      try {
        apartmentResponse = await addressApi.createApartment({
          addressId: data.addressId,
          apartmentNumber: data.apartmentNumber,
        })
      } catch (apartmentError: any) {
        console.error('Apartment creation error:', apartmentError)
        alert(`Ошибка при создании/поиске квартиры: ${apartmentError.response?.data?.message || apartmentError.message}`)
        setIsSubmitting(false)
        return
      }

      // Создание отзыва
      const ratingsArray = Object.entries(data.ratings).map(([criterion, score]) => ({
        criterion: criterion as RatingCriterion,
        score: Number(score),
      }))

      let reviewResponse
      try {
        reviewResponse = await reviewApi.create({
          apartmentId: apartmentResponse.apartment.id,
          comment: data.comment.trim(),
          periodFrom: data.periodFrom,
          periodTo: data.periodTo,
          ratings: ratingsArray,
        })
      } catch (reviewError: any) {
        console.error('Review creation error:', reviewError)
        const errorMessage = reviewError.response?.data?.message || reviewError.message || 'Ошибка при создании отзыва'
        alert(`Ошибка: ${errorMessage}`)
        if (reviewError.response?.data?.errors) {
          console.error('Validation errors:', reviewError.response.data.errors)
        }
        setIsSubmitting(false)
        return
      }

      // Связывание фотографий с отзывом
      if (uploadedUrls.length > 0 && reviewResponse?.review?.id) {
        try {
          await uploadApi.linkPhotosToReview(reviewResponse.review.id, uploadedUrls)
        } catch (linkError: any) {
          console.error('Photo linking error:', linkError)
          // Не блокируем успешное создание отзыва, даже если не удалось связать фото
          console.warn('Отзыв создан, но не удалось связать фотографии')
        }
      }

      alert('Отзыв успешно отправлен на модерацию!')
      
      // Вызываем callback для обновления данных
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (error: any) {
      console.error('Unexpected error:', error)
      alert(`Неожиданная ошибка: ${error.response?.data?.message || error.message || 'Попробуйте еще раз'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Добавить отзыв - Шаг 1: Выбор адреса</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Поиск адреса
              </label>
              <input
                type="text"
                value={addressSearchQuery}
                onChange={(e) => setAddressSearchQuery(e.target.value)}
                placeholder="Город, улица, дом..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              {addressResults.length > 0 ? (
                <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-700">
                  {addressResults.map((address) => (
                    <div key={address.id} className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                      <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                        {address.formattedAddress || `${address.city}, ${address.street}, ${address.building}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {address.reviewsCount !== undefined && address.reviewsCount > 0 ? (
                          <>{address.reviewsCount} отзывов</>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Нет отзывов</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Номер квартиры"
                          className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const apartmentNumber = (e.target as HTMLInputElement).value
                              if (apartmentNumber) {
                                handleAddressSelect(address, apartmentNumber)
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                            const apartmentNumber = input?.value
                            if (apartmentNumber) {
                              handleAddressSelect(address, apartmentNumber)
                            } else {
                              alert('Введите номер квартиры')
                            }
                          }}
                          className="px-4 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Выбрать
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : addressSearchQuery.length >= 3 ? (
                <div className="mt-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Адрес не найден</p>
                  <p className="text-sm">Проверьте правильность ввода или создайте новый адрес вручную</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Добавить отзыв - Шаг 2: Оценка и комментарий</h2>

          {selectedAddress && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedAddress.city}, {selectedAddress.street}, {selectedAddress.building}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Номер квартиры
                </label>
                <input
                  type="text"
                  {...register('apartmentNumber')}
                  placeholder="Например: 42"
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                {errors.apartmentNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.apartmentNumber.message}</p>
                )}
              </div>
            </div>
          )}

          <input type="hidden" {...register('addressId')} />

          {/* Оценки по критериям */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Оценка по критериям (1–5)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded bg-red-500 text-white text-xs flex items-center justify-center">1</span>
                <span>плохо</span>
              </span>
              <span className="text-gray-400">→</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded bg-green-500 text-white text-xs flex items-center justify-center">5</span>
                <span>отлично</span>
              </span>
            </p>
            <div className="space-y-4">
              {Object.values(RatingCriterion).map((criterion) => (
                <div key={criterion}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {RATING_CRITERIA_LABELS[criterion]}
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setValue(`ratings.${criterion}`, score)}
                        className={getScoreButtonClasses(score, ratings[criterion] === score)}
                        title={score === 1 ? 'Плохо' : score === 5 ? 'Отлично' : undefined}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {errors.ratings?.[criterion] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.ratings[criterion]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Комментарий */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Комментарий (до 100 символов)
            </label>
            <textarea
              {...register('comment')}
              maxLength={100}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {watch('comment')?.length || 0}/100
            </div>
            {errors.comment && (
              <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
            )}
          </div>

          {/* Период проживания */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Период проживания с
              </label>
              <input
                type="date"
                {...register('periodFrom')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
              />
              {errors.periodFrom && (
                <p className="text-red-500 text-sm mt-1">{errors.periodFrom.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">по</label>
              <input
                type="date"
                {...register('periodTo')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
              />
              {errors.periodTo && (
                <p className="text-red-500 text-sm mt-1">{errors.periodTo.message}</p>
              )}
            </div>
          </div>

          {/* Загрузка фото */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Фотографии (до 5 штук)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            />
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={(e) => {
                // Проверка перед отправкой
                const allCriteria = Object.values(RatingCriterion)
                const formRatings = watch('ratings') || {}
                const missingCriteria = allCriteria.filter(c => !formRatings[c] || formRatings[c] < 1 || formRatings[c] > 5)
                
                if (missingCriteria.length > 0) {
                  e.preventDefault()
                  alert(`Пожалуйста, оцените все критерии. Не оценено: ${missingCriteria.map(c => RATING_CRITERIA_LABELS[c]).join(', ')}`)
                  return false
                }
                
                const comment = watch('comment')?.trim()
                if (!comment || comment.length === 0) {
                  e.preventDefault()
                  alert('Пожалуйста, заполните комментарий')
                  return false
                }
                
                if (comment.length > 100) {
                  e.preventDefault()
                  alert('Комментарий не должен превышать 100 символов')
                  return false
                }
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

