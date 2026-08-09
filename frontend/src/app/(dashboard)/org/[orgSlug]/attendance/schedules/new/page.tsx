'use client'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, MapPin } from 'lucide-react'

export default function NewSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [title, setTitle] = useState('Sesi Absen Pagi')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')
  const [lateTime, setLateTime] = useState('08:15')
  
  const [latitude, setLatitude] = useState(-6.200000)
  const [longitude, setLongitude] = useState(106.816666)
  const [radius, setRadius] = useState(50)
  
  const [saving, setSaving] = useState(false)

  const daysMap = [
    { id: 1, name: 'Senin' },
    { id: 2, name: 'Selasa' },
    { id: 3, name: 'Rabu' },
    { id: 4, name: 'Kamis' },
    { id: 5, name: 'Jumat' },
    { id: 6, name: 'Sabtu' },
    { id: 0, name: 'Minggu' },
  ]

  const toggleDay = (id: number) => {
    if (days.includes(id)) {
      setDays(days.filter(d => d !== id))
    } else {
      setDays([...days, id].sort())
    }
  }

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Mendapatkan lokasi...', { id: 'location' })
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
          toast.success('Lokasi berhasil didapatkan!', { id: 'location' })
        },
        (error) => {
          toast.error('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.', { id: 'location' })
        },
        { enableHighAccuracy: true }
      )
    } else {
      toast.error('Browser Anda tidak mendukung Geolocation')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (days.length === 0) {
      toast.error('Pilih setidaknya satu hari')
      return
    }

    setSaving(true)
    try {
      await api.post(`/org-schedule/${orgSlug}`, {
        title,
        session_type: 'in_only',
        latitude,
        longitude,
        radius_meters: radius,
        days_of_week: days,
        start_time: startTime,
        end_time: endTime,
        late_time: lateTime || null
      })
      toast.success('Jadwal berhasil dibuat!')
      router.push(`/org/${orgSlug}/attendance/schedules`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan jadwal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 pb-28 relative">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="mb-8">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Kembali
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900">Buat Jadwal Baru</h1>
          <p className="text-slate-500 mt-1">Sistem akan otomatis membuka sesi absensi sesuai jadwal ini.</p>
        </header>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Detail Sesi</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Sesi (Opsional)</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Misal: Absen Pagi Kantor"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Waktu & Hari</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Hari Aktif</label>
              <div className="flex flex-wrap gap-2">
                {daysMap.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${days.includes(d.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jam Buka Sesi</label>
                <input 
                  type="time" 
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Batas Telat</label>
                <input 
                  type="time" 
                  value={lateTime}
                  onChange={e => setLateTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jam Tutup Sesi</label>
                <input 
                  type="time" 
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Lokasi Presensi</h2>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-sm flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Dapatkan Lokasi Saat Ini
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={latitude}
                  onChange={e => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={longitude}
                  onChange={e => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Radius Maksimal (Meter)</label>
              <input 
                type="number" 
                required
                min="10"
                value={radius}
                onChange={e => setRadius(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : <><Save className="w-5 h-5" /> Simpan Jadwal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
