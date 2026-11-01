'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Buildings,
  Users,
  Wallet,
  CalendarDots,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  Funnel,
  ArrowsClockwise,
  DownloadSimple,
  Eye,
  FileText,
  Check,
  X,
  ShieldCheck,
  CaretRight,
  UserCheck,
  FileImage,
  ArrowSquareOut,
  SealCheck,
  TrendUp,
  TrendDown,
  Trash
} from '@phosphor-icons/react'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { ExcelExportModal, ExcelColumnConfig } from '@/components/ui/ExcelExportModal'

export default function SchoolExecutiveEkskulInspectionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const ekskulSlug = params.ekskulSlug as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'finance' | 'students'>('overview')

  // Finance Filter State
  const [financeTypeFilter, setFinanceTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [financeSearch, setFinanceSearch] = useState('')
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState('all')

  // Attendance & Session Detail State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false)
  const [sessionDetail, setSessionDetail] = useState<any>(null)
  const [sessionAttendeeFilter, setSessionAttendeeFilter] = useState<'all' | 'present' | 'sick' | 'permit' | 'alpha'>('all')
  const [sessionAttendeeSearch, setSessionAttendeeSearch] = useState('')

  // Student Recap Filter State
  const [studentSearch, setStudentSearch] = useState('')
  const [studentSortBy, setStudentSortBy] = useState<'name_asc' | 'rate_desc' | 'rate_asc' | 'alpha_desc'>('name_asc')

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  const fetchFullReport = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await api.get(`/org/${orgSlug}/school/linked-org/${ekskulSlug}/full-report`)
      setReport(res.data)
    } catch (err: any) {
      console.error('Error fetching ekskul full report:', err)
      toast.error(err.response?.data?.error || 'Gagal memuat data inspeksi ekskul.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchFullReport()
  }, [orgSlug, ekskulSlug])

  // Auto load first session on desktop view when switching to attendance tab
  useEffect(() => {
    if (activeTab === 'attendance' && !selectedSessionId && report?.sessions?.length > 0) {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        loadSessionDetail(report.sessions[0].id)
      }
    }
  }, [activeTab, report])

  const loadSessionDetail = async (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setSessionDetailLoading(true)
    try {
      const res = await api.get(`/org/${orgSlug}/school/linked-org/${ekskulSlug}/session/${sessionId}`)
      setSessionDetail(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memuat detail sesi absensi.')
      setSelectedSessionId(null)
    } finally {
      setSessionDetailLoading(false)
    }
  }

  const confirm = useConfirm()
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const handleDeleteSession = async (sessionId: string, sessionTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const ok = await confirm({
      title: 'Hapus Sesi Agenda',
      message: `Hapus sesi agenda "${sessionTitle}"? Seluruh data presensi pada sesi ini akan dihapus permanen agar tidak dihitung sebagai alpa untuk siswa.`,
      confirmText: 'Ya, Hapus Sesi',
      variant: 'danger'
    })
    if (!ok) return

    setDeletingSessionId(sessionId)
    try {
      await api.delete(`/org/${orgSlug}/school/linked-org/${ekskulSlug}/session/${sessionId}`)
      toast.success(`Sesi "${sessionTitle}" berhasil dihapus. Rekap alpa telah dihitung ulang!`)
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null)
        setSessionDetail(null)
      }
      await fetchFullReport(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menghapus sesi agenda.')
    } finally {
      setDeletingSessionId(null)
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filtered Financial Records
  const filteredTransactions = useMemo(() => {
    if (!report?.transactions) return []
    return report.transactions.filter((tx: any) => {
      const matchType = financeTypeFilter === 'all' || tx.type === financeTypeFilter
      const matchCategory = financeCategoryFilter === 'all' || tx.category === financeCategoryFilter
      const matchSearch = financeSearch === '' || 
        (tx.description && tx.description.toLowerCase().includes(financeSearch.toLowerCase())) ||
        (tx.category && tx.category.toLowerCase().includes(financeSearch.toLowerCase()))
      return matchType && matchCategory && matchSearch
    })
  }, [report?.transactions, financeTypeFilter, financeCategoryFilter, financeSearch])

  // Categories list
  const categoryOptions = useMemo(() => {
    if (!report?.transactions) return []
    const set = new Set<string>()
    report.transactions.forEach((tx: any) => {
      if (tx.category) set.add(tx.category)
    })
    return Array.from(set)
  }, [report?.transactions])

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    if (!report?.student_recap) return []
    let list = report.student_recap.filter((s: any) => {
      return s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    })

    if (studentSortBy === 'name_asc') {
      list.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    } else if (studentSortBy === 'rate_desc') {
      list.sort((a: any, b: any) => b.attendance_rate - a.attendance_rate || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    } else if (studentSortBy === 'rate_asc') {
      list.sort((a: any, b: any) => a.attendance_rate - b.attendance_rate || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    } else if (studentSortBy === 'alpha_desc') {
      list.sort((a: any, b: any) => b.alpha_count - a.alpha_count || (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    }

    return list
  }, [report?.student_recap, studentSearch, studentSortBy])

  // Filtered Attendees in Selected Session
  const filteredSessionAttendees = useMemo(() => {
    if (!sessionDetail?.attendees) return []
    return sessionDetail.attendees.filter((att: any) => {
      const matchStatus = sessionAttendeeFilter === 'all' || att.status === sessionAttendeeFilter
      const matchSearch = sessionAttendeeSearch === '' ||
        att.name.toLowerCase().includes(sessionAttendeeSearch.toLowerCase()) ||
        att.email.toLowerCase().includes(sessionAttendeeSearch.toLowerCase())
      return matchStatus && matchSearch
    }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
  }, [sessionDetail?.attendees, sessionAttendeeFilter, sessionAttendeeSearch])

  // State & Konfigurasi Ekspor Excel (.xlsx) dengan Desain Tabel
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const exportConfig = useMemo(() => {
    if (!report) {
      return {
        title: 'Rekap Data Ekskul',
        filename: 'Rekap_Ekskul',
        sheetName: 'Data',
        reportTitle: 'REKAP DATA',
        subtitle: 'Inspeksi Kesiswaan',
        columns: [] as ExcelColumnConfig[],
        data: [] as Record<string, any>[],
        summaryRow: undefined as Record<string, any> | undefined
      }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const orgName = report.org.name

    if (activeTab === 'finance') {
      const columns: ExcelColumnConfig[] = [
        { header: 'No', key: 'no', width: 6, alignment: 'center' },
        { header: 'Tanggal', key: 'date', width: 16 },
        { header: 'Jenis', key: 'type', width: 14, alignment: 'center' },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Keterangan', key: 'description', width: 36 },
        { header: 'Pemasukan', key: 'income', width: 20, alignment: 'right', format: 'currency' },
        { header: 'Pengeluaran', key: 'expense', width: 20, alignment: 'right', format: 'currency' },
        { header: 'Bukti Nota', key: 'receipt', width: 32 }
      ]

      let totalIncome = 0
      let totalExpense = 0

      const data = filteredTransactions.map((tx: any, idx: number) => {
        const income = tx.type === 'income' ? Number(tx.amount || 0) : 0
        const expense = tx.type === 'expense' ? Number(tx.amount || 0) : 0
        totalIncome += income
        totalExpense += expense

        return {
          no: idx + 1,
          date: formatDate(tx.transaction_date),
          type: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          category: tx.category || '-',
          description: tx.description || '-',
          income,
          expense,
          receipt: tx.receipt_url || '-'
        }
      })

      const summaryRow = {
        no: '',
        date: '',
        type: '',
        category: '',
        description: 'TOTAL',
        income: totalIncome,
        expense: totalExpense,
        receipt: `Saldo Kas: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`
      }

      return {
        title: `Rekap Arus Kas - ${orgName}`,
        filename: `Rekap_Kas_${report.org.slug}_${todayStr}`,
        sheetName: 'Laporan Kas',
        reportTitle: `LAPORAN KEUANGAN & ARUS KAS - ${orgName.toUpperCase()}`,
        subtitle: `Inspeksi Kesiswaan Sekolah`,
        columns,
        data,
        summaryRow
      }
    }

    if (activeTab === 'attendance' && sessionDetail) {
      const columns: ExcelColumnConfig[] = [
        { header: 'No', key: 'no', width: 6, alignment: 'center' },
        { header: 'Nama Siswa', key: 'name', width: 28 },
        { header: 'Email Siswa', key: 'email', width: 26 },
        { header: 'Status Kehadiran', key: 'status', width: 18, alignment: 'center' },
        { header: 'Waktu Check-In', key: 'check_in_time', width: 20, alignment: 'center' },
        { header: 'Catatan / Alasan', key: 'notes', width: 32 },
        { header: 'Bukti Lampiran', key: 'proof_url', width: 30 }
      ]

      const data = filteredSessionAttendees.map((att: any, idx: number) => ({
        no: idx + 1,
        name: att.name,
        email: att.email || '-',
        status: (att.status || '').toUpperCase(),
        check_in_time: att.check_in_time ? formatDateTime(att.check_in_time) : '-',
        notes: att.notes || '-',
        proof_url: att.proof_url || '-'
      }))

      return {
        title: `Presensi Sesi: ${sessionDetail.session.title}`,
        filename: `Presensi_${report.org.slug}_${sessionDetail.session.title.replace(/\s+/g, '_')}_${todayStr}`,
        sheetName: 'Daftar Hadir Sesi',
        reportTitle: `DAFTAR HADIR SESI - ${sessionDetail.session.title.toUpperCase()}`,
        subtitle: `${orgName} | Sesi Tanggal: ${formatDate(sessionDetail.session.start_time)}`,
        columns,
        data,
        summaryRow: undefined
      }
    }

    // Default: Siswa / Kedisiplinan
    const columns: ExcelColumnConfig[] = [
      { header: 'No', key: 'no', width: 6, alignment: 'center' },
      { header: 'Nama Siswa', key: 'name', width: 28 },
      { header: 'Email Siswa', key: 'email', width: 28 },
      { header: 'Jabatan', key: 'role', width: 16, alignment: 'center' },
      { header: 'Kehadiran', key: 'rate', width: 16, alignment: 'center', format: 'percent' },
      { header: 'Hadir', key: 'present', width: 10, alignment: 'center', format: 'number' },
      { header: 'Izin', key: 'permit', width: 10, alignment: 'center', format: 'number' },
      { header: 'Sakit', key: 'sick', width: 10, alignment: 'center', format: 'number' },
      { header: 'Alpa', key: 'alpha', width: 10, alignment: 'center', format: 'number' },
      { header: 'Total Sesi', key: 'total_sessions', width: 12, alignment: 'center', format: 'number' }
    ]

    // Urutkan siswa selalu berdasarkan abjad A-Z untuk rekap Excel resmi
    const sortedStudentList = [...filteredStudents].sort((a: any, b: any) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    )

    const data = sortedStudentList.map((s: any, idx: number) => ({
      no: idx + 1,
      name: s.name,
      email: s.email,
      role: s.role === 'auditor' ? 'Pembina' : s.role === 'head' ? 'Ketua' : s.role === 'vice_head' ? 'Wakil Ketua' : s.role === 'bendahara' ? 'Bendahara' : s.role === 'sekretaris' ? 'Sekretaris' : s.role === 'member' ? 'Anggota' : s.role,
      rate: s.attendance_rate,
      present: s.present_count,
      permit: s.permit_count,
      sick: s.sick_count,
      alpha: s.alpha_count,
      total_sessions: s.total_sessions
    }))

    return {
      title: `Rekap Kedisiplinan Siswa - ${orgName}`,
      filename: `Kedisiplinan_Siswa_${report.org.slug}_${todayStr}`,
      sheetName: 'Kedisiplinan Siswa',
      reportTitle: `REKAP KEDISIPLINAN & PRESENSI SISWA - ${orgName.toUpperCase()}`,
      subtitle: `Inspeksi Kesiswaan Sekolah`,
      columns,
      data,
      summaryRow: undefined
    }
  }, [report, activeTab, sessionDetail, filteredTransactions, filteredStudents, filteredSessionAttendees])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 md:px-8 max-w-5xl mx-auto pt-6 animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
          <div className="space-y-2">
            <div className="w-40 h-4 rounded-md bg-slate-200"></div>
            <div className="w-64 h-6 rounded-md bg-slate-200"></div>
          </div>
        </div>
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="h-12 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6 flex flex-col items-center justify-center text-center">
        <WarningCircle size={48} className="text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Ekskul Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Organisasi/ekskul ini mungkin belum ditautkan ke sekolah Anda atau slug salah.
        </p>
        <Link
          href={`/org/${orgSlug}/executive`}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Portal Eksekutif
        </Link>
      </div>
    )
  }

  const { org, summary } = report

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <div className="max-w-5xl mx-auto p-4 md:px-8 space-y-4 sm:space-y-6">
        
        {/* Navigation & Header - Sleek Top Bar with Avatar & Badges */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/org/${orgSlug}/executive`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-2xs shrink-0"
              title="Kembali ke Portal Eksekutif"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>

            {org.logo_url ? (
              <img 
                src={org.logo_url} 
                alt={org.name} 
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain shrink-0" 
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#0087FF] to-sky-400 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-2xs shrink-0">
                {org.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {org.name}
                </h1>
                <span title="Terverifikasi Sekolah" className="shrink-0 flex items-center">
                  <SealCheck size={16} weight="fill" className="text-[#0087FF]" />
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium block truncate">
                Inspeksi Eksekutif Sekolah
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => fetchFullReport(true)}
              disabled={refreshing}
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors shadow-2xs disabled:opacity-50"
              title="Segarkan Data"
            >
              <ArrowsClockwise size={16} weight="bold" className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-xl bg-[#0087FF] hover:bg-[#007AE6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-[0.98]"
              title="Unduh Rekap Excel (.xlsx)"
            >
              <DownloadSimple size={16} weight="bold" />
              <span className="hidden sm:inline">Unduh (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Responsive 4-Column Grid Sticky Top */}
        <div className="sticky top-2 z-20 grid grid-cols-4 gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-[#0087FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Buildings size={16} weight="bold" />
            <span className="truncate">Ikhtisar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('attendance')
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setSelectedSessionId(null)
                setSessionDetail(null)
              }
            }}
            className={`py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-[#0087FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CalendarDots size={16} weight="bold" />
            <span className="truncate">Presensi</span>
            {report.sessions?.length > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline ${
                activeTab === 'attendance' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {report.sessions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'finance'
                ? 'bg-[#0087FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wallet size={16} weight="bold" />
            <span className="truncate">Keuangan</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'students'
                ? 'bg-[#0087FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users size={16} weight="bold" />
            <span className="truncate">Siswa</span>
            {summary.total_members > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline ${
                activeTab === 'students' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {summary.total_members}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: IKHTISAR (FULL OVERVIEW) */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6">
            
            {/* Hero Card Ekskul Overview */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 w-full sm:w-auto">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={org.name} 
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0087FF] to-sky-400 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                        {org.name}
                      </h2>
                      <span title="Terverifikasi Sekolah" className="shrink-0 flex items-center">
                        <SealCheck size={18} weight="fill" className="text-[#0087FF]" />
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {org.description || 'Ekstrakurikuler resmi di bawah naungan sekolah.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[11px] sm:text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users size={13} weight="bold" className="text-slate-400" />
                        Ketua: <strong className="text-slate-800">{org.leader?.name || '-'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        Pembina: <strong className="text-slate-800">{org.advisor?.name || '-'}</strong>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Slug: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-600">{org.slug}</code></span>
                    </div>
                  </div>
                </div>

                {/* Read-only Badge for Kesiswaan */}
                <div className="flex sm:flex-col sm:items-end gap-1 shrink-0">
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-[10px] sm:text-xs font-bold"
                    title="Mode Inspeksi Kesiswaan: Akses Langsung Tanpa Perlu Join Workspace"
                  >
                    <ShieldCheck size={13} weight="bold" />
                    <span className="hidden sm:inline">Mode Inspeksi Kesiswaan</span>
                    <span className="sm:hidden">Inspeksi</span>
                  </div>
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5">Akses Langsung Tanpa Join Workspace</p>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100">
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Kas</span>
                  <p className={`text-sm sm:text-lg font-black mt-0.5 ${
                    summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}>
                    {formatRupiah(summary.balance)}
                  </p>
                  <span className={`text-[10px] font-bold mt-0.5 sm:mt-1 flex items-center gap-1 ${
                    summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {summary.balance >= 0 ? (
                      <>
                        <TrendUp size={12} weight="bold" />
                        <span>Surplus</span>
                      </>
                    ) : (
                      <>
                        <TrendDown size={12} weight="bold" />
                        <span>Defisit</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Siswa</span>
                  <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">
                    {summary.total_members} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Anggota</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                    <Users size={12} weight="bold" />
                    <span>Terdaftar</span>
                  </span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Presensi</span>
                  <p className={`text-sm sm:text-lg font-black mt-0.5 ${
                    summary.avg_attendance >= 75 ? 'text-emerald-600' : summary.avg_attendance >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {summary.avg_attendance}%
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                    <CheckCircle size={12} weight="bold" />
                    <span>Keaktifan</span>
                  </span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sesi</span>
                  <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">
                    {summary.total_sessions} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Pertemuan</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                    <CalendarDots size={12} weight="bold" />
                    <span>Tercatat</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Top Cards: Financial Summary & Recent Sesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Financial Snapshot */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Wallet size={18} weight="duotone" className="text-[#0087FF]" />
                    Ringkasan Kas Masuk & Keluar
                  </h3>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="text-xs font-bold text-[#0087FF] hover:underline flex items-center gap-0.5"
                  >
                    Lihat Semua <CaretRight size={12} weight="bold" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Pemasukan</span>
                    <p className="text-base font-black text-emerald-700 mt-1">
                      {formatRupiah(summary.total_income)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Pengeluaran</span>
                    <p className="text-base font-black text-rose-700 mt-1">
                      {formatRupiah(summary.total_expense)}
                    </p>
                  </div>
                </div>

                {/* Top Categories Breakdown */}
                {report.category_breakdown && Object.keys(report.category_breakdown).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Distribusi Kategori Anggaran</span>
                    <div className="space-y-1.5">
                      {Object.entries(report.category_breakdown).slice(0, 4).map(([cat, val]: any) => (
                        <div key={cat} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-slate-50">
                          <span className="font-medium text-slate-700">{cat}</span>
                          <div className="flex items-center gap-3">
                            {val.income > 0 && <span className="text-emerald-600 font-bold">+{formatRupiah(val.income)}</span>}
                            {val.expense > 0 && <span className="text-rose-600 font-bold">-{formatRupiah(val.expense)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sesi Terkini & Keaktifan */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CalendarDots size={18} weight="duotone" className="text-[#0087FF]" />
                    Sesi Latihan / Pertemuan Terakhir
                  </h3>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="text-xs font-bold text-[#0087FF] hover:underline flex items-center gap-0.5"
                  >
                    Buka Detail <CaretRight size={12} weight="bold" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {report.sessions?.slice(0, 3).map((s: any) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveTab('attendance')
                        loadSessionDetail(s.id)
                      }}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-[#E0F4FE]/30 hover:border-[#0087FF]/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock size={12} />
                          {formatDateTime(s.start_time)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#007AE6] bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {s.attendee_count} Siswa Hadir ({s.attendance_rate}%)
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!report.sessions || report.sessions.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-8">
                      Belum ada sesi presensi latihan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Students Discipline Leaderboard Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck size={18} weight="duotone" className="text-emerald-600" />
                    Siswa Paling Rajin & Disiplin
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Persentase kehadiran tertinggi pada kegiatan ekskul ini</p>
                </div>
                <button
                  onClick={() => setActiveTab('students')}
                  className="text-xs font-bold text-[#0087FF] hover:underline flex items-center gap-0.5"
                >
                  Lihat Rekap Lengkap <CaretRight size={12} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredStudents.slice(0, 6).map((s: any, idx: number) => (
                  <div key={s.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 font-bold text-xs text-slate-700">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{s.role}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 shrink-0">
                      {s.attendance_rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESENSI & SESI ABSENSI DENGAN DRILL DOWN DAFTAR SISWA */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Responsive Layout: Mobile single-column swap, Desktop side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              
              {/* Sesi List Column (Visible on Mobile if no session selected; Always 5 cols on lg) */}
              <div className={`space-y-3 ${selectedSessionId ? 'hidden lg:block lg:col-span-5' : 'block lg:col-span-5'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Sesi ({report.sessions?.length || 0})
                  </h3>
                  <span className="text-[11px] text-slate-400">Pilih sesi untuk cek siswa</span>
                </div>

                <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                  {report.sessions?.map((session: any) => {
                    const isSelected = selectedSessionId === session.id
                    return (
                      <div
                        key={session.id}
                        onClick={() => loadSessionDetail(session.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E0F4FE] border-[#0087FF] shadow-xs ring-1 ring-[#0087FF]'
                            : 'bg-white border-slate-200 hover:border-slate-300 active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{session.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            session.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {session.is_active ? 'Aktif' : 'Selesai'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <CalendarDots size={13} className="text-slate-400" />
                            {formatDateTime(session.start_time)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#007AE6] bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                              {session.attendee_count} Hadir ({session.attendance_rate}%)
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, session.title, e)}
                              disabled={deletingSessionId === session.id}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus sesi agenda ini agar tidak dihitung alpa"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                            <span className="lg:hidden text-slate-400">
                              <CaretRight size={13} weight="bold" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {(!report.sessions || report.sessions.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-12 bg-white rounded-2xl border border-slate-200">
                      Belum ada sesi presensi latihan dibuat.
                    </p>
                  )}
                </div>
              </div>

              {/* Detailed Session Inspector Column (Visible on Mobile if session selected; Always 7 cols on lg) */}
              <div className={`${selectedSessionId ? 'block lg:col-span-7' : 'hidden lg:block lg:col-span-7'}`}>
                
                {/* Mobile Back Button: Return to Sesi List */}
                <div className="lg:hidden mb-3">
                  <button
                    onClick={() => {
                      setSelectedSessionId(null)
                      setSessionDetail(null)
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs"
                  >
                    <span className="flex items-center gap-2 text-[#0087FF]">
                      <ArrowLeft size={16} weight="bold" />
                      <span>Kembali ke Daftar Sesi</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {report.sessions?.length || 0} Sesi
                    </span>
                  </button>
                </div>

                {sessionDetailLoading ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-8 h-8 border-3 border-[#0087FF] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-medium">Memuat rincian daftar hadir siswa...</p>
                  </div>
                ) : sessionDetail ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    {/* Header Sesi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Detail Presensi Sesi
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">
                          {sessionDetail.session.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock size={13} />
                          {formatDateTime(sessionDetail.session.start_time)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {/* Summary Status Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Hadir: {sessionDetail.summary.present}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            Izin: {sessionDetail.summary.permit}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                            Sakit: {sessionDetail.summary.sick}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            Alpa: {sessionDetail.summary.alpha}
                          </span>
                        </div>

                        {/* Hapus Sesi Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(sessionDetail.session.id, sessionDetail.session.title)}
                          disabled={deletingSessionId === sessionDetail.session.id}
                          className="self-start sm:self-end px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                          title="Hapus sesi agenda ini agar tidak dihitung alpa"
                        >
                          <Trash size={14} weight="bold" />
                          <span>Hapus Sesi Ini</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search inside Session */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={sessionAttendeeSearch}
                          onChange={(e) => setSessionAttendeeSearch(e.target.value)}
                          placeholder="Cari siswa di sesi ini..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0087FF]"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto">
                        {(['all', 'present', 'permit', 'sick', 'alpha'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setSessionAttendeeFilter(tab)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                              sessionAttendeeFilter === tab
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tab === 'all' ? 'Semua' : tab === 'present' ? 'Hadir' : tab === 'permit' ? 'Izin' : tab === 'sick' ? 'Sakit' : 'Alpa'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attendees Table / Cards */}
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {filteredSessionAttendees.map((att: any) => {
                        const isPresent = att.status === 'present'
                        const isSick = att.status === 'sick'
                        const isPermit = att.status === 'permit'
                        const isAlpha = att.status === 'alpha'

                        return (
                          <div
                            key={att.profile_id}
                            className="p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                {att.avatar_url ? (
                                  <img src={att.avatar_url} alt={att.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  att.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                                  {att.is_ex_member && (
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full shrink-0 border border-slate-200" title="Member lama yang hadir saat sesi ini diadakan">
                                      Alumni
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {att.check_in_time ? `Check-in: ${formatDateTime(att.check_in_time)}` : att.email}
                                </p>
                                {att.notes && (
                                  <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                    Catatan: {att.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {att.proof_url && (
                                <button
                                  onClick={() => setPreviewImage({ url: att.proof_url, title: `Bukti ${att.name}` })}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs flex items-center gap-1 font-bold"
                                  title="Lihat Bukti Foto"
                                >
                                  <FileImage size={14} weight="bold" />
                                  <span className="hidden sm:inline">Bukti</span>
                                </button>
                              )}

                              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                isPresent ? 'bg-emerald-100 text-emerald-800' :
                                isPermit ? 'bg-amber-100 text-amber-800' :
                                isSick ? 'bg-sky-100 text-sky-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {isPresent && <CheckCircle size={13} weight="fill" />}
                                {isPermit && <Clock size={13} weight="bold" />}
                                {isSick && <WarningCircle size={13} weight="bold" />}
                                {isAlpha && <X size={13} weight="bold" />}
                                <span className="hidden sm:inline">
                                  {isPresent ? 'Hadir' : isPermit ? 'Izin' : isSick ? 'Sakit' : 'Alpa'}
                                </span>
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {filteredSessionAttendees.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-10 bg-slate-50 rounded-2xl">
                          Tidak ada siswa sesuai filter di sesi ini.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-2">
                    <CalendarDots size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Pilih salah satu sesi di sebelah kiri</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Anda dapat melihat status hadir, sakit, izin, atau alpa tiap siswa beserta jam check-in dan bukti foto.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEUANGAN LENGKAP DENGAN FILTER & BUKTI NOTA */}
        {activeTab === 'finance' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Top Metrics Cards: Saldo, Pemasukan, Pengeluaran */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Saldo Kas</span>
                <p className={`text-sm sm:text-lg font-black mt-0.5 truncate ${
                  summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}>
                  {formatRupiah(summary.balance)}
                </p>
                <span className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${
                  summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {summary.balance >= 0 ? (
                    <>
                      <TrendUp size={12} weight="bold" />
                      <span>Surplus</span>
                    </>
                  ) : (
                    <>
                      <TrendDown size={12} weight="bold" />
                      <span>Defisit</span>
                    </>
                  )}
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider block">Pemasukan</span>
                <p className="text-sm sm:text-lg font-black text-emerald-700 mt-0.5 truncate">
                  {formatRupiah(summary.total_income)}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ArrowUpRight size={12} weight="bold" className="text-emerald-500" />
                  <span>Total Masuk</span>
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider block">Pengeluaran</span>
                <p className="text-sm sm:text-lg font-black text-rose-700 mt-0.5 truncate">
                  {formatRupiah(summary.total_expense)}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ArrowDownRight size={12} weight="bold" className="text-rose-500" />
                  <span>Total Keluar</span>
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    placeholder="Cari transaksi berdasarkan keterangan atau kategori..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0087FF]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setFinanceTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        financeTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setFinanceTypeFilter('income')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        financeTypeFilter === 'income' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Pemasukan
                    </button>
                    <button
                      onClick={() => setFinanceTypeFilter('expense')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        financeTypeFilter === 'expense' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Pengeluaran
                    </button>
                  </div>

                  {/* Category Dropdown */}
                  {categoryOptions.length > 0 && (
                    <select
                      value={financeCategoryFilter}
                      onChange={(e) => setFinanceCategoryFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0087FF]"
                    >
                      <option value="all">Semua Kategori</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Ledger */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buku Kas & Riwayat Transaksi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Menampilkan {filteredTransactions.length} transaksi</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Total Terfilter:</span>
                  <p className="text-sm font-black text-slate-800">
                    {formatRupiah(filteredTransactions.reduce((acc: number, tx: any) => {
                      return acc + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount))
                    }, 0))}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((tx: any) => {
                  const isIncome = tx.type === 'income'
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors space-y-2"
                    >
                      {/* Baris 1: Kategori, Tanggal & Jumlah Transaksi */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {isIncome ? <ArrowUpRight size={17} weight="bold" /> : <ArrowDownRight size={17} weight="bold" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                              {tx.category || (isIncome ? 'Pemasukan Kas' : 'Pengeluaran Kas')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDate(tx.transaction_date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className={`font-black text-xs sm:text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            isIncome ? 'bg-emerald-100/80 text-emerald-800' : 'bg-rose-100/80 text-rose-800'
                          }`}>
                            {isIncome ? 'Masuk' : 'Keluar'}
                          </span>
                        </div>
                      </div>

                      {/* Baris 2: Detail Keterangan Lengkap & Tombol Bukti Nota (Tampil Penuh, Tanpa Kepotong) */}
                      <div className="flex items-start justify-between gap-3 pl-10 sm:pl-12">
                        <p className="text-xs text-slate-600 font-medium leading-relaxed break-words flex-1">
                          {tx.description ? (
                            <span>{tx.description}</span>
                          ) : (
                            <span className="text-slate-400 italic">Tidak ada catatan keterangan</span>
                          )}
                        </p>

                        {tx.receipt_url && (
                          <button
                            onClick={() => setPreviewImage({ url: tx.receipt_url, title: `Nota: ${tx.category || tx.description}` })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0087FF] transition-colors text-[11px] font-bold shrink-0 self-start"
                            title="Lihat Bukti Nota"
                          >
                            <FileText size={14} weight="bold" />
                            <span>Lihat Nota</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {filteredTransactions.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-1">
                    <p className="text-xs font-bold">Tidak ada data transaksi yang cocok.</p>
                    <p className="text-[11px]">Coba ubah kata kunci pencarian atau filter jenis transaksi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REKAP KEDISIPLINAN SISWA */}
        {activeTab === 'students' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Top Metrics Cards: Total Siswa, Rata-rata Presensi, Total Sesi */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Anggota</span>
                <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                  {summary.total_members} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Siswa</span>
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Users size={12} weight="bold" />
                  <span>Terdaftar</span>
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Presensi</span>
                <p className={`text-sm sm:text-lg font-black mt-0.5 truncate ${
                  summary.avg_attendance >= 75 ? 'text-emerald-600' : summary.avg_attendance >= 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {summary.avg_attendance}%
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle size={12} weight="bold" />
                  <span>Keaktifan</span>
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sesi</span>
                <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                  {summary.total_sessions} <span className="text-[10px] sm:text-xs font-medium text-slate-500">Pertemuan</span>
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <CalendarDots size={12} weight="bold" />
                  <span>Tercatat</span>
                </span>
              </div>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-2xs">
              <div className="relative flex-1">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari siswa berdasarkan nama atau email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0087FF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 shrink-0">Urutkan:</span>
                <select
                  value={studentSortBy}
                  onChange={(e: any) => setStudentSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0087FF]"
                >
                  <option value="name_asc">Nama Siswa (A-Z)</option>
                  <option value="rate_desc">Kehadiran Tertinggi (%)</option>
                  <option value="rate_asc">Kehadiran Terendah (%)</option>
                  <option value="alpha_desc">Paling Banyak Alpa</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rekap Presensi & Performa Anggota</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total {filteredStudents.length} siswa terdaftar di {org.name}
                  </p>
                </div>
              </div>

              {/* Mobile Touch-Friendly Card List (Shown on sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredStudents.map((s: any) => {
                  const isHigh = s.attendance_rate >= 80
                  const isLow = s.attendance_rate < 50

                  return (
                    <div key={s.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              s.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{s.name}</p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {s.role === 'auditor' ? 'Pembina' : s.role === 'head' ? 'Ketua' : s.role === 'vice_head' ? 'Wakil Ketua' : s.role === 'bendahara' ? 'Bendahara' : s.role === 'sekretaris' ? 'Sekretaris' : s.role === 'member' ? 'Anggota' : s.role}
                            </span>
                          </div>
                        </div>

                        <span className={`font-black text-xs px-2 py-0.5 rounded-lg shrink-0 ${
                          isHigh ? 'bg-emerald-50 text-emerald-700' : isLow ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {s.attendance_rate}%
                        </span>
                      </div>

                      {/* Mini Bar & Detailed Attendance Counts */}
                      <div className="flex items-center justify-between gap-3 text-[11px] pt-1">
                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">H: {s.present_count}</span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">I: {s.permit_count}</span>
                          <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">S: {s.sick_count}</span>
                          <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">A: {s.alpha_count}</span>
                        </div>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${s.attendance_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredStudents.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada siswa yang sesuai pencarian.
                  </div>
                )}
              </div>

              {/* Desktop Table (Hidden on Mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-3">Jabatan</th>
                      <th className="py-3 px-3 text-center">Hadir</th>
                      <th className="py-3 px-3 text-center">Izin</th>
                      <th className="py-3 px-3 text-center">Sakit</th>
                      <th className="py-3 px-3 text-center">Alpa</th>
                      <th className="py-3 px-4 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s: any) => {
                      const isHigh = s.attendance_rate >= 80
                      const isLow = s.attendance_rate < 50

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                {s.avatar_url ? (
                                  <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  s.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{s.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.role === 'head' ? 'bg-[#E0F4FE] text-[#007AE6]' :
                              s.role === 'vice_head' ? 'bg-sky-50 text-sky-700' :
                              s.role === 'auditor' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              s.role === 'bendahara' ? 'bg-emerald-50 text-emerald-700' :
                              s.role === 'sekretaris' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {s.role === 'auditor' ? 'Pembina' : s.role === 'head' ? 'Ketua' : s.role === 'vice_head' ? 'Wakil Ketua' : s.role === 'bendahara' ? 'Bendahara' : s.role === 'sekretaris' ? 'Sekretaris' : s.role === 'member' ? 'Anggota' : s.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                            {s.present_count}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-amber-600">
                            {s.permit_count}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-sky-600">
                            {s.sick_count}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-rose-600">
                            {s.alpha_count}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${
                                    isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${s.attendance_rate}%` }}
                                />
                              </div>
                              <span className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                                isHigh ? 'bg-emerald-50 text-emerald-700' : isLow ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {s.attendance_rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Tidak ada siswa yang sesuai pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Image Preview Modal (for Nota & Attendance Proof) */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 truncate pr-2">{previewImage.title}</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#0087FF] hover:underline flex items-center gap-1"
              >
                Buka Resolusi Penuh <ArrowSquareOut size={14} weight="bold" />
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ekspor Excel dengan Opsi Desain Tabel */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={exportConfig.title}
        filename={exportConfig.filename}
        sheetName={exportConfig.sheetName}
        reportTitle={exportConfig.reportTitle}
        subtitle={exportConfig.subtitle}
        columns={exportConfig.columns}
        data={exportConfig.data}
        summaryRow={exportConfig.summaryRow}
      />
    </div>
  )
}
