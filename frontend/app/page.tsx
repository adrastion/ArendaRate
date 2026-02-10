'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'

export default function LandingPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const { t } = useTranslation()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (u) router.replace('/map')
      else setCheckingAuth(false)
    })
  }, [checkAuth, router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230284c7\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80 dark:opacity-40" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-20 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              <span className="text-gray-900 dark:text-white">{t('landing.heroTitle1')}</span>
              <br />
              <span className="text-primary-600 dark:text-primary-400">{t('landing.heroTitle2')}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 transition-all"
              >
                {t('landing.openMap')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 border-2 border-primary-500/50 hover:border-primary-600 dark:hover:border-primary-400 rounded-xl transition-colors"
                >
                  {t('landing.register')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Что такое ArendaRate */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {t('landing.whatIs')}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('landing.whatIsSub')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('landing.mapTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('landing.mapDesc')}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('landing.criteriaTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('landing.criteriaDesc')}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('landing.safeTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('landing.safeDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('landing.howTitle')}</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('landing.howSub')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-primary-500/30">1</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{t('landing.step1')}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{t('landing.step1Desc')}</p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-primary-500/30">2</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{t('landing.step2')}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{t('landing.step2Desc')}</p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-primary-500/30">3</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{t('landing.step3')}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{t('landing.step3Desc')}</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/map" className="inline-flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              {t('landing.toMap')}
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Цитата */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-xl sm:text-2xl font-medium text-gray-700 dark:text-gray-200 leading-relaxed italic">
            {t('landing.quote')}
          </blockquote>
          <p className="mt-6 text-gray-600 dark:text-gray-400">— {t('landing.mission')}</p>
          <div className="mt-10">
            <Link href="/about" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">{t('landing.moreAbout')}</Link>
          </div>
        </div>
      </section>

      {/* Финальный CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('landing.ctaTitle')}</h2>
          <p className="mt-4 text-lg text-primary-100">{t('landing.ctaSub')}</p>
          <Link
            href="/map"
            className="mt-8 inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-600 bg-white hover:bg-primary-50 rounded-xl shadow-lg transition-colors"
          >
            {t('landing.openMap')}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className="whitespace-nowrap font-bold">
              <span className="text-gray-900 dark:text-white">Arenda</span><span className="logo-rate text-primary-400 dark:text-primary-400">Rate</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm flex-wrap justify-center">
            <Link href="/map" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.map')}</Link>
            <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.about')}</Link>
            <Link href="/about#team" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.creators')}</Link>
            <Link href="/reviews" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.reviews')}</Link>
            <Link href="/user-agreement" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.userAgreement')}</Link>
            <Link href="/contacts" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">{t('footer.contacts')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
