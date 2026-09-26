import { Router } from 'express'
import { handleKitapayWebhook } from '../controllers/webhook.controller'

const router = Router()

// Webhook dipanggil secara publik oleh server KitaPay
router.post('/kitapay', handleKitapayWebhook)

export default router
