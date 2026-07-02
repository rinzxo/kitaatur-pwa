import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Bulletproof workaround: Manually extract session from cookie if ssr fails to parse it
  const authCookie = request.cookies.get('sb-vapjaqgoikyllyeuilfs-auth-token')?.value
  if (authCookie) {
    try {
      // Sanitize literal newlines in the cookie string
      const sanitizedCookie = authCookie.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      const parsed = JSON.parse(sanitizedCookie)
      if (parsed.access_token && parsed.refresh_token) {
        await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        })
      }
    } catch (e) {
      console.log('[MIDDLEWARE] MANUAL PARSE ERROR:', e)
    }
  }

  // Fetch the user session to validate the token
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  console.log('[MIDDLEWARE] PATH:', request.nextUrl.pathname)
  console.log('[MIDDLEWARE] GET_USER ERROR:', error)
  console.log('[MIDDLEWARE] USER:', user ? user.email : 'null')

  const url = request.nextUrl.clone()

  // Protect dashboard and personal routes
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/personal')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth and root pages
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register') || url.pathname === '/') {
    if (user) {
      url.pathname = '/personal/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/personal/:path*',
    '/login',
    '/register'
  ],
}
