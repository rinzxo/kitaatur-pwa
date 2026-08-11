'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, Loader2, School } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EduPinVerifyPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgSlug as string

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    setLoading(true)
    try {
      const res = await api.post(`/school/schools/${orgId}/verify`, { pin })
      if (res.data.success) {
        toast.success('PIN Benar. Akses diizinkan.')
        // Simpan pin sementara di session storage agar tidak perlu input lagi saat pindah halaman
        sessionStorage.setItem(`edu_pin_${orgId}`, pin)
        router.push(`/school/${orgId}/student`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'PIN Salah atau terjadi kesalahan.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Link href="/school" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Sekolah
      </Link>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10" />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Akses Terkunci</h2>
          <p className="text-sm text-slate-500">Silakan masukkan PIN Akses Wali Murid yang diberikan oleh pihak sekolah Anda.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Masukkan PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center tracking-[0.5em] text-3xl font-black p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-base placeholder:font-medium"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buka Akses Siswa'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-3">Anda seorang guru / pengajar?</p>
          <Link 
            href={`/school/${orgId}/monitor`}
            className="inline-flex w-full items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-xl transition-colors border border-indigo-100"
          >
            Masuk ke Monitor Kelas
          </Link>
        </div>
      </div>
    </div>
  )
}
