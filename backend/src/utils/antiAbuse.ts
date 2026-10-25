import { Request } from 'express'
import { prisma } from '../config/db'

// Daftar domain email sekali pakai (disposable/temporary/throwaway email)
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'throwawaymail.com',
  'fakeinbox.com',
  'dispostable.com',
  'getairmail.com',
  'inboxkitten.com',
  'mohmal.com',
  'mytemp.email',
  'generator.email',
  'dropmail.me',
  'crazymailing.com',
  'burnermail.io',
  'maildrop.cc',
  'nada.ltd',
  'getnada.com',
  'tempail.com',
  'disposablemail.com',
  'emailondeck.com',
  'mytempmail.com',
  'fakemail.net',
  'minutemail.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'trbvm.com',
  'tmpmail.org',
  'tmpmail.net',
  'disposable.com',
  'tempinbox.com',
  'mailnesia.com',
  'zillamail.com',
  'trashymail.com'
])

/**
 * Cek apakah email berasal dari provider disposable/temporary.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return true
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

/**
 * Ambil IP client yang sebenarnya dengan aman (dukungan proxy/reverse proxy/CDN).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    // Ambil IP pertama jika terdapat rantai proxy "client, proxy1, proxy2"
    const firstIp = forwarded.split(',')[0].trim()
    if (firstIp) return firstIp
  }
  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp.trim()
  }
  return req.socket?.remoteAddress || '127.0.0.1'
}

/**
 * Validasi batas klaim trial per IP dalam 24 jam terakhir (Anti Bot / Sybil Attack).
 * Maksimal 3 klaim per IP per 24 jam.
 */
export async function checkIpTrialLimit(ip: string, maxClaims24h: number = 3): Promise<boolean> {
  // Abaikan limit untuk localhost saat development
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const count = await prisma.trial_claims.count({
    where: {
      ip_address: ip,
      created_at: {
        gte: twentyFourHoursAgo
      }
    }
  })

  return count < maxClaims24h
}
