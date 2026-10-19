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

  let next = requestUrl.searchParams.get('next') || '/app'

  // Pastikan path internal aman dari open redirect
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/app'
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || requestUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const redirectTarget = `${protocol}://${host}${next}`

  // Jika penyedia OAuth (misal Google) membatalkan atau mengembalikan error langsung
  if (errorParam || errorDesc) {
    const errorMsg = errorDesc || errorParam || 'Autentikasi dibatalkan atau gagal'
    return NextResponse.redirect(`${protocol}://${host}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  const response = NextResponse.redirect(redirectTarget)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Kompatibilitas untuk @supabase/ssr 0.3.x (menggunakan get, set, remove)
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set(name, value, {
            ...options,
            path: options?.path || '/',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set(name, '', {
            ...options,
            path: options?.path || '/',
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        // Kompatibilitas untuk versi @supabase/ssr yang lebih baru
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AUTH_CALLBACK] exchangeCodeForSession failed:', error.message)

      const isPkceError =
        error.message.toLowerCase().includes('pkce') ||
        error.message.toLowerCase().includes('code verifier') ||
        error.message.toLowerCase().includes('challenge')

      if (isPkceError) {
        // Jika PKCE gagal (misal user membuka tautan konfirmasi email di browser/aplikasi berbeda dari pendaftaran),
        // biasanya status email sudah diverifikasi di server Supabase saat link diklik.
        return NextResponse.redirect(
          `${protocol}://${host}/login?verified=true&info=${encodeURIComponent(
            'Email Anda berhasil diverifikasi. Silakan masuk menggunakan email dan kata sandi Anda.'
          )}`
        )
      }

      return NextResponse.redirect(`${protocol}://${host}/login?error=${encodeURIComponent(error.message)}`)
    }
    return response
  }

  return response
}
