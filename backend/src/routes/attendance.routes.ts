import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireOrgRole } from '../middleware/role.middleware'
import {
  createSession,
  getActiveSession,
  closeSession,
  checkIn,
  getAttendanceRecords,
  getAttendanceStats,
  getSessions,
  updateAttendanceStatus,
  getAgenda,
  validateAttendance,
  getMyAttendanceHistory,
  manualBulkCheckIn,
  getPendingCollaborations,
  acceptCollaboration,
  rejectCollaboration,
  getSessionMembers
} from '../controllers/attendance.controller'

import {
  generateAttendanceInsight,
  validateProofWithAI
} from '../controllers/ai.controller'

const router = Router()

router.use(requireAuth)

// ========================
// Attendance Sessions
// ========================

// Pending collaborations
router.get('/:orgIdOrSlug/pending-collaborations', requireOrgRole(['head', 'sekretaris']), getPendingCollaborations)

// Merespons kolaborasi
router.post('/:orgIdOrSlug/sessions/:sessionId/collaborate/accept', requireOrgRole(['head', 'sekretaris']), acceptCollaboration)
router.post('/:orgIdOrSlug/sessions/:sessionId/collaborate/reject', requireOrgRole(['head', 'sekretaris']), rejectCollaboration)

// Buka sesi absensi baru terjadwal (Head & Sekretaris)
router.post('/:orgIdOrSlug/sessions', requireOrgRole(['head', 'sekretaris']), createSession)

// Ambil daftar semua sesi absensi (Semua Anggota untuk keperluan filter riwayat)
router.get('/:orgIdOrSlug/sessions', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getSessions)

// Ambil sesi absensi yang sedang aktif (Semua Anggota)
router.get('/:orgIdOrSlug/sessions/active', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getActiveSession)

// Ambil anggota yang valid untuk suatu sesi (Bantu Absen)
router.get('/:orgIdOrSlug/sessions/:sessionId/members', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getSessionMembers)


// Ambil active/upcoming agenda untuk Member
router.get('/:orgIdOrSlug/agenda', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getAgenda)

// Ambil sesi absensi spesifik
router.get('/:orgIdOrSlug/sessions/active/:sessionId', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getActiveSession)

// Tutup sesi absensi (Head & Sekretaris)
router.put('/:orgIdOrSlug/sessions/:sessionId/close', requireOrgRole(['head', 'sekretaris']), closeSession)

// Manual Bulk Check-in (Untuk Head/Sekretaris/Delegasi)
router.post('/:orgIdOrSlug/sessions/:sessionId/manual-checkin', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), manualBulkCheckIn)


// ========================
// Member Check-in
// ========================

// Check-in dengan PIN dan GPS (Semua Anggota)
router.post('/:orgIdOrSlug/scan', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), checkIn)


// ========================
// Stats & History
// ========================

// Ambil statistik absensi untuk Dashboard Sekretaris
router.get('/:orgIdOrSlug/stats', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getAttendanceStats)

// Ambil riwayat absensi (Semua untuk Head/Sekretaris)
router.get('/:orgIdOrSlug', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getAttendanceRecords)

// Ambil riwayat absensi pribadi (Untuk Pengguna Aktif)
router.get('/:orgIdOrSlug/me/history', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getMyAttendanceHistory)

// Update status absen (Sekretaris & Head) - Untuk menolak bukti
router.put('/:orgIdOrSlug/attendance/:attendanceId/status', requireOrgRole(['head', 'sekretaris']), updateAttendanceStatus)

// Approve manual (Sekretaris & Head)
router.put('/:orgIdOrSlug/attendance/:attendanceId/validate', requireOrgRole(['head', 'sekretaris']), validateAttendance)

// ========================
// AI Analysis
// ========================
router.post('/:orgIdOrSlug/ai-insight', requireOrgRole(['head', 'sekretaris']), generateAttendanceInsight)
router.post('/:orgIdOrSlug/validate-proof', requireOrgRole(['head', 'sekretaris']), validateProofWithAI)

export default router
