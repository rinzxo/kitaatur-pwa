'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckCircle, Check } from 'lucide-react'

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
        "Daftar Gratis"
      )}
    </button>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const isTrialPromo = searchParams.get('promo') === 'trial7d'

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const password = formData.get('password') as string
    const fullName = (formData.get('fullName') as string || '').trim()

    if (!email || !password || !fullName) {
      setError('Semua field wajib diisi')
      setPending(false)
      return
    }

    const nextRedirect = isTrialPromo ? '/promo/trial' : '/app'

    const { error: registerError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextRedirect)}`,
        data: {
          full_name: fullName,
        }
      }
    })

    if (registerError) {
      setError(registerError.message)
      setPending(false)
      return
    }

    setSuccess(true)
    setPending(false)
  }

  async function handleGoogleLogin() {
    setPending(true)
    setError(null)

    const defaultNext = isTrialPromo ? '/promo/trial' : '/app'
    const redirectUrl = localStorage.getItem('redirect_after_login') || defaultNext
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
      {/* Left Pane (Hero Branding) - Hidden on Mobile */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0087FF] via-[#007AE6] to-[#01C4FB] p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-xl mb-6">
            <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
            Mulai Perjalanan<br/>Lebih Teratur.
          </h1>
          <p className="text-blue-100 text-base max-w-sm font-medium">
            Satu dasbor terpadu untuk keuangan personal, kas organisasi, presensi instan, hingga sistem terpadu sekolah.
          </p>
        </div>

        {/* Feature Cards Showcase */}
        <div className="relative z-10 space-y-4 max-w-sm">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">Keuangan Personal</span>
            <p className="text-sm font-bold mt-0.5">Catat kas, tabungan, dan dompet secara cerdas & otomatis.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-200">Organisasi & Sekolah</span>
            <p className="text-sm font-bold mt-0.5">Manajemen kas transparan, presensi QR, dan rekap instan.</p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-100 font-medium">
          © {new Date().getFullYear()} KitaAtur. Solusi Teratur Komunitas Anda.
        </div>
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
          
          {/* Promo Trial Applied Bar */}
          {isTrialPromo && (
            <div className="mb-6 px-3.5 py-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#0087FF] shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Uji Coba 7 Hari Aktif</span>
              </div>
              <span className="text-[11px] font-bold text-[#0087FF] bg-white px-2 py-0.5 rounded-md border border-blue-200">
                0 Biaya
              </span>
            </div>
          )}

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Daftar Akun</h2>
            <p className="text-slate-500 text-sm font-medium">
              {isTrialPromo ? 'Buat akun Anda untuk langsung menikmati masa uji coba 7 hari gratis.' : 'Buat akun gratis Anda dalam hitungan detik.'}
            </p>
          </div>
          
          {success ? (
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-emerald-800 font-bold text-lg mb-2">Pendaftaran Berhasil!</h3>
              <p className="text-emerald-700 text-sm mb-6">
                Silakan periksa kotak masuk email Anda untuk melakukan verifikasi akun.
              </p>
              <Link 
                href={isTrialPromo ? `/login?redirect=${encodeURIComponent('/promo/trial')}` : '/login'} 
                className="inline-block px-6 py-2.5 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="fullName">
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:border-[#0087FF] focus:bg-white transition-all font-medium"
                />
              </div>
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
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:border-[#0087FF] focus:bg-white transition-all font-medium"
                />
              </div>
              
              {error && (
                <div className="text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <SubmitButton pending={pending} />
            </form>
          )}

          {!success && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500 font-medium">Atau daftar dengan</span>
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
          )}
          
          <p className="text-slate-500 text-center text-sm mt-8 font-medium">
            Sudah punya akun?{' '}
            <Link 
              href={isTrialPromo ? `/login?redirect=${encodeURIComponent('/promo/trial')}` : '/login'} 
              className="text-[#0087FF] hover:text-[#0077E6] transition-colors font-bold"
            >
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
