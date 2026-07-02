import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'

const prisma = new PrismaClient()

// Setup Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
)

export async function getNotifications(req: any, res: Response) {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const notifications = await prisma.notifications.findMany({
      where: { profile_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    })

    return res.status(200).json(notifications)
  } catch (err) {
    console.error('Error fetching notifications:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function markAsRead(req: any, res: Response) {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await prisma.notifications.updateMany({
      where: { profile_id: userId, is_read: false },
      data: { is_read: true }
    })

    return res.status(200).json({ message: 'Marked as read' })
  } catch (err) {
    console.error('Error marking notifications as read:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function subscribePush(req: any, res: Response) {
  const userId = req.user?.id
  const subscription = req.body
  
  if (!userId || !subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription data' })
  }

  try {
    // Save subscription
    await prisma.push_subscriptions.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        profile_id: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        profile_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    })



    return res.status(200).json({ message: 'Subscribed' })
  } catch (err) {
    console.error('Error subscribing push:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function sendPushNotification(profileId: string, title: string, body: string, url?: string) {
  try {
    // 1. Save to DB
    await prisma.notifications.create({
      data: {
        profile_id: profileId,
        title,
        body
      }
    })

    // 2. Send Web Push
    const subs = await prisma.push_subscriptions.findMany({
      where: { profile_id: profileId }
    })

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/notifications'
    })

    for (const sub of subs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }
      
      try {
        await webpush.sendNotification(pushSub, payload)
      } catch (e: any) {
        if (e.statusCode === 410) {
          // Subscription expired/removed
          await prisma.push_subscriptions.delete({ where: { id: sub.id } })
        }
      }
    }
  } catch (err) {
    console.error('Error in sendPushNotification', err)
  }
}

export async function testPush(req: any, res: Response) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  
  await sendPushNotification(
    userId,
    'Notifikasi Uji Coba',
    'Ini adalah notifikasi push dari sistem KitaAtur!',
    '/notifications'
  )
  
  return res.status(200).json({ message: 'Push notification sent' })
}
