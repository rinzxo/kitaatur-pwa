import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isRinz = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('rinzgroup.web.id')
  const cookieDomain = process.env.NODE_ENV === 'production' && isRinz ? '.rinzgroup.web.id' : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        secure: process.env.NODE_ENV === 'production',
      }
    }
  )
}
