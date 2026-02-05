'use client'

import { Header } from '@/components/Header'
import { useTranslation } from '@/lib/useTranslation'

export default function ReviewsAboutPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('reviews.title')}</h1>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('reviews.mission')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('reviews.missionP1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('reviews.missionP2')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('reviews.howTitle')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('reviews.forTenants')}</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                    <li>{t('reviews.forTenants1')}</li>
                    <li>{t('reviews.forTenants2')}</li>
                    <li>{t('reviews.forTenants3')}</li>
                    <li>{t('reviews.forTenants4')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {t('reviews.forRenters')}
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                    <li>{t('reviews.forRenters1')}</li>
                    <li>{t('reviews.forRenters2')}</li>
                    <li>{t('reviews.forRenters3')}</li>
                    <li>{t('reviews.forRenters4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('reviews.modTitle')}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {t('reviews.modP')}
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>{t('reviews.mod1')}</li>
                <li>{t('reviews.mod2')}</li>
                <li>{t('reviews.mod3')}</li>
                <li>{t('reviews.mod4')}</li>
              </ul>
            </section>

            <section className="mb-2">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('reviews.principles')}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('reviews.transparency')}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {t('reviews.transparencyP')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('reviews.safety')}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {t('reviews.safetyP')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('reviews.honesty')}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {t('reviews.honestyP')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('reviews.community')}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {t('reviews.communityP')}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

