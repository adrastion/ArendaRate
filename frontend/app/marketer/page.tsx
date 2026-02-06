'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { marketerApi, userApi } from '@/lib/api'
import { UserRole } from '@/types'
import { format } from 'date-fns'

export default function MarketerPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [data, setData] = useState<Awaited<ReturnType<typeof marketerApi.getMe>>['marketer'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (!u) {
        router.push('/login')
        return
      }
      if (u.role !== UserRole.MARKETER) {
        router.push('/')
        return
      }
      if (u.passwordChangeRequired) {
        setLoading(false)
        return
      }
      loadData()
    })
  }, [user?.role, user?.passwordChangeRequired])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await marketerApi.getMe()
      setData(r.marketer)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Пароль не менее 6 символов')
      return
    }
    setChangingPassword(true)
    setError('')
    try {
      await userApi.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      await checkAuth()
      loadData()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка смены пароля')
    } finally {
      setChangingPassword(false)
    }
  }

  if (!user) return null
  if (user.role !== UserRole.MARKETER) return null

  if (user.passwordChangeRequired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Смена пароля</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">При первом входе необходимо сменить одноразовый пароль.</p>
          {error && <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{error}</div>}
          {passwordSuccess && <div className="mb-4 p-3 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Пароль изменён. Загрузка кабинета…</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текущий пароль (одноразовый)</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый пароль (мин. 6 символов)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <button type="submit" disabled={changingPassword} className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {changingPassword ? 'Сохранение…' : 'Сменить пароль'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Кабинет маркетолога</h1>
        {error && <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{error}</div>}
        {loading && <div className="text-gray-500 dark:text-gray-400">Загрузка…</div>}
        {!loading && data && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Профиль</h2>
              <p className="text-gray-600 dark:text-gray-400">Email: {data.email}</p>
              <p className="text-gray-600 dark:text-gray-400">Процент от продаж: {data.percentage}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Статистика</h2>
              <p className="text-gray-600 dark:text-gray-400">Сумма продаж по вашим промокодам: <strong>{data.totalSales} ₽</strong></p>
              <p className="text-gray-600 dark:text-gray-400">Ваш заработок ({data.percentage}%): <strong>{data.earnings.toFixed(0)} ₽</strong></p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ваши промокоды</h2>
              {data.promoCodes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Промокодов пока нет. Администратор может привязать промокоды к вашему аккаунту.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2">Код</th>
                        <th className="text-left py-2">Скидка</th>
                        <th className="text-left py-2">Использований</th>
                        <th className="text-left py-2">Создан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.promoCodes.map((pc) => (
                        <tr key={pc.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 font-mono">{pc.code}</td>
                          <td>{pc.discountType === 'PERCENT' ? `${pc.discountValue}%` : `${pc.discountValue} ₽`}</td>
                          <td>{pc.usedCount}{pc.maxUses != null ? ` / ${pc.maxUses}` : ''}</td>
                          <td>{format(new Date(pc.createdAt), 'dd.MM.yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
