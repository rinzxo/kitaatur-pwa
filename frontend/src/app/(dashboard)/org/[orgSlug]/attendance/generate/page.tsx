'use client'
import toast from 'react-hot-toast'


import { useState, useEffect, Suspense } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, Loader2, StopCircle } from 'lucide-react'

function GenerateContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string
  const rawSessionId = searchParams?.get('sessionId')
  const urlSessionId = rawSessionId === 'null' ? null : rawSessionId

  const [loading, setLoading] = useState(true)
  const [sessionPin, setSessionPin] = useState<string | null>(null)
  const [checkoutPin, setCheckoutPin] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<string>('in_only')
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null)
  const [sessionTitle, setSessionTitle] = useState<string>('Sesi Presensi Aktif')
  const [locationStatus, setLocationStatus] = useState<string>('Memuat data sesi...')


  useEffect(() => {
    checkActiveSession()
  }, [])

  const checkActiveSession = async () => {
    try {
      const endpoint = urlSessionId 
        ? `/org-attendance/${orgSlug}/sessions/active/${urlSessionId}`
        : `/org-attendance/${orgSlug}/sessions/active`
        
      const res = await api.get(endpoint)
      if (res.data) {
        setSessionPin(res.data.pin_code)
        setCheckoutPin(res.data.checkout_pin_code)
        setSessionType(res.data.session_type)
        setSessionId(res.data.id)
        if (res.data.title) setSessionTitle(res.data.title)
        
        // If URL had no sessionId or literally said 'null', fix the URL in the address bar
        if (!rawSessionId || rawSessionId === 'null') {
          router.replace(`/org/${orgSlug}/attendance/generate?sessionId=${res.data.id}`)
        }
      } else {
        toast.error('Sesi tidak ditemukan atau belum aktif.')
        router.push(`/org/${orgSlug}/attendance/sessions`)
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses (Hanya Ketua & Sekretaris).')
      } else {
        toast.error('Gagal memuat sesi.')
      }
      router.push(`/org/${orgSlug}/attendance/sessions`)
    } finally {
      setLoading(false)
    }
  }

  const closeSession = async () => {
    if (!sessionId) return
    try {
      await api.put(`/org-attendance/${orgSlug}/sessions/${sessionId}/close`)
      toast.error('Sesi presensi ditutup.')
      router.push(`/org/${orgSlug}/attendance`)
    } catch (err) {
      toast.error('Gagal menutup sesi.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 text-center">
        <header className="mb-6 text-left">
          <Link 
            href={`/org/${orgSlug}/attendance/sessions`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Manajemen Sesi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="h-7 w-7 text-blue-600" />
            {sessionTitle}
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-2">
            Anggota wajib memasukkan PIN ini dan berada di radius 50 meter dari titik ini.
          </p>
        </header>

        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center h-44">
              <div className="h-4 w-32 bg-slate-200 rounded-md mb-4" />
              <div className="h-14 w-52 bg-slate-300 rounded-xl" />
            </div>
            <div className="h-10 w-64 bg-slate-100 rounded-xl mx-auto" />
            <div className="space-y-3">
              <div className="h-14 bg-slate-100 rounded-xl" />
              <div className="h-14 bg-slate-100 rounded-xl" />
              <div className="h-14 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ) : sessionPin ? (
          <div className="space-y-8">
            {sessionType === 'in_out' && checkoutPin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">PIN Presensi Datang</p>
                  <h2 className="text-4xl md:text-5xl font-black text-blue-700 tracking-[0.2em]">{sessionPin}</h2>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">PIN Presensi Pulang</p>
                  <h2 className="text-4xl md:text-5xl font-black text-orange-700 tracking-[0.2em]">{checkoutPin}</h2>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">PIN Kehadiran</p>
                <h2 className="text-7xl font-black text-blue-600 tracking-[0.2em]">{sessionPin}</h2>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 py-3 px-4 rounded-xl">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Lokasi GPS Terkunci (Radius 50m)</span>
              </div>
              {sessionType === 'in_out' && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 py-3 px-4 rounded-xl">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">Validasi Lokasi 2x (Datang & Pulang)</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/org/${orgSlug}/attendance/guests/scan?sessionId=${sessionId}`)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-[#0087FF]/30 hover:border-[#0087FF] hover:bg-[#E0F4FE]/30 text-[#0087FF] font-bold rounded-xl transition-all shadow-sm"
              >
                Scan QR Tamu
              </button>

              <button 
                onClick={() => router.push(`/org/${orgSlug}/attendance/guests?sessionId=${sessionId}`)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm"
              >
                Lihat Daftar Hadir Tamu
              </button>

              <button 
                onClick={closeSession}
                className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-all"
              >
                <StopCircle className="w-5 h-5" />
                Tutup Sesi Presensi
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12">
            <p className="text-red-500 font-medium">Sesi tidak tersedia.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GenerateAttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
        <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 space-y-8">
          <div>
            <div className="h-4 w-28 bg-slate-200 rounded-md mb-3" />
            <div className="h-8 w-56 bg-slate-300 rounded-xl mb-2" />
            <div className="h-4 w-72 bg-slate-200 rounded-md" />
          </div>
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  )
}
