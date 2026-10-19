import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, {
              ...options,
              domain: undefined,
              secure: process.env.NODE_ENV === 'production'
            })
          } catch (error) {
            // Read-only in Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', {
              ...options,
              domain: undefined,
              maxAge: 0,
              secure: process.env.NODE_ENV === 'production'
            })
          } catch (error) {
            // Read-only in Server Components
          }
        },
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                domain: undefined,
                secure: process.env.NODE_ENV === 'production'
              })
            )
          } catch (error) {
            // Read-only in Server Components
          }
        },
      },
    }
  )
}
