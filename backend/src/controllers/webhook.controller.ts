import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { Prisma, user_global_role } from '@prisma/client'

export async function handleKitapayWebhook(req: Request, res: Response) {
  const payload = req.body

  if (!payload) {
    return res.status(400).json({ error: 'Payload tidak valid' })
  }

  const { status, transactionId: transaction_id, externalId: external_id, amount } = payload

  console.log(`[Webhook Received] Status: ${status}`, payload)

  if (status === 'PAID') {
    if (!transaction_id || !external_id) {
      return res.status(400).json({ error: 'Missing transactionId or externalId' })
    }

    // Find the subscription by transaction_id
    const existingSub = await prisma.subscriptions.findUnique({
      where: { kitapay_transaction_id: transaction_id }
    })

    if (!existingSub) {
       return res.status(404).json({ error: 'Subscription not found for this transaction' })
    }

    const finalUserId = existingSub.profile_id
    const planType = existingSub.plan_type

    try {
      await prisma.$transaction(async (tx) => {
        // A. Catat atau perbarui record subscription di database
        await tx.subscriptions.upsert({
          where: {
            kitapay_transaction_id: transaction_id
          },
          create: {
            profile_id: finalUserId,
            kitapay_transaction_id: transaction_id,
            status: 'active',
            plan_type: planType,
            amount_paid: amount ? new Prisma.Decimal(amount) : null,
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          update: {
            status: 'active',
            amount_paid: amount ? new Prisma.Decimal(amount) : null,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
          }
        })

        // B. Tingkatkan global_role user menjadi 'head' agar bisa membuat organisasi
        await tx.profiles.update({
          where: {
            id: finalUserId
          },
          data: {
            global_role: user_global_role.head
          }
        })
      })

      return res.status(200).json({ success: true })
    } catch (err: any) {
      console.error('Error handling webhook:', err)
      return res.status(500).json({ error: 'Internal Server Error', details: err.message })
    }
  }

  return res.status(200).json({ success: true, message: 'Event ignored' })
}
