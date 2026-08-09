'use client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Trash2, Power } from 'lucide-react'

export default function SchedulesPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/org-schedule/${orgSlug}`)
      setSchedules(res.data)
    } catch (err) {
      toast.error('Gagal memuat jadwal rutin')
    } finally {
      setLoading(false)
    }
  }

  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/org-schedule/${orgSlug}/${id}/toggle`, { is_active: !currentStatus })
      toast.success('Status jadwal berhasil diubah')
      fetchSchedules()
    } catch (err) {
      toast.error('Gagal mengubah status jadwal')
    }
  }

  const deleteSchedule = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return
    try {
      await api.delete(`/org-schedule/${orgSlug}/${id}`)
      toast.success('Jadwal berhasil dihapus')
      fetchSchedules()
    } catch (err) {
      toast.error('Gagal menghapus jadwal')
    }
  }

  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 pb-28 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" />
              Kembali
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              Jadwal Sesi Otomatis
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Atur jam absen yang akan dibuka otomatis oleh sistem.</p>
          </div>
          <Link 
            href={`/org/${orgSlug}/attendance/schedules/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Jadwal Baru
          </Link>
        </header>

        {loading ? (
          <div className="text-center text-slate-500 py-10 animate-pulse">Memuat jadwal...</div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Jadwal</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Anda belum mengatur jadwal sesi otomatis. Buat jadwal baru untuk mengotomatisasi absensi rutin Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                {/* Active Indicator */}
                <div className={`absolute top-0 left-0 w-full h-1 ${schedule.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{schedule.title}</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                      className={`p-2 rounded-lg transition-colors ${schedule.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      title={schedule.is_active ? "Nonaktifkan" : "Aktifkan"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                      {schedule.late_time && (
                        <p className="text-xs text-orange-600">Batas telat: {schedule.late_time}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {schedule.days_of_week.map((d: number) => (
                        <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                          {daysMap[d]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <p className="truncate">Radius: {schedule.radius_meters}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
