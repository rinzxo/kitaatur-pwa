'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, QrCode, CheckCircle, FileText, History, BarChart2, Users, Calendar, ArrowUpRight } from 'lucide-react'

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
        setCanDelegate(!!currentMember.custom_data?.can_take_attendance)

        if (currentMember.role === 'head' || currentMember.role === 'sekretaris') {
          const collabRes = await api.get(`/org-attendance/${orgSlug}/pending-collaborations`)
          setPendingCollabs(collabRes.data || [])
        }

        const agendaRes = await api.get(`/org-attendance/${orgSlug}/agenda`)
        setAgendas(agendaRes.data || [])

        try {
          const settingsRes = await api.get(`/org/${orgSlug}/settings`)
          setIsSchool(settingsRes.data?.is_edu || false)
        } catch (e) {
          // Ignore if settings fetch fails
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
  }, [orgSlug, router])

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

  const isEditor = currentUserRole === 'head' || currentUserRole === 'sekretaris'

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
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/dashboard`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard Utama
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Modul Absensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Kelola dan pantau kehadiran serta notulensi.</p>
        </div>
        {isEditor && (
          <div className="flex gap-2">
            <Link
              href={`/org/${orgSlug}/attendance/schedules`}
              className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Jadwal Sesi
            </Link>
            <Link
              href={`/org/${orgSlug}/attendance/guests`}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Users className="w-4 h-4" />
              {isSchool ? 'Data Siswa' : 'Data Tamu'}
            </Link>
          </div>
        )}
      </header>

      {pendingCollabs.length > 0 && (
        <div className="relative z-10 max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-3xl p-6 border-l-4 border-blue-500 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" /> Undangan Kolaborasi Agenda
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
                    <button onClick={() => handleAcceptCollab(session.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors">
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
          <div className="p-2 bg-blue-100 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          Agenda & Sesi Mendatang
        </h2>

        {agendas.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-800 font-bold text-lg mb-1">Belum Ada Agenda</p>
            <p className="text-slate-500 font-medium">Tidak ada agenda atau sesi absensi mendatang untuk saat ini.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {agendas.map((agenda) => {
              const isOngoing = new Date() >= new Date(agenda.start_time);
              return (
                <Link 
                  key={agenda.id} 
                  href={`/org/${orgSlug}/attendance/scan`} 
                  className="w-[85%] sm:w-[350px] shrink-0 snap-center md:w-auto group relative bg-white rounded-[2rem] p-6 md:p-7 border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                  
                  <div className="absolute top-6 right-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 text-slate-400">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-2 mb-8 relative z-10">
                    <div className="text-[10px] font-black tracking-widest uppercase mb-3 flex items-center gap-1.5">
                      {isOngoing ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <span className="text-rose-500">Sedang Berjalan</span>
                        </>
                      ) : (
                        <span className="text-blue-500">Mendatang</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors pr-12 leading-snug">
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
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tipe Absen</p>
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

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* SEKRETARIS PRIORITY ACTION */}
        {currentUserRole === 'sekretaris' && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 rounded-3xl p-6 text-center text-white flex flex-col h-full">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tugas Utama: Sesi Absensi</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed flex-grow">
              Anda bertanggung jawab membuat, memantau, dan menutup jadwal absensi anggota.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/sessions`}
              className="block w-full py-3.5 bg-white text-blue-600 font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.98] hover:bg-slate-50 mt-auto"
            >
              Buka Manajemen Sesi
            </Link>
          </div>
        )}

        {/* Check In Action (For Everyone) */}
        <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>
          
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
            <CheckCircle className="w-8 h-8 drop-shadow-sm" />
          </div>
          <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">Check-in Kehadiran</h3>
          <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
            Catat kehadiran (Datang/Pulang) secara real-time menggunakan PIN dari Panitia.
          </p>
          <Link 
            href={`/org/${orgSlug}/attendance/scan`}
            className="relative block w-full py-4 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto shadow-sm"
          >
            Mulai Absen (Scan PIN)
          </Link>
        </div>

        {/* History Action (For Everyone) */}
        <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

          <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
            <History className="w-8 h-8 drop-shadow-sm" />
          </div>
          <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">Riwayat Absensi</h3>
          <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
            Pantau rekam jejak kehadiran dan laporan ketepatan waktu Anda.
          </p>
          <Link 
            href={`/org/${orgSlug}/attendance/history`}
            className="relative block w-full py-4 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto shadow-sm"
          >
            Lihat Riwayat
          </Link>
        </div>

        {/* Bantu Absen Action (For Delegasi/Editor) */}
        {(isEditor || canDelegate) && (
          <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-fuchsia-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

            <div className="relative w-16 h-16 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 text-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
              <Users className="w-8 h-8 drop-shadow-sm" />
            </div>
            <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-fuchsia-700 transition-colors">Bantu Absen</h3>
            <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
              Delegasi absen untuk anggota lain secara manual tanpa limitasi GPS.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/bantu-absen`}
              className="relative block w-full py-4 bg-fuchsia-50 hover:bg-fuchsia-600 hover:text-white text-fuchsia-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto shadow-sm"
            >
              Mulai Bantu Absen
            </Link>
          </div>
        )}

        {/* Scan Tamu Action (For Editor) */}
        {isEditor && (
          <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
              <QrCode className="w-8 h-8 drop-shadow-sm" />
            </div>
            <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-700 transition-colors">Scan QR {isSchool ? 'Siswa' : 'Tamu'}</h3>
            <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
              Pindai tiket QR Code {isSchool ? 'siswa' : 'tamu'} untuk mencatat kehadiran mereka dengan cepat.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/guests/scan`}
              className="relative block w-full py-4 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto shadow-sm"
            >
              Mulai Scan {isSchool ? 'Siswa' : 'Tamu'}
            </Link>
          </div>
        )}

        {/* Notulensi Action (Pisah) */}
        {isEditor && (
          <>
            <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                <BarChart2 className="w-8 h-8 drop-shadow-sm" />
              </div>
              <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-700 transition-colors">Analisis Kehadiran</h3>
              <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
                Evaluasi statistik kehadiran, performa, dan kedisiplinan seluruh anggota.
              </p>
              <Link 
                href={`/org/${orgSlug}/attendance/analysis`}
                className="relative block w-full py-4 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto shadow-sm"
              >
                Lihat Analisis
              </Link>
            </div>

            <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                <FileText className="w-8 h-8 drop-shadow-sm" />
              </div>
              <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">Notulensi Rapat (AI)</h3>
              <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
                Otomatisasi pembuatan laporan rapat yang rapi dengan asisten AI cerdas.
              </p>
              <div className="relative flex gap-2 mt-auto w-full">
                <Link 
                  href={`/org/${orgSlug}/attendance/meeting`}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] text-sm"
                >
                  Buat Baru
                </Link>
                <Link 
                  href={`/org/${orgSlug}/attendance/meeting/history`}
                  className="flex-1 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  Riwayat
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Fallback for Head if they want to manage sessions but aren't sekretaris */}
        {currentUserRole === 'head' && (
           <div className="group bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-slate-500/10 rounded-[2rem] p-6 md:p-8 text-center flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-0"></div>

            <div className="relative w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <QrCode className="w-8 h-8 drop-shadow-sm" />
            </div>
            <h3 className="relative text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">Hak Akses Ketua</h3>
            <p className="relative text-slate-500 text-sm mb-8 leading-relaxed flex-grow">
              Akses khusus ketua untuk membuat dan memantau sesi absensi.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/sessions`}
              className="relative block w-full py-4 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] mt-auto"
            >
              Manajemen Sesi
            </Link>
          </div>
        )}

      </main>

    </div>
  )
}
