/**
 * Создание платежа в ЮKassa (API v3).
 * Документация: https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start
 */
const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments'

export interface CreatePaymentParams {
  amountRub: number
  description: string
  returnUrl: string
  metadata?: Record<string, string>
}

export interface CreatePaymentResult {
  id: string
  confirmationUrl: string
  status: string
}

export async function createYookassaPayment(params: CreatePaymentParams): Promise<CreatePaymentResult | null> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey) return null

  const idempotenceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64')

  const body = {
    amount: {
      value: params.amountRub.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    description: params.description.slice(0, 128),
    metadata: params.metadata || {},
  }

  const res = await fetch(YOOKASSA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('YooKassa create payment error:', res.status, err)
    throw new Error(`YooKassa error: ${res.status}`)
  }

  const data = await res.json()
  const confirmationUrl = data.confirmation?.confirmation_url
  if (!data.id || !confirmationUrl) {
    console.error('YooKassa invalid response:', data)
    throw new Error('Invalid YooKassa response')
  }

  return {
    id: data.id,
    confirmationUrl,
    status: data.status || 'pending',
  }
}
