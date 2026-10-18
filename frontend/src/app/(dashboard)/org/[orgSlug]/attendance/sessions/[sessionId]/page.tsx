'use client'

import toast from 'react-hot-toast'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  WarningCircle, 
  Key, 
  ShieldCheck, 
  StopCircle, 
  QrCode, 
  Check, 
  CalendarDots, 
  CircleNotch, 
  CaretRight 
} from '@phosphor-icons/react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'

function SessionDetailContent() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  const sessionId = params?.sessionId as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [closing, setClosing] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  const fetchSessionDetail = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/org-attendance/${orgSlug}/sessions/active/${sessionId}`)
      if (res.data) {
        setSession(res.data)
      } else {
        // Fallback: fetch from all sessions list
        const allRes = await api.get(`/org-attendance/${orgSlug}/sessions`)
        const found = (allRes.data || []).find((s: any) => s.id === sessionId)
        if (found) {
          setSession(found)
        } else {
          toast.error('Sesi tidak ditemukan.')
          router.push(`/org/${orgSlug}/attendance/sessions`)
        }
      }
    } catch (err: any) {
      toast.error('Gagal memuat detail sesi.')
      router.push(`/org/${orgSlug}/attendance/sessions`)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionRecords = async () => {
    try {
      setLoadingRecords(true)
      const res = await api.get(`/org-attendance/${orgSlug}?sessionId=${sessionId}`)
      setRecords(res.data || [])
    } catch (err) {
      console.error('Failed to fetch session records:', err)
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    if (orgSlug && sessionId) {
      fetchSessionDetail()
      fetchSessionRecords()
    }
  }, [orgSlug, sessionId])

  const handleCloseSession = async () => {
    const ok = await confirm({
      title: 'Tutup Sesi Presensi',
      message: 'Tutup sesi presensi ini sekarang? Anggota tidak akan bisa melakukan check-in lagi.',
      confirmText: 'Ya, Tutup Sesi',
      variant: 'danger'
    })
    if (!ok) return
    setClosing(true)
    try {
      await api.put(`/org-attendance/${orgSlug}/sessions/${sessionId}/close`)
      toast.success('Sesi presensi berhasil ditutup.')
      fetchSessionDetail()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menutup sesi presensi.')
    } finally {
      setClosing(false)
    }
  }

  const now = new Date()
  const isOngoing = session?.is_active && new Date(session.start_time) <= now && new Date(session.end_time) >= now
  const isUpcoming = session?.is_active && new Date(session.start_time) > now
  const isPast = !session?.is_active || new Date(session.end_time) < now

  const summary = useMemo(() => {
    let present = 0
    let late = 0
    let excused = 0
    let sick = 0
    let absent = 0

    records.forEach(r => {
      if (r.status === 'present') present++
      else if (r.status === 'late') late++
      else if (r.status === 'excused') excused++
      else if (r.status === 'sick') sick++
      else if (r.status === 'absent') absent++
    })

    return { total: records.length, present, late, excused, sick, absent }
  }, [records])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <CircleNotch className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat detail sesi presensi...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-4">
          <WarningCircle className="w-12 h-12 text-rose-500 mx-auto" weight="duotone" />
          <h2 className="text-lg font-bold text-slate-900">Sesi Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Sesi yang Anda tuju mungkin telah dihapus atau tidak tersedia.</p>
          <Link
            href={`/org/${orgSlug}/attendance/sessions`}
            className="inline-block bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Kembali ke Pusat Presensi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 md:pb-20 font-sans">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link 
            href={`/org/${orgSlug}/attendance/sessions`} 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0087FF] transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Kembali ke Pusat Presensi</span>
          </Link>

          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isOngoing
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isUpcoming
              ? 'bg-[#E0F4FE] text-[#0087FF] border border-[#b9e5fa]'
              : !session?.is_active && new Date(session?.end_time) >= now
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isOngoing 
              ? 'Sedang Berlangsung' 
              : isUpcoming 
              ? 'Akan Datang' 
              : !session?.is_active && new Date(session?.end_time) >= now 
              ? 'Ditutup' 
              : 'Selesai'}
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Title & Metadata Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E0F4FE] text-[#0087FF] px-2.5 py-0.5 rounded-md">
                  {session.session_type === 'in_out' ? 'Masuk & Pulang' : 'Hanya Datang'}
                </span>
                <span className="text-xs text-slate-400">ID: {session.id.slice(0, 8)}...</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {session.title || 'Sesi Presensi'}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/org/${orgSlug}/attendance/sessions?tab=izin&sessionId=${session.id}`}
                className="bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Users size={16} weight="duotone" />
                <span>Bantu Absen</span>
              </Link>

              {session.is_active && new Date(session.end_time) >= now && (
                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {closing ? <CircleNotch size={16} weight="bold" className="animate-spin" /> : <StopCircle size={16} weight="duotone" />}
                  <span>Tutup Sesi</span>
                </button>
              )}
            </div>
          </div>

          {/* Time & GPS Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarDots size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Jadwal Sesi</p>
                <p className="font-bold text-slate-800">
                  {new Date(session.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {new Date(session.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Batas Toleransi Telat</p>
                <p className="font-bold text-slate-800">
                  {session.late_time ? `${new Date(session.late_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : 'Tanpa batas telat'}
                </p>
                <p className="text-slate-500 text-[11px]">Lewat jam ini = Telat</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin size={18} weight="duotone" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Lokasi Presensi</p>
                <p className="font-bold text-slate-800 truncate" title={session.location_name || 'Radius GPS'}>
                  {session.location_name || 'Titik Koordinat GPS'}
                </p>
                <p className="text-slate-500 text-[11px]">Radius {session.radius_meters || 50} meter</p>
              </div>
            </div>
          </div>
        </div>

        {/* PIN DISPLAY SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Key size={18} weight="duotone" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">PIN Verifikasi Sesi</h3>
                <p className="text-xs text-slate-500">Bagikan PIN ini kepada anggota untuk melakukan presensi mandiri.</p>
              </div>
            </div>
            
            <Link
              href={`/org/${orgSlug}/attendance/generate?sessionId=${session.id}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <QrCode size={15} weight="duotone" />
              <span>Layar Penuh PIN</span>
            </Link>
          </div>

          {session.session_type === 'in_out' && session.checkout_pin_code ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 text-center">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  PIN Absen Datang
                </span>
                <span className="text-4xl md:text-5xl font-black text-blue-700 tracking-[0.2em] block">
                  {session.pin_code || '------'}
                </span>
                <p className="text-[11px] text-blue-500 mt-2">Digunakan saat check-in kedatangan</p>
              </div>

              <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-6 text-center">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
                  PIN Absen Pulang
                </span>
                <span className="text-4xl md:text-5xl font-black text-orange-700 tracking-[0.2em] block">
                  {session.checkout_pin_code || '------'}
                </span>
                <p className="text-[11px] text-orange-500 mt-2">Digunakan saat check-out kepulangan</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                PIN Kehadiran
              </span>
              <span className="text-5xl md:text-6xl font-black text-blue-600 tracking-[0.2em] block">
                {session.pin_code || '------'}
              </span>
              <p className="text-xs text-slate-400 mt-2">Berikan PIN kepada anggota saat sesi berlangsung</p>
            </div>
          )}
        </div>

        {/* STATS & ATTENDANCE LOG OF THIS SESSION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Rekapitulasi Kehadiran Sesi</h3>
              <p className="text-xs text-slate-500">Total {summary.total} catatan kehadiran pada sesi ini.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/org/${orgSlug}/attendance/guests?sessionId=${session.id}`}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Daftar Tamu</span>
                <CaretRight size={14} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total</span>
              <span className="text-xl font-bold text-slate-800">{summary.total}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100">
              <span className="text-[10px] font-semibold text-emerald-700 block uppercase">Hadir</span>
              <span className="text-xl font-bold text-emerald-700">{summary.present}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-center border border-amber-100">
              <span className="text-[10px] font-semibold text-amber-700 block uppercase">Telat</span>
              <span className="text-xl font-bold text-amber-700">{summary.late}</span>
            </div>
            <div className="bg-[#E0F4FE] p-3 rounded-xl text-center border border-[#b9e5fa]">
              <span className="text-[10px] font-semibold text-[#0087FF] block uppercase">Izin/Sakit</span>
              <span className="text-xl font-bold text-[#0087FF]">{summary.excused + summary.sick}</span>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl text-center border border-rose-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-rose-700 block uppercase">Alpa</span>
              <span className="text-xl font-bold text-rose-700">{summary.absent}</span>
            </div>
          </div>

          {/* Attendance Log List */}
          <div className="pt-2">
            {loadingRecords ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CircleNotch size={18} weight="bold" className="animate-spin mx-auto mb-2 text-[#0087FF]" />
                Memuat riwayat kehadiran...
              </div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada anggota yang melakukan presensi pada sesi ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                {records.map((r: any) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">
                        {r.profile?.full_name || r.profile?.email || 'Anggota'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(r.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        {r.notes && <span className="ml-1.5 text-slate-500">· {r.notes.replace(/\[VALIDATED\]|\[MANUAL_BY_ADMIN[^\]]*\]/g, '').trim()}</span>}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'late'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : r.status === 'excused'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : r.status === 'sick'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {r.status === 'present' ? 'Hadir' : r.status === 'late' ? 'Telat' : r.status === 'excused' ? 'Izin' : r.status === 'sick' ? 'Sakit' : 'Alpa'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}

export default function SessionDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <CircleNotch size={28} weight="bold" className="animate-spin text-blue-600" />
      </div>
    }>
      <SessionDetailContent />
    </Suspense>
  )
}
