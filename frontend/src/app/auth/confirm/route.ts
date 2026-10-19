import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') || '/app'

  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/app'
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || requestUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const redirectTarget = `${protocol}://${host}${next}`

  const response = NextResponse.redirect(redirectTarget)

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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      console.error('[AUTH_CONFIRM] verifyOtp failed:', error.message)
      return NextResponse.redirect(`${protocol}://${host}/login?error=${encodeURIComponent(error.message)}`)
    }
    return response
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[AUTH_CONFIRM] exchangeCodeForSession failed:', error.message)
      return NextResponse.redirect(
        `${protocol}://${host}/login?verified=true&info=${encodeURIComponent(
          'Email Anda berhasil diverifikasi. Silakan masuk menggunakan email dan kata sandi Anda.'
        )}`
      )
    }
    return response
  }

  return response
}
