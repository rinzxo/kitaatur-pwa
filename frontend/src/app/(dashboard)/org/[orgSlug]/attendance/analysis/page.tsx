'use client'

import toast from 'react-hot-toast'
import { useEffect, useState, useMemo } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Trophy, 
  Warning as AlertTriangle, 
  ArrowsClockwise as RefreshCw, 
  ChartBar as BarChart2, 
  Sparkle as Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Robot as Bot, 
  CircleNotch as Loader2, 
  MagnifyingGlass as Search,
  CheckCircle as CheckCircle2,
  Clock,
  UserCheck,
  TrendUp as TrendingUp
} from '@phosphor-icons/react'
import Link from 'next/link'

export default function AttendanceAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState<{ summary: string; pattern: string } | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')

  const fetchData = async () => {
    try {
      const [resStats, resRecords] = await Promise.all([
        api.get(`/org-attendance/${orgSlug}/stats`),
        api.get(`/org-attendance/${orgSlug}`)
      ])
      setStats(resStats.data)
      setRecords(resRecords.data || [])
      
      // Fetch AI Insight asynchronously
      fetchAiInsight(resStats.data)
    } catch (err) {
      console.error('Failed to fetch attendance stats:', err)
    }
  }

  const fetchAiInsight = async (currentStats: any) => {
    if (!currentStats) return
    setLoadingAi(true)
    try {
      const res = await api.post(`/org-attendance/${orgSlug}/ai-insight`, {
        leaderboard: currentStats.leaderboard,
        redZone: currentStats.red_zone
      })
      setAiInsight(res.data)
    } catch (err) {
      console.error('Failed to fetch AI insight:', err)
    } finally {
      setLoadingAi(false)
    }
  }

  const initRoleAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      } else {
        router.push('/personal/dashboard')
        return
      }

      await fetchData()
    } catch (err: any) {
      console.error('Error verifying org access:', err)
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses ke organisasi ini.')
        router.push('/personal/dashboard')
      } else {
        toast.error('Terjadi kesalahan saat memuat data statistik.')
        setLoading(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initRoleAndData()
  }, [orgSlug, router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  // Summary counters computed from records
  const metrics = useMemo(() => {
    const total = records.length
    const present = records.filter(r => r.status === 'present').length
    const late = records.filter(r => r.status === 'late').length
    const excusedOrSick = records.filter(r => r.status === 'excused' || r.status === 'sick').length
    const absent = records.filter(r => r.status === 'absent').length
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return { total, present, late, excusedOrSick, absent, attendanceRate }
  }, [records])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="h-[300px] bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  const isEditor = currentUserRole === 'head' || currentUserRole === 'vice_head' || currentUserRole === 'sekretaris'

  if (!isEditor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 text-sm mb-6">Halaman analisis ini hanya dapat diakses oleh Ketua, Wakil Ketua, dan Sekretaris.</p>
          <Link href={`/org/${orgSlug}/attendance`} className="inline-block bg-[#0087FF] text-white font-bold px-6 py-2.5 rounded-xl">
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 pb-32 md:p-10 md:pb-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Presensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-8 w-8 text-amber-600" />
            Analisis Kehadiran
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Evaluasi performa presensi, tren kedisiplinan, dan ringkasan AI.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-lg text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Tingkat Hadir</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics.attendanceRate}%</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Dari {metrics.total} total log</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Hadir Tepat</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{metrics.present}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Presensi tepat waktu</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Terlambat</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{metrics.late}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Lewat batas toleransi</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Izin / Sakit / Alpa</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600">{metrics.excusedOrSick + metrics.absent}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.excusedOrSick} Izin/Sakit · {metrics.absent} Alpa</p>
          </div>
        </div>

        {/* AI INSIGHT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-15"><Bot className="w-24 h-24" /></div>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-3 relative z-10">
               <Sparkles className="w-5 h-5 text-indigo-200" /> Rapor Kedisiplinan AI
             </h3>
             {loadingAi ? (
                <div className="flex items-center gap-2 text-indigo-100 text-sm relative z-10 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI sedang membaca data...
                </div>
             ) : aiInsight?.summary ? (
                <p className="text-sm text-indigo-50 leading-relaxed relative z-10">{aiInsight.summary}</p>
             ) : (
                <p className="text-sm text-indigo-200 relative z-10">Belum ada cukup data presensi untuk dianalisis AI.</p>
             )}
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-15"><Search className="w-24 h-24" /></div>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-3 relative z-10">
               <ShieldCheck className="w-5 h-5 text-amber-200" /> Pola & Peringatan Dini
             </h3>
             {loadingAi ? (
                <div className="flex items-center gap-2 text-amber-100 text-sm relative z-10 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI sedang mencari pola...
                </div>
             ) : aiInsight?.pattern ? (
                <p className="text-sm text-amber-50 leading-relaxed relative z-10">{aiInsight.pattern}</p>
             ) : (
                <p className="text-sm text-amber-200 relative z-10">Pola kehadiran stabil tanpa indikasi anomali.</p>
             )}
          </div>
        </div>

        {/* LEADERBOARD & RED ZONE */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Klasemen Kehadiran Paling Rajin
              </h3>
              
              {!stats.leaderboard || stats.leaderboard.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium py-10">
                  Belum ada data kehadiran.
                </div>
              ) : (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2">
                  {stats.leaderboard.map((stat: any, index: number) => (
                    <div key={stat.profile_id} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-bold w-5 text-center">#{index + 1}</span>
                        <span className="font-semibold text-slate-900 text-sm">{stat.profile.full_name || 'Tanpa Nama'}</span>
                      </div>
                      <span className="text-emerald-600 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                        {stat._count.id}x Hadir
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-100 shadow-sm rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Zona Merah (Alpa / Telat)
              </h3>

              {!stats.red_zone || stats.red_zone.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-red-400 text-sm font-medium py-10 text-center px-4">
                  Bagus! Tidak ada anggota yang bermasalah.
                </div>
              ) : (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2">
                  {stats.red_zone.map((stat: any) => (
                    <div key={stat.profile_id} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-red-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 text-sm">{stat.profile.full_name || 'Tanpa Nama'}</span>
                      </div>
                      <span className="text-red-600 font-bold bg-red-100 px-2.5 py-1 rounded-lg text-xs">
                        {stat._count.id}x Bermasalah
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REDIRECT BANNER TO UNIFIED ATTENDANCE TOOLS */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100">
                Pusat Alat Presensi
              </span>
            </div>
            <h4 className="text-lg font-bold text-white">Kelola Sesi & Validasi Izin / Sakit</h4>
            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
              Tabel validasi bukti surat izin, verifikasi dokter dengan AI, serta pencatatan presensi manual telah disatukan dalam satu modul operasional presensi.
            </p>
          </div>
          <Link
            href={`/org/${orgSlug}/attendance/sessions?tab=izin`}
            className="bg-white hover:bg-slate-50 text-blue-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <span>Buka Modul Presensi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </main>
    </div>
  )
}
