import { prisma } from './prisma'

const DEFAULT_PLANS = [
  { responses: 1, price: 100 },
  { responses: 3, price: 340 },
  { responses: 5, price: 450 },
  { responses: 10, price: 900 },
]

export type SubscriptionPlan = { responses: number; price: number }

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const row = await prisma.systemSettings.findUnique({
      where: { key: 'subscription_plans' },
    })
    if (!row?.value) return DEFAULT_PLANS
    const parsed = JSON.parse(row.value) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PLANS
    const plans = parsed.filter(
      (p: unknown): p is SubscriptionPlan =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as any).responses === 'number' &&
        typeof (p as any).price === 'number'
    )
    return plans.length > 0 ? plans : DEFAULT_PLANS
  } catch {
    return DEFAULT_PLANS
  }
}

export function getPlanPrice(plans: SubscriptionPlan[], planType: number): number | undefined {
  const plan = plans.find((p) => p.responses === planType)
  return plan?.price
}
