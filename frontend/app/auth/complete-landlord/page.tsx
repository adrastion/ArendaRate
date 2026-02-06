'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { LandlordSubscriptionModal } from '@/components/LandlordSubscriptionModal'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'

export default function CompleteLandlordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, checkAuth, linkLandlordAccount } = useAuthStore()
  const [step, setStep] = useState<'info' | 'plan'>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (!u) {
        router.replace('/login')
        return
      }
      if (u.role === 'LANDLORD' || u.linkedLandlordId) {
        router.replace('/profile')
        return
      }
      setLoading(false)
    })
  }, [])

  const handleSelectPlan = async (
    planType: number,
    amount: number,
    password: string | undefined,
    promoCode?: string
  ) => {
    if (!password || password.length < 6) {
      setError(t('landlord.passwordMin6'))
      return
    }
    setError('')
    try {
      await linkLandlordAccount({
        password,
        landlordPlan: { planType, amount, promoCode },
      })
      setSuccess(true)
      setTimeout(() => router.replace('/profile'), 1500)
    } catch (e: any) {
      setError(e?.response?.data?.message || t('register.error'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          {t('landlord.completeLandlordTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {t('landlord.completeLandlordDesc')}
        </p>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
            {t('landlord.completeLandlordSuccess')}
          </div>
        )}
      </div>
      <LandlordSubscriptionModal
        isOpen
        onClose={() => (success ? undefined : router.replace('/profile'))}
        step={step}
        onNext={() => setStep('plan')}
        onSelectPlan={handleSelectPlan}
        onBack={step === 'plan' ? () => setStep('info') : undefined}
        mode="link"
        showPromoCode={user?.promoCodeFieldEnabled !== false}
      />
    </div>
  )
}
