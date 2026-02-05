'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/lib/useTranslation'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const { user, logout, checkAuth, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Проверяем авторизацию при монтировании компонента
    if (!user && !isLoading) {
      checkAuth()
    }
  }, [user, isLoading, checkAuth])

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold tracking-wide flex items-baseline">
              <span className="text-gray-900 dark:text-white">Arenda</span>
              <span className="logo-rate text-primary-400 dark:text-primary-400">Rate</span>
            </Link>
            <Link
              href="/reviews"
              className="text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              aria-label={t('header.reviews')}
            >
              ({t('header.reviews')})
            </Link>
          </div>

          {/* Десктопное меню */}
          <nav className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/map"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('header.map')}
            </Link>
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('header.about')}
            </Link>
            <a
              href="https://yoomoney.ru/to/4100119446457843"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('header.thankYou')}
            </a>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-primary-100 text-primary-600 hover:ring-2 hover:ring-primary-500 transition"
                  aria-label="Профиль"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Link>
                {user.role === 'MODERATOR' || user.role === 'ADMIN' ? (
                  <Link
                    href="/moderation"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('header.moderation')}
                  </Link>
                ) : null}
                <button
                  onClick={logout}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium"
                >
                  {t('header.logout')}
                </button>
                <LanguageSwitcher />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('header.login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {t('header.register')}
                </Link>
                <LanguageSwitcher />
              </>
            )}
          </nav>

          {/* Мобильное меню - кнопка гамбургера */}
          <div className="md:hidden mobile-menu-container relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Открыть меню"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Выпадающее меню */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1" role="menu">
                  {/* Переключатель темы */}
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('header.theme')}</span>
                      <ThemeToggle />
                    </div>
                  </div>

                  {/* Язык */}
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('header.language')}</span>
                      <LanguageSwitcher />
                    </div>
                  </div>

                  {/* Карта */}
                  <Link
                    href="/map"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    {t('header.map')}
                  </Link>
                  {/* О нас */}
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    {t('header.about')}
                  </Link>

                  {/* Сказать спасибо */}
                  <a
                    href="https://yoomoney.ru/to/4100119446457843"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    {t('header.thankYou')}
                  </a>

                  {/* Разделитель */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                  {/* Пункты меню в зависимости от авторизации */}
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-primary-100 text-primary-600">
                          {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-xs font-semibold">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span>{t('header.profile')}</span>
                      </Link>
                      {user.role === 'MODERATOR' || user.role === 'ADMIN' ? (
                        <Link
                          href="/moderation"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          {t('header.moderation')}
                        </Link>
                      ) : null}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          logout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        {t('header.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-center"
                        role="menuitem"
                      >
                        {t('header.login')}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-md mx-2 my-1 text-center"
                        role="menuitem"
                      >
                        {t('header.register')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

