import express, { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getSubscriptionPlans } from '../lib/subscriptionPlans'
import { incrementPromoUsage } from '../services/promoService'

const router = express.Router()

// Публичный: список тарифов подписки (для модалки на фронте)
router.get('/subscription-plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await getSubscriptionPlans()
    res.json({ plans })
  } catch (e) {
    next(e)
  }
})

// Webhook ЮKassa (уведомления о статусе платежа)
// Документация: https://yookassa.ru/developers/using-api/webhooks
router.post('/yookassa-webhook', express.json(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {}
    const { type, event, object: paymentObject } = body
    const paymentId = paymentObject?.id ?? body.object?.id

    console.log('[YooKassa webhook]', { type, event, paymentId: paymentId ?? 'missing', hasBody: !!req.body })

    if (type !== 'notification' || event !== 'payment.succeeded' || !paymentId) {
      res.status(200).send('ok')
      return
    }

    const pending = await prisma.pendingYookassaPayment.findUnique({
      where: { yookassaPaymentId: String(paymentId) },
      include: { landlord: { select: { id: true } } },
    })

    if (!pending) {
      console.warn('[YooKassa webhook] Pending payment not found for id:', paymentId)
      res.status(200).send('ok')
      return
    }
    if (pending.status !== 'PENDING') {
      console.log('[YooKassa webhook] Payment already processed:', pending.id, pending.status)
      res.status(200).send('ok')
      return
    }
    if (!pending.subscriptionId) {
      console.error('[YooKassa webhook] Pending payment has no subscriptionId:', pending.id)
      res.status(200).send('ok')
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.landlordSubscription.update({
        where: { id: pending.subscriptionId },
        data: { responsesRemaining: { increment: pending.planType } },
      })
      await tx.landlordSubscriptionPurchase.create({
        data: {
          subscriptionId: pending.subscriptionId,
          planType: pending.planType,
          amount: pending.amount,
          responsesGranted: pending.planType,
          promoCodeId: pending.promoCodeId ?? undefined,
          marketerId: pending.marketerId ?? undefined,
        },
      })
      await tx.pendingYookassaPayment.update({
        where: { id: pending.id },
        data: { status: 'COMPLETED' },
      })
    })

    if (pending.promoCodeId) await incrementPromoUsage(pending.promoCodeId)

    console.log('[YooKassa webhook] Success: credited', pending.planType, 'responses to subscription', pending.subscriptionId)
    res.status(200).send('ok')
  } catch (e) {
    console.error('YooKassa webhook error:', e)
    next(e)
  }
})

export default router
