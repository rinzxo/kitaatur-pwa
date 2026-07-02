import { Router } from 'express'
import { handlePakasirWebhook } from '../controllers/webhook.controller'

const router = Router()

// Webhook dipanggil secara publik oleh server Pakasir.com
router.post('/pakasir', handlePakasirWebhook)

export default router
