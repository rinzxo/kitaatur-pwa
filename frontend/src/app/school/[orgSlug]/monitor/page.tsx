'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { Lock, ArrowLeft, Loader2, School, Search, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function MonitorPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgSlug as string

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  
  const [data, setData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all')

  const fetchSessionData = async (sessionId: string, isInitial = false) => {
    setLoading(true)
    try {
      const res = await api.post(`/school/schools/${orgId}/monitor`, { pin, sessionId })
      setData(res.data)
      setSelectedSessionId(sessionId)
      if (isInitial) {
        setAuthorized(true)
        toast.success('Akses Diberikan')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (isInitial ? 'PIN salah' : 'Gagal memuat data'))
      if (isInitial) setPin('')
    } finally {
      setLoading(false)
    }
  }

  const submitPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!pin) return
    await fetchSessionData('all', true)
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-blue-600 rounded-b-[40px] z-0 shadow-lg"></div>
        <Link href="/school" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-bold text-blue-100 hover:text-white transition-colors z-10">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl text-center border border-slate-100 z-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Monitor Kehadiran</h1>
          <p className="text-slate-500 text-sm mb-8">Masukkan PIN Sekolah untuk melihat data kehadiran kelas secara langsung.</p>
          
          <form onSubmit={submitPin} className="space-y-6 mb-8">
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
              disabled={!pin || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Akses Data'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Monitor Dashboard
  const { guests, sessions, allSessions } = data
  const filteredGuests = guests.filter((g: any) => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.identifier && g.identifier.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (g.custom_data?.kelas && g.custom_data.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 pt-6 pb-4 px-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setAuthorized(false)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <School className="h-3.5 w-3.5" /> Mode Monitor Publik
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              {selectedSessionId === 'all' ? 'Rekap Kehadiran Hari Ini' : 'Rekap Kehadiran Sesi'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Sesi: {sessions.length > 0 ? sessions.map((s:any) => s.title).join(', ') : 'Tidak ada sesi'}</p>
          </div>
          <div className="w-full md:w-auto relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Cari nama / kelas..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-colors outline-none"
             />
          </div>
        </div>
        
        {allSessions && allSessions.length > 0 && (
          <div className="max-w-5xl mx-auto mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Pilih Sesi:</span>
            <select
              value={selectedSessionId}
              onChange={(e) => fetchSessionData(e.target.value)}
              className="px-4 py-2 bg-slate-100 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer transition-all min-w-[200px]"
            >
              <option value="all">Sesi Hari Ini</option>
              {allSessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({new Date(s.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}) {s.is_currently_active ? '🟢' : '⚪'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-3">
        {filteredGuests.length === 0 ? (
           <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-200">Data tidak ditemukan.</div>
        ) : (
           filteredGuests.map((g: any) => {
             // Let's figure out status for today's first active session or general status
             let status = 'alpha'
             let notes = null

             const targetAttendances = selectedSessionId === 'all' ? g.guest_attendance : g.guest_attendance.filter((a:any) => a.session_id === selectedSessionId);
             const targetLeaves = selectedSessionId === 'all' ? g.guest_leaves : g.guest_leaves.filter((l:any) => l.session_id === selectedSessionId);

             if (targetAttendances && targetAttendances.length > 0) {
                 status = targetAttendances[0].status
             } else if (targetLeaves && targetLeaves.length > 0) {
                 const leave = targetLeaves[0]
                 status = leave.type
                 notes = leave.notes
                 if (status === 'sakit' && !leave.proof_url) {
                    const ageHours = (Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60);
                    if (ageHours > 24) status = 'izin'
                 }
             }

             return (
               <div key={g.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg">{g.name}</h3>
                   <div className="flex gap-3 text-sm text-slate-500 mt-1 font-medium">
                     <span>{g.identifier}</span>
                     <span>•</span>
                     <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{g.custom_data?.kelas || '-'}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    {status === 'present' ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> Hadir
                      </div>
                    ) : status === 'izin' ? (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100">
                        <Clock className="w-4 h-4" /> Izin
                      </div>
                    ) : status === 'sakit' ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100">
                          <AlertCircle className="w-4 h-4" /> Sakit
                        </div>
                        {notes && <span className="text-xs text-slate-400 mt-1">{notes}</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100">
                        <AlertCircle className="w-4 h-4" /> Alpha
                      </div>
                    )}
                 </div>
               </div>
             )
           })
        )}
      </div>
    </div>
  )
}
