import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { sendPushNotification } from './notification.controller'
import { Prisma } from '@prisma/client'

// 1. Mengambil Daftar Transaksi Keuangan Organisasi (Akses: Semua Anggota)
export async function getOrgFinancialRecords(req: any, res: Response) {
  const orgMemberContext = req.orgMember

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' })
  }

  try {
    const records = await prisma.financial_records.findMany({
      where: {
        organization_id: orgMemberContext.organizationId
      },
      orderBy: [
        { transaction_date: 'desc' },
        { created_at: 'desc' }
      ],
      include: {
        profile: {
          select: {
            full_name: true,
            email: true
          }
        }
      }
    })

    return res.status(200).json(records)
  } catch (err) {
    console.error('Error fetching org financial records:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2. Mengambil Summary Keuangan & Deret Waktu Bulanan untuk Recharts (Akses: Semua Anggota)
export async function getOrgFinancialSummary(req: any, res: Response) {
  const orgMemberContext = req.orgMember

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' })
  }

  const orgId = orgMemberContext.organizationId

  try {
    // A. Agregasi Total Pemasukan
    const incomeAgg = await prisma.financial_records.aggregate({
      where: {
        organization_id: orgId,
        type: 'income'
      },
      _sum: {
        amount: true
      }
    })

    // B. Agregasi Total Pengeluaran
    const expenseAgg = await prisma.financial_records.aggregate({
      where: {
        organization_id: orgId,
        type: 'expense'
      },
      _sum: {
        amount: true
      }
    })

    const totalIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0
    const totalExpense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0
    const balance = totalIncome - totalExpense

    // C. Agregasi Data Bulanan (6 Bulan Terakhir)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1) // Set ke awal bulan

    const monthlyRecords = await prisma.financial_records.findMany({
      where: {
        organization_id: orgId,
        transaction_date: {
          gte: sixMonthsAgo
        }
      },
      select: {
        amount: true,
        type: true,
        transaction_date: true
      }
    })

    // Bangun peta inisialisasi untuk 6 bulan terakhir
    const monthlyDataMap: { [key: string]: { month: string; income: number; expense: number } } = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' })
      monthlyDataMap[monthLabel] = { month: monthLabel, income: 0, expense: 0 }
    }

    // Isi data dari records
    monthlyRecords.forEach((record) => {
      const date = new Date(record.transaction_date)
      const monthLabel = date.toLocaleString('id-ID', { month: 'short' })
      
      if (monthlyDataMap[monthLabel]) {
        if (record.type === 'income') {
          monthlyDataMap[monthLabel].income += Number(record.amount)
        } else if (record.type === 'expense') {
          monthlyDataMap[monthLabel].expense += Number(record.amount)
        }
      }
    })

    const chartData = Object.values(monthlyDataMap)

    return res.status(200).json({
      summary: {
        income: totalIncome,
        expense: totalExpense,
        balance: balance
      },
      chartData
    })
  } catch (err) {
    console.error('Error fetching org financial summary:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 3. Menulis Transaksi Keuangan Organisasi Baru (Akses: Head & Bendahara)
export async function createOrgFinancialRecord(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const userId = req.user?.id
  const { amount, type, category, description, transaction_date, receipt_url, member_profile_id } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat mencatat keuangan' })
  }

  if (!amount || !type || !category) {
    return res.status(400).json({ error: 'Field amount, type, dan category wajib diisi' })
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Tipe transaksi tidak valid' })
  }

  try {
    const newRecord = await prisma.financial_records.create({
      data: {
        organization_id: orgMemberContext.organizationId,
        profile_id: member_profile_id || userId,
        amount: new Prisma.Decimal(amount),
        type,
        category,
        description: description || null,
        receipt_url: receipt_url || null,
        transaction_date: transaction_date ? new Date(transaction_date) : new Date()
      }
    })

    
    if (member_profile_id && member_profile_id !== userId) {
      const org = await prisma.organizations.findUnique({ where: { id: orgMemberContext.organizationId } });
      if (org && type === 'income') {
        sendPushNotification(
          member_profile_id, 
          'Pembayaran Dicatat', 
          `Pembayaran sebesar Rp${amount} untuk ${category} di ${org.name} telah dicatat oleh bendahara.`, 
          `/org/${org.slug}/financial`
        );
      }
    }
    return res.status(201).json(newRecord)
  } catch (err) {
    console.error('Error creating org transaction:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Menghapus Transaksi Keuangan Organisasi (Akses: Bendahara)
export async function deleteOrgFinancialRecord(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const { recordId } = req.params

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat menghapus catatan keuangan' })
  }

  try {
    // Pastikan transaksi kas tersebut milik organisasi yang bersangkutan
    const targetRecord = await prisma.financial_records.findUnique({
      where: { id: recordId }
    })

    if (!targetRecord || targetRecord.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Catatan transaksi tidak ditemukan pada organisasi ini' })
    }

    await prisma.financial_records.delete({
      where: { id: recordId }
    })

    return res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus' })
  } catch (err) {
    console.error('Error deleting org transaction:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5. Mengambil Satu Transaksi Keuangan (Untuk Cetak Invoice)
export async function getOrgFinancialRecordById(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const { recordId } = req.params

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' })
  }

  try {
    // Menggunakan raw SQL untuk menghindari isu Prisma Client yang belum di-generate ulang
    const results = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        fr.*,
        p.full_name as profile_full_name,
        p.email as profile_email,
        o.name as org_name,
        o.logo_url as org_logo_url
      FROM public.financial_records fr
      LEFT JOIN public.profiles p ON fr.profile_id = p.id
      LEFT JOIN public.organizations o ON fr.organization_id = o.id
      WHERE fr.id = $1::uuid
      `,
      recordId
    )

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Catatan transaksi tidak ditemukan' })
    }

    const rawRecord = results[0]

    // Pastikan transaksi milik organisasi ini
    if (rawRecord.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Catatan transaksi tidak ditemukan pada organisasi ini' })
    }

    // Format ulang seperti struktur Prisma include
    const record = {
      ...rawRecord,
      profile: {
        full_name: rawRecord.profile_full_name,
        email: rawRecord.profile_email
      },
      organization: {
        name: rawRecord.org_name,
        logo_url: rawRecord.org_logo_url
      }
    }

    return res.status(200).json(record)
  } catch (err) {
    console.error('Error fetching org financial record by id:', err)
    return res.status(500).json({ error: 'Internal Server Error', details: (err as any).message })
  }
}

// 6. Mengambil Invoice Public (Tanpa Login)
export async function getPublicInvoiceById(req: Request, res: Response) {
  const { recordId } = req.params

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        fr.*,
        p.full_name as profile_full_name,
        p.email as profile_email,
        o.name as org_name,
        o.logo_url as org_logo_url,
        cb.full_name as created_by_name
      FROM public.financial_records fr
      LEFT JOIN public.profiles p ON fr.profile_id = p.id
      LEFT JOIN public.organizations o ON fr.organization_id = o.id
      LEFT JOIN public.profiles cb ON fr.created_by = cb.id
      WHERE fr.id = $1::uuid
      `,
      recordId
    )

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Kwitansi tidak ditemukan' })
    }

    const rawRecord = results[0]

    const record = {
      ...rawRecord,
      profile: {
        full_name: rawRecord.profile_full_name,
        email: rawRecord.profile_email
      },
      organization: {
        name: rawRecord.org_name,
        logo_url: rawRecord.org_logo_url
      },
      created_by_name: rawRecord.created_by_name
    }

    return res.status(200).json(record)
  } catch (err) {
    console.error('Error fetching public invoice:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
