'use client'

import { Header } from '@/components/Header'
import Link from 'next/link'

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Контакты и реквизиты</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Информация для связи и реквизиты для приёма платежей (самозанятый).
          </p>

          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Как с нами связаться</h2>
              <ul className="list-none space-y-2 pl-0">
                <li>
                  <strong>Электронная почта:</strong>{' '}
                  <a href="mailto:ArendaRate@yandex.ru" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ArendaRate@yandex.ru
                  </a>
                </li>
                <li>
                  <strong>Telegram (техподдержка):</strong>{' '}
                  <a href="https://t.me/ArendaRateTS" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    t.me/ArendaRateTS
                  </a>
                </li>
                <li>
                  <strong>Телефон:</strong> уточняйте по email или в Telegram.
                </li>
                <li>
                  <strong>Почтовый адрес:</strong> для корреспонденции уточняйте по email или в Telegram.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Реквизиты самозанятого</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Платежи за подписку (пакеты ответов на отзывы) принимаются от имени самозанятого. Реквизиты для выставления чеков и связи:
              </p>
              <ul className="list-none space-y-2 pl-0">
                <li><strong>ФИО:</strong> Сапронов Павел Анатольевич</li>
                <li><strong>ИНН:</strong> 463234953250</li>
              </ul>
            </section>

            <p className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/user-agreement" className="text-primary-600 dark:text-primary-400 hover:underline">
                ← Пользовательское соглашение
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
