'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { useTranslation } from '@/lib/useTranslation'

export default function AboutPage() {
  const { t } = useTranslation()
  const [isEmailCopied, setIsEmailCopied] = useState(false)

  const handleCopyEmail = () => {
    const email = 'ArendaRate@yandex.ru'
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        setIsEmailCopied(true)
        setTimeout(() => setIsEmailCopied(false), 2000)
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-10">
              <div className="text-center mb-8">
                <div className="text-4xl md:text-5xl font-extrabold tracking-wide text-gray-900 dark:text-white mb-3">
                  <span className="text-gray-900 dark:text-white">Arenda</span>
                  <span className="logo-rate text-primary-400 dark:text-primary-400">Rate</span>
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t('about.charter')}
                </p>
                <p className="mt-4 text-sm md:text-base italic text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('about.motto')}{' '}
                  <span className="font-semibold">
                    {t('about.mottoText')}
                  </span>
                </p>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.intro1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.intro2')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.criteriaIntro')}
              </p>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>{t('about.criteria1')}</li>
                <li>{t('about.criteria2')}</li>
                <li>{t('about.criteria3')}</li>
                <li>{t('about.criteria4')}</li>
                <li>{t('about.criteria5')}</li>
                <li>{t('about.criteria6')}</li>
              </ol>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('about.believeP')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.section1')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article1Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article1P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article2Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article2P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article3Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('about.article3P')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.section2')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article4Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article4P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article5Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article5P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article6Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('about.article6P')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.section3')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article7Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article7P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article8Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.article8P')}
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('about.article9Title')}</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('about.article9P')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('about.conclusionTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.conclusion1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.conclusion2')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.conclusion3')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('about.conclusion4')}
              </p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{t('about.regards')}</p>
            </section>

            <section id="team" className="mb-8 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.creatorsTitle')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="https://t.me/The_Sapron"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{t('about.creatorIdeologist')}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">t.me/The_Sapron</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">{t('about.openChat')}</div>
                  </div>
                </a>
                <a
                  href="https://t.me/besmsk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{t('about.creatorDeveloper')}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">t.me/besmsk</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">{t('about.openChat')}</div>
                  </div>
                </a>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.contactSupport')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.contactIntro')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="group flex w-full items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={handleCopyEmail}
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4 7 8 6 8-6" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{t('about.emailSupport')}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      ArendaRate@yandex.ru
                    </div>
                    <div className="mt-2 text-sm text-primary-600 dark:text-primary-400 group-hover:underline">
                      {isEmailCopied ? t('about.emailCopied') : t('about.copyEmailLink')}
                    </div>
                  </div>
                </button>

                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://t.me/ArendaRateTS"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{t('about.telegramSupport')}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRateTS</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">
                      {t('about.openChat')}
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://t.me/ArendaRate"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{t('about.telegramChannel')}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRate</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">
                      {t('about.goToChannel')}
                    </div>
                  </div>
                </a>

                <a
                  className="group flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  href="https://vk.com/club235637206"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13l8-6-3 10-2-3-3-1Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {t('about.vkGroup')}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      vk.com/club235637206
                    </div>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 group-hover:underline">
                      {t('about.openCommunity')}
                    </div>
                  </div>
                </a>
              </div>
            </section>

            <section className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('about.supportProject')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('about.supportIntro')}
              </p>
              <a
                href="https://yoomoney.ru/to/4100119446457843"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                {t('header.thankYou')}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
