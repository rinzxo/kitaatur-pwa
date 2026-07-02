'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import FinancialChart from './financial-chart'
import OrgTransactionForm from './org-transaction-form'
import { 
  ArrowLeft, Wallet, TrendingUp, TrendingDown, FileSpreadsheet, 
  Trash2, RefreshCw, AlertCircle, Search, Filter, Paperclip 
} from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface Summary {
  income: number
  expense: number
  balance: number
}

interface Record {
  id: string
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
  created_at: string
  receipt_url?: string | null
}

interface ChartItem {
  month: string
  income: number
  expense: number
}

export default function OrgFinancialPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  // User States
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [orgName, setOrgName] = useState<string>('')

  // Financial States
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 })
  const [chartData, setChartData] = useState<ChartItem[]>([])
  const [records, setRecords] = useState<Record[]>([])
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const formatRupiah = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const fetchData = async () => {
    try {
      // 1. Get Financial Summary & Chart Data
      const summaryRes = await api.get(`/org-financial/${orgSlug}/summary`)
      setSummary(summaryRes.data.summary)
      setChartData(summaryRes.data.chartData)

      // 2. Get Financial Records
      const recordsRes = await api.get(`/org-financial/${orgSlug}`)
      setRecords(recordsRes.data)

      // 3. Get Org Detail
      const orgRes = await api.get(`/org/${orgSlug}`)
      if (orgRes.data && orgRes.data.name) {
        setOrgName(orgRes.data.name)
      } else {
        setOrgName(orgSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      }
    } catch (err) {
      console.error('Error fetching org financial data:', err)
      if (!orgName) {
        setOrgName(orgSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      }
    }
  }

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUserId(user.id)

    try {
      // Dapatkan keanggotaan user di org ini untuk mengetahui role-nya
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      } else {
        // Jika tidak terdaftar, lempar ke dashboard utama
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
        setLoading(false) // Don't redirect, let them see the empty state or retry
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!await await confirm('Konfirmasi', 'Apakah Anda yakin ingin menghapus catatan transaksi ini?')) return

    try {
      await api.delete(`/org-financial/${orgSlug}/${recordId}`)
      toast.success('Transaksi kas berhasil dihapus')
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menghapus transaksi')
    }
  }

  // Integrasi Ekspor Laporan Excel (.xlsx) menggunakan exceljs
  const handleExportToExcel = async () => {
    if (records.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor')
      return
    }

    try {
      const ExcelJS = (await import('exceljs')).default
      const { saveAs } = (await import('file-saver')).default

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Laporan Keuangan')

      // Styling: Kolom
      worksheet.columns = [
        { header: 'Tanggal Transaksi', key: 'date', width: 20 },
        { header: 'Tipe', key: 'type', width: 12 },
        { header: 'Kategori', key: 'category', width: 20 },
        { header: 'Keterangan', key: 'description', width: 45 },
        { header: 'Uang Masuk', key: 'income', width: 22 },
        { header: 'Uang Keluar', key: 'expense', width: 22 },
        { header: 'Saldo Berjalan', key: 'balance', width: 25 },
      ]

      // Menambah Kop Laporan
      worksheet.insertRow(1, [`LAPORAN KEUANGAN: ${orgName ? orgName.toUpperCase() : 'ORGANISASI'}`])
      worksheet.insertRow(2, [`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`])
      worksheet.insertRow(3, []) // Spasi

      worksheet.getCell('A1').font = { size: 16, bold: true }
      worksheet.getCell('A2').font = { size: 11, italic: true }

      // Header tabel sekarang bergeser ke baris ke 4.
      // Kita styling header tabelnya
      const headerRow = worksheet.getRow(4)
      headerRow.values = ['Tanggal Transaksi', 'Tipe', 'Kategori', 'Keterangan', 'Uang Masuk', 'Uang Keluar', 'Saldo Berjalan']
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' } // slate-800
        }
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Mengurutkan data (terlama ke terbaru)
      const sortedRecords = [...records].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())

      let totalIncome = 0
      let totalExpense = 0
      let runningBalance = 0

      // Isi Data
      sortedRecords.forEach((record) => {
        const amount = parseFloat(record.amount)
        if (record.type === 'income') {
          totalIncome += amount
          runningBalance += amount
        } else {
          totalExpense += amount
          runningBalance -= amount
        }

        const row = worksheet.addRow({
          date: new Date(record.transaction_date),
          type: record.type === 'income' ? 'Debet' : 'Kredit',
          category: record.category,
          description: record.description || '-',
          income: record.type === 'income' ? amount : null,
          expense: record.type === 'expense' ? amount : null,
          balance: runningBalance
        })

        // Styling data row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          // Format angka jadi mata uang
          if ([5, 6, 7].includes(colNumber)) {
            cell.numFmt = '"Rp"#,##0_ ;[Red]\\-"Rp"#,##0'
          }
          if (colNumber === 1) {
            cell.numFmt = 'dd/mm/yyyy'
            cell.alignment = { horizontal: 'center' }
          }
        })
      })

      // Baris Total
      worksheet.addRow([])
      const summaryRow1 = worksheet.addRow(['', '', '', 'TOTAL PEMASUKAN', totalIncome, '', ''])
      const summaryRow2 = worksheet.addRow(['', '', '', 'TOTAL PENGELUARAN', '', totalExpense, ''])
      const summaryRow3 = worksheet.addRow(['', '', '', 'SALDO BERSIH (AKHIR)', '', '', runningBalance])

      // Styling summary
      ;[summaryRow1, summaryRow2, summaryRow3].forEach((row) => {
        row.getCell(4).font = { bold: true }
        row.getCell(4).alignment = { horizontal: 'right' }
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          if ([5, 6, 7].includes(colNumber)) {
            cell.numFmt = '"Rp"#,##0_ ;[Red]\\-"Rp"#,##0'
            cell.font = { bold: true }
          }
        })
      })

      // Tulis file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `Laporan_Keuangan_${orgSlug}_${new Date().toISOString().split('T')[0]}.xlsx`)

    } catch (err) {
      console.error('Failed to export Excel:', err)
      toast.error('Gagal mengekspor laporan Excel')
    }
  }

  // Calculate monthly stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyIncome = records.filter(r => {
    const d = new Date(r.transaction_date)
    return r.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((acc, r) => acc + parseFloat(r.amount), 0)

  const monthlyExpense = records.filter(r => {
    const d = new Date(r.transaction_date)
    return r.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).reduce((acc, r) => acc + parseFloat(r.amount), 0)

  // Filter & Search Logic
  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || record.type === filterType
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory

    return matchesSearch && matchesType && matchesCategory
  })

  // Dapatkan seluruh daftar kategori unik untuk dropdown filter
  const uniqueCategories = Array.from(new Set(records.map(r => r.category)))

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg mb-8"></div>
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
          {/* Chart & Table Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[300px] bg-slate-200 rounded-2xl"></div>
              <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-[300px] bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isEditor = currentUserRole === 'bendahara'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/dashboard`}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Workspace
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Keuangan Organisasi</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Pantau laporan kas masuk dan keluar secara terstruktur.</p>
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Link
            href={`/org/${orgSlug}/financial/analysis`}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[11px] sm:text-xs md:text-sm shadow-sm transition-all duration-300 justify-center whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3 md:w-4 md:h-4"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            Analisis
          </Link>

          <Link
            href={`/org/${orgSlug}/financial/goals`}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-[11px] sm:text-xs md:text-sm shadow-sm transition-all duration-300 justify-center whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target md:w-4 md:h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Anggaran
          </Link>

          <Link
            href={`/org/${orgSlug}/financial/dues`}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] sm:text-xs md:text-sm shadow-sm transition-all duration-300 justify-center whitespace-nowrap"
          >
            <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Tagihan
          </Link>
          
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-[11px] sm:text-xs md:text-sm shadow-sm transition-all duration-300 justify-center whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Ekspor Excel</span>
            <span className="sm:hidden">Ekspor</span>
          </button>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Chart and table */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">
                Saldo Kas Aktif
              </span>
              <span className="text-2xl font-bold text-slate-900 block">
                {formatRupiah(summary.balance)}
              </span>
              <div className="text-slate-500 font-medium text-xs mt-3 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Total Kas Bersih
              </div>
            </div>

            {/* Income */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">
                Uang Masuk (Total)
              </span>
              <span className="text-2xl font-bold text-emerald-600 block">
                {formatRupiah(summary.income)}
              </span>
              <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Bulan Ini
                </div>
                <span className="font-bold text-sm">{formatRupiah(monthlyIncome)}</span>
              </div>
            </div>

            {/* Expense */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">
                Uang Keluar (Total)
              </span>
              <span className="text-2xl font-bold text-rose-600 block">
                {formatRupiah(summary.expense)}
              </span>
              <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Bulan Ini
                </div>
                <span className="font-bold text-sm">{formatRupiah(monthlyExpense)}</span>
              </div>
            </div>
          </div>

          {/* Recharts chart */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Statistik Kas 6 Bulan Terakhir</h3>
            <FinancialChart data={chartData} />
          </div>

          {/* Recent History List */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">Riwayat Kas Terbaru</h3>
              <Link 
                href={`/org/${orgSlug}/financial/history`}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Lihat Riwayat Lengkap
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
              


            {filteredRecords.slice(0, 5).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm font-medium">
                Belum ada transaksi kas yang tercatat.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {filteredRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 sm:p-4 bg-white border border-slate-100 shadow-sm rounded-2xl hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center ${record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {record.type === 'income' ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          <span className="font-bold text-slate-900 text-sm sm:text-base truncate block">{record.category}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 truncate block w-full">{record.description || 'Tanpa keterangan'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className={`font-bold text-sm sm:text-base mb-1.5 ${record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {record.type === 'income' ? '+' : '-'} {formatRupiah(record.amount)}
                      </div>
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium mr-2 hidden sm:inline-block">
                          {new Date(record.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                          {' • '}
                          {new Date(record.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {record.receipt_url && (
                          <a href={record.receipt_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Lihat Struk">
                            <Paperclip className="w-4 h-4" />
                          </a>
                        )}
                        <a href={`/invoice/${record.id}`} className="text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 p-1.5 rounded-lg transition" title="Kwitansi Digital">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: CTA (Form separated to another page) */}
        <div className="space-y-6">
          {isEditor ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pencatatan Kas Baru</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Tambah laporan uang masuk atau pengeluaran secara detail untuk transparansi.
              </p>
              <Link 
                href={`/org/${orgSlug}/financial/create`}
                className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
              >
                Catat Transaksi Sekarang
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              Anda masuk dengan peran **{currentUserRole.toUpperCase()}**.
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-bold">
                Anda hanya diizinkan untuk melihat laporan kas keuangan. Pencatatan kas baru hanya bisa dilakukan oleh **Head** dan **Bendahara**.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
