'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'
import { VKOneTap } from '@/components/VKOneTap'
import { LandlordSubscriptionModal } from '@/components/LandlordSubscriptionModal'
import { userApi } from '@/lib/api'

type UserType = 'renter' | 'landlord'

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { register } = useAuthStore()
  const [userType, setUserType] = useState<UserType>('renter')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    dateOfBirth: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [subscriptionStep, setSubscriptionStep] = useState<'info' | 'plan'>('info')

  const handleOAuth = (provider: 'yandex' | 'vk') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
    const params = userType === 'landlord' ? '?userType=landlord' : ''
    window.location.href = `${baseUrl}/auth/${provider}${params}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent, landlordPlan?: { planType: number; amount: number }) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError(t('register.errorTerms'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errorPasswordMatch'))
      return
    }

    // Проверка возраста
    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (age < 18 || (age === 18 && monthDiff < 0)) {
      setError(t('register.errorAge'))
      return
    }

    // Для арендодателя без выбранного плана — открываем модалку
    if (userType === 'landlord' && !landlordPlan) {
      setSubscriptionStep('info')
      setSubscriptionModalOpen(true)
      return
    }

    setIsLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        userType,
        ...(userType === 'landlord' && landlordPlan && {
          landlordPlan: { planType: landlordPlan.planType, amount: landlordPlan.amount },
        }),
      })
      router.push('/map')
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscriptionNext = () => setSubscriptionStep('plan')
  const handleSubscriptionBack = () => setSubscriptionStep('info')
  const handleSelectPlan = async (planType: number, amount: number, _password?: string, promoCode?: string) => {
    setSubscriptionModalOpen(false)
    setError('')
    if (!acceptedTerms || formData.password !== formData.confirmPassword) return
    const birthDate = new Date(formData.dateOfBirth)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    if (age < 18) return
    setIsLoading(true)
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        userType: 'landlord',
        landlordPlan: { planType, amount, promoCode },
      })
      try {
        const { confirmationUrl } = await userApi.landlordCreatePayment({ planType, amount, promoCode: promoCode || undefined })
        window.location.href = confirmationUrl
        return
      } catch (payErr: any) {
        if (payErr?.response?.status === 503) {
          router.push('/map')
          return
        }
        setError(payErr?.response?.data?.message || 'Ошибка создания платежа')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="relative">
          <button
            onClick={() => router.push('/')}
            className="absolute -top-2 -left-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={t('login.back')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('register.over18')}
          </p>

          <div className="mt-6 flex justify-center">
            <div
              role="group"
              aria-label={t('register.title')}
              className="inline-flex p-1.5 rounded-xl bg-gray-200/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600"
            >
              <button
                type="button"
                onClick={() => setUserType('renter')}
                className={`relative min-w-[120px] sm:min-w-[140px] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                  userType === 'renter'
                    ? 'bg-primary-600 text-white shadow shadow-primary-900/20 dark:shadow-primary-900/40'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/40'
                }`}
              >
                {t('register.asRenter')}
              </button>
              <button
                type="button"
                onClick={() => setUserType('landlord')}
                className={`relative min-w-[120px] sm:min-w-[140px] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                  userType === 'landlord'
                    ? 'bg-primary-600 text-white shadow shadow-primary-900/20 dark:shadow-primary-900/40'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/40'
                }`}
              >
                {t('register.asLandlord')}
              </button>
            </div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => handleSubmit(e)}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('register.name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('login.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('register.dateOfBirth')}
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('register.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('register.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading
                ? t('register.registering')
                : userType === 'landlord'
                  ? t('register.subscribe')
                  : t('register.submit')}
            </button>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="acceptedTerms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="acceptedTerms" className="text-sm text-gray-700 dark:text-gray-300">
              {t('register.acceptTerms')}{' '}
              <Link href="/user-agreement" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline">
                {t('register.acceptTermsLink')}
              </Link>
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">{t('register.orRegisterVia')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              disabled={!acceptedTerms}
              onClick={() => handleOAuth('yandex')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('register.yandex')}
            </button>
            <div className="flex justify-center">
              <VKOneTap
                contentId="SIGN_UP"
                disabled={!acceptedTerms}
                userType={userType}
                onError={(err) => {
                  console.error('VK One Tap error:', err)
                  setError(t('register.oauthError'))
                }}
              />
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              {t('register.haveAccount')}
            </Link>
          </div>
        </form>

        <LandlordSubscriptionModal
          isOpen={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
          step={subscriptionStep}
          onNext={handleSubscriptionNext}
          onSelectPlan={handleSelectPlan}
          onBack={subscriptionStep === 'plan' ? handleSubscriptionBack : undefined}
        />
      </div>
    </div>
  )
}

