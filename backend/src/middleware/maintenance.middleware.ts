import { Request, Response, NextFunction } from 'express'
import { verifyToken } from './auth.middleware'
import { prisma } from '../config/db'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', { 
  auth: { persistSession: false },
  realtime: { transport: WebSocket as any }
})

// Cache untuk mengurangi hit ke DB setiap request (cache valid 30 detik)
let maintenanceCache: { mode: boolean, message: string, expiresAt: number } | null = null

export async function maintenanceCheck(req: Request, res: Response, next: NextFunction) {
  // Biarkan route admin lewat (agar dev bisa mematikan maintenance)
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/health')) {
    return next()
  }

  const now = Date.now()
  if (!maintenanceCache || maintenanceCache.expiresAt < now) {
    try {
      const results = await prisma.$queryRawUnsafe<any[]>('SELECT * FROM public.system_settings WHERE key = $1', 'maintenance_mode')
      if (results && results.length > 0) {
        const val = typeof results[0].value === 'string' ? JSON.parse(results[0].value) : results[0].value
        maintenanceCache = {
          mode: val === true,
          message: results[0].description || 'Sistem sedang dalam perbaikan.',
          expiresAt: now + 30000 // 30 seconds cache
        }
      } else {
        maintenanceCache = { mode: false, message: '', expiresAt: now + 30000 }
      }
    } catch (err) {
      // Jika terjadi error DB (misal tabel belum ada), lewati saja agar tidak down
      maintenanceCache = { mode: false, message: '', expiresAt: now + 30000 }
    }
  }

  if (maintenanceCache.mode) {
    // Pengecualian khusus dev
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const user = await verifyToken(token)
        if (user && user.email === 'generalrino@gmail.com') {
          return next()
        }
      } catch (e) {
        // Abaikan error auth, biarkan turun ke response 503
      }
    }
    
    return res.status(503).json({ 
      error: 'Maintenance', 
      message: maintenanceCache.message 
    })
  }

  next()
}
