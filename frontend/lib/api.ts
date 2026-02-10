import axios from 'axios'
import { User, Review, Apartment, Address, AddressSearchResult } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** URL для загрузок (uploads) — без /api, т.к. статика отдаётся с корня бэкенда */
export function getUploadUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const baseForUploads = base.replace(/\/api\/?$/, '')
  return `${baseForUploads}${path.startsWith('/') ? path : `/${path}`}`
}

/** URL аватарки: полные URL (OAuth) — как есть, относительные — через getUploadUrl */
export function getAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
  return getUploadUrl(avatar)
}

// Убираем /api из baseURL, так как NEXT_PUBLIC_API_URL уже содержит полный путь к API
// Для localhost: NEXT_PUBLIC_API_URL=http://localhost:3001 (без /api)
// Для production: NEXT_PUBLIC_API_URL=https://arendrate.ru/api (с /api)
const baseURL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Простой кэш для API запросов
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 минута

function getCacheKey(url: string, params?: any): string {
  return `${url}?${JSON.stringify(params || {})}`
}

function getCached(key: string): any | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// Функция для очистки кэша маркеров
function clearMarkersCache(): void {
  const keysToDelete: string[] = []
  cache.forEach((_, key) => {
    if (key.includes('/addresses/map')) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => cache.delete(key))
}

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удаление токена при 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (data: {
    email: string
    password: string
    name: string
    dateOfBirth: string
    userType?: 'renter' | 'landlord'
    landlordPlan?: { planType: number; amount: number; promoCode?: string }
  }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  /** Переключиться на привязанный аккаунт (арендатор ↔ арендодатель). */
  switchToLinked: async (): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/switch-to-linked')
    return response.data
  },

  /** Создать аккаунт арендодателя и привязать к текущему арендатору. */
  linkLandlord: async (data: {
    password: string
    landlordPlan: { planType: number; amount: number; promoCode?: string }
  }): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/link-landlord', data)
    return response.data
  },

  /** Создать аккаунт арендатора и привязать к текущему арендодателю (после принятия соглашения). */
  createLinkedRenter: async (): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/create-linked-renter', { acceptTerms: true })
    return response.data
  },

  /** VK ID One Tap: обмен access_token на JWT. При userType=landlord возвращает needLandlordPlan. */
  vkTokenLogin: async (
    accessToken: string,
    userType?: 'renter' | 'landlord'
  ): Promise<{ user: User; token: string; needLandlordPlan?: boolean }> => {
    const response = await api.post('/auth/vk/token', {
      access_token: accessToken,
      ...(userType && { userType }),
    })
    return response.data
  },
}

export const userApi = {
  updateEmail: async (email: string): Promise<{ user: User }> => {
    const response = await api.put('/user/me/email', { email })
    return response.data
  },
  updateAvatar: async (file: File): Promise<{ user: User }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  updatePassword: async (data: {
    currentPassword?: string
    newPassword: string
  }): Promise<{ status: 'ok' }> => {
    const response = await api.put('/user/me/password', data)
    return response.data
  },

  addLandlordApartment: async (apartmentId: string): Promise<{ landlordApartments: any[] }> => {
    const response = await api.post('/user/me/landlord-apartments', { apartmentId })
    return response.data
  },

  removeLandlordApartment: async (apartmentId: string): Promise<void> => {
    await api.delete(`/user/me/landlord-apartments/${apartmentId}`)
  },

  getLandlordReviews: async (): Promise<{ answered: any[]; unanswered: any[] }> => {
    const response = await api.get('/user/me/landlord-reviews')
    return response.data
  },

  /** Создать платёж ЮKassa — возвращает URL для редиректа на оплату. */
  landlordCreatePayment: async (data: {
    planType: number
    amount: number
    promoCode?: string
  }): Promise<{ confirmationUrl: string; paymentId: string }> => {
    const response = await api.post('/user/me/landlord-create-payment', data)
    return response.data
  },

  /** Докупка ответов (мгновенно, без ЮKassa — для тестов или если платёж не настроен). */
  landlordTopUp: async (data: {
    planType: number
    amount: number
    promoCode?: string
  }): Promise<{ responsesRemaining: number }> => {
    const response = await api.post('/user/me/landlord-top-up', data)
    return response.data
  },
}

/** Публичный API тарифов подписки (для модалки). */
export const subscriptionPlansApi = {
  getPlans: async (): Promise<{ plans: { responses: number; price: number }[] }> => {
    const response = await api.get('/payments/subscription-plans')
    return response.data
  },
}

export const addressApi = {
  search: async (
    query: string,
    options?: { near?: { lat: number; lng: number } }
  ): Promise<{ addresses: AddressSearchResult[] }> => {
    const params: { q: string; near?: string } = { q: query }
    if (options?.near) {
      params.near = `${options.near.lat},${options.near.lng}`
    }
    const cacheKey = getCacheKey('/addresses/search', params)
    const cached = getCached(cacheKey)
    if (cached) return cached

    const response = await api.get('/addresses/search', { params })
    setCache(cacheKey, response.data)
    return response.data
  },

  getMapMarkers: async (bounds?: string): Promise<{ markers: any[] }> => {
    const cacheKey = getCacheKey('/addresses/map', { bounds })
    const cached = getCached(cacheKey)
    if (cached) return cached

    const response = await api.get('/addresses/map', { params: { bounds } })
    setCache(cacheKey, response.data)
    return response.data
  },

  getById: async (id: string): Promise<{ address: Address; apartments: Apartment[] }> => {
    const cacheKey = getCacheKey(`/addresses/${id}`)
    const cached = getCached(cacheKey)
    if (cached) return cached

    const response = await api.get(`/addresses/${id}`)
    setCache(cacheKey, response.data)
    return response.data
  },

  getByIdWithReviews: async (id: string): Promise<{
    address: Address
    apartments: Array<Apartment & { reviews: Review[] }>
  }> => {
    const cacheKey = getCacheKey(`/addresses/${id}`, { withReviews: true })
    const cached = getCached(cacheKey)
    if (cached) return cached

    const response = await api.get(`/addresses/${id}`, { params: { withReviews: 'true' } })
    setCache(cacheKey, response.data)
    return response.data
  },

  create: async (data: {
    country: string
    city: string
    street: string
    building: string
    latitude?: number
    longitude?: number
  }): Promise<{ address: Address }> => {
    const response = await api.post('/addresses', data)
    // Очищаем кэш после создания нового адреса
    cache.clear()
    return response.data
  },

  createApartment: async (data: {
    addressId: string
    apartmentNumber: string
  }): Promise<{ apartment: Apartment }> => {
    const response = await api.post('/addresses/apartments', data)
    return response.data
  },
}

export const apartmentApi = {
  getById: async (id: string): Promise<{ apartment: Apartment & { reviews: Review[] } }> => {
    const cacheKey = getCacheKey(`/apartments/${id}`)
    const cached = getCached(cacheKey)
    if (cached) return cached

    const response = await api.get(`/apartments/${id}`)
    setCache(cacheKey, response.data)
    return response.data
  },
}

export const reviewApi = {
  create: async (data: {
    apartmentId: string
    comment: string
    periodFrom: string
    periodTo: string
    ratings: Array<{ criterion: string; score: number }>
    photoUrls?: string[]
  }): Promise<{ review: Review }> => {
    const response = await api.post('/reviews', data)
    // Очищаем кэш квартир и маркеров после создания отзыва
    clearMarkersCache()
    cache.clear()
    return response.data
  },

  update: async (id: string, data: {
    comment: string
    periodFrom: string
    periodTo: string
    ratings: Array<{ criterion: string; score: number }>
  }): Promise<{ review: Review }> => {
    const response = await api.put(`/reviews/${id}`, data)
    // Очищаем кэш после редактирования
    cache.clear()
    return response.data
  },

  getMyReviews: async (): Promise<{ reviews: Review[] }> => {
    const response = await api.get('/reviews/my')
    return response.data
  },

  getById: async (id: string): Promise<{ review: Review }> => {
    const response = await api.get(`/reviews/${id}`)
    return response.data
  },

  reply: async (reviewId: string, text: string): Promise<{ review: Review }> => {
    const response = await api.post(`/reviews/${reviewId}/reply`, { text })
    cache.clear()
    return response.data
  },

  vote: async (reviewId: string, vote: 1 | -1): Promise<{ likes: number; dislikes: number }> => {
    const response = await api.post(`/reviews/${reviewId}/vote`, { vote })
    cache.clear()
    return response.data
  },

  report: async (reviewId: string, reason?: string): Promise<void> => {
    await api.post(`/reviews/${reviewId}/report`, { reason })
  },
}

export const uploadApi = {
  uploadPhotos: async (files: File[]): Promise<{ photos: Array<{ url: string }> }> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('photos', file)
    })
    const response = await api.post('/upload/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  linkPhotosToReview: async (reviewId: string, photoUrls: string[]): Promise<{ photos: any[] }> => {
    const response = await api.post('/upload/photos/link', { reviewId, photoUrls })
    return response.data
  },
}

export const moderationApi = {
  getPendingReviews: async (page = 1, limit = 20) => {
    const response = await api.get('/moderation/pending', { params: { page, limit } })
    return response.data
  },

  approveReview: async (id: string) => {
    const response = await api.post(`/moderation/${id}/approve`)
    // Очищаем кэш маркеров после одобрения отзыва
    clearMarkersCache()
    return response.data
  },

  rejectReview: async (id: string, reason: string) => {
    const response = await api.post(`/moderation/${id}/reject`, { reason })
    return response.data
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/moderation/${id}`)
    // Очищаем кэш после удаления
    clearMarkersCache()
    cache.clear()
    return response.data
  },
}

export const marketerApi = {
  getMe: async (): Promise<{
    marketer: {
      id: string
      email: string
      percentage: number
      promoCodes: Array<{
        id: string
        code: string
        discountType: string
        discountValue: number
        usedCount: number
        maxUses: number | null
        isActive: boolean
        createdAt: string
      }>
      totalSales: number
      earnings: number
    }
  }> => {
    const response = await api.get('/marketer/me')
    return response.data
  },
}

export const adminApi = {
  getUsers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },
  blockUser: async (userId: string, isBlocked: boolean) => {
    await api.patch(`/admin/users/${userId}/block`, { isBlocked })
  },
  setSubscription: async (userId: string, responsesRemaining: number) => {
    const response = await api.patch(`/admin/users/${userId}/subscription`, { responsesRemaining })
    return response.data
  },
  createPromo: async (data: {
    code: string
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number
    maxUses?: number
    marketerId?: string
  }) => {
    const response = await api.post('/admin/promo', data)
    return response.data
  },
  getMarketers: async () => {
    const response = await api.get('/admin/marketers')
    return response.data
  },
  createMarketer: async (data: { email: string; percentage: number }) => {
    const response = await api.post<{ user: { id: string; email: string }; marketer: { id: string; percentage: number }; oneTimePassword: string }>('/admin/marketers', data)
    return response.data
  },
  getStatsPurchases: async () => {
    const response = await api.get('/admin/stats/purchases')
    return response.data
  },
  getStatsMarketers: async () => {
    const response = await api.get('/admin/stats/marketers')
    return response.data
  },
  getSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },
  setSetting: async (key: string, value: string) => {
    await api.patch('/admin/settings', { key, value })
  },
}

export default api

