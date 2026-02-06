'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const needLandlordPlan = searchParams.get('needLandlordPlan') === '1'
    if (token) {
      auth.setToken(token)
      if (needLandlordPlan) {
        router.replace('/auth/complete-landlord')
        return
      }
      router.replace('/')
    } else {
      router.replace('/login')
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

