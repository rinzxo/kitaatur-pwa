import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const errorParam = requestUrl.searchParams.get('error')
  const errorDesc = requestUrl.searchParams.get('error_description')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || requestUrl.host
  const isAdminHost = host.toLowerCase().includes('admin')

  let next = requestUrl.searchParams.get('next') || (isAdminHost ? '/' : '/app')

  // Pastikan path internal aman dari open redirect
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = isAdminHost ? '/' : '/app'
  }
  const isLocal = host.includes('localhost') || host === '127.0.0.1'
  const protocol = isLocal ? 'http' : 'https'
  const redirectTarget = `${protocol}://${host}${next}`

  // Jika penyedia OAuth (misal Google) membatalkan atau mengembalikan error langsung
  if (errorParam || errorDesc) {
    const errorMsg = errorDesc || errorParam || 'Autentikasi dibatalkan atau gagal'
    const loginPath = isAdminHost ? (host.includes('admin') ? '/login' : '/admin/login') : '/login'
    return NextResponse.redirect(`${protocol}://${host}${loginPath}?error=${encodeURIComponent(errorMsg)}`)
  }

  const response = NextResponse.redirect(redirectTarget)

  const isRinzDomain = host.includes('rinzgroup.web.id')
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
          response.cookies.set(name, value, {
            ...options,
            domain: cookieDomain,
            path: options?.path || '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set(name, '', {
            ...options,
            domain: cookieDomain,
            path: options?.path || '/',
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          })
        },
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              domain: cookieDomain,
              path: options?.path || '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  // 1. Verifikasi email melalui OTP/token_hash (bebas isu PKCE lintas peramban)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error('[AUTH_CALLBACK] verifyOtp failed:', error.message)
      return NextResponse.redirect(`${protocol}://${host}/login?error=${encodeURIComponent(error.message)}`)
    }
    return response
  }

  // 2. Pertukaran Authorization Code untuk Sesi (OAuth seperti Google atau PKCE Auth Code)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AUTH_CALLBACK] exchangeCodeForSession failed:', error.message)

      const isPkceError =
        error.message.toLowerCase().includes('pkce') ||
        error.message.toLowerCase().includes('code verifier') ||
        error.message.toLowerCase().includes('challenge')

      if (isPkceError) {
        console.error('[AUTH_CALLBACK] PKCE Error on host:', host, error.message)
        const isTargetAdmin = isAdminHost || next.startsWith('/admin')
        const loginPath = isTargetAdmin ? (isAdminHost ? '/login' : '/admin/login') : '/login'
        return NextResponse.redirect(
          `${protocol}://${host}${loginPath}?error=${encodeURIComponent(
            'Sesi verifikasi OAuth terputus antar-domain. Silakan login langsung melalui https://kitatur.rinzgroup.web.id/admin/login atau pastikan wildcard domain sudah diizinkan di Supabase.'
          )}`
        )
      }

      const loginPath = isAdminHost ? (host.includes('admin') ? '/login' : '/admin/login') : '/login'
      return NextResponse.redirect(`${protocol}://${host}${loginPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.user) {
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com')
        .split(',')
        .map((e) => e.trim().toLowerCase())
      const isSuperadmin = data.user.email ? adminEmails.includes(data.user.email.toLowerCase()) : false
      const isAdminLoginCookie = request.cookies.get('kitaatur_admin_login')?.value === '1'

      // Jika user adalah superadmin dan request ini diawali dari admin panel:
      if (isSuperadmin && (isAdminLoginCookie || isAdminHost || next.startsWith('/admin') || (next === '/' && isAdminHost))) {
        // Hapus tracking cookie
        response.cookies.set('kitaatur_admin_login', '', {
          domain: cookieDomain,
          path: '/',
          maxAge: 0,
        })
        const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin-kitatur.rinzgroup.web.id'
        const destination = isAdminHost ? `${protocol}://${host}/` : `https://${adminDomain}/`
        return NextResponse.redirect(destination, { headers: response.headers })
      }
    }


    return response
  }


  return response
}
