import { redirect } from 'next/navigation'
import { getBrowserApiBase } from '@/lib/api'
import { VerifyEmailBadLink } from './VerifyEmailBadLink'

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  if (!token) {
    return <VerifyEmailBadLink />
  }

  const apiBase = getBrowserApiBase()
  redirect(
    `${apiBase}/auth/verify-email?token=${encodeURIComponent(token)}`
  )
}
