'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, RefreshCw, Filter, X, History } from 'lucide-react'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function AttendanceHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [personalHistory, setPersonalHistory] = useState<any[]>([])
  const [personalStats, setPersonalStats] = useState<any>(null)

  const fetchData = async () => {
    try {
      const url = selectedSession 
        ? `/org-attendance/${orgSlug}?sessionId=${selectedSession}` 
        : `/org-attendance/${orgSlug}`;
        
      const [resHistory, resSessions] = await Promise.all([
        api.get(url),
        api.get(`/org-attendance/${orgSlug}/sessions`)
      ])
      setRecords(resHistory.data)
      setSessions(resSessions.data)
    } catch (err) {
      console.error('Failed to fetch attendance data:', err)
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
        try {
          const histRes = await api.get(`/org-attendance/${orgSlug}/me/history`)
          setPersonalHistory(histRes.data.records || [])
          setPersonalStats(histRes.data.stats || null)
        } catch (e) {
          console.error('Failed to fetch personal history', e)
        }
    
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
        toast.error('Terjadi kesalahan saat memuat data organisasi: ' + (err.response?.data?.error || err.message))
        setLoading(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initRoleAndData()
  }, [orgSlug, router])

  // Refetch when selectedSession changes
  useEffect(() => {
    if (!loading) {
      setRefreshing(true)
      fetchData().then(() => setRefreshing(false))
    }
  }, [selectedSession])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="h-[500px] bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  const isEditor = currentUserRole === 'head' || currentUserRole === 'sekretaris'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Absensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Riwayat Absensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Pantau rekam jejak kehadiran anggota.</p>
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

      <main className="relative z-10 max-w-4xl mx-auto">
        {/* PERSONAL ATTENDANCE SUMMARY & HISTORY */}
      <section className="relative z-10 max-w-7xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          Riwayat Kehadiran Anda
        </h2>

        {personalStats && (personalStats.late > 2 || personalStats.absent > 0) && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-bold">!</span>
            </div>
            <div>
              <h4 className="font-bold text-rose-900">Peringatan Kehadiran</h4>
              <p className="text-sm text-rose-700 mt-1">
                Catatan kehadiran Anda kurang baik. Anda telah <strong>telat {personalStats.late} kali</strong> dan <strong>alpha {personalStats.absent} kali</strong>. Harap tingkatkan kedisiplinan Anda.
              </p>
            </div>
          </div>
        )}

        {personalStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-emerald-600">{personalStats.present}</div>
              <div className="text-xs font-bold text-slate-500 uppercase mt-1">Hadir</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-amber-500">{personalStats.late}</div>
              <div className="text-xs font-bold text-slate-500 uppercase mt-1">Telat</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-500">{personalStats.excused}</div>
              <div className="text-xs font-bold text-slate-500 uppercase mt-1">Izin</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-2xl font-black text-indigo-500">{personalStats.sick}</div>
              <div className="text-xs font-bold text-slate-500 uppercase mt-1">Sakit</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center col-span-2 md:col-span-1">
              <div className="text-2xl font-black text-rose-500">{personalStats.absent}</div>
              <div className="text-xs font-bold text-slate-500 uppercase mt-1">Alpha</div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full max-w-full">
          {personalHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Belum ada riwayat absensi.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[500px] text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Agenda / Sesi</th>
                    <th className="px-6 py-4">Waktu Check-in</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {record.session?.title || 'Sesi Tanpa Nama'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {record.check_in_time ? new Date(record.check_in_time).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          record.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          record.status === 'sick' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                          record.status === 'excused' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          {record.status === 'present' ? 'Hadir' : 
                           record.status === 'late' ? 'Telat' : 
                           record.status === 'sick' ? 'Sakit' : 
                           record.status === 'excused' ? 'Izin' : 'Alpha'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]" title={record.notes || ''}>
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

        {isEditor && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-slate-900">Daftar Kehadiran Terbaru</h3>
            
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none">
                <Filter className="w-4 h-4" />
              </div>
              <CustomSelect
                value={selectedSession}
                onChange={val => setSelectedSession(val)}
                placeholder="Semua Agenda Absensi"
                options={[
                  { label: 'Semua Agenda Absensi', value: '' },
                  ...sessions.map(s => ({ label: s.title, value: s.id }))
                ]}
                className="w-full sm:w-64 pl-8"
              />
            </div>
          </div>
          
          {records.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-medium">
              Belum ada data absensi yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="py-3 px-2 whitespace-nowrap">Tanggal & Waktu</th>
                    <th className="py-3 px-2 whitespace-nowrap">Anggota</th>
                    <th className="py-3 px-2 whitespace-nowrap">Status</th>
                    <th className="py-3 px-2 whitespace-nowrap">Catatan/Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-2 text-slate-700 font-medium whitespace-nowrap text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-900 font-bold">{new Date(record.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-blue-600">Datang: {new Date(record.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          {record.session?.session_type === 'in_out' && (
                            record.check_out_time 
                            ? <span className="text-orange-600">Pulang: {new Date(record.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            : <span className="text-slate-400">Pulang: -</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                        {record.profile.full_name || record.profile.email.split('@')[0]}
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        {/* Status Datang: Hadir / Terlambat */}
                        {record.status === 'present' && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            record.session?.session_type === 'in_out' && !record.check_out_time 
                            ? 'bg-blue-50 text-blue-600' // Biru jika belum pulang
                            : 'bg-emerald-50 text-emerald-600' // Hijau jika sudah pulang (atau sesi biasa)
                          }`}>
                            Hadir
                          </span>
                        )}
                        {record.status === 'late' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600">
                            Terlambat
                          </span>
                        )}
                        {record.status === 'excused' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">Izin</span>}
                        {record.status === 'sick' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-600">Sakit</span>}
                        {record.status === 'absent' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">Alpa</span>}
                        
                        {/* Tambahan Status Pulang */}
                        {record.session?.session_type === 'in_out' && !record.check_out_time && (
                           <div className="mt-1.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Belum Pulang</span></div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-slate-500 max-w-[200px] truncate">
                        {record.notes?.replace('[VALIDATED]', '') || '-'}
                        {record.proof_url && (
                          <button 
                            onClick={() => setPreviewProofUrl(record.proof_url)} 
                            className="block text-blue-600 font-bold text-xs hover:underline mt-1 cursor-pointer bg-blue-50 px-2 py-1 rounded"
                          >
                            Lihat Bukti
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </main>

      {/* MODAL PREVIEW BUKTI */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-screen flex flex-col items-center justify-center">
            <button 
              onClick={() => setPreviewProofUrl(null)}
              className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 w-full flex justify-center p-2">
              {previewProofUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewProofUrl} className="w-full h-[80vh] rounded-xl bg-white" />
              ) : (
                <img src={previewProofUrl} alt="Bukti Kehadiran" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
