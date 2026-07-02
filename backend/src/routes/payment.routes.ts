import { Router } from 'express'
import { createCheckout } from '../controllers/payment.controller'

const router = Router()

// Endpoint untuk frontend meminta pembuatan tautan pembayaran
router.post('/checkout', createCheckout)

export default router
