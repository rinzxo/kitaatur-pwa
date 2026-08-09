import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import {
  getSystemStats,
  getAllOrgs,
  grantSubscription,
  getSystemSettings,
  updateSystemSetting,
  getAnnouncementsAdmin,
  createAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  forceDeleteOrg
} from '../controllers/admin.controller'

const router = Router()

// Middleware khusus dev
const requireDev = (req: any, res: any, next: any) => {
  if (req.user?.email !== 'generalrino@gmail.com') {
    return res.status(403).json({ error: 'Access denied: Dev only' })
  }
  next()
}

// === PUBLIC ROUTES ===
// Public endpoint for active announcements
router.get('/announcements/active', getActiveAnnouncements)

// === ADMIN ROUTES ===
router.use(requireAuth)
router.use(requireDev)

// Stats & Orgs
router.get('/stats', getSystemStats)
router.get('/orgs', getAllOrgs)
router.delete('/orgs/:id', forceDeleteOrg)

// Subs
router.post('/subscriptions/grant', grantSubscription)

// Settings (Maintenance mode etc)
router.get('/settings', getSystemSettings)
router.put('/settings/:key', updateSystemSetting)

// Announcements management
router.get('/announcements', getAnnouncementsAdmin)
router.post('/announcements', createAnnouncement)
router.delete('/announcements/:id', deleteAnnouncement)

export default router
