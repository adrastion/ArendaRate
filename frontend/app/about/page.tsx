'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'

export default function AboutPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">О проекте ArendaRate</h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Наша миссия</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                ArendaRate — это платформа, созданная для повышения прозрачности рынка аренды жилья. 
                Мы предоставляем будущим арендаторам доступ к проверенным отзывам и оценкам предыдущих жильцов, 
                помогая принимать обоснованные решения при выборе жилья.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Наша цель — создать честную и открытую экосистему, где каждый может поделиться своим опытом 
                и получить достоверную информацию о жилье перед заключением договора аренды.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Как это работает</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Для арендаторов</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                    <li>Изучайте отзывы о квартирах на интерактивной карте</li>
                    <li>Оценивайте жилье по 6 критериям: техническое состояние, чистота, безопасность, комфорт, честность арендодателя и соотношение цены и качества</li>
                    <li>Просматривайте фотографии и детальные комментарии от предыдущих жильцов</li>
                    <li>Принимайте обоснованные решения на основе реального опыта других людей</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Для тех, кто снимал жилье</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                    <li>Делитесь своим опытом проживания в квартире</li>
                    <li>Оставляйте детальные отзывы с оценками и фотографиями</li>
                    <li>Помогайте другим людям избежать проблемных вариантов</li>
                    <li>Создавайте сообщество ответственных арендаторов</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Система модерации</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Все отзывы проходят проверку модераторами перед публикацией. Это гарантирует:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Отсутствие оскорблений, спама и рекламы</li>
                <li>Защиту личных данных арендодателей и соседей</li>
                <li>Качество и достоверность информации</li>
                <li>Соблюдение правил сообщества</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Принципы работы</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Прозрачность</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Вся информация о жилье доступна открыто, без скрытых условий
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Безопасность</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Защита личных данных и конфиденциальность пользователей
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Честность</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Только реальные отзывы от людей, которые действительно проживали в квартирах
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Сообщество</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Взаимопомощь и поддержка между арендаторами
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Контакты и поддержка</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Если у вас есть вопросы, предложения или вы хотите сообщить о проблеме — свяжитесь с нами удобным способом:
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
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Почта поддержки и предложений</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                      ArendaRate@yandex.ru
                    </div>
                    <div className="mt-2 text-sm text-primary-600 dark:text-primary-400 group-hover:underline">
                      {isEmailCopied ? 'Почта скопирована' : 'Скопировать почту →'}
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
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Техподдержка в Telegram</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRateTS</div>
                    <div className="mt-2 text-sm text-sky-700 dark:text-sky-300 group-hover:underline">
                      Открыть чат →
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4">
                <div className="flex items-start gap-3">
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
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Новостной Telegram-канал</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">t.me/ArendaRate</div>
                    <a
                      className="mt-2 inline-flex text-sm text-sky-700 dark:text-sky-300 hover:underline"
                      href="https://t.me/ArendaRate"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Перейти в канал →
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Поддержать проект</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                ArendaRate — это независимый проект, созданный для помощи людям. 
                Если вы хотите поддержать развитие платформы, вы можете сделать это через:
              </p>
              <a
                href="https://yoomoney.ru/to/4100119446457843"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Сказать спасибо
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
