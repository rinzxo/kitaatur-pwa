import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { getTrialStatus, claimTrial } from '../controllers/trial.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

// Rate limiter khusus endpoint klaim trial (10 request per 15 menit per IP)
const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak permintaan klaim dari IP ini. Silakan coba lagi setelah 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false
})

router.use(requireAuth)

router.get('/status', getTrialStatus)
router.post('/claim', claimLimiter, claimTrial)

export default router
