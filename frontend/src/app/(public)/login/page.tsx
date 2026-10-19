'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 bg-[#0087FF] hover:bg-[#0077E6] disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        "Masuk ke Akun"
      )}
    </button>
  )
}

function AuthCodeHandler() {
  const searchParams = useSearchParams()
  const [hasCode, setHasCode] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') || '/app'

    if (tokenHash && type) {
      setHasCode(true)
      window.location.href = `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`
      return
    }

    if (!code) return

    setHasCode(true)

    async function handleExchange(authCode: string) {
      try {
        // Coba exchange di browser client
        const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
        
        if (!error && data?.session) {
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
          window.location.href = next
          return
        }

        const isPkce = error?.message?.toLowerCase().includes('pkce') ||
                       error?.message?.toLowerCase().includes('code verifier') ||
                       error?.message?.toLowerCase().includes('challenge')

        if (isPkce) {
          // Bersihkan URL dan tampilkan info bahwa verifikasi email selesai dan user bisa langsung login
          const cleanUrl = `${window.location.pathname}?verified=true&info=${encodeURIComponent('Email Anda telah diverifikasi. Silakan masuk menggunakan email dan kata sandi Anda.')}`
          window.location.href = cleanUrl
          return
        }

        // Fallback ke server route /auth/callback
        window.location.href = `/auth/callback?code=${authCode}&next=${encodeURIComponent(next)}`
      } catch (err) {
        console.error('[AuthCodeHandler] Error exchanging code:', err)
        window.location.href = `/auth/callback?code=${authCode}&next=${encodeURIComponent(next)}`
      }
    }

    handleExchange(code)
  }, [searchParams, supabase])

  if (!hasCode) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
        <div className="w-12 h-12 border-4 border-[#0087FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-800 font-bold text-lg">Menyinkronkan sesi akun...</p>
        <p className="text-slate-500 text-sm">Mohon tunggu sebentar, Anda sedang dialihkan.</p>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const supabase = createClient()

  // Tangkap pesan error dan info dari query param jika ada
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const infoParam = searchParams.get('info')
    const verifiedParam = searchParams.get('verified')

    if (infoParam) {
      setInfo(decodeURIComponent(infoParam))
    } else if (verifiedParam === 'true') {
      setInfo('Email Anda telah berhasil diverifikasi! Silakan masuk menggunakan email dan kata sandi.')
    }

    if (errorParam) {
      const decoded = decodeURIComponent(errorParam)
      const isPkce = decoded.toLowerCase().includes('pkce') ||
                     decoded.toLowerCase().includes('code verifier') ||
                     decoded.toLowerCase().includes('challenge')
      if (isPkce) {
        setError('Sesi verifikasi dibuka di peramban berbeda atau telah kedaluwarsa. Jika Anda baru saja mengonfirmasi email, akun Anda sudah aktif—silakan langsung masukkan email dan kata sandi Anda.')
      } else {
        setError(decoded)
      }
    }
  }, [searchParams])

  // Cek apakah user sudah terautentikasi sebelumnya
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Hanya redirect jika tidak sedang memproses parameter auth code
      if (session && !searchParams.get('code') && !searchParams.get('token_hash')) {
        const nextParam = searchParams.get('next')
        const redirectUrl = nextParam || localStorage.getItem('redirect_after_login') || '/app'
        localStorage.removeItem('redirect_after_login')
        window.location.href = redirectUrl
      }
    })
  }, [supabase, searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Email dan password wajib diisi')
      setPending(false)
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setPending(false)
      return
    }

    if (!data.session) {
      setError('Email belum diverifikasi. Silakan daftar ulang jika diperlukan.')
      setPending(false)
      return
    }

    const nextParam = searchParams.get('next')
    const redirectUrl = nextParam || localStorage.getItem('redirect_after_login') || '/app'
    localStorage.removeItem('redirect_after_login')
    window.location.href = redirectUrl
  }

  async function handleGoogleLogin() {
    setPending(true)
    setError(null)
    
    const nextParam = searchParams.get('next')
    const redirectUrl = nextParam || localStorage.getItem('redirect_after_login') || '/app'
    localStorage.removeItem('redirect_after_login')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    })
    
    if (error) {
      setError(error.message)
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Suspense fallback={null}>
        <AuthCodeHandler />
      </Suspense>

      {/* Left Pane (Hero Branding) - Hidden on Mobile */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0087FF] via-[#007AE6] to-[#01C4FB] p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-xl mb-6">
            <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
            Kelola Keuangan<br/>& Organisasi Anda.
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Platform modern untuk mencatat arus kas, melacak target finansial, dan mengelola kehadiran anggota.
          </p>
        </div>

        {/* Decorative Shapes */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Pane (Form) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
        {/* Mobile Header Branding */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-64 bg-gradient-to-r from-[#0087FF] to-[#01C4FB] rounded-b-[40px] flex items-start justify-center pt-10">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm">
              <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
            </div>
            KitaAtur
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md bg-white p-8 md:p-10 rounded-[2rem] md:rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 mt-24 md:mt-0">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Selamat Datang</h2>
            <p className="text-slate-500 text-sm font-medium">Masuk untuk melanjutkan ke dasbor Anda.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:border-[#0087FF] focus:bg-white transition-all font-medium"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider" htmlFor="password">
                  Kata Sandi
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:border-[#0087FF] focus:bg-white transition-all font-medium"
              />
            </div>
            
            {info && (
              <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-medium">
                {info}
              </div>
            )}

            {error && (
              <div className="text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <SubmitButton pending={pending} />
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Atau lanjutkan dengan</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={pending}
              type="button"
              className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl text-slate-700 font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
          
          <p className="text-slate-500 text-center text-sm mt-8 font-medium">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#0087FF] hover:text-[#0077E6] transition-colors font-bold">
              Buat Akun Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0087FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
