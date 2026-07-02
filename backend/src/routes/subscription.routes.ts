import { Router } from 'express'
import { getMySubscriptions, getSubscriptionById } from '../controllers/subscription.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

router.use(requireAuth)

router.get('/me', getMySubscriptions)
router.get('/:id', getSubscriptionById)

export default router
