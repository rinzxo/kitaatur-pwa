import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { getNotifications, markAsRead, subscribePush, testPush } from '../controllers/notification.controller'

const router = Router()

// Semua route di sini butuh autentikasi global
router.use(requireAuth)

router.get('/', getNotifications)
router.post('/read', markAsRead)
router.post('/subscribe', subscribePush)
router.post('/test', testPush)

export default router
