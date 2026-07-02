'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react'

interface FinancialRecord {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
}

export default function PersonalWalletPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [records, setRecords] = useState<FinancialRecord[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/personal/summary')
        setSummary(res.data.summary)
        setRecords(res.data.records)
      } catch (err) {
        console.error('Failed to fetch personal summary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-bold">Memuat dompet Anda...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <header className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            Dompet Pribadi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Pantau arus kas personal Anda di sini.</p>
        </div>
        <Link 
          href="/personal/wallet/create"
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5" />
          Catat Transaksi
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-20 w-20 text-slate-900" /></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Bersih</p>
            <h2 className="text-3xl font-extrabold text-slate-900">{formatCurrency(summary.balance)}</h2>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="h-20 w-20 text-emerald-500" /></div>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Pemasukan</p>
            <h2 className="text-2xl font-bold text-slate-900">{formatCurrency(summary.income)}</h2>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="h-20 w-20 text-rose-500" /></div>
            <p className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-2">Total Pengeluaran</p>
            <h2 className="text-2xl font-bold text-slate-900">{formatCurrency(summary.expense)}</h2>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">10 Transaksi Terakhir</h3>
          {records.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">Belum ada catatan transaksi personal.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <th className="py-3 px-2">Tanggal</th>
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Keterangan</th>
                    <th className="py-3 px-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-4 px-2 whitespace-nowrap">{new Date(r.transaction_date).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 px-2">{r.category}</td>
                      <td className="py-4 px-2 text-slate-500">{r.description || '-'}</td>
                      <td className={`py-4 px-2 text-right font-bold ${r.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.type === 'income' ? '+' : '-'}{formatCurrency(Number(r.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
