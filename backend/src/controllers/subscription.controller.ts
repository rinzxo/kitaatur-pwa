import { Request, Response } from 'express'
import { prisma } from '../config/db'

export async function getMySubscriptions(req: Request, res: Response) {
  const userId = (req as any).user?.id

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
    const sub = await prisma.subscriptions.findUnique({
      where: { id }
    })
    
    if (!sub || sub.profile_id !== userId) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    return res.status(200).json(sub)
  } catch (err: any) {
    console.error('Error fetching subscription:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
