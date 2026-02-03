'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Сохранение токена
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
      }
      // Перенаправление на главную страницу
      router.push('/')
    } else {
      // Если токена нет, перенаправляем на страницу входа
      router.push('/login')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Вход...</p>
      </div>
    </div>
  )
}

