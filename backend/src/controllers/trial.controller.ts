import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { isDisposableEmail, getClientIp, checkIpTrialLimit } from '../utils/antiAbuse'

/**
 * Cek status eligibility & status trial user saat ini
 */
export async function getTrialStatus(req: Request, res: Response) {
  const userId = (req as any).user?.id
  const userEmail = (req as any).user?.email

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const now = new Date()

    // 1. Cek apakah pernah klaim trial
    const claim = await prisma.trial_claims.findFirst({
      where: {
        OR: [
          { profile_id: userId },
          { email: (userEmail || '').toLowerCase().trim() }
        ]
      }
    })

    // 2. Cek apakah ada langganan aktif saat ini
    const activeSub = await prisma.subscriptions.findFirst({
      where: {
        profile_id: userId,
        status: 'active',
        expires_at: { gt: now }
      },
      orderBy: { expires_at: 'desc' }
    })

    // 3. Cek apakah ada trial subscription (aktif atau sudah kedaluwarsa)
    const trialSub = await prisma.subscriptions.findFirst({
      where: {
        profile_id: userId,
        plan_type: 'plus_trial'
      },
      orderBy: { expires_at: 'desc' }
    })

    let hasActiveTrial = false
    let isExpired = false
    let daysLeft = 0
    let hoursLeft = 0

    if (trialSub) {
      const exp = new Date(trialSub.expires_at)
      if (exp > now && trialSub.status === 'active') {
        hasActiveTrial = true
        const diffMs = exp.getTime() - now.getTime()
        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))
      } else {
        isExpired = true
      }
    }

    const hasClaimedBefore = Boolean(claim || trialSub)
    const hasActiveSubscription = Boolean(activeSub && !activeSub.plan_type.includes('trial'))
    const eligible = !hasClaimedBefore && !hasActiveSubscription && !activeSub

    let reason: string | null = null
    if (hasActiveTrial) {
      reason = 'Masa uji coba 7 hari Anda sedang aktif.'
    } else if (hasActiveSubscription) {
      reason = 'Akun Anda telah memiliki paket langganan berbayar aktif.'
    } else if (hasClaimedBefore) {
      reason = 'Akun Anda sudah pernah menggunakan masa uji coba 7 hari.'
    }

    return res.status(200).json({
      eligible,
      hasActiveTrial,
      hasClaimedBefore,
      hasActiveSubscription,
      trial: trialSub ? {
        id: trialSub.id,
        startsAt: trialSub.starts_at,
        expiresAt: trialSub.expires_at,
        daysLeft,
        hoursLeft,
        isExpired
      } : null,
      reason
    })
  } catch (err: any) {
    console.error('Error getting trial status:', err)
    return res.status(500).json({ error: 'Gagal memuat status trial', details: err.message })
  }
}

/**
 * Klaim promo trial 7 hari dengan proteksi Anti-Abuse ketat
 */
export async function claimTrial(req: Request, res: Response) {
  const userId = (req as any).user?.id
  const userEmail = ((req as any).user?.email || '').toLowerCase().trim()

  if (!userId || !userEmail) {
    return res.status(401).json({ error: 'Harap masuk ke akun Anda terlebih dahulu' })
  }

  try {
    const now = new Date()

    // PROTEKSI 1: Cek Disposable / Temporary Email
    if (isDisposableEmail(userEmail)) {
      return res.status(400).json({
        error: 'Alamat email terdeteksi sebagai disposable / temporary email. Silakan gunakan alamat email resmi atau pribadi yang valid (seperti Gmail, institusi, atau domain resmi).'
      })
    }

    // PROTEKSI 2: Cek apakah user atau email sudah pernah mengklaim trial sebelumnya
    const existingClaim = await prisma.trial_claims.findFirst({
      where: {
        OR: [
          { profile_id: userId },
          { email: userEmail }
        ]
      }
    })

    if (existingClaim) {
      return res.status(400).json({
        error: 'Akun atau email ini sudah pernah mengklaim masa uji coba 7 hari. Masa uji coba hanya berlaku 1 kali per akun.'
      })
    }

    // PROTEKSI 3: Cek apakah user sudah memiliki riwayat langganan trial atau aktif
    const existingTrialSub = await prisma.subscriptions.findFirst({
      where: {
        profile_id: userId,
        plan_type: 'plus_trial'
      }
    })

    if (existingTrialSub) {
      return res.status(400).json({
        error: 'Akun Anda tercatat sudah pernah mengaktifkan masa uji coba.'
      })
    }

    const existingActiveSub = await prisma.subscriptions.findFirst({
      where: {
        profile_id: userId,
        status: 'active',
        expires_at: { gt: now }
      }
    })

    if (existingActiveSub) {
      return res.status(400).json({
        error: 'Akun Anda sudah memiliki paket langganan aktif, sehingga tidak memerlukan masa uji coba.'
      })
    }

    // PROTEKSI 4: Cek Rate Limit IP Address (Maksimal 3 klaim per IP dalam 24 jam)
    const clientIp = getClientIp(req)
    const ipAllowed = await checkIpTrialLimit(clientIp, 3)
    if (!ipAllowed) {
      return res.status(429).json({
        error: 'Batas klaim masa uji coba dari perangkat/jaringan ini telah tercapai untuk hari ini. Silakan coba kembali besok atau hubungi layanan bantuan.'
      })
    }

    // PROSES: Berikan Trial 7 Hari (168 jam)
    const durationDays = 7
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Simpan catatan klaim trial untuk audit & anti-abuse
      const claim = await tx.trial_claims.create({
        data: {
          profile_id: userId,
          email: userEmail,
          ip_address: clientIp,
          user_agent: userAgent,
          claimed_at: now,
          expires_at: expiresAt
        }
      })

      // 2. Buat paket langganan KitaAtur Plus (Trial 7 Hari) aktif
      const sub = await tx.subscriptions.create({
        data: {
          profile_id: userId,
          status: 'active',
          plan_type: 'plus_trial',
          amount_paid: 0,
          starts_at: now,
          expires_at: expiresAt,
          kitapay_transaction_id: `trial_${claim.id.replace(/-/g, '').slice(0, 20)}`
        }
      })

      return { claim, sub }
    })

    return res.status(201).json({
      success: true,
      message: 'Selamat! Masa uji coba KitaAtur Plus selama 7 hari berhasil diaktifkan.',
      subscriptionId: result.sub.id,
      expiresAt: expiresAt.toISOString(),
      daysLeft: durationDays
    })
  } catch (err: any) {
    console.error('Error claiming trial:', err)
    if (err.code === 'P2002') {
      return res.status(400).json({
        error: 'Akun ini sudah pernah mengklaim masa uji coba 7 hari.'
      })
    }
    return res.status(500).json({ error: 'Gagal mengaktifkan masa uji coba. Silakan coba beberapa saat lagi.' })
  }
}
