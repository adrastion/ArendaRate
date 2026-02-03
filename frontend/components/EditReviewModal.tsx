'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { reviewApi } from '@/lib/api'
import { getScoreButtonClasses } from '@/lib/ratingColors'
import { RatingCriterion, RATING_CRITERIA_LABELS, Review } from '@/types'

const editReviewSchema = z.object({
  comment: z.string().min(1, 'Комментарий обязателен').max(100, 'Максимум 100 символов'),
  periodFrom: z.string().min(1, 'Укажите дату начала'),
  periodTo: z.string().min(1, 'Укажите дату окончания'),
  ratings: z.record(z.number().min(1).max(5)),
})

type EditReviewFormData = z.infer<typeof editReviewSchema>

interface EditReviewModalProps {
  review: Review
  onClose: () => void
  onSuccess: () => void
}

export function EditReviewModal({
  review,
  onClose,
  onSuccess,
}: EditReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Преобразуем ratings в формат для формы
  const initialRatings = review.ratings.reduce((acc, rating) => {
    acc[rating.criterion] = rating.score
    return acc
  }, {} as Record<RatingCriterion, number>)

  // Преобразуем даты в формат для input[type="date"]
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditReviewFormData>({
    resolver: zodResolver(editReviewSchema),
    defaultValues: {
      comment: review.comment,
      periodFrom: formatDateForInput(review.periodFrom),
      periodTo: formatDateForInput(review.periodTo),
      ratings: initialRatings,
    },
  })

  const ratings = watch('ratings')

  const onSubmit = async (data: EditReviewFormData) => {
    setIsSubmitting(true)

    try {
      // Преобразуем ratings в массив для API
      const ratingsArray = Object.entries(data.ratings).map(([criterion, score]) => ({
        criterion: criterion as RatingCriterion,
        score,
      }))

      await reviewApi.update(review.id, {
        comment: data.comment,
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
        ratings: ratingsArray,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating review:', error)
      alert(`Ошибка при обновлении отзыва: ${error.response?.data?.message || error.message || 'Попробуйте еще раз'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Редактировать отзыв</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⚠️ После редактирования отзыв будет отправлен на модерацию
            </p>
          </div>

          {/* Оценки по критериям */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Оценка по критериям (1-5)</h3>
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

          <div className="flex space-x-4">
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
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

