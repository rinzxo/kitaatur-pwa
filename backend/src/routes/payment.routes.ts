import { Router } from 'express'
import { createCheckout } from '../controllers/payment.controller'
import { validateVoucher } from '../controllers/voucher.controller'

const router = Router()

// Endpoint untuk frontend meminta pembuatan tautan pembayaran
router.post('/checkout', createCheckout)

// Endpoint untuk mengecek dan memvalidasi kode voucher
router.post('/validate-voucher', validateVoucher)

export default router
