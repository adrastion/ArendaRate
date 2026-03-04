'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/auth'

/** Парсит hash фрагмент после редиректа от Яндекса (response_type=token). */
function parseHashParams(hash: string): { access_token?: string; state?: string } {
  const params: Record<string, string> = {}
  if (!hash || !hash.startsWith('#')) return params
  const q = hash.slice(1)
  q.split('&').forEach((pair) => {
    const [k, v] = pair.split('=')
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v)
  })
  return params
}

export default function YandexTokenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    const { access_token, state } = parseHashParams(hash)
    const userType = searchParams.get('userType') || state || undefined

    if (!access_token) {
      setStatus('error')
      router.replace('/login?error=oauth_failed')
      return
    }

    auth
      .yandexTokenLogin(access_token, userType === 'landlord' ? 'landlord' : undefined)
      .then((result) => {
        if (result.needLandlordPlan) {
          router.replace('/auth/complete-landlord')
        } else {
          router.replace('/map')
        }
      })
      .catch(() => {
        setStatus('error')
        router.replace('/login?error=oauth_failed')
      })
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {status === 'loading' ? 'Вход через Яндекс...' : 'Перенаправление...'}
        </p>
      </div>
    </div>
  )
}
