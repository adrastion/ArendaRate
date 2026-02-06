'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { useTranslation } from '@/lib/useTranslation'

const VK_SDK_URL = 'https://unpkg.com/@vkid/sdk@2.5.2/dist-sdk/umd/index.js'

type ContentId = 'SIGN_IN' | 'SIGN_UP'

interface VKOneTapProps {
  /** Сценарий: SIGN_IN для входа, SIGN_UP для регистрации */
  contentId?: ContentId
  /** Надпись над виджетом (например, "Войти как") */
  label?: string
  /** Отключить виджет (например, до принятия правил) */
  disabled?: boolean
  /** При регистрации как арендодатель — после входа редирект на оформление подписки */
  userType?: 'renter' | 'landlord'
  onError?: (error: unknown) => void
}

declare global {
  interface Window {
    VKIDSDK?: {
      Config: {
        init: (config: {
          app: number
          redirectUrl: string
          responseMode: number
          source: number
          scope?: string
        }) => void
      }
      ConfigResponseMode: { Callback: number }
      ConfigSource: { LOWCODE: number }
      OneTap: new () => {
        render: (options: {
          container: HTMLElement
          contentId?: number
          scheme?: string
          lang?: number
          showAlternativeLogin?: boolean
        }) => void
        on: (event: string, handler: (payload?: any) => void) => void
      }
      Auth: {
        exchangeCode: (code: string, deviceId: string) => Promise<{ access_token: string }>
      }
      WidgetEvents: { ERROR: string }
      OneTapInternalEvents: { LOGIN_SUCCESS: string }
      Scheme: { LIGHT: string; DARK: string }
      OneTapContentId: { SIGN_IN: number; SIGN_UP: number }
      Languages: { RUS: number }
    }
  }
}

export function VKOneTap({ contentId = 'SIGN_IN', label, disabled, userType, onError }: VKOneTapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onErrorRef = useRef(onError)
  const userTypeRef = useRef(userType)
  onErrorRef.current = onError
  userTypeRef.current = userType
  const [sdkReady, setSdkReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useTranslation()

  const vkAppId = process.env.NEXT_PUBLIC_VK_APP_ID || '54435093'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const redirectUrl = apiUrl.endsWith('/api')
    ? `${apiUrl}/auth/vk/callback`
    : `${apiUrl}/api/auth/vk/callback`

  const initRef = useRef(false)

  useEffect(() => {
    if (!sdkReady || !containerRef.current || !('VKIDSDK' in window) || initRef.current) return
    initRef.current = true

    const VKID = window.VKIDSDK!
    const appId = parseInt(vkAppId, 10)
    if (isNaN(appId)) {
      onErrorRef.current?.(new Error('Invalid VK_APP_ID'))
      return
    }

    try {
      VKID.Config.init({
        app: appId,
        redirectUrl,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'vkid.personal_info email',
      })

      const oneTap = new VKID.OneTap()
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

      oneTap.render({
        container: containerRef.current,
        contentId: contentId === 'SIGN_UP' ? VKID.OneTapContentId.SIGN_UP : VKID.OneTapContentId.SIGN_IN,
        scheme: isDark ? VKID.Scheme.DARK : VKID.Scheme.LIGHT,
        lang: VKID.Languages.RUS,
        showAlternativeLogin: true,
      })
      oneTap.on(VKID.WidgetEvents.ERROR, (err: unknown) => {
        onErrorRef.current?.(err)
      })
      oneTap.on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
          const { code, device_id } = payload
          if (!code || !device_id) {
            onErrorRef.current?.(new Error('Missing code or device_id'))
            return
          }
          setIsLoading(true)
          try {
            const tokens = await VKID.Auth.exchangeCode(code, device_id) as { access_token?: string; accessToken?: string }
            const accessToken = tokens?.access_token ?? tokens?.accessToken
            if (!accessToken) {
              throw new Error('No access_token in response')
            }
            const result = await auth.vkTokenLogin(accessToken, userTypeRef.current)
            if (result.needLandlordPlan) {
              router.push('/auth/complete-landlord')
            } else {
              router.push('/')
            }
          } catch (err) {
            onErrorRef.current?.(err)
            setIsLoading(false)
          }
        })
    } catch (err) {
      onErrorRef.current?.(err)
    }
  }, [sdkReady, contentId, redirectUrl, vkAppId, router])

  return (
    <>
      <Script
        src={VK_SDK_URL}
        strategy="lazyOnload"
        onLoad={() => setSdkReady(true)}
      />
      <div className="flex flex-col gap-2 relative">
        {label && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        )}
        <div ref={containerRef} className={`min-h-[44px] flex items-center justify-center ${disabled ? 'opacity-50' : ''}`}>
          {isLoading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('login.loggingIn')}
            </span>
          )}
        </div>
        {disabled && (
          <div className="absolute inset-0 cursor-not-allowed z-10" aria-hidden="true" />
        )}
      </div>
    </>
  )
}
