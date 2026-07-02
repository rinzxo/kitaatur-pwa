'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import { ArrowLeft, Search, Paperclip, TrendingUp, TrendingDown, Trash2, Wallet } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export default function FinancialHistoryPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('all')
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

  const fetchData = async (silent = false) => {
    try {
      if (!silent && records.length === 0) setLoading(true)
      const recordsRes = await api.get(`/org-financial/${orgSlug}`)
      setRecords(recordsRes.data)
    } catch (err) {
      console.error('Error fetching org financial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkRoleAndLoad = async () => {
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

      await fetchData(true)
    } catch (err: any) {
      console.error('Error verifying org access:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug])

  const handleDeleteRecord = async (recordId: string) => {
    if (!await await confirm('Konfirmasi', 'Apakah Anda yakin ingin menghapus catatan transaksi ini?')) return
    try {
      await api.delete(`/org-financial/${orgSlug}/${recordId}`)
      await fetchData(true)
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Gagal menghapus transaksi.')
    }
  }

  const isEditor = currentUserRole === 'bendahara'

  // Generate unique months in YYYY-MM format
  const uniqueMonths = Array.from(new Set(records.map(r => {
    const d = new Date(r.transaction_date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))).sort().reverse()

  const recordsByMonthAndType = records.filter(record => {
    const d = new Date(record.transaction_date)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const matchesMonth = filterMonth === 'all' || monthStr === filterMonth
    const matchesType = filterType === 'all' || record.type === filterType
    return matchesMonth && matchesType
  })

  // Only show categories that exist in the currently filtered month/type
  const uniqueCategories = Array.from(new Set(recordsByMonthAndType.map(r => r.category))).sort()

  const filteredRecords = recordsByMonthAndType.filter(record => {
    const matchesSearch = 
      record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 relative animate-pulse">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 mt-4">
          <div className="h-14 w-full bg-slate-200 rounded-xl"></div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Link 
            href={`/org/${orgSlug}/financial`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Keuangan
          </Link>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Riwayat Kas Lengkap
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <CustomSelect
              value={filterMonth}
              onChange={(value) => {
                setFilterMonth(value)
                setFilterCategory('all')
              }}
              options={[
                { label: 'Semua Bulan', value: 'all' },
                ...uniqueMonths.map(m => ({ label: formatMonth(m), value: m }))
              ]}
              className="w-full"
            />
            <CustomSelect
              value={filterType}
              onChange={(value) => {
                setFilterType(value)
                setFilterCategory('all')
              }}
              options={[
                { label: 'Semua Jenis', value: 'all' },
                { label: 'Uang Masuk', value: 'income' },
                { label: 'Uang Keluar', value: 'expense' }
              ]}
              className="w-full"
            />
            <CustomSelect
              value={filterCategory}
              onChange={(value) => setFilterCategory(value)}
              options={[
                { label: 'Semua Kategori', value: 'all' },
                ...uniqueCategories.map(cat => ({ label: cat as string, value: cat as string }))
              ]}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm font-medium">
              Tidak ada data catatan kas yang cocok.
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-3 sm:p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
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
                    {isEditor && (
                      <button onClick={() => handleDeleteRecord(record.id)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition" title="Hapus Transaksi">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
