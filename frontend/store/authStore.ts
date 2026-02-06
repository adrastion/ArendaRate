import { create } from 'zustand'
import { User } from '@/types'
import { auth } from '@/lib/auth'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    name: string
    dateOfBirth: string
  }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  /** Переключиться на привязанный аккаунт (арендатор ↔ арендодатель). */
  switchToLinkedAccount: () => Promise<void>
  /** Создать аккаунт арендодателя и привязать к текущему арендатору. */
  linkLandlordAccount: (data: {
    password: string
    landlordPlan: { planType: number; amount: number; promoCode?: string }
  }) => Promise<void>
  /** Создать аккаунт арендатора и привязать к текущему арендодателю (после принятия соглашения). */
  createLinkedRenterAccount: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  login: async (email, password) => {
    const user = await auth.login(email, password)
    set({ user, isLoading: false })
  },

  register: async (data) => {
    const user = await auth.register(data)
    set({ user, isLoading: false })
  },

  logout: () => {
    auth.logout()
    set({ user: null, isLoading: false })
  },

  checkAuth: async () => {
    if (auth.isAuthenticated()) {
      try {
        const user = await auth.getCurrentUser()
        set({ user, isLoading: false })
      } catch {
        set({ user: null, isLoading: false })
      }
    } else {
      set({ user: null, isLoading: false })
    }
  },

  switchToLinkedAccount: async () => {
    const { token } = await authApi.switchToLinked()
    auth.setToken(token)
    const user = await auth.getCurrentUser()
    set({ user, isLoading: false })
  },

  linkLandlordAccount: async (data) => {
    const { token } = await authApi.linkLandlord(data)
    auth.setToken(token)
    const user = await auth.getCurrentUser()
    set({ user, isLoading: false })
  },

  createLinkedRenterAccount: async () => {
    const { token } = await authApi.createLinkedRenter()
    auth.setToken(token)
    const user = await auth.getCurrentUser()
    set({ user, isLoading: false })
  },
}))

