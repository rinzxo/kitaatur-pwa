import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { Prisma } from '@prisma/client'

// 1. Ambil ringkasan keuangan personal (pemasukan/pengeluaran)
export async function getPersonalSummary(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  try {
    // Ambil data transaksi personal (organization_id IS NULL)
    const records = await prisma.financial_records.findMany({
      where: {
        profile_id: userId,
        organization_id: null
      },
      orderBy: {
        transaction_date: 'desc'
      },
      take: 10
    })

    // Agregasi Pemasukan
    const incomeAgg = await prisma.financial_records.aggregate({
      where: {
        profile_id: userId,
        organization_id: null,
        type: 'income'
      },
      _sum: {
        amount: true
      }
    })

    // Agregasi Pengeluaran
    const expenseAgg = await prisma.financial_records.aggregate({
      where: {
        profile_id: userId,
        organization_id: null,
        type: 'expense'
      },
      _sum: {
        amount: true
      }
    })

    const totalIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0
    const totalExpense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0
    const balance = totalIncome - totalExpense

    return res.status(200).json({
      summary: {
        income: totalIncome,
        expense: totalExpense,
        balance: balance
      },
      records
    })
  } catch (err) {
    console.error('Error fetching personal summary:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2. Ambil personal goals
export async function getPersonalGoals(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  try {
    const goals = await prisma.goals.findMany({
      where: {
        profile_id: userId,
        organization_id: null
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return res.status(200).json(goals)
  } catch (err) {
    console.error('Error fetching personal goals:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 3. Simpan transaksi keuangan personal
export async function createPersonalTransaction(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  const { amount, type, category, description, transaction_date, receipt_url } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
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
        profile_id: userId,
        organization_id: null, // Menandakan transaksi personal
        amount: new Prisma.Decimal(amount),
        type,
        category,
        description: description || null,
        receipt_url: receipt_url || null,
        transaction_date: transaction_date ? new Date(transaction_date) : new Date()
      }
    })

    return res.status(201).json(newRecord)
  } catch (err) {
    console.error('Error creating personal transaction:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Buat personal goal baru
export async function createPersonalGoal(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  const { title, description, target_amount, deadline } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  if (!title || !target_amount) {
    return res.status(400).json({ error: 'Field title dan target_amount wajib diisi' })
  }

  try {
    const newGoal = await prisma.goals.create({
      data: {
        profile_id: userId,
        organization_id: null,
        title,
        description: description || null,
        target_amount: new Prisma.Decimal(target_amount),
        current_amount: new Prisma.Decimal(0),
        deadline: deadline ? new Date(deadline) : null,
        status: 'active'
      }
    })

    return res.status(201).json(newGoal)
  } catch (err) {
    console.error('Error creating personal goal:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5. Tambah progress personal goal
export async function updatePersonalGoalProgress(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  const { id } = req.params
  const { amount_to_add } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  if (!amount_to_add || amount_to_add <= 0) {
    return res.status(400).json({ error: 'Jumlah penambahan progress tidak valid' })
  }

  try {
    const goal = await prisma.goals.findFirst({
      where: {
        id,
        profile_id: userId,
        organization_id: null
      }
    })

    if (!goal) {
      return res.status(404).json({ error: 'Target tidak ditemukan' })
    }

    const newAmount = Number(goal.current_amount || 0) + Number(amount_to_add)
    const targetAmount = Number(goal.target_amount || 0)

    const updatedGoal = await prisma.goals.update({
      where: { id: goal.id },
      data: {
        current_amount: new Prisma.Decimal(newAmount),
        status: newAmount >= targetAmount ? 'completed' : 'active'
      }
    })

    return res.status(200).json(updatedGoal)
  } catch (err) {
    console.error('Error updating goal progress:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
