import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const jwtSecret = process.env.SUPABASE_JWT_SECRET || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    // @ts-ignore
    transport: WebSocket
  }
})

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

// Simple in-memory cache untuk token (valid selama 5 menit)
const tokenCache = new Map<string, { user: any, expiresAt: number }>()

export async function verifyToken(token: string) {
  const now = Date.now()
  
  // 1. Cek di Cache Lokal terlebih dahulu
  const cached = tokenCache.get(token)
  if (cached && cached.expiresAt > now) {
    return cached.user
  }

  // 2. Jika tidak ada di cache atau expired, tembak Supabase API
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    console.error('[AUTH ERROR] Supabase getUser failed:', error)
    return null
  }

  // 3. Simpan di cache untuk 5 menit ke depan
  tokenCache.set(token, { user, expiresAt: now + 5 * 60 * 1000 })
  return user
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const user = await verifyToken(token)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' })
    }

    req.user = {
      id: user.id,
      email: user.email || ''
    }

    next()
  } catch (err) {
    console.error('Auth Error:', err)
    return res.status(500).json({ error: 'Internal Auth Error' })
  }
}
