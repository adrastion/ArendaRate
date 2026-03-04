'use client'

import { useEffect, useRef, useState } from 'react'
import { authApi } from '@/lib/api'

const SCRIPT_URL = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js'

declare global {
  interface Window {
    YaAuthSuggest?: {
      init: (
        oauthQueryParams: { client_id: string; response_type: string; redirect_uri: string; state?: string },
        tokenPageOrigin: string,
        suggestParams?: { view: string; parentId: string; buttonView?: string; buttonTheme?: string; buttonSize?: string; buttonBorderRadius?: number }
      ) => Promise<{ status: string; handler: () => Promise<unknown> }>
    }
  }
}

interface YandexIdButtonProps {
  /** Роль при входе: арендатор или арендодатель (передаётся в state и на страницу токена). */
  userType?: 'renter' | 'landlord'
  /** Дополнительные классы контейнера. */
  className?: string
  /** Показывается, пока нет Client ID или пока не подгрузилась официальная кнопка. */
  children?: React.ReactNode
}

export function YandexIdButton({ userType = 'renter', className, children }: YandexIdButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  // Берём Client ID с бэкенда (достаточно YANDEX_CLIENT_ID в backend/.env) или из NEXT_PUBLIC_
  useEffect(() => {
    const fromEnv = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID
    if (fromEnv) {
      setClientId(fromEnv)
      return
    }
    authApi
      .getPublicConfig()
      .then((config) => {
        if (config.yandexClientId) setClientId(config.yandexClientId)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!clientId) return

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const redirectUri = `${origin}/auth/yandex-token`
    const state = userType === 'landlord' ? 'landlord' : 'renter'

    const initButton = () => {
      if (!window.YaAuthSuggest || !containerRef.current) return

      const parentId = containerRef.current.id
      if (!parentId) return

      window.YaAuthSuggest.init(
        {
          client_id: clientId,
          response_type: 'token',
          redirect_uri: redirectUri,
          state,
        },
        origin,
        {
          view: 'button',
          parentId,
          buttonView: 'main',
          buttonTheme: 'light',
          buttonSize: 'm',
          buttonBorderRadius: 8,
        }
      )
        .then((result) => {
          if (result.status === 'ok' && result.handler) {
            return result.handler()
          }
        })
        .catch((err) => {
          console.error('Yandex ID button init error:', err)
        })
    }

    if (window.YaAuthSuggest) {
      initButton()
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = initButton
    script.onerror = () => {}
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [clientId, userType])

  if (!clientId) {
    return <>{children}</>
  }

  return (
    <div
      id="yandex-id-button-container"
      ref={containerRef}
      className={className}
      aria-label="Войти через Яндекс"
    />
  )
}
