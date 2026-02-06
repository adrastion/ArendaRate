'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'

const SUBSCRIPTION_PLANS = [
  { responses: 1, price: 100 },
  { responses: 3, price: 340 },
  { responses: 5, price: 450 },
  { responses: 10, price: 900 },
]

interface LandlordSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  step: 'info' | 'plan'
  onNext: () => void
  /** В режиме link передаётся пароль для аккаунта арендодателя. */
  onSelectPlan: (planType: number, amount: number, password?: string, promoCode?: string) => void
  onBack?: () => void
  /** Режим: register — при регистрации, link — привязка арендодателя (поле пароля), topUp — докупка ответов. */
  mode?: 'register' | 'link' | 'topUp'
  /** Показывать поле промокода (зависит от настроек админки, по умолчанию true). */
  showPromoCode?: boolean
}

export function LandlordSubscriptionModal({
  isOpen,
  onClose,
  step,
  onNext,
  onSelectPlan,
  onBack,
  mode = 'register',
  showPromoCode = true,
}: LandlordSubscriptionModalProps) {
  const { t } = useTranslation()
  const [linkPassword, setLinkPassword] = useState('')
  const [promoCode, setPromoCode] = useState('')

  if (!isOpen) return null

  const isLinkMode = mode === 'link'
  const isTopUpMode = mode === 'topUp'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {step === 'info' ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('landlord.subscriptionBenefits')}
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
              <li className="flex gap-2">
                <span className="text-primary-500">1.</span>
                {t('landlord.benefit1')}
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">2.</span>
                {t('landlord.benefit2')}
              </li>
              <li className="flex gap-2">
                <span className="text-primary-500">3.</span>
                {t('landlord.benefit3')}
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {t('landlord.goToSubscription')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {isTopUpMode ? t('landlord.topUpTitle') : t('landlord.choosePlan')}
            </h3>
            {isLinkMode && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('landlord.passwordForLandlordAccount')}
                </label>
                <input
                  type="password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder={t('landlord.passwordMin6')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
            {showPromoCode && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('landlord.promoCode')}
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.trim())}
                  placeholder={t('landlord.promoCodePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
            <div className="space-y-3 mb-3">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.responses}
                  type="button"
                  onClick={() => onSelectPlan(plan.responses, plan.price, isLinkMode ? linkPassword : undefined, promoCode || undefined)}
                  disabled={isLinkMode && linkPassword.length < 6}
                  className="w-full flex justify-between items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-900 dark:text-gray-100">
                    {plan.responses} {t('landlord.responses')} — {plan.price} ₽
                  </span>
                  <span className="text-primary-600 dark:text-primary-400">→</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              После оплаты пакет ответов зачисляется на ваш счёт в личном кабинете в течение нескольких минут.
            </p>
            <div className="flex gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.back')}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
