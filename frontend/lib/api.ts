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

export default api

