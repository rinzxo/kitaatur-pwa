import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import {
  getPersonalSummary,
  getPersonalGoals,
  createPersonalTransaction,
  createPersonalGoal,
  updatePersonalGoalProgress
} from '../controllers/personal.controller'

const router = Router()

// Seluruh route di file ini memerlukan otentikasi
router.use(requireAuth)

router.get('/summary', getPersonalSummary)
router.get('/goals', getPersonalGoals)
router.post('/goals', createPersonalGoal)
router.patch('/goals/:id/progress', updatePersonalGoalProgress)
router.post('/transaction', createPersonalTransaction)

export default router
