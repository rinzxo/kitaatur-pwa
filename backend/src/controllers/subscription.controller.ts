import { Request, Response } from 'express'
import { prisma } from '../config/db'

export async function getMySubscriptions(req: Request, res: Response) {
  const userId = (req as any).user?.id
  const userEmail = (req as any).user?.email

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  try {
    const subs = await prisma.subscriptions.findMany({
      where: { profile_id: userId },
      orderBy: { created_at: 'desc' }
    })

    return res.status(200).json(subs)
  } catch (err: any) {
    console.error('Error fetching subscriptions:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function getSubscriptionById(req: Request, res: Response) {
  const userId = (req as any).user?.id
  const { id } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.subscriptions WHERE id = $1 LIMIT 1`,
      id
    )
    const sub = rows[0]
    
    if (!sub || sub.profile_id !== userId) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    return res.status(200).json(sub)
  } catch (err: any) {
    console.error('Error fetching subscription:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
