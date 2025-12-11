import { authApi } from './api'
import { User } from '@/types'

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken()
  },

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    auth.setToken(response.token)
    return response.user
  },

  register: async (data: {
    email: string
    password: string
    name: string
    dateOfBirth: string
  }) => {
    const response = await authApi.register(data)
    auth.setToken(response.token)
    return response.user
  },

  logout: () => {
    auth.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await authApi.getMe()
      return response.user
    } catch {
      return null
    }
  },
}

