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
          request.cookies.set({ name, value, ...options })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )

  // Fetch the user session to validate the token
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  const url = request.nextUrl.clone()

  // Auto-redirect logged-in users from root to /app
  if (url.pathname === '/') {
    if (user) {
      url.pathname = '/app'
      return NextResponse.redirect(url)
    }
  }

  // Protect dashboard, personal, app routes, and onboarding
  const isProtectedRoute = 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/personal') || 
    url.pathname.startsWith('/onboarding') || 
    url.pathname.startsWith('/app')

  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      const targetPath = url.pathname === '/app' ? '/app' : (url.pathname + url.search)
      redirectUrl.searchParams.set('next', targetPath)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect logged-in users away from auth pages directly into /app
  if (url.pathname === '/login' || url.pathname === '/register') {
    // Only redirect if user has active session and is NOT currently processing an auth code
    if (user && !request.nextUrl.searchParams.has('code')) {
      const nextTarget = request.nextUrl.searchParams.get('next') || '/app'
      const destination = nextTarget.startsWith('/') ? nextTarget : '/app'
      const redirectUrl = new URL(destination, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/app/:path*',
    '/dashboard/:path*',
    '/personal/:path*',
    '/onboarding',
    '/login',
    '/register'
  ],
}
