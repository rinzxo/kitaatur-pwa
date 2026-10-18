'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  QrCode, 
  CheckCircle, 
  ClockCounterClockwise, 
  ChartBar, 
  Users, 
  CalendarDots, 
  ArrowUpRight,
  Plus,
  FileText,
  Compass,
  IdentificationCard
} from '@phosphor-icons/react'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

export default function AttendanceDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [canDelegate, setCanDelegate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingCollabs, setPendingCollabs] = useState<any[]>([])
  const [agendas, setAgendas] = useState<any[]>([])
  const [isSchool, setIsSchool] = useState(false)

  // Spotlight Walkthrough Tour
  const [showTour, setShowTour] = useState(false)
  const attendanceHubTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-manage-card"]',
      title: 'Pusat Kelola Presensi & Bantu Absen',
      description: 'Fitur utama pengurus: mencatat presensi siswa sekaligus (Bantu Absen 1 HP tanpa HP siswa), validasi surat dokter, serta atur jadwal rutin mingguan.'
    },
    {
      target: '[data-tour="tour-create-session-btn"]',
      title: 'Buka Sesi Presensi Baru',
      description: 'Buka sesi kegiatan baru dalam 15 detik dengan durasi otomatis tanpa kendala sinyal GPS.'
    },
    {
      target: '[data-tour="tour-scan-card"]',
      title: 'Check-in Mandiri Anggota',
      description: 'Anggota yang membawa HP dapat langsung scan QR atau memasukkan PIN sesi panitia di menu ini.'
    },
    {
      target: '[data-tour="tour-history-card"]',
      title: 'Riwayat & Analisis Kehadiran',
      description: 'Lihat arsip rekap kehadiran seluruh agenda lampau dan unduh rekap data dalam format spreadsheet Excel.'
    }
  ]

  const initRoleAndData = async () => {
    try {
      const [
        { data: { user } },
        membersRes,
        agendaRes,
        settingsRes,
        collabRes
      ] = await Promise.all([
        supabase.auth.getUser(),
        api.get(`/org/${orgSlug}/members`).catch((err) => {
          if (err.response?.status === 403) throw err
          return { data: [] }
        }),
        api.get(`/org-attendance/${orgSlug}/agenda`).catch(() => ({ data: [] })),
        api.get(`/org/${orgSlug}/settings`).catch(() => ({ data: null })),
        api.get(`/org-attendance/${orgSlug}/pending-collaborations`).catch(() => ({ data: [] }))
      ])

      if (!user) {
        router.push('/login')
        return
      }

      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
        setCanDelegate(!!currentMember.custom_data?.can_take_attendance)
        setAgendas(agendaRes.data || [])
        setIsSchool(settingsRes.data?.is_edu || false)

        if (currentMember.role === 'head' || currentMember.role === 'vice_head' || currentMember.role === 'sekretaris') {
          setPendingCollabs(collabRes.data || [])
        }
      } else {
        router.push('/personal/dashboard')
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses ke organisasi ini.')
        router.push('/personal/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initRoleAndData()
  }, [orgSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const isEditor = currentUserRole === 'head' || currentUserRole === 'vice_head' || currentUserRole === 'sekretaris'

  const ongoingSession = agendas.find((agenda: any) => {
    const now = new Date()
    return agenda.is_active && now >= new Date(agenda.start_time) && now <= new Date(agenda.end_time)
  })

  const handleAcceptCollab = async (sessionId: string) => {
    try {
      await api.post(`/org-attendance/${orgSlug}/sessions/${sessionId}/collaborate/accept`)
      toast.success('Kolaborasi diterima!')
      setPendingCollabs(pendingCollabs.filter(c => c.id !== sessionId))
    } catch (err: any) {
      toast.error('Gagal menerima kolaborasi')
    }
  }

  const handleRejectCollab = async (sessionId: string) => {
    try {
      await api.post(`/org-attendance/${orgSlug}/sessions/${sessionId}/collaborate/reject`)
      toast.success('Kolaborasi ditolak')
      setPendingCollabs(pendingCollabs.filter(c => c.id !== sessionId))
    } catch (err: any) {
      toast.error('Gagal menolak kolaborasi')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 pb-28 md:pb-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#01C4FB]/15 via-[#0087FF]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/dashboard`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft size={14} weight="bold" />
            Kembali ke Dashboard Utama
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock size={32} weight="duotone" className="text-[#0087FF]" />
            Modul Presensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Kelola dan pantau kehadiran serta notulensi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Panduan Interaktif Fitur"
          >
            <Compass size={16} weight="bold" />
            <span>Panduan Fitur</span>
          </button>
          {isEditor && (
            <Link
              href={`/org/${orgSlug}/attendance/sessions/create`}
              data-tour="tour-create-session-btn"
              className="bg-[#0087FF] hover:bg-[#0077E6] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Buka Sesi Baru</span>
            </Link>
          )}
        </div>
      </header>

      {/* Live Active Session Shortcut Banner */}
      {(isEditor || canDelegate) && ongoingSession && (
        <div className="relative z-10 max-w-7xl mx-auto mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm border-l-4 border-l-[#0087FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sesi Sedang Berlangsung
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(ongoingSession.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(ongoingSession.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {ongoingSession.title}
              </h3>
              {ongoingSession.late_time && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={14} weight="duotone" className="text-slate-400" />
                  Batas waktu hadir tepat: {new Date(ongoingSession.late_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <Link
                href={`/org/${orgSlug}/attendance/sessions?tab=izin&sessionId=${ongoingSession.id}&mode=scan`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all shrink-0"
              >
                <QrCode size={16} weight="bold" />
                <span>Scan QR Siswa</span>
              </Link>
              <Link
                href={`/org/${orgSlug}/attendance/sessions?tab=izin&sessionId=${ongoingSession.id}&mode=manual`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <Users size={16} weight="bold" />
                <span>Bantu Absen (1 HP)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {pendingCollabs.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-3xl p-6 border-l-4 border-[#0087FF] shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0087FF]" /> Undangan Kolaborasi Agenda
            </h2>
            <div className="space-y-4">
              {pendingCollabs.map(session => (
                <div key={session.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">{session.title}</h3>
                    <p className="text-sm text-slate-500">Oleh: {session.organization?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Waktu: {new Date(session.start_time).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptCollab(session.id)} className="px-4 py-2 bg-[#0087FF] hover:bg-[#0077E6] text-white rounded-lg font-bold text-sm transition-colors">
                      Terima
                    </button>
                    <button onClick={() => handleRejectCollab(session.id)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-colors">
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tampilan Agenda Mendatang / Aktif */}
      <div className="relative z-10 max-w-7xl mx-auto mb-10">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-[#E0F4FE] rounded-xl text-[#0087FF]">
            <CalendarDots size={20} weight="duotone" className="text-[#0087FF]" />
          </div>
          Agenda & Sesi Mendatang
        </h2>

        {agendas.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-b from-white via-white to-[#E0F4FE]/30 border border-slate-200/80 shadow-sm rounded-3xl p-8 md:p-10 text-center flex flex-col items-center justify-center transition-all">
            {/* Background ambient decorative blurs using logo colors */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#01C4FB]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#0087FF]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Icon Badge */}
            <div className="mb-4 z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0087FF] to-[#01C4FB] text-white shadow-lg shadow-[#0087FF]/25 flex items-center justify-center ring-8 ring-[#E0F4FE]/80">
                <CalendarDots size={32} weight="duotone" className="text-white" />
              </div>
            </div>

            {/* Title & Copy */}
            <h3 className="text-slate-900 font-black text-lg md:text-xl mb-1.5 z-10 tracking-tight">
              Belum Ada Agenda Presensi
            </h3>
            <p className="text-slate-500 font-medium text-xs md:text-sm max-w-md mx-auto leading-relaxed z-10">
              {isEditor 
                ? 'Tidak ada sesi berjalan atau terjadwal. Buka sesi presensi baru sekarang agar anggota dapat melakukan check-in kehadiran.'
                : 'Tidak ada agenda atau sesi presensi mendatang untuk saat ini. Anda akan mendapatkan notifikasi begitu sesi dibuka oleh pengurus.'}
            </p>

            {/* Action CTA for Ketua / Wakil Ketua / Sekretaris */}
            {isEditor ? (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto z-10">
                <Link
                  href={`/org/${orgSlug}/attendance/sessions/create`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold text-xs md:text-sm px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Plus size={18} weight="bold" />
                  <span>Buat Sesi Sekarang</span>
                </Link>
                <Link
                  href={`/org/${orgSlug}/attendance/sessions?tab=schedules`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-[#0087FF] hover:bg-white border border-slate-200/90 bg-white/80 shadow-sm transition-all active:scale-95"
                >
                  <Clock size={16} weight="duotone" className="text-[#0087FF]" />
                  <span>Jadwal Otomatis</span>
                </Link>
              </div>
            ) : (
              <div className="mt-4 z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F4FE]/80 border border-[#01C4FB]/30 text-[#007AE6] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#01C4FB]"></span>
                <span>Menunggu sesi presensi dibuka oleh pengurus</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {agendas.map((agenda) => {
              const isOngoing = new Date() >= new Date(agenda.start_time);
              return (
                <Link 
                  key={agenda.id} 
                  href={`/org/${orgSlug}/attendance/scan?sessionId=${agenda.id}${!isOngoing ? '&status=excused' : ''}`} 
                  className="w-[85%] sm:w-[350px] shrink-0 snap-center md:w-auto group relative bg-white rounded-[2rem] p-6 md:p-7 border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                  
                  <div className="absolute top-6 right-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-[#0087FF] group-hover:text-white transition-colors duration-300 text-slate-400">
                      <ArrowUpRight size={20} weight="bold" />
                    </div>
                  </div>

                  <div className="mt-2 mb-8 relative z-10">
                    <div className="text-[10px] font-black tracking-widest uppercase mb-3 flex items-center justify-between">
                      {isOngoing ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <span className="text-rose-500">Sedang Berjalan</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[#0087FF]">Mendatang</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                            Bisa Izin / Sakit
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0087FF] transition-colors pr-12 leading-snug">
                      {agenda.title}
                    </h3>
                  </div>
                  
                  <div className="mt-auto flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl group-hover:bg-blue-50/50 transition-colors relative z-10">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mulai</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(agenda.start_time).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tipe Presensi</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {agenda.session_type === 'in_out' ? 'In & Out' : 'Datang Saja'}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Presensi Mandiri (Untuk Semua Anggota) */}
        <div data-tour="tour-scan-card" className="group bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#0087FF]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#01C4FB]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-60"></div>
          
          <div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#E0F4FE] to-[#BAE6FD]/70 text-[#0087FF] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
              <CheckCircle size={30} weight="duotone" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0087FF] transition-colors">
              Check-in Kehadiran
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Catat presensi datang dan pulang secara mandiri menggunakan PIN panitia atau QR Code.
            </p>
          </div>

          <Link 
            href={`/org/${orgSlug}/attendance/scan`}
            className="w-full py-3.5 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-center shadow-md shadow-[#0087FF]/20 transition-all active:scale-[0.98] block"
          >
            Mulai Presensi (Scan PIN)
          </Link>
        </div>

        {/* Card 2: Riwayat & Laporan Kehadiran (Transparansi Penuh untuk Anggota & Pengurus) */}
        <div data-tour="tour-history-card" className="group bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#0087FF]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#01C4FB]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-60"></div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-[#E0F4FE] text-[#0087FF] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                <ClockCounterClockwise size={30} weight="duotone" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200/60">
                Laporan & Rekap
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0087FF] transition-colors">
              Riwayat & Laporan
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Pantau rekam jejak kehadiran lengkap, evaluasi kedisiplinan, dan unduh laporan resmi Excel.
            </p>
          </div>

          <div className="space-y-2.5">
            <Link 
              href={`/org/${orgSlug}/attendance/history`}
              className="w-full py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-center shadow-md shadow-[#0087FF]/20 transition-all active:scale-[0.98] block text-sm"
            >
              Buka Riwayat Presensi
            </Link>
            {isEditor && (
              <Link 
                href={`/org/${orgSlug}/attendance/analysis`}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold rounded-xl text-center transition-colors block text-xs flex items-center justify-center gap-1.5"
              >
                <ChartBar size={15} weight="duotone" className="text-[#0087FF]" />
                <span>Lihat Statistik & Analisis</span>
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Pusat Kelola Presensi (Pengurus: Ketua, Wakil Ketua, Sekretaris, Delegasi) */}
        {(isEditor || canDelegate) && (
          <div data-tour="tour-manage-card" className="group bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#0087FF]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#01C4FB]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-60"></div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-[#E0F4FE] text-[#0087FF] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <QrCode size={30} weight="duotone" />
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-[#E0F4FE] text-[#007AE6] rounded-lg border border-[#01C4FB]/30">
                  {currentUserRole === 'head' ? 'Akses Ketua' : currentUserRole === 'vice_head' ? 'Akses Wakil Ketua' : currentUserRole === 'sekretaris' ? 'Akses Sekretaris' : 'Akses Delegasi'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0087FF] transition-colors">
                Bantu Absen & Scan QR
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Pindai QR Code siswa langsung dengan kamera, roll-call manual 1 HP tanpa HP siswa, validasi surat izin/sakit, dan kelola sesi kegiatan.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href={`/org/${orgSlug}/attendance/sessions?tab=izin&mode=scan`}
                  className="py-3 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                >
                  <QrCode size={16} weight="bold" />
                  <span>Scan QR Siswa</span>
                </Link>
                <Link 
                  href={`/org/${orgSlug}/attendance/sessions?tab=izin&mode=manual`}
                  className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                >
                  <Users size={16} weight="bold" />
                  <span>Bantu Absen</span>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Link 
                  href={`/org/${orgSlug}/attendance/sessions`}
                  className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-medium rounded-lg text-center transition-colors text-[11px] truncate"
                >
                  Kelola Sesi
                </Link>
                <Link 
                  href={`/org/${orgSlug}/attendance/sessions?tab=schedules`}
                  className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-medium rounded-lg text-center transition-colors text-[11px] truncate"
                >
                  Jadwal
                </Link>
                <Link 
                  href={`/org/${orgSlug}/members/qr`}
                  className="py-2 px-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 font-bold rounded-lg text-center transition-colors text-[11px] truncate"
                >
                  Cetak QR
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Card 4 (Kondisional: Tamu / Siswa) */}
        {isEditor && (
          <div className="group bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#0087FF]/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#01C4FB]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-60"></div>

            <div>
              <div className="w-14 h-14 bg-[#E0F4FE] text-[#0087FF] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-inner">
                <Users size={30} weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0087FF] transition-colors">
                Buku {isSchool ? 'Siswa Luar / Tamu' : 'Tamu'}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Data presensi peserta luar organisasi, pendaftaran tamu undangan, dan cetak tiket kartu.
              </p>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href={`/org/${orgSlug}/attendance/sessions?tab=izin&mode=scan`}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                >
                  <QrCode size={16} weight="bold" />
                  <span>Scan Presensi</span>
                </Link>
                <Link 
                  href={`/org/${orgSlug}/attendance/guests`}
                  className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-bold rounded-xl text-center transition-colors text-xs flex items-center justify-center"
                >
                  <span>Daftar {isSchool ? 'Siswa' : 'Tamu'}</span>
                </Link>
              </div>
              <Link 
                href={`/org/${orgSlug}/members/qr`}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 font-bold rounded-xl text-center transition-colors text-xs flex items-center justify-center gap-1.5"
              >
                <IdentificationCard size={15} weight="bold" />
                <span>Cetak QR Seluruh Anggota</span>
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* Spotlight Tour */}
      <SpotlightTour
        tourKey="attendance_hub"
        steps={attendanceHubTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}
