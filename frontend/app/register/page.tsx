'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
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

  const handleOAuth = (provider: 'yandex' | 'vk') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    // Если apiUrl уже содержит /api, не добавляем его снова
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
    window.location.href = `${baseUrl}/auth/${provider}`
  }

  useEffect(() => {
    let cancelled = false

    function initVKID() {
      if (cancelled) return

      const container = document.getElementById('vkid-one-tap-container-register')
      if (!container) {
        requestAnimationFrame(initVKID)
        return
      }

      // @ts-expect-error VKIDSDK добавляется внешним скриптом
      if (typeof window === 'undefined' || !window.VKIDSDK) {
        setTimeout(initVKID, 100)
        return
      }

      if ((container as HTMLElement).dataset.vkidInitialized === 'true') return
      ;(container as HTMLElement).dataset.vkidInitialized = 'true'

      // @ts-expect-error VKIDSDK добавляется внешним скриптом
      const VKID = window.VKIDSDK

      VKID.Config.init({
        app: 54435093,
        redirectUrl: 'https://arendarate.ru/api/auth/vk/callback',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      })

      const oneTap = new VKID.OneTap()

      function vkidOnSuccess(data: any) {
        console.log('VKID success', data)
      }

      function vkidOnError(error: any) {
        console.error('VKID error', error)
      }

      oneTap
        .render({
          container,
          fastAuthEnabled: false,
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, vkidOnError)
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, function (payload: any) {
          const code = payload.code
          const deviceId = payload.device_id

          VKID.Auth.exchangeCode(code, deviceId)
            .then(vkidOnSuccess)
            .catch(vkidOnError)
        })
    }

    initVKID()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Необходимо принять правила пользовательского соглашения')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    // Проверка возраста
    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (age < 18 || (age === 18 && monthDiff < 0)) {
      setError('Вы должны быть старше 18 лет')
      return
    }

    setIsLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
      })
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации')
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
            title="Вернуться на главную"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Регистрация в ArendaRate
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Только для лиц старше 18 лет
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Имя
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
                Email
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
                Дата рождения
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
                Пароль (минимум 6 символов)
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
                Подтвердите пароль
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
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
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
              Принимаю правила{' '}
              <Link href="/user-agreement" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline">
                пользовательского соглашения
              </Link>
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Или зарегистрируйтесь через</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => handleOAuth('yandex')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Яндекс
            </button>

            <div className="space-y-2">
              <div id="vkid-one-tap-container-register" />

              <Script
                src="https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js"
                strategy="afterInteractive"
              />
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

