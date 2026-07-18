import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireOrgRole } from '../middleware/role.middleware'
import {
  createOrganization,
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  getOrgGoals,
  createOrgGoal,
  deleteOrgGoal,
  addGoalProgress,
  getGoalTransactions,
  manageGoalFunds,
  getMyOrganizations,
  getOrganizationSettings,
  updateOrganizationSettings,
  updateOrganization,
  getInviteCode,
  resetInviteCode,
  getOrgByInviteCode,
  joinOrganization,
  updateOrgCustomFields,
  updateMemberCustomData,
  leaveOrganization,
  searchOrgs
} from '../controllers/org.controller'

const router = Router()

// Public Route: Mengambil info org dari kode invite (tanpa auth)
router.get('/invite/:code', getOrgByInviteCode)

// Seluruh rute organisasi wajib melalui otentikasi JWT
router.use(requireAuth)

// Route pencarian organisasi (untuk kolaborasi, dll)
router.get('/search', searchOrgs)

// Route bergabung via invite code
router.post('/join', joinOrganization)

// A1. Mendapatkan daftar organisasi pengguna yang login (Workspace Switcher)
// Route ini harus di atas /:orgIdOrSlug agar 'me' tidak dianggap sebagai orgId
router.get('/me/list', getMyOrganizations)

// A. Membuat organisasi baru (Hanya Head global)
router.post('/create', createOrganization)

// Update Profil Organisasi (Akses: Head)
router.put('/:orgIdOrSlug', requireOrgRole(['head']), updateOrganization)

// B. Mendapatkan seluruh anggota organisasi (Semua role dalam org bersangkutan)
router.get('/:orgIdOrSlug/members', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), getOrganizationMembers)

// C. Menambahkan anggota baru ke dalam organisasi (Hanya Head organisasi)
router.post('/:orgIdOrSlug/members', requireOrgRole(['head']), addOrganizationMember)

// C2. Mendapatkan Invite Code Organisasi
router.get('/:orgIdOrSlug/invite-code', requireOrgRole(['head', 'sekretaris']), getInviteCode)

// C3. Mereset Invite Code Organisasi
router.post('/:orgIdOrSlug/invite-code/reset', requireOrgRole(['head', 'sekretaris']), resetInviteCode)

// D. Mengubah role anggota organisasi (Hanya Head organisasi)
router.patch('/:orgIdOrSlug/members/:memberProfileId', requireOrgRole(['head']), updateMemberRole)

// D2. Mengeluarkan anggota dari organisasi (Hanya Head organisasi)
router.delete('/:orgIdOrSlug/members/:memberProfileId', requireOrgRole(['head']), removeOrganizationMember)

// E. Mendapatkan goals/target organisasi
router.get('/:orgIdOrSlug/goals', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), getOrgGoals)

// E2. Buat Target/Anggaran Baru (Hanya Bendahara)
router.post('/:orgIdOrSlug/goals', requireOrgRole(['bendahara']), createOrgGoal)

// E3. Tambah Saldo Target (Hanya Bendahara)
router.post('/:orgIdOrSlug/goals/:goalId/progress', requireOrgRole(['bendahara']), addGoalProgress)

// E4. Ambil Riwayat Target (Semua Anggota)
router.get('/:orgIdOrSlug/goals/:goalId/transactions', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), getGoalTransactions)

// E5. Kelola Dana Target (Pengeluaran, Pindah Kas, Pindah Target) (Hanya Bendahara)
router.post('/:orgIdOrSlug/goals/:goalId/manage', requireOrgRole(['bendahara']), manageGoalFunds)

// E6. Hapus Target (Hanya Bendahara)
router.delete('/:orgIdOrSlug/goals/:goalId', requireOrgRole(['bendahara']), deleteOrgGoal)

// F. Pengaturan Organisasi

// F1. Ambil Pengaturan (Termasuk nominal iuran wajib) (Semua Anggota)
router.get('/:orgIdOrSlug/settings', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), getOrganizationSettings)

// F2. Ubah Pengaturan (Hanya Bendahara untuk Iuran)
router.patch('/:orgIdOrSlug/settings', requireOrgRole(['bendahara']), updateOrganizationSettings)

// F3. Ubah Skema Data Tambahan (Hanya Head)
router.put('/:orgIdOrSlug/custom-fields', requireOrgRole(['head']), updateOrgCustomFields)

// F4. Update Data Tambahan Anggota (Diri Sendiri atau Head)
router.put('/:orgIdOrSlug/members/:memberProfileId/custom-data', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), updateMemberCustomData)

// F5. Keluar dari Organisasi (Meninggalkan Workspace Mandiri)
router.delete('/:orgIdOrSlug/leave', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member', 'auditor']), leaveOrganization)

export default router
