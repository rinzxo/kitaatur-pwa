import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') || '/app'

  // Pastikan path internal aman dari open redirect
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/app'
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || requestUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const redirectTarget = `${protocol}://${host}${next}`

  const response = NextResponse.redirect(redirectTarget)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                path: options?.path || '/',
                secure: process.env.NODE_ENV === 'production',
              })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AUTH_CALLBACK] exchangeCodeForSession failed:', error.message)
      // Redirect ke login dengan pesan error jika code expired / invalid
      return NextResponse.redirect(`${protocol}://${host}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  return response
}
