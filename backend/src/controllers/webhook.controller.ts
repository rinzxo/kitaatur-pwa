import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { Prisma, user_global_role } from '@prisma/client'

export async function handlePakasirWebhook(req: Request, res: Response) {
  // Pakasir webhook payload
  const payload = req.body

  if (!payload) {
    return res.status(400).json({ error: 'Payload tidak valid' })
  }

  // Pakasir SDK / API typically sends transaction status in standard format
  const event = payload.event || payload.status || 'PAID'
  const data = payload.data || payload

  console.log(`[Webhook Received] Event: ${event}`, data)

  // Menangani event pembayaran sukses
  if (event === 'PAID' || event === 'payment.success' || event === 'subscription.activated' || event === 'completed' || event === 'success') {
    // Pakasir returns order_id as the ID we sent!
    const order_id = data.order_id || data.subscription_id
    const user_id = data.user_id || data.customer_id
    const amount = data.amount || data.total_payment || data.gross_amount
    const expires_at = data.expires_at

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id dalam payload data' })
    }

    // Extract plan from order_id, assuming format: sub_{planType}_{timestamp}_{random}
    let planType = 'premium'
    if (order_id.includes('sub_plus_')) planType = 'plus'
    else if (order_id.includes('sub_enterprise_')) planType = 'enterprise'
    else if (data.plan) planType = data.plan

    // Note: since Pakasir might not return user_id if we didn't pass it in a specific field,
    // we could also extract user_id from order_id if needed, but we rely on Pakasir passing it,
    // or we fetch user_id from a pending_transactions table (which we skipped for simplicity).
    // Let's assume we can fetch it, OR we'll just require the user to send user_id.
    // Wait, the frontend sends user_id, but the checkout link might not preserve it.
    // For safety, let's embed user_id in the orderId as well!
    // But since the webhook payload already expects user_id... let's check order_id for it:
    // Format: sub_{planType}_{userId}_{timestamp}

    try {
      // If user_id is missing, let's try to extract from order_id
      // Split by _ and assume index 2 is user_id if we formatted it that way
      // We will adjust payment.controller to format: sub_{planType}_{userId}_{timestamp}
      const parts = order_id.split('_')
      const parsedUserId = parts.length >= 4 ? parts[2] : null
      const finalUserId = user_id || parsedUserId

      if (!finalUserId) {
         return res.status(400).json({ error: 'Missing user_id' })
      }

      await prisma.$transaction(async (tx) => {
        // A. Catat atau perbarui record subscription di database
        await tx.subscriptions.upsert({
          where: {
            pakasir_subscription_id: order_id
          },
          create: {
            profile_id: finalUserId,
            pakasir_subscription_id: order_id,
            status: 'active',
            plan_type: planType,
            amount_paid: amount ? new Prisma.Decimal(amount) : null,
            starts_at: new Date(),
            expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          update: {
            status: 'active',
            amount_paid: amount ? new Prisma.Decimal(amount) : null,
            expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
