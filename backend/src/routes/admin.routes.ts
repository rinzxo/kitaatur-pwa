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
  forceDeleteOrg,
  getSchoolLinkedOrgsAdmin,
  linkOrgsToSchoolAdmin,
  unlinkOrgFromSchoolAdmin,
  createSchoolOrgAdmin,
  getPublicAppInfo,
  updateSystemAppInfo
} from '../controllers/admin.controller'
import {
  getAllVouchersAdmin,
  createVoucherAdmin,
  updateVoucherAdmin,
  deleteVoucherAdmin
} from '../controllers/voucher.controller'

const router = Router()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'generalrino@gmail.com'

// Middleware khusus dev
const requireDev = (req: any, res: any, next: any) => {
  if (!req.user?.email || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied: Dev only' })
  }
  next()
}

// === PUBLIC ROUTES ===
// Public endpoint for active announcements & app version info
router.get('/announcements/active', getActiveAnnouncements)
router.get('/app-info', getPublicAppInfo)

// === ADMIN ROUTES ===
router.use(requireAuth)
router.use(requireDev)

// Stats & Orgs
router.get('/stats', getSystemStats)
router.get('/orgs', getAllOrgs)
router.post('/orgs/create-school', createSchoolOrgAdmin)
router.delete('/orgs/:id', forceDeleteOrg)

// Subs
router.post('/subscriptions/grant', grantSubscription)

// Settings (Maintenance mode etc)
router.get('/settings', getSystemSettings)
router.put('/settings/:key', updateSystemSetting)
router.put('/system-app-info', updateSystemAppInfo)

// Announcements management
router.get('/announcements', getAnnouncementsAdmin)
router.post('/announcements', createAnnouncement)
// School Ekosistem & Ekskul Pairing
router.get('/schools/:schoolId/links', getSchoolLinkedOrgsAdmin)
router.post('/schools/:schoolId/links', linkOrgsToSchoolAdmin)
// Vouchers Management
router.get('/vouchers', getAllVouchersAdmin)
router.post('/vouchers', createVoucherAdmin)
router.put('/vouchers/:id', updateVoucherAdmin)
router.delete('/vouchers/:id', deleteVoucherAdmin)

export default router
