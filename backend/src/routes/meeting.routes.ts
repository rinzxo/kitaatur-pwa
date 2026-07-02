import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireOrgRole } from '../middleware/role.middleware'
import {
  createMeetingMinutes,
  getMeetingMinutes
} from '../controllers/meeting.controller'

const router = Router()

router.use(requireAuth)

// Buat notulensi dengan AI Summarization (Hanya Head & Sekretaris)
router.post('/:orgIdOrSlug', requireOrgRole(['head', 'sekretaris']), createMeetingMinutes)

// Ambil riwayat notulensi (Semua anggota)
router.get('/:orgIdOrSlug', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getMeetingMinutes)

export default router
