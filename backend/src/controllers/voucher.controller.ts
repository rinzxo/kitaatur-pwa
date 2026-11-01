import { Request, Response } from 'express'
import { prisma } from '../config/db'

export interface VoucherRecord {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: any
  max_discount_amount: any | null
  min_purchase_amount: any | null
  applicable_plans: string | null
  usage_limit: number | null
  used_count: number
  starts_at: Date | null
  expires_at: Date | null
  is_active: boolean
  created_at: Date
  updated_at: Date | null
}

// 1. Validasi Voucher saat Checkout (Publik / User)
export async function validateVoucher(req: Request, res: Response) {
  const { code, planType, baseAmount } = req.body

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Kode voucher wajib diisi.' })
  }

  const cleanCode = code.trim().toUpperCase()
  const purchaseAmount = Number(baseAmount) || 0

  try {
    const vouchers = await prisma.$queryRawUnsafe<VoucherRecord[]>(
      `SELECT * FROM public.vouchers WHERE UPPER(code) = $1 LIMIT 1`,
      cleanCode
    )

    if (!vouchers || vouchers.length === 0) {
      return res.status(404).json({ error: 'Kode voucher tidak ditemukan.' })
    }

    const v = vouchers[0]
    const now = new Date()

    if (!v.is_active) {
      return res.status(400).json({ error: 'Kode voucher ini sudah tidak aktif.' })
    }

    if (v.starts_at && new Date(v.starts_at) > now) {
      return res.status(400).json({ error: 'Voucher ini belum dapat digunakan.' })
    }

    if (v.expires_at && new Date(v.expires_at) < now) {
      return res.status(400).json({ error: 'Voucher ini telah kedaluwarsa.' })
    }

    if (v.usage_limit !== null && v.usage_limit !== undefined && v.used_count >= v.usage_limit) {
      return res.status(400).json({ error: 'Batas kuota penggunaan voucher ini telah habis.' })
    }

    const minPurchase = Number(v.min_purchase_amount) || 0
    if (purchaseAmount < minPurchase) {
      return res.status(400).json({
        error: `Minimal pembelian untuk menggunakan voucher ini adalah Rp ${minPurchase.toLocaleString('id-ID')}.`
      })
    }

    const appPlans = (v.applicable_plans || 'all').trim().toLowerCase()
    if (appPlans !== 'all' && planType) {
      const targetPlan = String(planType).toLowerCase()
      const allowed = appPlans.split(',').map(p => p.trim())
      const isMatch = allowed.some(p => targetPlan.includes(p))
      if (!isMatch) {
        return res.status(400).json({
          error: `Voucher ini hanya berlaku untuk paket: ${allowed.join(', ').toUpperCase()}.`
        })
      }
    }

    // Hitung potongan diskon
    let discountAmount = 0
    const discountVal = Number(v.discount_value) || 0

    if (v.discount_type === 'percentage') {
      const rawDiscount = (purchaseAmount * discountVal) / 100
      const maxDiscount = v.max_discount_amount ? Number(v.max_discount_amount) : null
      discountAmount = maxDiscount ? Math.min(rawDiscount, maxDiscount) : rawDiscount
    } else {
      discountAmount = Math.min(discountVal, purchaseAmount)
    }

    discountAmount = Math.round(discountAmount)
    const finalAmount = Math.max(0, purchaseAmount - discountAmount)

    return res.status(200).json({
      valid: true,
      voucher: {
        id: v.id,
        code: v.code,
        description: v.description,
        discount_type: v.discount_type,
        discount_value: Number(v.discount_value),
        max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : null
      },
      discountAmount,
      finalAmount,
      message: `Voucher ${v.code} berhasil diterapkan! Hemat Rp ${discountAmount.toLocaleString('id-ID')}`
    })
  } catch (err: any) {
    console.error('Error validating voucher:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2. Ambil Semua Voucher (Admin)
export async function getAllVouchersAdmin(req: Request, res: Response) {
  try {
    const vouchers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.vouchers ORDER BY created_at DESC`
    )

    const formatted = vouchers.map(v => ({
      ...v,
      discount_value: Number(v.discount_value),
      max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : null,
      min_purchase_amount: v.min_purchase_amount ? Number(v.min_purchase_amount) : 0,
      used_count: Number(v.used_count || 0),
      usage_limit: v.usage_limit ? Number(v.usage_limit) : null
    }))

    return res.status(200).json(formatted)
  } catch (err) {
    console.error('Error fetching admin vouchers:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 3. Tambah Voucher Baru (Admin)
export async function createVoucherAdmin(req: Request, res: Response) {
  const {
    code,
    description,
    discount_type = 'percentage',
    discount_value,
    max_discount_amount,
    min_purchase_amount = 0,
    applicable_plans = 'all',
    usage_limit,
    expires_at,
    is_active = true
  } = req.body

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Kode voucher wajib diisi.' })
  }

  if (discount_value === undefined || isNaN(Number(discount_value)) || Number(discount_value) <= 0) {
    return res.status(400).json({ error: 'Nilai potongan (diskon) harus lebih besar dari 0.' })
  }

  if (discount_type === 'percentage' && Number(discount_value) > 100) {
    return res.status(400).json({ error: 'Diskon persentase tidak boleh lebih dari 100%.' })
  }

  const cleanCode = code.trim().toUpperCase()

  try {
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM public.vouchers WHERE UPPER(code) = $1 LIMIT 1`,
      cleanCode
    )

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: `Kode voucher ${cleanCode} sudah ada. Harap gunakan kode lain.` })
    }

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `
      INSERT INTO public.vouchers (
        code,
        description,
        discount_type,
        discount_value,
        max_discount_amount,
        min_purchase_amount,
        applicable_plans,
        usage_limit,
        expires_at,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      cleanCode,
      description?.trim() || null,
      discount_type,
      Number(discount_value),
      max_discount_amount ? Number(max_discount_amount) : null,
      min_purchase_amount ? Number(min_purchase_amount) : 0,
      applicable_plans?.trim() || 'all',
      usage_limit ? Number(usage_limit) : null,
      expires_at ? new Date(expires_at) : null,
      Boolean(is_active)
    )

    return res.status(201).json({
      success: true,
      message: 'Voucher berhasil dibuat.',
      voucher: inserted[0]
    })
  } catch (err: any) {
    console.error('Error creating voucher:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

// 4. Update Voucher (Admin)
export async function updateVoucherAdmin(req: Request, res: Response) {
  const { id } = req.params
  const {
    description,
    discount_type,
    discount_value,
    max_discount_amount,
    min_purchase_amount,
    applicable_plans,
    usage_limit,
    expires_at,
    is_active
  } = req.body

  try {
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.vouchers WHERE id = $1::uuid LIMIT 1`,
      id
    )

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Voucher tidak ditemukan.' })
    }

    const current = existing[0]

    const updated = await prisma.$queryRawUnsafe<any[]>(
      `
      UPDATE public.vouchers
      SET
        description = $1,
        discount_type = $2,
        discount_value = $3,
        max_discount_amount = $4,
        min_purchase_amount = $5,
        applicable_plans = $6,
        usage_limit = $7,
        expires_at = $8,
        is_active = $9,
        updated_at = timezone('utc'::text, now())
      WHERE id = $10::uuid
      RETURNING *
      `,
      description !== undefined ? (description?.trim() || null) : current.description,
      discount_type !== undefined ? discount_type : current.discount_type,
      discount_value !== undefined ? Number(discount_value) : Number(current.discount_value),
      max_discount_amount !== undefined ? (max_discount_amount ? Number(max_discount_amount) : null) : current.max_discount_amount,
      min_purchase_amount !== undefined ? Number(min_purchase_amount) : Number(current.min_purchase_amount),
      applicable_plans !== undefined ? applicable_plans : current.applicable_plans,
      usage_limit !== undefined ? (usage_limit ? Number(usage_limit) : null) : current.usage_limit,
      expires_at !== undefined ? (expires_at ? new Date(expires_at) : null) : current.expires_at,
      is_active !== undefined ? Boolean(is_active) : current.is_active,
      id
    )

    return res.status(200).json({
      success: true,
      message: 'Voucher berhasil diperbarui.',
      voucher: updated[0]
    })
  } catch (err: any) {
    console.error('Error updating voucher:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

// 5. Hapus Voucher (Admin)
export async function deleteVoucherAdmin(req: Request, res: Response) {
  const { id } = req.params

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM public.vouchers WHERE id = $1::uuid`,
      id
    )

    return res.status(200).json({
      success: true,
      message: 'Voucher berhasil dihapus.'
    })
  } catch (err: any) {
    console.error('Error deleting voucher:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
