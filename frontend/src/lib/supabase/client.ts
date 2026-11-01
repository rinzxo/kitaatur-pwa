import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isRinz = typeof window !== 'undefined' && window.location.hostname.includes('rinzgroup.web.id')
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: isRinz
        ? {
            domain: '.rinzgroup.web.id',
            path: '/',
            sameSite: 'lax',
            secure: true,
          }
        : undefined,
    }
  )
}


