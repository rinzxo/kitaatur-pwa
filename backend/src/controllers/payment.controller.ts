import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { Prisma } from '@prisma/client'
import { Pakasir } from 'pakasir'

export async function createCheckout(req: Request, res: Response) {
  const { planType, amount, userId } = req.body

  if (!planType || !amount || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: planType, amount, or userId' })
  }

  try {
    const projectSlug = process.env.PAKASIR_PROJECT_SLUG
    const apiKey = process.env.PAKASIR_API_KEY
    
    if (!projectSlug || !apiKey) {
      console.error('PAKASIR_PROJECT_SLUG or PAKASIR_API_KEY is not defined in .env')
      return res.status(500).json({ error: 'Payment gateway is not configured properly' })
    }

    const pakasir = new Pakasir({
      project: projectSlug,
      api_key: apiKey
    })

    const robustOrderId = `sub_${planType}_${userId}_${Date.now()}`

    // The redirect URL back to the app after payment on Pakasir's end
    const redirectUrl = `http://localhost:3000/personal/settings/subscription`

    const transaction = await pakasir.createTransaction(
      robustOrderId, 
      'QRIS', 
      Number(amount), 
      true, 
      redirectUrl
    )

    if (!transaction || !transaction.payment) {
      throw new Error('Gagal mendapatkan respon pembayaran dari Pakasir')
    }

    const checkoutUrl = transaction.payment.payment_url || ''
    const qrString = transaction.payment.payment_number || ''

    // SIMPAN KE DATABASE DENGAN STATUS UNPAID
    // Cari apakah user sudah punya subscription. Jika ya, timpa/update yang ada
    // Tapi karena orderId unik, lebih baik kita upsert berdasarkan profile_id saja, 
    // asumsinya 1 user 1 active subscription.
    // Atau lebih baik create new record, tapi kita harus hati-hati agar tidak menumpuk.
    // Kita gunakan profile_id sebagai unique? Tidak, profile_id bukan unique di subscriptions.
    
    // Untuk payment in-app, kita insert record baru. Jika ada unpaid yang lama, bisa di-ignore.
    const newSub = await prisma.subscriptions.create({
      data: {
        profile_id: userId,
        pakasir_subscription_id: robustOrderId,
        status: 'unpaid',
        plan_type: planType,
        amount_paid: new Prisma.Decimal(amount),
        starts_at: new Date(),
        expires_at: transaction.payment.expired_at ? new Date(transaction.payment.expired_at) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        payment_url: qrString || checkoutUrl
      }
    })

    return res.status(200).json({ 
      success: true, 
      checkoutUrl: qrString || checkoutUrl,
      orderId: robustOrderId,
      subscriptionId: newSub.id
    })

  } catch (err: any) {
    console.error('Error creating checkout:', err.message || err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
