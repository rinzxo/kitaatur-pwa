'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Calendar, Clock, MapPin, Plus, ChevronRight, AlertCircle, PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function SessionsDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string

  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'past'>('ongoing')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/sessions`)
      setSessions(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses (Hanya Ketua & Sekretaris).')
        router.push(`/org/${orgSlug}/attendance`)
      }
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  // Filter sessions
  const ongoingSessions = sessions.filter(s => s.is_active && new Date(s.start_time) <= now && new Date(s.end_time) >= now)
  const upcomingSessions = sessions.filter(s => s.is_active && new Date(s.start_time) > now)
  const pastSessions = sessions.filter(s => !s.is_active || new Date(s.end_time) < now)

  const renderSessionCard = (session: any, type: 'ongoing' | 'upcoming' | 'past') => {
    const startTime = new Date(session.start_time)
    const endTime = new Date(session.end_time)
    
    return (
      <div 
        key={session.id} 
        onClick={() => router.push(`/org/${orgSlug}/attendance/generate?sessionId=${session.id}`)}
        className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
              {session.title || 'Sesi Absensi'}
            </h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg inline-block mt-1">
              Tipe: {session.session_type === 'in_out' ? 'Datang & Pulang' : 'Hanya Datang'}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{startTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              {startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
              {endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {session.late_time && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span>Batas Telat: {new Date(session.late_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-4 px-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-end">
          <div>
            <button 
              onClick={() => router.push(`/org/${orgSlug}/attendance`)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              Kembali ke Absensi
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900">Manajemen Sesi</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola jadwal absensi organisasi</p>
          </div>
          <button
            onClick={() => router.push(`/org/${orgSlug}/attendance/sessions/create`)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 stroke-[2.5px]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto mt-6 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setActiveTab('ongoing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Sedang Berlangsung ({ongoingSessions.length})
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'upcoming' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Akan Datang ({upcomingSessions.length})
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'past' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Selesai ({pastSessions.length})
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Memuat sesi...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'ongoing' && (
              ongoingSessions.length > 0 ? ongoingSessions.map(s => renderSessionCard(s, 'ongoing')) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                  <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Tidak ada sesi yang sedang berlangsung</p>
                </div>
              )
            )}
            
            {activeTab === 'upcoming' && (
              upcomingSessions.length > 0 ? upcomingSessions.map(s => renderSessionCard(s, 'upcoming')) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Tidak ada sesi terjadwal</p>
                </div>
              )
            )}
            
            {activeTab === 'past' && (
              pastSessions.length > 0 ? pastSessions.map(s => renderSessionCard(s, 'past')) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                  <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Belum ada riwayat sesi</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
