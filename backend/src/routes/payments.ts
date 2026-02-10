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
router.post('/yookassa-webhook', express.json(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, event, object: paymentObject } = req.body || {}
    if (type !== 'notification' || event !== 'payment.succeeded' || !paymentObject?.id) {
      res.status(200).send('ok')
      return
    }

    const paymentId = paymentObject.id as string
    const pending = await prisma.pendingYookassaPayment.findUnique({
      where: { yookassaPaymentId: paymentId },
      include: { landlord: { select: { id: true } } },
    })

    if (!pending || pending.status !== 'PENDING') {
      res.status(200).send('ok')
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.landlordSubscription.update({
        where: { id: pending.subscriptionId! },
        data: { responsesRemaining: { increment: pending.planType } },
      })
      await tx.landlordSubscriptionPurchase.create({
        data: {
          subscriptionId: pending.subscriptionId!,
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

    res.status(200).send('ok')
  } catch (e) {
    console.error('YooKassa webhook error:', e)
    next(e)
  }
})

export default router
