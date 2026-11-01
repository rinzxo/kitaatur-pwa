import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

// Daftar pattern User-Agent tool script / scraping / penetration testing otomatis
const SCRIPT_BOT_PATTERNS: RegExp[] = [
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /httpx/i,
  /curl\//i,
  /wget\//i,
  /httpclient/i,
  /scrapy/i,
  /postmanruntime/i,
  /insomnia/i,
  /go-http-client/i,
  /apache-httpclient/i,
  /libwww-perl/i,
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nmap/i,
  /phantomjs/i,
  /headlesschrome/i,
]

// Deteksi prototype pollution di body atau query
function containsPrototypePollution(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (containsPrototypePollution(obj[key])) return true
    }
  }
  return false
}

// 1. Guard Global: Deteksi User-Agent script otomatis & cegah injeksi payload
export function antiScriptBotGuard(req: Request, res: Response, next: NextFunction) {
  // Pengecualian rute: Webhook payment & Health check harus tetap bisa menerima server-to-server call
  if (req.path.startsWith('/api/webhooks') || req.path.startsWith('/webhooks') || req.path === '/health') {
    return next()
  }

  const userAgent = req.headers['user-agent'] || ''
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)

  // A. Tolak request mutasi yang tidak memiliki User-Agent sama sekali (ciri khas script mentah)
  if (isMutation && (!userAgent || userAgent.trim().length === 0)) {
    console.warn(`[SECURITY ALERT] Request tanpa User-Agent ditolak dari IP: ${req.ip}, Path: ${req.originalUrl}`)
    return res.status(403).json({
      error: 'Akses ditolak: Permintaan tidak valid dari klien tidak teridentifikasi.'
    })
  }

  // B. Tolak jika User-Agent cocok dengan library automation/scripting yang diketahui
  for (const pattern of SCRIPT_BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      console.warn(`[SECURITY ALERT] Script/Bot terdeteksi & diblokir. IP: ${req.ip}, UA: "${userAgent}", Path: ${req.originalUrl}`)
      return res.status(403).json({
        error: 'Akses ditolak: Eksekusi script atau otomasi dilarang.'
      })
    }
  }

  // C. Periksa kemungkinan Prototype Pollution
  if (req.body && containsPrototypePollution(req.body)) {
    console.warn(`[SECURITY ALERT] Upaya Prototype Pollution terdeteksi dari IP: ${req.ip}`)
    return res.status(400).json({ error: 'Payload tidak valid.' })
  }

  if (req.query && containsPrototypePollution(req.query)) {
    return res.status(400).json({ error: 'Query parameter tidak valid.' })
  }

  next()
}

// 2. Honeypot Guard: Menjebak bot/script form autofill
export function antiScriptHoneypot(req: Request, res: Response, next: NextFunction) {
  const honeypotField = req.body?._company_trap || req.body?._hp_website || req.body?._bot_field
  if (honeypotField && typeof honeypotField === 'string' && honeypotField.trim().length > 0) {
    console.warn(`[SECURITY HONEYPOT] Bot terperangkap honeypot dari IP: ${req.ip}, Path: ${req.originalUrl}`)
    // Return 400 Bad Request
    return res.status(400).json({ error: 'Pengiriman formulir gagal diverifikasi.' })
  }
  next()
}

// 3. Rate Limiter Khusus: Anti Brute-Force Invite Code & Pendaftaran Anggota
export const antiJoinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 6, // Maksimal 6x percobaan bergabung atau cek invite per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak permintaan bergabung atau pemeriksaan kode invite. Mohon tunggu 15 menit.'
  }
})

// 4. Rate Limiter Khusus: Pengelolaan Anggota (Anti Script Spam Add/Role/Kick)
export const antiMemberManageRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 30, // Maksimal 30 request mutasi member per 10 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Batas frekuensi pengelolaan anggota tercapai. Mohon tunggu beberapa menit.'
  }
})
