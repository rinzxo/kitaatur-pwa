'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const next = searchParams.get('next') || '/personal/dashboard'
      router.replace(`/auth/callback?code=${code}&next=${encodeURIComponent(next)}`)
    }
  }, [searchParams, router])

  return null
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const supabase = createClient()

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

    window.location.href = '/personal/dashboard'
  }

  async function handleGoogleLogin() {
    setPending(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/personal/dashboard`,
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
      <div className="hidden md:flex md:w-1/2 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden text-white">
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
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-10 -right-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Right Pane (Form) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 relative">
        {/* Mobile Header Branding */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-64 bg-blue-600 rounded-b-[40px] flex items-start justify-center pt-10">
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
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
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
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
            
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
            <Link href="/register" className="text-blue-600 hover:text-blue-700 transition-colors font-bold">
              Buat Akun Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
