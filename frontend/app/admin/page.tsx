'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { useAuthStore } from '@/store/authStore'
import { adminApi } from '@/lib/api'
import { UserRole } from '@/types'
import { format } from 'date-fns'

type Tab = 'users' | 'promo' | 'marketers' | 'stats' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<any[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [marketers, setMarketers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [purchasesTotal, setPurchasesTotal] = useState(0)
  const [marketerStats, setMarketerStats] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Forms
  const [promoCode, setPromoCode] = useState('')
  const [promoType, setPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [promoValue, setPromoValue] = useState('')
  const [promoMaxUses, setPromoMaxUses] = useState('')
  const [promoMarketerId, setPromoMarketerId] = useState('')
  const [marketerEmail, setMarketerEmail] = useState('')
  const [marketerPercentage, setMarketerPercentage] = useState('')
  const [showMarketerPasswordModal, setShowMarketerPasswordModal] = useState(false)
  const [createdMarketerEmail, setCreatedMarketerEmail] = useState('')
  const [createdMarketerPassword, setCreatedMarketerPassword] = useState('')
  const [subResponses, setSubResponses] = useState<Record<string, string>>({})
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ responses: number; price: number }[]>([])
  const [savingPlans, setSavingPlans] = useState(false)
  const [showMarketerContractModal, setShowMarketerContractModal] = useState(false)
  const [marketerContractText, setMarketerContractText] = useState('')
  const [marketerContractLoading, setMarketerContractLoading] = useState(false)
  const [marketerContractEmail, setMarketerContractEmail] = useState('')

  useEffect(() => {
    checkAuth().then(() => {
      const u = useAuthStore.getState().user
      if (!u || u.role !== UserRole.ADMIN) {
        router.push('/login')
        return
      }
      loadTab()
    })
  }, [user?.role])

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) loadTab()
  }, [tab, usersPage, usersSearch])


  const loadTab = async () => {
    if (!user || user.role !== UserRole.ADMIN) return
    setLoading(true)
    setError('')
    try {
      if (tab === 'users') {
        const r = await adminApi.getUsers({ search: usersSearch || undefined, page: usersPage, limit: 20 })
        setUsers(r.users)
        setUsersTotal(r.total)
      } else if (tab === 'promo') {
        const r = await adminApi.getMarketers()
        setMarketers(r.marketers)
      } else if (tab === 'marketers') {
        const r = await adminApi.getMarketers()
        setMarketers(r.marketers)
      } else if (tab === 'stats') {
        const [p, m] = await Promise.all([adminApi.getStatsPurchases(), adminApi.getStatsMarketers()])
        setPurchases(p.purchases)
        setPurchasesTotal(p.totalAmount)
        setMarketerStats(m.marketers)
      } else if (tab === 'settings') {
        const r = await adminApi.getSettings()
        setSettings(r.settings)
        const raw = r.settings?.subscription_plans
        try {
          setSubscriptionPlans(raw ? JSON.parse(raw) : [{ responses: 1, price: 100 }, { responses: 3, price: 340 }, { responses: 5, price: 450 }, { responses: 10, price: 900 }])
        } catch {
          setSubscriptionPlans([{ responses: 1, price: 100 }, { responses: 3, price: 340 }, { responses: 5, price: 450 }, { responses: 10, price: 900 }])
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await adminApi.blockUser(userId, isBlocked)
      setSuccess(isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован')
      loadTab()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка')
    }
  }

  const handleSetSubscription = async (userId: string) => {
    const v = subResponses[userId]
    if (v === undefined || v === '') return
    const num = parseInt(v, 10)
    if (Number.isNaN(num) || num < 0) return
    try {
      await adminApi.setSubscription(userId, num)
      setSuccess('Подписка обновлена')
      setSubResponses((s) => ({ ...s, [userId]: '' }))
      loadTab()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка')
    }
  }

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseInt(promoValue, 10)
    if (!promoCode.trim() || Number.isNaN(value) || value < 1) {
      setError('Заполните код и значение скидки')
      return
    }
    try {
      await adminApi.createPromo({
        code: promoCode.trim(),
        discountType: promoType,
        discountValue: value,
        maxUses: promoMaxUses ? parseInt(promoMaxUses, 10) : undefined,
        marketerId: promoMarketerId || undefined,
      })
      setSuccess('Промокод создан')
      setPromoCode('')
      setPromoValue('')
      setPromoMaxUses('')
      setPromoMarketerId('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка')
    }
  }

  const handleCreateMarketer = async (e: React.FormEvent) => {
    e.preventDefault()
    const pct = parseFloat(marketerPercentage)
    if (!marketerEmail.trim() || Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError('Укажите email и процент (0–100)')
      return
    }
    try {
      const res = await adminApi.createMarketer({
        email: marketerEmail.trim(),
        percentage: pct,
      })
      setCreatedMarketerEmail(res.user.email)
      setCreatedMarketerPassword(res.oneTimePassword)
      setShowMarketerPasswordModal(true)
      setMarketerEmail('')
      setMarketerPercentage('')
      setError('')
      loadTab()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка')
    }
  }

  const handlePromoFieldToggle = async (enabled: boolean) => {
    try {
      await adminApi.setSetting('promo_code_field_enabled', enabled ? 'true' : 'false')
      setSuccess(enabled ? 'Поле промокода включено' : 'Поле промокода отключено')
      setSettings((s) => ({ ...s, promo_code_field_enabled: enabled ? 'true' : 'false' }))
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка')
    }
  }

  const handleSaveSubscriptionPlans = async () => {
    const valid = subscriptionPlans.filter((p) => Number.isFinite(p.responses) && p.responses > 0 && Number.isFinite(p.price) && p.price >= 0)
    if (valid.length === 0) {
      setError('Добавьте хотя бы один тариф (ответы > 0, цена ≥ 0)')
      return
    }
    setSavingPlans(true)
    setError('')
    try {
      await adminApi.setSetting('subscription_plans', JSON.stringify(valid))
      setSubscriptionPlans(valid)
      setSuccess('Тарифы сохранены')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка сохранения')
    } finally {
      setSavingPlans(false)
    }
  }

  if (!user) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'users', label: 'Пользователи' },
    { id: 'promo', label: 'Промокоды' },
    { id: 'marketers', label: 'Маркетологи' },
    { id: 'stats', label: 'Статистика' },
    { id: 'settings', label: 'Настройки' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Админ-панель</h1>

        {(error || success) && (
          <div className={`mb-4 p-3 rounded ${error ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
            {error || success}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setTab(id); setError(''); setSuccess('') }}
              className={`px-4 py-2 rounded-md text-sm font-medium ${tab === id ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <div className="text-gray-500 dark:text-gray-400">Загрузка…</div>}

        {!loading && tab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Поиск по email или имени"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button type="button" onClick={() => loadTab()} className="px-4 py-2 bg-primary-600 text-white rounded-md">Искать</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Всего: {usersTotal}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-2">Email / Имя</th>
                    <th className="text-left py-2">Роль</th>
                    <th className="text-left py-2">Блок</th>
                    <th className="text-left py-2">Ответов</th>
                    <th className="text-left py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">{u.email || '—'} / {u.name}</td>
                      <td>{u.role}</td>
                      <td>{u.isBlocked ? 'Да' : 'Нет'}</td>
                      <td>
                        {u.role === 'LANDLORD' ? (
                          <span className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={subResponses[u.id] ?? u.landlordResponseCount ?? ''}
                              onChange={(e) => setSubResponses((s) => ({ ...s, [u.id]: e.target.value }))}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <button type="button" onClick={() => handleSetSubscription(u.id)} className="text-primary-600 dark:text-primary-400 text-xs">Сохранить</button>
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleBlock(u.id, !u.isBlocked)}
                          className={`text-xs px-2 py-1 rounded ${u.isBlocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                        >
                          {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersTotal > 20 && (
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={usersPage <= 1} onClick={() => setUsersPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Назад</button>
                <span className="py-1">Стр. {usersPage}</span>
                <button type="button" disabled={usersPage * 20 >= usersTotal} onClick={() => setUsersPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Вперёд</button>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'promo' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Создать промокод</h2>
            <form onSubmit={handleCreatePromo} className="space-y-3 max-w-md">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Код</label>
                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Тип</label>
                  <select value={promoType} onChange={(e) => setPromoType(e.target.value as 'PERCENT' | 'FIXED')} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    <option value="PERCENT">Процент</option>
                    <option value="FIXED">Фикс. сумма (₽)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Значение</label>
                  <input type="number" min={1} value={promoValue} onChange={(e) => setPromoValue(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Макс. использований (пусто = без лимита)</label>
                <input type="number" min={1} value={promoMaxUses} onChange={(e) => setPromoMaxUses(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Маркетолог (необязательно)</label>
                <select value={promoMarketerId} onChange={(e) => setPromoMarketerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                  <option value="">—</option>
                  {marketers.map((m) => (
                    <option key={m.id} value={m.id}>{m.email} ({m.percentage}%)</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Создать</button>
            </form>
          </div>
        )}

        {!loading && tab === 'marketers' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Создать маркетолога</h2>
              <form onSubmit={handleCreateMarketer} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={marketerEmail} onChange={(e) => setMarketerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Процент (%)</label>
                  <input type="number" min={0} max={100} step={0.1} value={marketerPercentage} onChange={(e) => setMarketerPercentage(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Создать</button>
              </form>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Список маркетологов</h2>
              <ul className="space-y-2">
                {marketers.map((m: any) => (
                  <li key={m.id} className="flex flex-wrap justify-between items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700">
                    <span>{m.email} — {m.percentage}%</span>
                    <span className="text-gray-500 text-sm">
                      Промокодов: {m._count?.promoCodes ?? 0}
                      {' · '}
                      {m.contractAcceptedAt ? (
                        <>Договор подписан {format(new Date(m.contractAcceptedAt), 'dd.MM.yyyy')}</>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Договор не подписан</span>
                      )}
                    </span>
                    {m.contractAcceptedAt && (
                      <button
                        type="button"
                        onClick={async () => {
                          setMarketerContractEmail(m.email)
                          setShowMarketerContractModal(true)
                          setMarketerContractLoading(true)
                          setMarketerContractText('')
                          try {
                            const r = await adminApi.getMarketerContract(m.id)
                            setMarketerContractText(r.contractText)
                          } catch {
                            setMarketerContractText('Не удалось загрузить договор.')
                          } finally {
                            setMarketerContractLoading(false)
                          }
                        }}
                        className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Просмотр договора
                      </button>
                    )}
                  </li>
                ))}
                {marketers.length === 0 && <li className="text-gray-500">Нет маркетологов</li>}
              </ul>
            </div>
          </div>
        )}

        {!loading && tab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Покупки</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Всего сумма: <strong>{purchasesTotal} ₽</strong></p>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2">Дата</th>
                      <th className="text-left py-2">Арендодатель</th>
                      <th className="text-left py-2">Сумма</th>
                      <th className="text-left py-2">Промокод</th>
                      <th className="text-left py-2">Маркетолог</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-1">{format(new Date(p.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                        <td>{p.subscription?.landlord?.email ?? p.subscription?.landlordId}</td>
                        <td>{p.amount} ₽</td>
                        <td>{p.promoCode?.code ?? '—'}</td>
                        <td>{p.marketer?.email ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Заработок маркетологов</h2>
              <ul className="space-y-2">
                {marketerStats.map((m) => (
                  <li key={m.id} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span>{m.email} ({m.percentage}%)</span>
                    <span>Продажи: {m.totalSales} ₽ → Заработок: {m.earnings.toFixed(0)} ₽</span>
                  </li>
                ))}
                {marketerStats.length === 0 && <li className="text-gray-500">Нет данных</li>}
              </ul>
            </div>
          </div>
        )}

        {!loading && tab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Настройки</h2>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Поле промокода при оформлении подписки</span>
              <button
                type="button"
                onClick={() => handlePromoFieldToggle(settings.promo_code_field_enabled === 'false')}
                className={`px-3 py-1 rounded text-sm ${settings.promo_code_field_enabled === 'false' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}
              >
                {settings.promo_code_field_enabled === 'false' ? 'Включить' : 'Выключить'}
              </button>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Тарифы подписки (ответы / цена ₽)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Ответов</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Цена (₽)</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionPlans.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-1">
                          <input
                            type="number"
                            min={1}
                            value={p.responses}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10)
                              setSubscriptionPlans((prev) => prev.map((pl, j) => (j === i ? { ...pl, responses: Number.isNaN(v) ? 0 : v } : pl)))
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="py-1">
                          <input
                            type="number"
                            min={0}
                            value={p.price}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10)
                              setSubscriptionPlans((prev) => prev.map((pl, j) => (j === i ? { ...pl, price: Number.isNaN(v) ? 0 : v } : pl)))
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="py-1">
                          <button
                            type="button"
                            onClick={() => setSubscriptionPlans((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-600 hover:underline"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSubscriptionPlans((prev) => [...prev, { responses: 1, price: 0 }])}
                  className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm"
                >
                  Добавить тариф
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubscriptionPlans}
                  disabled={savingPlans}
                  className="px-3 py-1.5 rounded bg-green-600 text-white text-sm disabled:opacity-50"
                >
                  {savingPlans ? 'Сохранение…' : 'Сохранить тарифы'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMarketerPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowMarketerPasswordModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Маркетолог создан</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Передайте маркетологу данные для входа. Одноразовый пароль показывается один раз.</p>
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100 break-all">{createdMarketerEmail}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Одноразовый пароль</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100 font-mono text-sm select-all">
                      {createdMarketerPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdMarketerPassword)
                      }}
                      className="shrink-0 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded text-sm"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMarketerPasswordModal(false)}
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {showMarketerContractModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowMarketerContractModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Договор — {marketerContractEmail}</h3>
                <button type="button" onClick={() => setShowMarketerContractModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Закрыть</button>
              </div>
              <div className="p-4 overflow-auto flex-1">
                {marketerContractLoading ? (
                  <p className="text-gray-500 dark:text-gray-400">Загрузка…</p>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">{marketerContractText}</pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
