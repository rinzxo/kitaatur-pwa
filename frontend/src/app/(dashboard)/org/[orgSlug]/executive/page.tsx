'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Buildings,
  Users,
  Wallet,
  QrCode,
  CalendarDots,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  CaretRight,
  CaretDown,
  CaretUp,
  X,
  ArrowsClockwise,
  DownloadSimple,
  Info,
  TrendUp,
  FileText,
  Check,
  ShieldCheck,
  ArrowSquareOut,
  FileImage,
  UserCheck,
  SealCheck,
  Compass
} from '@phosphor-icons/react'
import { ExcelExportModal, ExcelColumnConfig } from '@/components/ui/ExcelExportModal'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

export default function SchoolExecutiveDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'attention'>('all')

  // Spotlight Walkthrough Tour State
  const [showTour, setShowTour] = useState(false)

  // Drawer Detail State
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEkskul, setSelectedEkskul] = useState<any>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerDetail, setDrawerDetail] = useState<any>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'finance' | 'attendance' | 'members'>('finance')
  const [drawerFinanceFilter, setDrawerFinanceFilter] = useState<'all' | 'income' | 'expense'>('all')

  // Drawer Session Drill-down State
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false)
  const [sessionAttendees, setSessionAttendees] = useState<any>(null)

  // Drawer Receipt / Proof Lightbox
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null)

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    try {
      const res = await api.get(`/org/${orgSlug}/school/executive-overview`)
      setData(res.data)
    } catch (err: any) {
      console.error('Error fetching executive data:', err)
      toast.error(err.response?.data?.error || 'Gagal memuat overview eksekutif sekolah.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [orgSlug])

  const openDrawer = async (ekskul: any) => {
    setSelectedEkskul(ekskul)
    setDrawerOpen(true)
    setDrawerLoading(true)
    setActiveDrawerTab('finance')
    setDrawerFinanceFilter('all')
    setExpandedSessionId(null)
    setSessionAttendees(null)
    setPreviewReceiptUrl(null)

    try {
      const res = await api.get(`/org/${orgSlug}/school/linked-org/${ekskul.id}/detail`)
      setDrawerDetail(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memuat detail ekskul')
    } finally {
      setDrawerLoading(false)
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedEkskul(null)
    setDrawerDetail(null)
    setExpandedSessionId(null)
    setSessionAttendees(null)
    setPreviewReceiptUrl(null)
  }

  const handleToggleSessionDetail = async (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null)
      setSessionAttendees(null)
      return
    }

    setExpandedSessionId(sessionId)
    setSessionDetailLoading(true)
    try {
      const res = await api.get(`/org/${orgSlug}/school/linked-org/${selectedEkskul.id}/session/${sessionId}`)
      setSessionAttendees(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memuat detail kehadiran sesi.')
      setExpandedSessionId(null)
    } finally {
      setSessionDetailLoading(false)
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)
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

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const excelColumns: ExcelColumnConfig[] = [
    { header: 'No', key: 'no', width: 6, alignment: 'center' },
    { header: 'Nama Ekskul / Organisasi', key: 'name', width: 32 },
    { header: 'Ketua', key: 'leader', width: 24 },
    { header: 'Pembina', key: 'advisor', width: 24 },
    { header: 'Jumlah Siswa', key: 'members', width: 15, alignment: 'center', format: 'number' },
    { header: 'Sesi Presensi Terakhir', key: 'last_session_title', width: 28 },
    { header: 'Tingkat Kehadiran', key: 'attendance_rate', width: 18, alignment: 'center', format: 'percent' },
    { header: 'Total Pemasukan', key: 'income', width: 20, alignment: 'right', format: 'currency' },
    { header: 'Total Pengeluaran', key: 'expense', width: 20, alignment: 'right', format: 'currency' },
    { header: 'Saldo Kas', key: 'balance', width: 22, alignment: 'right', format: 'currency' },
    { header: 'Status Operasional', key: 'status_label', width: 18, alignment: 'center' }
  ]

  const excelData = useMemo(() => {
    if (!data?.ekskuls) return []
    const sorted = [...data.ekskuls].sort((a: any, b: any) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    )
    return sorted.map((e: any, idx: number) => {
      const isDeficit = e.finance.current_balance < 0
      const inactive = !e.attendance.last_session || e.attendance.last_session.days_ago > 14
      const statusLabel = isDeficit ? 'Defisit' : inactive ? 'Perlu Perhatian' : 'Aktif'

      return {
        no: idx + 1,
        name: e.name,
        leader: e.leader?.name || '-',
        advisor: e.advisor?.name || '-',
        members: e.member_count || 0,
        last_session_title: e.attendance.last_session?.title || 'Belum ada sesi',
        attendance_rate: e.attendance.last_session ? e.attendance.last_session.attendance_rate : 0,
        income: Number(e.finance.total_income || 0),
        expense: Number(e.finance.total_expense || 0),
        balance: Number(e.finance.current_balance || 0),
        status_label: statusLabel
      }
    })
  }, [data])

  const excelSummaryRow = useMemo(() => {
    if (!data?.ekskuls || data.ekskuls.length === 0) return undefined
    const totalMembers = data.ekskuls.reduce((acc: number, e: any) => acc + (e.member_count || 0), 0)
    const totalIncome = data.ekskuls.reduce((acc: number, e: any) => acc + Number(e.finance.total_income || 0), 0)
    const totalExpense = data.ekskuls.reduce((acc: number, e: any) => acc + Number(e.finance.total_expense || 0), 0)
    const totalBalance = data.ekskuls.reduce((acc: number, e: any) => acc + Number(e.finance.current_balance || 0), 0)

    return {
      no: '',
      name: 'TOTAL KESELURUHAN',
      leader: '',
      advisor: '',
      members: totalMembers,
      last_session_title: '',
      attendance_rate: '',
      income: totalIncome,
      expense: totalExpense,
      balance: totalBalance,
      status_label: ''
    }
  }, [data])

  // Konfigurasi Langkah Panduan Interaktif Eksekutif
  const executiveTourSteps: TourStep[] = useMemo(() => {
    if (!data?.has_linked_orgs) {
      return [
        {
          target: '[data-tour="tour-zero-state"]',
          title: 'Ruang Eksekutif Kesiswaan',
          description: 'Halaman ini merupakan pusat kendali sekolah untuk memantau seluruh kegiatan ekstrakurikuler. Hubungi administrator untuk menautkan ekskul yang ada.'
        }
      ]
    }

    return [
      {
        target: '[data-tour="tour-hero-overview"]',
        title: 'Akumulasi Kas & Metrik Kesiswaan',
        description: 'Pantau total akumulasi saldo kas seluruh unit ekskul, total siswa terdaftar, persentase kehadiran gabungan, dan rasio ekskul aktif secara real-time.'
      },
      {
        target: '[data-tour="tour-export-excel"]',
        title: 'Unduh Rekap Eksekutif (.xlsx)',
        description: 'Cetak dan ekspor laporan kedisiplinan serta keuangan kesiswaan resmi berformat Excel dengan data terurut alfabetis A-Z untuk keperluan arsip sekolah.'
      },
      {
        target: '[data-tour="tour-status-filter"]',
        title: 'Filter Status Ekskul',
        description: 'Pilah ekskul dengan mudah berdasarkan status: "Semua", "Aktif", atau "Perlu Perhatian" (unit dengan kas defisit atau vakum latihan > 14 hari).'
      },
      {
        target: '[data-tour="tour-search-ekskul"]',
        title: 'Pencarian Instan',
        description: 'Temukan ekstrakurikuler tertentu berdasarkan nama ekskul, nama ketua siswa, atau nama guru pembina secara cepat.'
      },
      {
        target: '[data-tour="tour-ekskul-card"]',
        title: 'Kartu Monitoring Unit Ekskul',
        description: 'Setiap kartu merangkum kondisi unit: saldo kas terkini, log latihan terakhir, jumlah siswa, serta kontak ketua dan pembina resmi.'
      },
      {
        target: '[data-tour="tour-detail-action"]',
        title: 'Quick Peek Drawer',
        description: 'Ketuk tombol "Detail" untuk membuka drawer samping yang menampilkan rekap mutasi kas, lampiran bukti nota, dan log absensi per sesi tanpa meninggalkan dashboard.'
      },
      {
        target: '[data-tour="tour-inspect-action"]',
        title: 'Inspeksi Penuh & Validasi',
        description: 'Ketuk tombol "Inspeksi" untuk masuk ke halaman audit mendalam per unit ekskul, melihat rincian keuangan lengkap dan daftar rekap kedisiplinan siswa.'
      }
    ]
  }, [data?.has_linked_orgs])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 md:px-8 max-w-4xl mx-auto pt-6 animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="space-y-1.5">
              <div className="w-28 h-4 rounded-full bg-slate-200"></div>
              <div className="w-48 h-6 rounded-md bg-slate-200"></div>
            </div>
          </div>
          <div className="w-24 h-9 rounded-full bg-slate-200"></div>
        </div>
        <div className="h-48 md:h-56 bg-slate-200 rounded-3xl"></div>
        <div className="h-12 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    )
  }

  const { school, has_linked_orgs, summary, ekskuls = [] } = data || {}

  // Filtered ekskuls
  const attentionCount = ekskuls.filter((e: any) => {
    const isDeficit = e.finance.current_balance < 0
    const inactive = !e.attendance.last_session || e.attendance.last_session.days_ago > 14
    return isDeficit || inactive
  }).length

  const activeCount = ekskuls.length - attentionCount

  const filteredEkskuls = ekskuls.filter((e: any) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.leader?.name && e.leader.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.advisor?.name && e.advisor.name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchSearch) return false

    if (statusFilter === 'active') {
      return e.attendance.last_session && e.attendance.last_session.days_ago <= 14 && e.finance.current_balance >= 0
    }
    if (statusFilter === 'attention') {
      const isDeficit = e.finance.current_balance < 0
      const inactive = !e.attendance.last_session || e.attendance.last_session.days_ago > 14
      return isDeficit || inactive
    }
    return true
  }).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <div className="max-w-4xl mx-auto p-4 md:px-8 space-y-6">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-3 pt-2 sm:pt-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {school?.logo_url ? (
              <img 
                src={school.logo_url} 
                alt={school?.name || 'Logo'} 
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 text-white shadow-xs flex items-center justify-center shrink-0 font-black text-base sm:text-lg">
                {(school?.name || orgSlug).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {school?.name || orgSlug}
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                Dasbor Eksekutif Kesiswaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowTour(true)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#007AE6] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
              title="Panduan Interaktif Fitur"
            >
              <Compass size={15} weight="bold" className="text-[#0087FF]" />
              <span className="hidden sm:inline">Panduan Fitur</span>
              <span className="sm:hidden text-[11px]">Panduan</span>
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 sm:p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-[#0087FF] hover:border-[#0087FF] transition-all shadow-2xs active:scale-95 disabled:opacity-50"
              title="Segarkan Data"
            >
              <ArrowsClockwise size={16} weight="bold" className={refreshing ? 'animate-spin' : ''} />
            </button>
            {has_linked_orgs && (
              <button
                data-tour="tour-export-excel"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-full bg-[#0087FF] hover:bg-[#007AE6] text-white text-xs font-bold transition-all shadow-sm shadow-[#0087FF]/20 flex items-center gap-1.5 active:scale-95"
                title="Unduh Rekap Excel (.xlsx)"
              >
                <DownloadSimple size={15} weight="bold" />
                <span className="hidden sm:inline">Unduh Rekap (.xlsx)</span>
                <span className="sm:hidden text-[11px]">Excel</span>
              </button>
            )}
          </div>
        </header>

        {/* Zero State if no linked ekskul */}
        {!has_linked_orgs ? (
          <div data-tour="tour-zero-state" className="bg-white rounded-3xl p-8 md:p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center mx-auto shadow-inner">
              <Buildings size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg md:text-xl font-black text-slate-900">
                Belum Ada Ekskul yang Ditautkan
              </h2>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Sekolah ini belum memiliki unit ekskul yang terhubung. Admin KitaAtur dapat menautkan seluruh ekskul Anda secara langsung lewat Admin Panel.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle size={16} weight="fill" className="text-[#0087FF]" />
                Sistem Terpadu KitaAtur:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Kepsek & Wakasek langsung pantau tanpa perlu input akun tiap ekskul.</li>
                <li>Tiap pembina ekskul tetap independen mengurus kas & absen masing-masing.</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Signature KitaAtur Hero Card: Kas Gabungan & Metrik Utama */}
            <div data-tour="tour-hero-overview" className="relative overflow-hidden rounded-3xl shadow-xl shadow-[#0087FF]/25 bg-gradient-to-r from-[#0087FF] via-[#0099FF] to-[#01C4FB] text-white p-5 sm:p-6 md:p-7">
              <div className="flex justify-between items-start mb-2 relative z-10 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 opacity-95 min-w-0">
                  <span className="font-semibold text-xs sm:text-sm md:text-base truncate">Akumulasi Saldo Kas Ekskul</span>
                  <Info size={15} weight="bold" className="opacity-80 shrink-0" />
                </div>
                <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full shrink-0">
                  <Check size={13} weight="bold" />
                  <span>{summary?.total_ekskul || 0} Unit</span>
                </div>
              </div>

              {/* Big Balance */}
              <div className="relative z-10 my-2 sm:my-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight truncate">
                  {formatRupiah(summary?.total_cash || 0)}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                  <span className="text-[11px] sm:text-xs font-bold bg-white/25 px-2.5 py-0.5 rounded-lg backdrop-blur-xs">
                    {(summary?.total_cash || 0) >= 0 ? 'Surplus Kas Bersih' : 'Defisit Terdeteksi'}
                  </span>
                </div>
              </div>

              {/* Bottom Strip: 3 Pillars inside Hero */}
              <div className="relative z-10 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/20 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 truncate">Total Siswa</p>
                  <p className="text-xs sm:text-base md:text-lg font-black tracking-tight flex items-center justify-center gap-1">
                    <Users size={14} weight="bold" className="opacity-80 shrink-0 hidden sm:inline" />
                    <span>{summary?.total_students || 0} Siswa</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 truncate">Kehadiran</p>
                  <p className="text-xs sm:text-base md:text-lg font-black tracking-tight flex items-center justify-center gap-1">
                    <TrendUp size={14} weight="bold" className="opacity-80 shrink-0 hidden sm:inline" />
                    <span>{summary?.avg_attendance || 0}% Hadir</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 truncate">Ekskul Aktif</p>
                  <p className="text-xs sm:text-base md:text-lg font-black tracking-tight flex items-center justify-center gap-1">
                    <CheckCircle size={14} weight="bold" className="opacity-80 shrink-0 hidden sm:inline" />
                    <span>{activeCount} / {ekskuls.length} Unit</span>
                  </p>
                </div>
              </div>

              {/* Ambient blur blob */}
              <div className="absolute -bottom-24 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Health Notice (Alert Box) if any attention is needed */}
            {attentionCount > 0 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-slate-900 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <WarningCircle size={18} weight="fill" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {attentionCount} Ekskul Perlu Perhatian
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">
                      Terdapat ekskul yang belum menyelenggarakan latihan dalam 14 hari terakhir atau posisi kas defisit.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'attention' ? 'all' : 'attention')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-200/80 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-colors shrink-0 text-center"
                >
                  {statusFilter === 'attention' ? 'Tampilkan Semua' : 'Filter Ekskul Bermasalah'}
                </button>
              </div>
            )}

            {/* Section Header & Controls */}
            <div className="space-y-3 pt-1 sm:pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Daftar Ekskul & Kegiatan Kesiswaan</span>
                  <span className="text-xs font-bold bg-[#E0F4FE] text-[#007AE6] px-2.5 py-0.5 rounded-full">
                    {filteredEkskuls.length}
                  </span>
                </h3>

                {/* Filter Chips */}
                <div data-tour="tour-status-filter" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({ekskuls.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      statusFilter === 'active'
                        ? 'bg-[#0087FF] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Aktif ({activeCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('attention')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      statusFilter === 'attention'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Perlu Perhatian ({attentionCount})
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div data-tour="tour-search-ekskul" className="relative">
                <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama ekskul atau nama ketua..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#0087FF] focus:ring-2 focus:ring-[#0087FF]/10 text-slate-800 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Ekskul Cards List */}
            <div className="space-y-3">
              {filteredEkskuls.map((ekskul: any, idx: number) => {
                const lastSession = ekskul.attendance.last_session
                const balance = ekskul.finance.current_balance
                const isDeficit = balance < 0
                const isInactive = !lastSession || lastSession.days_ago > 14

                return (
                  <div
                    key={ekskul.id}
                    data-tour={idx === 0 ? 'tour-ekskul-card' : undefined}
                    onClick={() => openDrawer(ekskul)}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 hover:border-[#0087FF]/50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                  >
                    {/* Left: Ekskul Identity & Ketua */}
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      {ekskul.logo_url ? (
                        <img 
                          src={ekskul.logo_url} 
                          alt={ekskul.name} 
                          className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200/60 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0087FF] transition-colors">
                          {ekskul.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm md:text-base group-hover:text-[#0087FF] transition-colors truncate">
                            {ekskul.name}
                          </h4>
                          <span title="Terverifikasi Sekolah" className="shrink-0 flex items-center">
                            <SealCheck size={16} weight="fill" className="text-[#0087FF]" />
                          </span>
                          {isInactive && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5" title="Vakum lebih dari 14 hari">
                              <WarningCircle size={11} weight="bold" />
                              <span>&gt;14h</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                          Ketua: <span className="font-semibold text-slate-700">{ekskul.leader?.name || '-'}</span>
                          {ekskul.advisor?.name ? (
                            <> • Pembina: <span className="font-semibold text-slate-700">{ekskul.advisor.name}</span></>
                          ) : null}
                          {' '}• {ekskul.member_count} Siswa
                        </p>
                      </div>
                    </div>

                    {/* Middle: Activity & Attendance */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latihan Terakhir</p>
                        {lastSession ? (
                          <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center sm:justify-end gap-1">
                            <Clock size={13} weight="bold" className="text-slate-400 shrink-0" />
                            <span>{lastSession.days_ago === 0 ? 'Hari ini' : `${lastSession.days_ago} hari lalu`}</span>
                            <span className="text-slate-400 font-normal">({lastSession.attendance_rate}%)</span>
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-slate-400 mt-0.5">Belum ada sesi</p>
                        )}
                      </div>

                      {/* Right: Cash Balance & Action */}
                      <div className="text-right">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldo Kas</p>
                        <p className={`text-sm md:text-base font-black mt-0.5 ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatRupiah(balance)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          data-tour={idx === 0 ? 'tour-detail-action' : undefined}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDrawer(ekskul)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#E0F4FE] text-[#007AE6] hover:bg-[#0087FF] hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <span>Detail</span>
                          <CaretRight size={13} weight="bold" />
                        </button>
                        <Link
                          href={`/org/${orgSlug}/executive/ekskul/${ekskul.slug}`}
                          data-tour={idx === 0 ? 'tour-inspect-action' : undefined}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1 shadow-2xs"
                          title="Buka Inspeksi Penuh"
                        >
                          <span className="hidden sm:inline">Inspeksi</span>
                          <ArrowSquareOut size={13} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredEkskuls.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                  Tidak ada ekskul yang cocok dengan filter atau kata kunci pencarian.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* QUICK PEEK SLIDE-OVER DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header (Clean KitaAtur Blue) */}
            <div className="p-5 bg-gradient-to-r from-[#0087FF] to-[#01C4FB] text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {selectedEkskul?.logo_url ? (
                  <img 
                    src={selectedEkskul.logo_url} 
                    alt={selectedEkskul.name} 
                    className="w-11 h-11 object-contain shrink-0" 
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#0087FF] font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                    {selectedEkskul?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-base truncate">{selectedEkskul?.name}</h3>
                  <p className="text-xs text-white/80 truncate">
                    Ketua: {selectedEkskul?.leader?.name || '-'} • Pembina: {selectedEkskul?.advisor?.name || '-'} • {selectedEkskul?.member_count} Siswa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/org/${orgSlug}/executive/ekskul/${selectedEkskul?.slug}`}
                  title="Buka Halaman Inspeksi Penuh"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0087FF] hover:bg-white/90 text-xs font-black transition-all shadow-xs"
                >
                  <span>Inspeksi Penuh</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </Link>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs - Responsive 3 Columns Grid */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border-b border-slate-200 shrink-0">
              <button
                onClick={() => setActiveDrawerTab('finance')}
                className={`py-2 px-1 text-center text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1 ${
                  activeDrawerTab === 'finance'
                    ? 'bg-white text-[#007AE6] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet size={15} weight="bold" />
                <span className="truncate">Keuangan</span>
              </button>
              <button
                onClick={() => setActiveDrawerTab('attendance')}
                className={`py-2 px-1 text-center text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1 ${
                  activeDrawerTab === 'attendance'
                    ? 'bg-white text-[#007AE6] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock size={15} weight="bold" />
                <span className="truncate">Presensi</span>
              </button>
              <button
                onClick={() => setActiveDrawerTab('members')}
                className={`py-2 px-1 text-center text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1 ${
                  activeDrawerTab === 'members'
                    ? 'bg-white text-[#007AE6] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={15} weight="bold" />
                <span className="truncate">Siswa</span>
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {drawerLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-7 h-7 border-3 border-[#0087FF] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">Memuat data ekskul...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: KEUANGAN */}
                  {activeDrawerTab === 'finance' && (
                    <div className="space-y-5">
                      {/* Current Balance Card */}
                      <div className="p-4 rounded-2xl bg-[#E0F4FE] border border-[#0087FF]/20 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-[#007AE6] font-bold">Saldo Kas Saat Ini</span>
                          <p className="text-xl font-black text-slate-900 mt-0.5">
                            {formatRupiah(selectedEkskul?.finance?.current_balance || 0)}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          (selectedEkskul?.finance?.current_balance || 0) >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {(selectedEkskul?.finance?.current_balance || 0) >= 0 ? 'Kas Surplus' : 'Kas Defisit'}
                        </span>
                      </div>

                      {/* Cash Breakdown */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Masuk</span>
                          <p className="text-base font-black text-emerald-600 mt-1">
                            {formatRupiah(selectedEkskul?.finance?.total_income || 0)}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Keluar</span>
                          <p className="text-base font-black text-rose-600 mt-1">
                            {formatRupiah(selectedEkskul?.finance?.total_expense || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Recent Transactions List with Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Transaksi Terakhir
                          </h4>
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                            {(['all', 'income', 'expense'] as const).map(ft => (
                              <button
                                key={ft}
                                onClick={() => setDrawerFinanceFilter(ft)}
                                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                                  drawerFinanceFilter === ft
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {ft === 'all' ? 'Semua' : ft === 'income' ? 'Masuk' : 'Keluar'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(drawerDetail?.transactions || [])
                            .filter((tx: any) => drawerFinanceFilter === 'all' || tx.type === drawerFinanceFilter)
                            .map((tx: any) => {
                              const isIncome = tx.type === 'income'
                              return (
                                <div
                                  key={tx.id}
                                  className="p-3 rounded-2xl border border-slate-100 bg-white space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                      }`}>
                                        {isIncome ? <ArrowUpRight size={15} weight="bold" /> : <ArrowDownRight size={15} weight="bold" />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">
                                          {tx.category || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {formatDate(tx.transaction_date)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0 flex items-center gap-2">
                                      <span className={`font-black text-xs ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isIncome ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                                      </span>
                                      {tx.receipt_url && (
                                        <button
                                          onClick={() => setPreviewReceiptUrl(tx.receipt_url)}
                                          className="p-1 rounded-md bg-blue-50 text-[#0087FF] hover:bg-blue-100 transition-colors"
                                          title="Bukti Nota"
                                        >
                                          <FileText size={13} weight="bold" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {tx.description && (
                                    <p className="text-[11px] text-slate-600 leading-relaxed break-words pl-9">
                                      {tx.description}
                                    </p>
                                  )}
                                </div>
                              )
                            })}

                          {(!drawerDetail?.transactions || drawerDetail.transactions.length === 0) && (
                            <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                              Belum ada catatan transaksi keuangan.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ABSENSI DENGAN DRILL DOWN DAFTAR SISWA */}
                  {activeDrawerTab === 'attendance' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Sesi Presensi Terakhir
                        </h4>
                        <span className="text-[11px] text-slate-400">Klik sesi untuk cek siswa</span>
                      </div>

                      <div className="space-y-2.5">
                        {drawerDetail?.sessions?.map((session: any) => {
                          const isExpanded = expandedSessionId === session.id

                          return (
                            <div
                              key={session.id}
                              className={`rounded-2xl border transition-all overflow-hidden ${
                                isExpanded ? 'border-[#0087FF] bg-white shadow-xs' : 'border-slate-200/80 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleSessionDetail(session.id)}
                                className="p-3.5 space-y-2 cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900">{session.title}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      session.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {session.is_active ? 'Berlangsung' : 'Selesai'}
                                    </span>
                                    {isExpanded ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                                  <span className="flex items-center gap-1">
                                    <CalendarDots size={14} weight="bold" className="text-slate-400" />
                                    {formatDate(session.start_time)}
                                  </span>
                                  <span className="font-bold text-[#007AE6] bg-[#E0F4FE] px-2 py-0.5 rounded-lg">
                                    {session.attendee_count} Siswa Hadir ({session.attendance_rate}%)
                                  </span>
                                </div>
                              </div>

                              {/* Inline Expanded Attendee Detail */}
                              {isExpanded && (
                                <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                                  {sessionDetailLoading ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                                      <div className="w-5 h-5 border-2 border-[#0087FF] border-t-transparent rounded-full animate-spin" />
                                      <p className="text-[11px]">Memuat daftar siswa...</p>
                                    </div>
                                  ) : sessionAttendees ? (
                                    <div className="space-y-2.5">
                                      {/* Status Summary */}
                                      <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                          Hadir: {sessionAttendees.summary?.present || 0}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                          Izin: {sessionAttendees.summary?.permit || 0}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                                          Sakit: {sessionAttendees.summary?.sick || 0}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                          Alpa: {sessionAttendees.summary?.alpha || 0}
                                        </span>
                                      </div>

                                      {/* Attendee List */}
                                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                        {[...(sessionAttendees.attendees || [])].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })).map((att: any) => {
                                          const isPres = att.status === 'present'
                                          const isPerm = att.status === 'permit'
                                          const isSk = att.status === 'sick'

                                          return (
                                            <div
                                              key={att.profile_id}
                                              className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                                            >
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                  <p className="font-bold text-slate-800 truncate">{att.name}</p>
                                                  {att.is_ex_member && (
                                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full shrink-0 border border-slate-200">
                                                      Alumni
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                  {att.check_in_time ? `Jam: ${new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : (att.notes || att.role)}
                                                </p>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                {att.proof_url && (
                                                  <button
                                                    onClick={() => setPreviewReceiptUrl(att.proof_url)}
                                                    className="p-1 rounded bg-slate-100 text-slate-600 hover:text-slate-900"
                                                    title="Lihat Foto Bukti"
                                                  >
                                                    <FileImage size={13} weight="bold" />
                                                  </button>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                  isPres ? 'bg-emerald-100 text-emerald-800' :
                                                  isPerm ? 'bg-amber-100 text-amber-800' :
                                                  isSk ? 'bg-sky-100 text-sky-800' :
                                                  'bg-rose-100 text-rose-800'
                                                }`}>
                                                  {isPres ? 'Hadir' : isPerm ? 'Izin' : isSk ? 'Sakit' : 'Alpa'}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {(!drawerDetail?.sessions || drawerDetail.sessions.length === 0) && (
                          <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                            Belum ada sesi presensi yang dibuat oleh pembina.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: REKAP KEDISIPLINAN SISWA */}
                  {activeDrawerTab === 'members' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Rekap Kedisiplinan Siswa
                        </h4>
                        <span className="text-[11px] text-slate-400">Total {drawerDetail?.members?.length || 0} Siswa</span>
                      </div>

                      <div className="space-y-2">
                        {[...(drawerDetail?.members || [])]
                          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                          .map((m: any) => {
                          const rate = m.attendance_rate ?? 100
                          const isHigh = rate >= 80
                          const isLow = rate < 50

                          return (
                            <div
                              key={m.id}
                              className="p-3 rounded-2xl border border-slate-100 bg-white space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                    {m.avatar_url ? (
                                      <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      m.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                    isHigh ? 'bg-emerald-100 text-emerald-800' : isLow ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {rate}%
                                  </span>
                                </div>
                              </div>

                              {/* Attendance Mini Recap Stats */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-50">
                                <span className="font-semibold text-slate-600">
                                  H: <strong className="text-emerald-600">{m.present_count || 0}</strong> • 
                                  I: <strong className="text-amber-600">{m.permit_count || 0}</strong> • 
                                  S: <strong className="text-sky-600">{m.sick_count || 0}</strong> • 
                                  A: <strong className="text-rose-600">{m.alpha_count || 0}</strong>
                                </span>
                                <span className="uppercase text-[9px] font-bold text-slate-400">
                                  {m.role === 'auditor' ? 'Pembina' : m.role === 'head' ? 'Ketua' : m.role === 'vice_head' ? 'Wakil Ketua' : m.role}
                                </span>
                              </div>
                            </div>
                          )
                        })}

                        {(!drawerDetail?.members || drawerDetail.members.length === 0) && (
                          <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
                            Belum ada anggota terdaftar di ekskul ini.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Pusat Data Eksekutif Kesiswaan
              </span>
              <button
                onClick={closeDrawer}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal for Nota or Attendance Proof */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">Bukti Lampiran</h4>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[65vh] overflow-auto">
              <img
                src={previewReceiptUrl}
                alt="Lampiran"
                className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={previewReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#0087FF] hover:underline flex items-center gap-1"
              >
                Buka Penuh <ArrowSquareOut size={14} weight="bold" />
              </a>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ekspor Excel dengan Pilihan Desain Tabel */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Rekap Data Seluruh Ekskul Sekolah"
        filename={`Rekap_Ekskul_${(data?.school?.name || orgSlug).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`}
        sheetName="Rekap Ekskul"
        reportTitle={`REKAPITULASI UNIT EKSTRAKURIKULER - ${(data?.school?.name || orgSlug).toUpperCase()}`}
        subtitle="Laporan Eksekutif Kesiswaan"
        columns={excelColumns}
        data={excelData}
        summaryRow={excelSummaryRow}
      />

      {/* Spotlight Tour for Executive Dashboard */}
      <SpotlightTour
        tourKey="school_executive_dashboard"
        steps={executiveTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  )
}
