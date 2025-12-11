'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export function Header() {
  const { user, logout, checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    // Проверяем авторизацию при монтировании компонента
    if (!user && !isLoading) {
      checkAuth()
    }
  }, [user, isLoading, checkAuth])

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary-600">
            ArendRate
          </Link>

          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Профиль
                </Link>
                {user.role === 'MODERATOR' || user.role === 'ADMIN' ? (
                  <Link
                    href="/moderation"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Модерация
                  </Link>
                ) : null}
                <button
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

