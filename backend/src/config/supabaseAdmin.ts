import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Supabase Admin Warning] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
}

import WebSocket from 'ws'

// Inisialisasi client administratif Supabase
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    // @ts-ignore
    transport: WebSocket
  }
})
