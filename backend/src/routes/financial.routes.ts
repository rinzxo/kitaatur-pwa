import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { requireOrgRole } from '../middleware/role.middleware'
import {
  getOrgFinancialRecords,
  getOrgFinancialSummary,
  createOrgFinancialRecord,
  deleteOrgFinancialRecord,
  getOrgFinancialRecordById,
  getPublicInvoiceById
} from '../controllers/financial.controller'
import { generateFinancialInsight } from '../controllers/ai.controller'

const router = Router()

// PUBLIC ROUTE: Ambil invoice tanpa login
router.get('/public/invoice/:recordId', getPublicInvoiceById)

// Seluruh rute keuangan di bawah ini memerlukan otentikasi JWT
router.use(requireAuth)

// A. Ambil riwayat kas organisasi (Semua role pengurus & anggota)
router.get('/:orgIdOrSlug', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getOrgFinancialRecords)

// B. Ambil summary & data grafik bulanan (Semua role pengurus & anggota)
router.get('/:orgIdOrSlug/summary', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getOrgFinancialSummary)

// Hanya Bendahara yang bisa mencatat dan menghapus kas
router.post('/:orgIdOrSlug', requireOrgRole(['bendahara']), createOrgFinancialRecord)
router.delete('/:orgIdOrSlug/:recordId', requireOrgRole(['bendahara']), deleteOrgFinancialRecord)

// E. Ambil satu transaksi (Semua anggota bisa melihat)
router.get('/:orgIdOrSlug/record/:recordId', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), getOrgFinancialRecordById)

// F. Generate AI Insight (Semua anggota bisa meminta insight)
router.post('/:orgIdOrSlug/ai-insight', requireOrgRole(['head', 'bendahara', 'sekretaris', 'member']), generateFinancialInsight)

export default router
