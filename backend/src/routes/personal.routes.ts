import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import {
  getPersonalSummary,
  getPersonalGoals,
  createPersonalTransaction,
  createPersonalGoal,
  updatePersonalGoalProgress,
  getProfile,
  updateProfile
} from '../controllers/personal.controller'

const router = Router()

// Seluruh route di file ini memerlukan otentikasi
router.use(requireAuth)

router.get('/profile', getProfile)
router.patch('/profile', updateProfile)

router.get('/summary', getPersonalSummary)
router.get('/goals', getPersonalGoals)
router.post('/goals', createPersonalGoal)
router.patch('/goals/:id/progress', updatePersonalGoalProgress)
router.post('/transaction', createPersonalTransaction)

export default router
