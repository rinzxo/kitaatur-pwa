import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Domains
const ADMIN_DOMAIN = (process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin-kitatur.rinzgroup.web.id').split(':')[0].toLowerCase()
const MAIN_DOMAIN = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'kitatur.rinzgroup.web.id').split(':')[0].toLowerCase()

// Helper: check if email is Superadmin (supports multiple comma-separated emails)
function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false
  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com'
  const list = envAdmins.split(',').map((e) => e.trim().toLowerCase())
  return list.includes(email.toLowerCase())
}

// Helper: preserve updated Supabase cookies when rewriting
function rewriteWithCookies(targetUrl: URL, request: NextRequest, supabaseResponse: NextResponse) {
  const response = NextResponse.rewrite(targetUrl, {
    request: {
      headers: request.headers,
    },
  })
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })
  return response
}

// Helper: preserve updated Supabase cookies when redirecting, strictly enforcing HTTPS on non-localhost
function redirectWithCookies(targetUrl: URL | string, supabaseResponse: NextResponse) {
  const urlObj = typeof targetUrl === 'string' ? new URL(targetUrl) : new URL(targetUrl.toString())
  if (!urlObj.hostname.includes('localhost') && urlObj.hostname !== '127.0.0.1') {
    urlObj.protocol = 'https:'
  }
  const response = NextResponse.redirect(urlObj)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })
  return response
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const hostHeader = (request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host || '').toLowerCase()
  const hostname = hostHeader.split(':')[0]
  const { pathname } = request.nextUrl

  // Enforce HTTPS on production / custom domains
  const proto = request.headers.get('x-forwarded-proto')
  const isLocal = hostname.includes('localhost') || hostname === '127.0.0.1'
  if (!isLocal && proto === 'http') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // Bypass auth and api endpoints immediately on all domains
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    return supabaseResponse
  }

  const isRinzDomain = hostname.includes('rinzgroup.web.id')
  const cookieDomain = isRinzDomain ? '.rinzgroup.web.id' : undefined

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: isRinzDomain
        ? {
            domain: '.rinzgroup.web.id',
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          }
        : undefined,
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          if (cookieDomain) {
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          }
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
            domain: cookieDomain,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
          if (cookieDomain) {
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
              domain: cookieDomain,
              maxAge: 0,
              secure: process.env.NODE_ENV === 'production',
            })
          }
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
            if (cookieDomain) {
              supabaseResponse.cookies.set({
                name,
                value: '',
                ...options,
                maxAge: 0,
              })
            }
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: cookieDomain,
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )


  // Fetch the user session to validate token
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  // Detect whether request comes through the dedicated admin domain
  const isAdminDomain =
    hostname === ADMIN_DOMAIN ||
    hostname.includes('admin-kitatur') ||
    hostname.startsWith('admin.') ||
    (process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.has('__admin_domain'))

  const url = request.nextUrl.clone()

  // Normalize accidental caret typo (e.g. /^?code=...) from external OAuth redirect misconfigurations
  if (pathname.startsWith('/^')) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.pathname = pathname.replace(/^\/\^/, '') || '/'
    return redirectWithCookies(cleanUrl, supabaseResponse)
  }

  // CRITICAL: If an OAuth code callback lands on root on any domain (e.g. /?code=...):
  // Forward it immediately to /auth/callback so the authorization code can be exchanged for a session!
  if ((pathname === '/' || pathname === '') && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.search = request.nextUrl.search
    if (!callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', isAdminDomain ? '/' : '/app')
    }
    return redirectWithCookies(callbackUrl, supabaseResponse)
  }

  // =========================================================================
  // SCENARIO 1: REQUEST ON ADMIN DOMAIN (e.g. admin-kitatur.rinzgroup.web.id)
  // =========================================================================
  if (isAdminDomain) {
    // 0. Allow auth and api endpoints to pass through unimpeded
    if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
      return supabaseResponse
    }

    // 0.1. CRITICAL: If an OAuth code callback lands on root or any other page (e.g. /?code=...):
    // Forward it immediately to /auth/callback so the authorization code can be exchanged for a session!
    if (request.nextUrl.searchParams.has('code')) {
      const callbackUrl = new URL('/auth/callback', request.url)
      callbackUrl.search = request.nextUrl.search
      if (!callbackUrl.searchParams.has('next')) {
        callbackUrl.searchParams.set('next', '/')
      }
      return redirectWithCookies(callbackUrl, supabaseResponse)
    }

    // 1. Unauthenticated users
    if (!user) {
      if (pathname === '/login' || pathname === '/admin/login') {
        url.pathname = '/admin/login'
        return rewriteWithCookies(url, request, supabaseResponse)
      }
      // Redirect unauthenticated requests on admin domain to admin login
      const loginRedirect = new URL('/login', request.url)
      return redirectWithCookies(loginRedirect, supabaseResponse)
    }

    // 2. Authenticated user on Login page:
    // If superadmin, proceed to dashboard. If not superadmin, show login page with warning & switch account button.
    if (pathname === '/login' || pathname === '/admin/login') {
      if (isSuperadminEmail(user.email)) {
        const homeRedirect = new URL('/', request.url)
        return redirectWithCookies(homeRedirect, supabaseResponse)
      } else {
        url.pathname = '/admin/login'
        return rewriteWithCookies(url, request, supabaseResponse)
      }
    }

    // 3. Clean URL redirects on admin domain (strip /admin prefix if typed directly)
    if (pathname === '/admin') {
      return redirectWithCookies(new URL('/', request.url), supabaseResponse)
    }
    if (pathname === '/admin/organizations') {
      return redirectWithCookies(new URL('/organizations', request.url), supabaseResponse)
    }
    if (pathname === '/admin/announcements') {
      return redirectWithCookies(new URL('/announcements', request.url), supabaseResponse)
    }
    if (pathname === '/admin/vouchers') {
      return redirectWithCookies(new URL('/vouchers', request.url), supabaseResponse)
    }
    if (pathname.startsWith('/admin/')) {
      const cleanPath = pathname.replace(/^\/admin/, '') || '/'
      return redirectWithCookies(new URL(cleanPath, request.url), supabaseResponse)
    }

    // 4. Rewrite clean paths to internal /admin App Router files
    if (pathname === '/') {
      url.pathname = '/admin'
      return rewriteWithCookies(url, request, supabaseResponse)
    }
    if (pathname === '/organizations' || pathname.startsWith('/organizations/')) {
      url.pathname = `/admin${pathname}`
      return rewriteWithCookies(url, request, supabaseResponse)
    }
    if (pathname === '/announcements' || pathname.startsWith('/announcements/')) {
      url.pathname = `/admin${pathname}`
      return rewriteWithCookies(url, request, supabaseResponse)
    }
    if (pathname === '/vouchers' || pathname.startsWith('/vouchers/')) {
      url.pathname = `/admin${pathname}`
      return rewriteWithCookies(url, request, supabaseResponse)
    }

    // 5. If user visits main app paths (dashboard, personal, org) while on admin domain, redirect to main domain
    const isMainAppRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/personal') ||
      pathname.startsWith('/org') ||
      pathname.startsWith('/app') ||
      pathname.startsWith('/onboarding')

    if (isMainAppRoute) {
      const isLocal = hostname.includes('localhost') || hostname === '127.0.0.1'
      const mainBase = isLocal ? 'http://localhost:3000' : `https://${MAIN_DOMAIN}`
      const targetMainUrl = new URL(`${mainBase}${pathname}${url.search}`)
      return redirectWithCookies(targetMainUrl, supabaseResponse)
    }

    // Default rewrite for any other admin sub-routes
    if (pathname.startsWith('/admin')) {
      return rewriteWithCookies(url, request, supabaseResponse)
    }

    return supabaseResponse
  }

  // =========================================================================
  // SCENARIO 2: REQUEST ON MAIN DOMAIN (e.g. kitatur.rinzgroup.web.id)
  // =========================================================================

  // Allow direct access to /admin routes on main domain seamlessly!
  if (pathname.startsWith('/admin')) {
    if (!user) {
      if (pathname === '/admin/login') {
        return supabaseResponse
      }
      const adminLoginTarget = new URL('/admin/login', request.url)
      return redirectWithCookies(adminLoginTarget, supabaseResponse)
    }

    // If authenticated user is on /admin/login:
    if (pathname === '/admin/login') {
      if (isSuperadminEmail(user.email)) {
        const adminDashboardTarget = new URL('/admin', request.url)
        return redirectWithCookies(adminDashboardTarget, supabaseResponse)
      }
      // Non-superadmin stays on login page to see the warning and switch account
      return supabaseResponse
    }

    // Allow authenticated user to proceed to /admin; AdminLayout will handle superadmin verification
    return supabaseResponse
  }


  // Auto-redirect logged-in users from root to /app
  if (pathname === '/') {
    if (user) {
      url.pathname = '/app'
      return redirectWithCookies(url, supabaseResponse)
    }
  }

  // Protect dashboard, personal, app routes, and onboarding
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/personal') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/org')

  if (isProtectedRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      const targetPath = pathname === '/app' ? '/app' : pathname + url.search
      redirectUrl.searchParams.set('next', targetPath)
      return redirectWithCookies(redirectUrl, supabaseResponse)
    }
  }

  // Redirect logged-in users away from auth pages directly into /app
  if (pathname === '/login' || pathname === '/register') {
    // Only redirect if user has active session and is NOT currently processing an auth code
    if (user && !request.nextUrl.searchParams.has('code')) {
      const nextTarget = request.nextUrl.searchParams.get('next') || '/app'
      const destination = nextTarget.startsWith('/') ? nextTarget : '/app'
      const redirectUrl = new URL(destination, request.url)
      return redirectWithCookies(redirectUrl, supabaseResponse)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets (manifest, sw, icons, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/|images/|logo.png|offline.html).*)',
  ],
}
