'use client'
import toast from 'react-hot-toast'
import { useState, useEffect, Suspense } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

function ScanGuestsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string
  const urlSessionId = searchParams?.get('sessionId')

  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null)
  const [loading, setLoading] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  
  const [sessionTitle, setSessionTitle] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [isSchool, setIsSchool] = useState(false)

  const fetchStats = async (sid: string) => {
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/sessions/${sid}/guests/stats`)
      setSessionTitle(res.data.sessionTitle)
      setStats(res.data.stats)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }

  useEffect(() => {
    if (!urlSessionId) {
      // Try to get active session
      api.get(`/org-attendance/${orgSlug}/sessions/active`).then(res => {
        if (res.data && res.data.id) {
          setSessionId(res.data.id)
          fetchStats(res.data.id)
        } else {
          toast.error('Tidak ada sesi absensi yang sedang aktif.')
          router.push(`/org/${orgSlug}/attendance`)
        }
      }).catch(() => {
        toast.error('Gagal memuat sesi aktif.')
        router.push(`/org/${orgSlug}/attendance`)
      })
    } else {
      fetchStats(urlSessionId)
    }

    // Fetch settings for terminology
    api.get(`/org/${orgSlug}/settings`).then(res => {
      setIsSchool(res.data?.is_edu || false)
    }).catch(() => {})
  }, [urlSessionId, orgSlug, router])

  const handleScan = async (result: any) => {
    if (!result || !result[0] || !result[0].rawValue) return
    const qrToken = result[0].rawValue

    // Prevent spam scanning the same QR multiple times rapidly
    if (loading || lastScanned === qrToken) return

    setLoading(true)
    setLastScanned(qrToken)
    
    try {
      const res = await api.post(`/org-attendance/${orgSlug}/sessions/${sessionId}/guests/scan`, {
        qrToken
      })
      toast.success(res.data.message || 'Berhasil check-in!')
      if (sessionId) {
        fetchStats(sessionId)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memproses QR Code')
    } finally {
      // Hilangkan status loading secara instan agar UI langsung responsif
      setLoading(false)
      // Allow scanning the same QR again after 3 seconds
      setTimeout(() => {
        setLastScanned(null)
      }, 3000)
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>
        <div className="flex-1 text-center font-extrabold text-slate-800 mr-8">
          Scan QR {isSchool ? 'Siswa' : 'Tamu'}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {sessionTitle && (
          <div className="mb-6 text-center animate-fade-in">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Scanning Sesi</p>
            <h2 className="text-xl font-extrabold text-white bg-blue-600 px-6 py-2 rounded-full border border-blue-500 shadow-lg shadow-blue-500/30">{sessionTitle}</h2>
          </div>
        )}

        <div className="w-full max-w-sm relative aspect-square rounded-3xl overflow-hidden border-[6px] border-white shadow-2xl shadow-blue-900/10 bg-slate-900">
          <Scanner 
            onScan={handleScan}
            formats={['qr_code']}
            constraints={{
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              advanced: [{ focusMode: "continuous" }] as any
            }}
            components={{
              onOff: true,
              torch: true,
              zoom: true,
              finder: true
            }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { objectFit: 'cover' }
            }}
          />
          
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
              <p className="font-bold text-lg text-blue-800 animate-pulse">Memproses...</p>
            </div>
          )}
        </div>

        {stats ? (
          <div className="mt-8 w-full max-w-sm flex flex-col gap-3 animate-fade-in">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Tepat</p>
                <p className="text-2xl font-black text-emerald-700">{stats.tepat}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1">Terlambat</p>
                <p className="text-2xl font-black text-amber-700">{stats.terlambat}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-wider text-rose-600 font-bold mb-1">Alpha</p>
                <p className="text-2xl font-black text-rose-700">{stats.alpha}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl text-center border border-slate-200 shadow-sm mt-1">
               <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-3 px-1">
                 <span>Tingkat Kehadiran</span>
                 <span className="text-blue-600">{stats.percentage}% <span className="text-slate-400 font-normal">dari {stats.total} {isSchool ? 'Siswa' : 'Tamu'}</span></span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5 shadow-inner overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.percentage}%` }}></div>
               </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center max-w-xs animate-fade-in">
            <div className="bg-white shadow-sm p-4 rounded-2xl border border-slate-200 inline-flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl">
                <ScanLine className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 text-left leading-relaxed">
                Arahkan kamera ke QR Code milik {isSchool ? 'siswa' : 'tamu'} untuk melakukan absensi otomatis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScanGuestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}>
      <ScanGuestsContent />
    </Suspense>
  )
}
