import { Request, Response } from 'express'
import { prisma } from '../config/db'

// 1. Get System Stats
export async function getSystemStats(req: Request, res: Response) {
  try {
    const totalUsers = await prisma.profiles.count()
    const totalOrgs = await prisma.organizations.count()
    const activeSubs = await prisma.subscriptions.count({ where: { status: 'active' } })
    
    // Total income from all financial_records globally (excluding transfers)
    const incomeRecords = await prisma.financial_records.aggregate({
      _sum: { amount: true },
      where: { type: 'income' }
    })

    return res.status(200).json({
      totalUsers,
      totalOrgs,
      activeSubs,
      totalIncome: incomeRecords._sum.amount || 0
    })
  } catch (err) {
    console.error('Error fetching stats:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2. Get All Organizations (with their owners)
export async function getAllOrgs(req: Request, res: Response) {
  try {
    const orgs = await prisma.organizations.findMany({
      include: { owner: true },
      orderBy: { created_at: 'desc' }
    })
    return res.status(200).json(orgs)
  } catch (err) {
    console.error('Error fetching orgs:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 3. Manage Subscriptions Manually
export async function grantSubscription(req: Request, res: Response) {
  const { profile_id, plan_type } = req.body
  try {
    const end_date = new Date()
    end_date.setFullYear(end_date.getFullYear() + 1)

    const sub = await prisma.subscriptions.create({
      data: {
        profile_id,
        plan_type,
        status: 'active',
        starts_at: new Date(),
        expires_at: end_date
      }
    })
    return res.status(200).json({ message: 'Subscription granted successfully', sub })
  } catch (err) {
    console.error('Error granting sub:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Get System Settings (for maintenance)
export async function getSystemSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.$queryRawUnsafe('SELECT * FROM public.system_settings')
    return res.status(200).json(settings)
  } catch (err) {
    console.error('Error fetching settings:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5. Update System Settings (Toggle Maintenance)
export async function updateSystemSetting(req: Request, res: Response) {
  const { key } = req.params
  const { value, description } = req.body
  try {
    const setting = await prisma.$queryRawUnsafe(
      `INSERT INTO public.system_settings (key, value, description, updated_at) 
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, description = $3, updated_at = NOW()
       RETURNING *`,
      key, JSON.stringify(value), description || null
    )
    return res.status(200).json({ message: 'Setting updated successfully', setting })
  } catch (err) {
    console.error('Error updating setting:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 6. Announcements
export async function getAnnouncementsAdmin(req: Request, res: Response) {
  try {
    const announcements = await prisma.$queryRawUnsafe('SELECT * FROM public.announcements ORDER BY created_at DESC')
    return res.status(200).json(announcements)
  } catch (err) {
    console.error('Error fetching announcements:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function createAnnouncement(req: Request, res: Response) {
  const { title, content, type, starts_at, ends_at } = req.body
  try {
    const result = await prisma.$queryRawUnsafe(
      `INSERT INTO public.announcements (title, content, type, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
       title, content, type || 'info', starts_at ? new Date(starts_at) : null, ends_at ? new Date(ends_at) : null
    )
    return res.status(201).json(result)
  } catch (err) {
    console.error('Error creating announcement:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.$executeRawUnsafe('DELETE FROM public.announcements WHERE id = $1::uuid', id)
    return res.status(200).json({ message: 'Announcement deleted' })
  } catch (err) {
    console.error('Error deleting announcement:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7. Get Active Announcements for Public
export async function getActiveAnnouncements(req: Request, res: Response) {
  try {
    const announcements = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.announcements 
       WHERE is_active = true 
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY created_at DESC`
    )
    return res.status(200).json(announcements)
  } catch (err) {
    console.error('Error fetching public announcements:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 8. Hard Delete Org
export async function forceDeleteOrg(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.organizations.delete({ where: { id } })
    return res.status(200).json({ message: 'Organization deleted' })
  } catch (err) {
    console.error('Error deleting org:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
