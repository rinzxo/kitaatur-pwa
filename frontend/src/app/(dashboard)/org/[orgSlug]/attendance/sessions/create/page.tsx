'use client'
import toast from 'react-hot-toast'


import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Calendar, Clock, MapPin, ChevronLeft, Save } from 'lucide-react'

export default function CreateSessionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string

  const [title, setTitle] = useState('Sesi Absensi')
  const [sessionType, setSessionType] = useState<'in_only' | 'in_out'>('in_only')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [lateTime, setLateTime] = useState('')
  const [checkoutStartTime, setCheckoutStartTime] = useState('')
  const [radius, setRadius] = useState(50)
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung GPS.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const payload = {
          title,
          session_type: sessionType,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          late_time: lateTime ? new Date(lateTime).toISOString() : null,
          checkout_start_time: (sessionType === 'in_out' && checkoutStartTime) ? new Date(checkoutStartTime).toISOString() : null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius_meters: radius
        }

        await api.post(`/org-attendance/${orgSlug}/sessions`, payload)
        toast.success('Sesi berhasil dibuat!')
        router.push(`/org/${orgSlug}/attendance/sessions`)
      } catch (err: any) {
        toast.error('Gagal membuat sesi absensi: ' + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }, (error) => {
      toast.error('Gagal mendapatkan lokasi. Izinkan akses GPS terlebih dahulu.')
      setLoading(false)
    }, {
      enableHighAccuracy: true
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Buat Sesi Absensi</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Sesi (Acara/Kegiatan)</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                placeholder="Contoh: Rapat Paripurna"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Absensi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionType('in_only')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    sessionType === 'in_only' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Hanya Datang
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('in_out')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    sessionType === 'in_out' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Datang & Pulang
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" /> Pengaturan Waktu
            </h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Mulai</label>
              <input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Selesai (Tutup Sesi)</label>
              <input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Batas Keterlambatan (Opsional)</label>
              <input 
                type="datetime-local" 
                value={lateTime}
                onChange={(e) => setLateTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 font-medium text-slate-800"
              />
              <p className="text-xs text-slate-500 mt-1">Jika dikosongkan, anggota tidak akan pernah ditandai terlambat.</p>
            </div>
            
            {sessionType === 'in_out' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold mb-2 text-orange-600">Waktu Mulai Absen Pulang</label>
                <input 
                  type="datetime-local" 
                  value={checkoutStartTime}
                  onChange={(e) => setCheckoutStartTime(e.target.value)}
                  required
                  className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 font-medium text-slate-800"
                />
                <p className="text-xs text-orange-600/80 mt-1">
                  Anggota tidak bisa absen pulang sebelum waktu ini. Mencegah anggota "titip absen pulang" di awal acara.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Kordinat Kehadiran
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Titik GPS pusat akan otomatis diambil dari lokasi Anda saat Anda menekan tombol "Simpan & Buat Sesi". Pastikan Anda berada di lokasi acara saat membuat sesi ini.
            </p>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Radius Maksimal (Meter)</label>
              <input 
                type="number" 
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" /> Simpan & Buat Sesi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
