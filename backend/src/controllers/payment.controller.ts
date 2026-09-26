import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { Prisma } from '@prisma/client'

export async function createCheckout(req: Request, res: Response) {
  const { planType, amount, userId } = req.body

  if (!planType || !amount || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: planType, amount, or userId' })
  }

  try {
    const merchantId = process.env.KITAPAY_MERCHANT_ID
    const apiKey = process.env.KITAPAY_API_KEY
    const targetWebhookUrl = process.env.KITAPAY_WEBHOOK_URL || 'https://kitaatur-sept-production.up.railway.app/api/webhooks/kitapay'
    
    if (!merchantId || !apiKey) {
      console.error('KITAPAY_MERCHANT_ID or KITAPAY_API_KEY is not defined in .env')
      return res.status(500).json({ error: 'Payment gateway is not configured properly' })
    }

    const userProfile = await prisma.profiles.findUnique({
      where: { id: userId }
    })
    const realEmail = userProfile?.email || "user@kitaatur.com"

    const robustOrderId = `sub_${planType}_${userId}_${Date.now()}`

    const baseUrl = process.env.KITAPAY_API_URL || 'http://localhost:4000'
    const response = await fetch(`${baseUrl}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantId,
        amount: Number(amount),
        externalId: robustOrderId,
        targetWebhookUrl,
        customerEmail: realEmail,
        customerWhatsapp: "081234567890",
        paymentMethod: "qris"
      })
    })

    const result: any = await response.json()

    if (!response.ok || !result.success || !result.transactionId) {
      console.error('KitaPay Error:', result)
      throw new Error('Gagal mendapatkan respon pembayaran dari KitaPay')
    }

    const { transactionId, qrisString: qrString, expiresAt: expires_at } = result

    const newSub = await prisma.subscriptions.create({
      data: {
        profile_id: userId,
        kitapay_transaction_id: transactionId,
        status: 'unpaid',
        plan_type: planType,
        amount_paid: new Prisma.Decimal(amount),
        starts_at: new Date(),
        expires_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        payment_url: qrString || ''
      }
    })

    return res.status(200).json({ 
      success: true, 
      transactionId,
      orderId: robustOrderId,
      subscriptionId: newSub.id
    })

  } catch (err: any) {
    console.error('Error creating checkout:', err.message || err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
