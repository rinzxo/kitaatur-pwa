'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/api'
import { Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminRoute } from '../useAdminRoute'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dashboardHref, mainAppUrl } = useAdminRoute()

  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkingInitialAuth, setCheckingInitialAuth] = useState(true)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)

  const urlError = searchParams.get('error')

  useEffect(() => {
    // 0. Enforce HTTPS in production if page loaded over insecure HTTP
    if (typeof window !== 'undefined' && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
      window.location.href = window.location.href.replace('http:', 'https:')
      return
    }

    // 1. If returning with an auth code (?code=...), exchange code for session immediately
    const code = searchParams.get('code')
    if (code) {
      setCheckingInitialAuth(true)
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data?.user) {
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com'
          if (data.user.email?.toLowerCase() === adminEmail.toLowerCase()) {
            toast.success('Selamat datang kembali, Superadmin!')
            router.replace(dashboardHref)
          } else {
            setCurrentEmail(data.user.email || null)
            toast.error(`Akses Ditolak: ${data.user.email} bukan akun Superadmin.`)
            setCheckingInitialAuth(false)
          }
        } else {
          toast.error(error?.message || 'Gagal memproses kode autentikasi.')
          setCheckingInitialAuth(false)
        }
      }).catch((err) => {
        toast.error(err.message || 'Terjadi kesalahan sistem saat otentikasi.')
        setCheckingInitialAuth(false)
      })
      return
    }

    // 2. Check if already authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com'
        if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          router.replace(dashboardHref)
          return
        } else {
          setCurrentEmail(user.email || null)
        }
      }
      setCheckingInitialAuth(false)
    }).catch(() => {
      setCheckingInitialAuth(false)
    })
  }, [dashboardHref, router, searchParams])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      // If currently signed in as non-superadmin, sign out first
      if (currentEmail) {
        await supabase.auth.signOut()
      }

      const isLocal = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1')
      const origin = isLocal ? window.location.origin : `https://${window.location.host}`
      const redirectTarget = `${origin}/auth/callback?next=${encodeURIComponent(dashboardHref)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })
      if (error) {
        toast.error(error.message || 'Gagal login dengan Google')
        setGoogleLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat menghubungkan ke Google.')
      setGoogleLoading(false)
    }
  }

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut()
    setCurrentEmail(null)
    toast.success('Silakan pilih akun Google Superadmin.')
    handleGoogleLogin()
  }

  if (checkingInitialAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans">
        <Loader2 className="w-7 h-7 text-[#0087FF] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs text-center">
        {/* Brand Logo */}
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center p-2.5 mx-auto mb-5 border border-slate-200/60">
          <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-1.5">
          Admin KitaAtur
        </h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Silakan masuk menggunakan akun Google Superadmin yang terdaftar untuk mengakses panel manajemen sistem.
        </p>

        {/* Error Alert */}
        {urlError && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 text-left">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        )}

        {/* Non-Superadmin Warning */}
        {currentEmail && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">Bukan Akun Superadmin</div>
              <div className="mt-0.5 text-amber-700 leading-relaxed">
                Anda masuk sebagai <span className="font-medium text-slate-800">{currentEmail}</span>. Panel ini khusus Superadmin terotorisasi.
              </div>
            </div>
          </div>
        )}

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={currentEmail ? handleSwitchAccount : handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-2xl text-sm transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>
            {googleLoading
              ? 'Menghubungkan...'
              : currentEmail
              ? 'Ganti ke Akun Superadmin'
              : 'Masuk dengan Google'}
          </span>
        </button>

        {/* Back Link */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <a
            href={mainAppUrl}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition inline-block"
          >
            &larr; Kembali ke Aplikasi Utama
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans">
          <Loader2 className="w-7 h-7 text-[#0087FF] animate-spin" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}
