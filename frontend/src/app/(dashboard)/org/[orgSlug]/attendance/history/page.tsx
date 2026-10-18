'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, RefreshCw, Filter, X, History, Download, Compass, Upload, FileText, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/CustomSelect'
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour'

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
  const [showTour, setShowTour] = useState(false)

  // State untuk Modal Upload Surat Dokter Susulan (1x24 jam)
  const [uploadingRecord, setUploadingRecord] = useState<any | null>(null)
  const [uploadingProofUrl, setUploadingProofUrl] = useState<string>('')
  const [uploadNotes, setUploadNotes] = useState<string>('')
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const [submittingProof, setSubmittingProof] = useState<boolean>(false)

  const historyTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-hist-summary"]',
      title: 'Statistik Kehadiran Anda',
      description: 'Pantau akumulasi kehadiran pribadi Anda: jumlah hadir tepat waktu, keterlambatan, izin, sakit, hingga alpa.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-hist-filter"]',
      title: 'Filter Agenda & Sesi',
      description: 'Pilih sesi kegiatan tertentu untuk melihat siapa saja yang hadir pada agenda tersebut secara spesifik.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-hist-export"]',
      title: 'Unduh Rekap Excel',
      description: 'Ekspor seluruh data kehadiran ke format spreadsheet Excel (.xlsx) rapi dengan satu klik untuk arsip laporan resmi.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-hist-table"]',
      title: 'Tabel Presensi Lengkap',
      description: 'Lihat daftar lengkap anggota yang hadir beserta jam kedatangan, kepulangan, bukti foto/surat izin, dan catatan.',
      position: 'top'
    }
  ]

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
    await Promise.all([
      fetchData(),
      api.get(`/org-attendance/${orgSlug}/me/history`).then(res => {
        setPersonalHistory(res.data.records || [])
        setPersonalStats(res.data.stats || null)
      }).catch(console.error)
    ])
    setRefreshing(false)
  }

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadingRecord) return
    if (!uploadingProofUrl) {
      toast.error('Silakan unggah foto atau dokumen surat dokter terlebih dahulu.')
      return
    }

    setSubmittingProof(true)
    try {
      await api.put(`/org-attendance/${orgSlug}/attendance/${uploadingRecord.id}/proof`, {
        proof_url: uploadingProofUrl,
        notes: uploadNotes
      })
      toast.success('Surat dokter berhasil diunggah! Status sakit Anda telah diperbarui.')
      setUploadingRecord(null)
      setUploadingProofUrl('')
      setUploadNotes('')
      await handleRefresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan surat bukti.')
    } finally {
      setSubmittingProof(false)
    }
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

  const isEditor = currentUserRole === 'head' || currentUserRole === 'vice_head' || currentUserRole === 'sekretaris'

  const handleExportExcel = async () => {
    if (records.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const sessionName = selectedSession ? (sessions.find(s => s.id === selectedSession)?.title || 'Sesi') : 'Semua Agenda';
    
    const ExcelJS = (await import('exceljs')).default
    const { saveAs } = (await import('file-saver')).default

    // Inisialisasi Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Presensi');

    // Styling Header
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Agenda / Sesi', key: 'agenda', width: 25 },
      { header: 'Nama Anggota', key: 'nama', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'Waktu Datang', key: 'waktuDatang', width: 15 },
      { header: 'Waktu Pulang', key: 'waktuPulang', width: 15 },
      { header: 'Status', key: 'status', width: 25 },
      { header: 'Catatan', key: 'catatan', width: 35 },
    ];

    // Format Header (Bold, Centered, Background, Border)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' } // Blue-600
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add Borders to Header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Sort records alphabetically by member name
    const sortedRecords = [...records].sort((a, b) => {
      const nameA = (a.profile?.full_name || a.profile?.email || '').toLowerCase();
      const nameB = (b.profile?.full_name || b.profile?.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Populate Data
    sortedRecords.forEach((record, index) => {
      const checkInDate = new Date(record.check_in_time);
      const checkOutDate = record.check_out_time ? new Date(record.check_out_time) : null;
      
      let statusString = '';
      if (record.status === 'present') statusString = 'Hadir';
      else if (record.status === 'late') statusString = 'Terlambat';
      else if (record.status === 'excused') statusString = 'Izin';
      else if (record.status === 'sick') statusString = 'Sakit';
      else if (record.status === 'absent') statusString = 'Alpa';

      if (record.session?.session_type === 'in_out' && !record.check_out_time && (record.status === 'present' || record.status === 'late')) {
        statusString += ' (Belum Pulang)';
      }

      const row = worksheet.addRow({
        no: index + 1,
        agenda: record.session?.title || 'Sesi Tanpa Nama',
        nama: (record.profile?.full_name || record.profile?.email?.split('@')[0] || '-').toUpperCase(),
        email: record.profile?.email || '-',
        tanggal: checkInDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        waktuDatang: checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        waktuPulang: checkOutDate ? checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        status: statusString,
        catatan: record.notes?.replace('[VALIDATED]', '') || '-'
      });

      // Styling Baris Data (Alignment & Borders)
      row.alignment = { vertical: 'middle', wrapText: true };
      
      // Center align for certain columns
      row.getCell('no').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('tanggal').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('waktuDatang').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('waktuPulang').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };

      // Set Borders for each cell in the row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Rekap_Presensi_${sessionName.replace(/\\s+/g, '_')}_${new Date().getTime()}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
  };

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
            Kembali ke Presensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Riwayat Presensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Pantau rekam jejak kehadiran anggota.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-bold transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Panduan Fitur</span>
          </button>
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
      <section data-tour="tour-hist-summary" className="relative z-10 max-w-7xl mx-auto mt-10">
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
              Belum ada riwayat presensi.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[500px] text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Agenda / Sesi</th>
                    <th className="px-6 py-4">Waktu Check-in</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Bukti Surat / Tindakan</th>
                    <th className="px-6 py-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalHistory.map((record) => {
                    const rawTime = record.check_in_time || record.created_at
                    const checkInTime = rawTime ? new Date(rawTime) : new Date()
                    const ageHours = (Date.now() - checkInTime.getTime()) / (1000 * 60 * 60)
                    const isExpired = ageHours > 24
                    const hoursRemaining = Math.max(0, 24 - ageHours)
                    const remH = Math.floor(hoursRemaining)
                    const remM = Math.floor((hoursRemaining - remH) * 60)

                    const isSick = record.status === 'sick'
                    const isConvertedFromSick = record.status === 'excused' && (record.notes?.includes('CONVERTED_TO_EXCUSED') || record.notes?.includes('batas 24 jam'))
                    const hasProof = !!record.proof_url

                    return (
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
                            record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            record.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            record.status === 'excused' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            record.status === 'sick' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {record.status === 'present' ? 'Hadir' : 
                             record.status === 'late' ? 'Telat' : 
                             record.status === 'excused' ? 'Izin' : 
                             record.status === 'sick' ? 'Sakit' : 'Alpa'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hasProof ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProofUrl(record.proof_url)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Surat</span>
                            </button>
                          ) : isSick ? (
                            !isExpired ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Sisa {remH}j {remM}m</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadingRecord(record)
                                    setUploadingProofUrl('')
                                    setUploadNotes('')
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Unggah Surat</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 italic">
                                  Lewat batas 24j (Dianggap Izin)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadingRecord(record)
                                    setUploadingProofUrl('')
                                    setUploadNotes('')
                                  }}
                                  className="text-xs text-blue-600 hover:underline font-bold"
                                >
                                  Unggah Susulan
                                </button>
                              </div>
                            )
                          ) : isConvertedFromSick ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Izin (Sakit tanpa surat &gt;24j)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadingRecord(record)
                                  setUploadingProofUrl('')
                                  setUploadNotes('')
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Unggah Surat</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]" title={record.notes || ''}>
                          {record.notes?.replace(/\[CONVERTED_TO_EXCUSED[^\]]*\]/g, '') || '-'}
                        </td>
                      </tr>
                    )
                  })}
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
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                data-tour="tour-hist-export"
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-bold transition-colors"
                title="Unduh ke Excel"
              >
                <Download className="w-4 h-4" />
                Rekap Excel
              </button>
              
              <div data-tour="tour-hist-filter" className="relative w-full sm:w-auto">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none">
                <Filter className="w-4 h-4" />
              </div>
              <CustomSelect
                value={selectedSession}
                onChange={val => setSelectedSession(val)}
                placeholder="Semua Agenda Presensi"
                options={[
                  { label: 'Semua Agenda Presensi', value: '' },
                  ...sessions.map(s => ({ label: s.title, value: s.id }))
                ]}
                className="w-full sm:w-64 pl-8"
              />
            </div>
            </div>
          </div>
          
          {records.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-medium">
              Belum ada data presensi yang tercatat.
            </div>
          ) : (
            <div data-tour="tour-hist-table" className="overflow-x-auto">
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
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Terlambat
                          </span>
                        )}
                        {record.status === 'excused' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Izin</span>}
                        {record.status === 'sick' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Sakit</span>}
                        {record.status === 'absent' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Alpa</span>}
                        
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

      {/* MODAL UPLOAD SURAT DOKTER SUSULAN (1x24 JAM) */}
      {uploadingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => {
                setUploadingRecord(null)
                setUploadingProofUrl('')
                setUploadNotes('')
              }}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">Unggah Surat Dokter Susulan</h3>
                <p className="text-xs text-slate-500 truncate">
                  {uploadingRecord.session?.title || 'Sesi Presensi'}
                </p>
              </div>
            </div>

            {/* Info batas waktu 24 jam */}
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-bold">Ketentuan Batas 1x24 Jam</p>
                <p className="mt-0.5 text-amber-800">
                  Unggah foto surat keterangan dokter/sakit untuk mengonfirmasi status Sakit resmi Anda. Jika melewati 24 jam sejak pengajuan awal, sistem secara otomatis menganggapnya sebagai Izin biasa.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadProofSubmit} className="space-y-4">
              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Berkas Surat (Foto / PDF)
                </label>
                {!uploadingProofUrl ? (
                  <div className="relative w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadLoading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        if (file.size > 5000000) {
                          toast.error('Ukuran berkas maksimal 5MB')
                          return
                        }

                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'appweb')

                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'djkkckmig'

                        setUploadLoading(true)
                        try {
                          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                            method: 'POST',
                            body: formData
                          })
                          const data = await res.json()
                          if (data.secure_url) {
                            setUploadingProofUrl(data.secure_url)
                            toast.success('Berkas surat berhasil diunggah.')
                          } else {
                            throw new Error(data.error?.message || 'Gagal mengunggah berkas')
                          }
                        } catch (err: any) {
                          console.error('Upload Error', err)
                          toast.error(err.message || 'Gagal mengunggah berkas ke server.')
                        } finally {
                          setUploadLoading(false)
                        }
                      }}
                    />
                    {uploadLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-xs font-semibold text-blue-600">Sedang mengunggah berkas...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                        <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 text-center">
                          Klik atau seret foto surat dokter ke sini
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, PDF (Maksimal 5MB)</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Surat Dokter Terlampir</p>
                        <a
                          href={uploadingProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline font-medium"
                        >
                          Lihat Pratinjau Berkas
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadingProofUrl('')}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan / Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Keterangan Dokter / Diagnosa (Opsional)
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Contoh: Sakit Tifus, surat dokter RS Hermina istirahat 3 hari"
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setUploadingRecord(null)
                    setUploadingProofUrl('')
                    setUploadNotes('')
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProof || !uploadingProofUrl}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingProof ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Surat Bukti</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SpotlightTour
        tourKey="attendance_history"
        steps={historyTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  )
}
