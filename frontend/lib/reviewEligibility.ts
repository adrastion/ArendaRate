import type { User } from '@/types'
import { UserRole } from '@/types'

/** Нужно подтвердить email перед отзывом (не арендодатель, не только OAuth). */
export function needsEmailVerificationForReview(user: User | null | undefined): boolean {
  if (!user) return false
  return (
    user.role !== UserRole.LANDLORD &&
    user.isOAuthUser !== true &&
    (!user.email || user.emailVerified !== true)
  )
}
