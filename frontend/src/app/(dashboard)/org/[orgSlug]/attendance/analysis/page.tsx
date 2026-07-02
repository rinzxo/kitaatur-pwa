'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, AlertTriangle, RefreshCw, BarChart2, Bot, Sparkles, ShieldCheck, Search, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export default function AttendanceAnalysisPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState<{summary: string, pattern: string} | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [resStats, resRecords] = await Promise.all([
        api.get(`/org-attendance/${orgSlug}/stats`),
        api.get(`/org-attendance/${orgSlug}`)
      ])
      setStats(resStats.data)
      setRecords(resRecords.data)
      
      // Fetch AI Insight asynchronously so it doesn't block
      fetchAiInsight(resStats.data)
    } catch (err) {
      console.error('Failed to fetch attendance stats:', err)
    }
  }

  const fetchAiInsight = async (currentStats: any) => {
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

  const handleValidateProof = async (attendanceId: string) => {
    setValidatingId(attendanceId)
    try {
      const res = await api.post(`/org-attendance/${orgSlug}/validate-proof`, { attendanceId })
      const data = res.data
      
      let alertMsg = `Hasil Analisis AI:\n\n`
      alertMsg += `Valid: ${data.is_valid ? 'YA' : 'TIDAK'}\n`
      alertMsg += `Kepercayaan: ${data.confidence}\n\n`
      alertMsg += `Ringkasan: ${data.summary}`
      
      toast.error(alertMsg)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memvalidasi bukti dengan AI.')
    } finally {
      setValidatingId(null)
    }
  }

  const handleRejectProof = async (attendanceId: string) => {
    if (!await await confirm('Konfirmasi', 'Apakah Anda yakin ingin menolak izin ini dan mengubah statusnya menjadi Alpa?')) return

    try {
      await api.put(`/org-attendance/${orgSlug}/attendance/${attendanceId}/status`, { status: 'absent' })
      toast.success('Status berhasil diubah menjadi Alpa.')
      fetchData() // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status absen.')
    }
  }

  const handleApproveManual = async (attendanceId: string) => {
    if (!await await confirm('Konfirmasi', 'Apakah Anda yakin ingin menyetujui izin ini secara manual?')) return

    try {
      await api.put(`/org-attendance/${orgSlug}/attendance/${attendanceId}/validate`)
      toast.success('Izin/Sakit berhasil disetujui.')
      fetchData() // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyetujui izin.')
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

  const isEditor = currentUserRole === 'head' || currentUserRole === 'sekretaris'

  if (!isEditor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 text-sm mb-6">Halaman analisis ini hanya dapat diakses oleh Ketua dan Sekretaris.</p>
          <Link href={`/org/${orgSlug}/attendance`} className="inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl">
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
            Kembali ke Absensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-8 w-8 text-amber-600" />
            Analisis Kehadiran
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Evaluasi performa absensi dan kedisiplinan anggota.</p>
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
        
        {/* AI INSIGHT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20"><Bot className="w-24 h-24" /></div>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-3 relative z-10">
               <Sparkles className="w-5 h-5 text-indigo-200" /> Rapor Kedisiplinan AI
             </h3>
             {loadingAi ? (
                <div className="flex items-center gap-2 text-indigo-100 text-sm relative z-10">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI sedang membaca data...
                </div>
             ) : aiInsight ? (
                <p className="text-sm text-indigo-50 leading-relaxed relative z-10">{aiInsight.summary}</p>
             ) : (
                <p className="text-sm text-indigo-200 relative z-10">Tidak ada data untuk dianalisis.</p>
             )}
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20"><Search className="w-24 h-24" /></div>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-3 relative z-10">
               <ShieldCheck className="w-5 h-5 text-amber-200" /> Pola & Peringatan Dini
             </h3>
             {loadingAi ? (
                <div className="flex items-center gap-2 text-amber-100 text-sm relative z-10">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI sedang mencari pola...
                </div>
             ) : aiInsight ? (
                <p className="text-sm text-amber-50 leading-relaxed relative z-10">{aiInsight.pattern}</p>
             ) : (
                <p className="text-sm text-amber-200 relative z-10">Tidak ada data untuk dianalisis.</p>
             )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Klasemen Kehadiran
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
                Zona Merah (Alpa/Telat)
              </h3>

              {!stats.red_zone || stats.red_zone.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-red-400 text-sm font-medium py-10 text-center px-4">
                  Luar biasa! Tidak ada anggota yang bermasalah.
                </div>
              ) : (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px] pr-2">
                  {stats.red_zone.map((stat: any, index: number) => (
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

        {/* VALIDASI MANUAL SECTION */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tabel Validasi Izin & Sakit</h3>
              <p className="text-sm text-slate-500 mt-1">Cek pengajuan izin anggota secara manual atau menggunakan asisten AI.</p>
            </div>
          </div>
          
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-2 whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-2 whitespace-nowrap">Anggota</th>
                  <th className="py-3 px-2 whitespace-nowrap">Status</th>
                  <th className="py-3 px-2">Catatan/Alasan</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Aksi Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {records.filter(r => r.status === 'excused' || r.status === 'sick' || r.status === 'absent').length === 0 ? (
                   <tr>
                     <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">Tidak ada data izin atau sakit.</td>
                   </tr>
                ) : (
                  records
                    .filter(r => r.status === 'excused' || r.status === 'sick' || r.status === 'absent')
                    .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-2 text-slate-700 font-medium whitespace-nowrap text-xs">
                        {new Date(record.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                        {record.profile?.full_name || record.profile?.email.split('@')[0]}
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        {record.status === 'excused' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">Izin</span>}
                        {record.status === 'sick' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-600">Sakit</span>}
                        {record.status === 'absent' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">Alpa</span>}
                      </td>
                      <td className="py-3.5 px-2 text-slate-600 max-w-[200px] truncate">
                        {record.notes?.replace('[VALIDATED]', '') || '-'}
                      </td>
                      <td className="py-3.5 px-2 text-right whitespace-nowrap">
                        {record.notes?.includes('[VALIDATED]') ? (
                          <span className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600">
                            <ShieldCheck className="w-4 h-4" /> Disetujui
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {record.proof_url ? (
                              <>
                                <button 
                                  onClick={() => setPreviewProofUrl(record.proof_url)} 
                                  className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Lihat Bukti
                                </button>
                                <button 
                                  onClick={() => handleValidateProof(record.id)}
                                  disabled={validatingId === record.id}
                                  className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  {validatingId === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                                  Cek AI
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic mr-2">Tanpa Bukti</span>
                            )}
                            <button 
                              onClick={() => handleApproveManual(record.id)}
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Setujui
                            </button>
                            <button 
                              onClick={() => handleRejectProof(record.id)}
                              className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW CARDS */}
          <div className="md:hidden space-y-4">
             {records.filter(r => r.status === 'excused' || r.status === 'sick' || r.status === 'absent').length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-medium text-sm">Tidak ada data izin atau sakit.</div>
             ) : (
                records
                  .filter(r => r.status === 'excused' || r.status === 'sick' || r.status === 'absent')
                  .map((record) => (
                    <div key={record.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                           <div className="text-xs font-bold text-slate-400 mb-1">
                             {new Date(record.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                           </div>
                           <div className="font-bold text-slate-900">
                             {record.profile?.full_name || record.profile?.email.split('@')[0]}
                           </div>
                        </div>
                        <div>
                          {record.status === 'excused' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">Izin</span>}
                          {record.status === 'sick' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-600">Sakit</span>}
                          {record.status === 'absent' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">Alpa</span>}
                        </div>
                      </div>
                      
                      {record.notes && record.notes.replace('[VALIDATED]', '').trim() !== '' && (
                        <div className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-900 block text-xs mb-1">Catatan:</span>
                          {record.notes.replace('[VALIDATED]', '')}
                        </div>
                      )}

                      {record.notes?.includes('[VALIDATED]') ? (
                        <div className="pt-2 flex items-center justify-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
                          <ShieldCheck className="w-4 h-4" /> Disetujui
                        </div>
                      ) : (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {record.proof_url ? (
                            <>
                              <button 
                                onClick={() => setPreviewProofUrl(record.proof_url)} 
                                className="flex-1 text-center text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 py-2.5 rounded-xl transition-colors"
                              >
                                Lihat Bukti
                              </button>
                              <button 
                                onClick={() => handleValidateProof(record.id)}
                                disabled={validatingId === record.id}
                                className="flex-[1] justify-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 py-2.5 rounded-xl transition-colors flex items-center gap-1"
                              >
                                {validatingId === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                                Cek AI
                              </button>
                            </>
                          ) : (
                            <div className="flex-1 text-center text-xs text-slate-400 italic py-2.5 bg-slate-100 rounded-xl">
                              Tanpa Bukti
                            </div>
                          )}
                          <button 
                            onClick={() => handleApproveManual(record.id)}
                            className="flex-[1] justify-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 py-2.5 rounded-xl transition-colors"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleRejectProof(record.id)}
                            className="flex-[0.8] justify-center text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 py-2.5 rounded-xl transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))
             )}
          </div>
        </div>

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
