'use client'
import toast from 'react-hot-toast'


import { useEffect, useState, useMemo } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, TrendingUp, TrendingDown, 
  BarChart3, PieChart, Activity, ChevronRight, ChevronLeft, Sparkles, Loader2
} from 'lucide-react'

interface OrgFinancialRecord {
  id: string
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
  created_at: string
}

export default function FinancialAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [records, setRecords] = useState<OrgFinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  
  // Selected month in format YYYY-MM
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug])

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (!currentMember) {
        router.push('/personal/dashboard')
        return
      }
      await fetchRecords()
    } catch (err) {
      console.error('Error verifying org access:', err)
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    try {
      const res = await api.get(`/org-financial/${orgSlug}`)
      setRecords(res.data)
    } catch (err) {
      console.error('Error fetching financial records:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  // Calculate stats for the selected month and the previous month
  const { currentStats, previousStats, categoryBreakdown, monthlyRecords } = useMemo(() => {
    const [year, month] = selectedMonthStr.split('-').map(Number)
    
    let prevYear = year
    let prevMonth = month - 1
    if (prevMonth < 1) {
      prevMonth = 12
      prevYear -= 1
    }

    const current = { income: 0, expense: 0 }
    const previous = { income: 0, expense: 0 }
    const breakdown: globalThis.Record<string, { income: number, expense: number }> = {}
    const filtered: OrgFinancialRecord[] = []

    records.forEach(r => {
      const d = new Date(r.transaction_date)
      const rYear = d.getFullYear()
      const rMonth = d.getMonth() + 1
      const amount = parseFloat(r.amount)

      // Current Month
      if (rYear === year && rMonth === month) {
        filtered.push(r)
        
        if (r.type === 'income') {
          current.income += amount
        } else {
          current.expense += amount
        }

        if (!breakdown[r.category]) {
          breakdown[r.category] = { income: 0, expense: 0 }
        }
        
        if (r.type === 'income') {
          breakdown[r.category].income += amount
        } else {
          breakdown[r.category].expense += amount
        }
      }

      // Previous Month
      if (rYear === prevYear && rMonth === prevMonth) {
        if (r.type === 'income') {
          previous.income += amount
        } else {
          previous.expense += amount
        }
      }
    })

    return {
      currentStats: current,
      previousStats: previous,
      categoryBreakdown: Object.entries(breakdown).sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense)),
      monthlyRecords: filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    }
  }, [records, selectedMonthStr])

  // Reset AI insight when month changes
  useEffect(() => {
    setAiInsight(null)
  }, [selectedMonthStr])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const incomeTrend = calculateTrend(currentStats.income, previousStats.income)
  const expenseTrend = calculateTrend(currentStats.expense, previousStats.expense)

  const balance = currentStats.income - currentStats.expense
  let insightStatus: 'deficit' | 'surplus' | 'balanced' | 'neutral' = 'neutral'
  let insightMessage = 'Belum ada data transaksi yang cukup untuk dianalisis bulan ini.'
  let insightRecommendation = 'Mulai catat kas organisasi secara rutin.'

  if (currentStats.income > 0 || currentStats.expense > 0) {
    const expenseCategories = categoryBreakdown.filter(c => c[1].expense > 0).sort((a, b) => b[1].expense - a[1].expense)
    const topExpenseCat = expenseCategories.length > 0 ? expenseCategories[0] : null
    const topExpenseIsDominant = topExpenseCat && (topExpenseCat[1].expense / currentStats.expense) > 0.5

    if (balance < 0) {
      insightStatus = 'deficit'
      let percentageStr = ''
      if (currentStats.income > 0) {
        const pct = (Math.abs(balance) / currentStats.income) * 100
        percentageStr = ` (${pct.toFixed(1)}% dari total pemasukan)`
      } else {
        percentageStr = ` (100% defisit karena tidak ada pemasukan)`
      }
      insightMessage = `Organisasi mengalami defisit sebesar ${formatRupiah(Math.abs(balance))}${percentageStr} pada bulan ini.`

      if (expenseTrend > 20) {
        insightRecommendation = `Pengeluaran melonjak ${expenseTrend.toFixed(1)}% dibanding bulan lalu. `
        if (topExpenseIsDominant) {
          insightRecommendation += `Sektor "${topExpenseCat![0]}" sangat mendominasi pengeluaran (${formatRupiah(topExpenseCat![1].expense)}). Lakukan efisiensi pengeluaran pada sektor ini.`
        } else {
          insightRecommendation += `Penambahan beban tersebar di beberapa kategori. Evaluasi ulang batas operasional Anda bulan ini.`
        }
      } else if (incomeTrend < -20) {
        insightRecommendation = `Defisit terjadi terutama karena pemasukan merosot tajam ${Math.abs(incomeTrend).toFixed(1)}% dibanding bulan lalu. Fokuskan strategi pada tagihan kas atau mencari pendanaan baru.`
      } else if (topExpenseIsDominant) {
        insightRecommendation = `Pengeluaran terbesar ada pada kategori "${topExpenseCat![0]}" (${formatRupiah(topExpenseCat![1].expense)}). Segera tekan pengeluaran pada sektor ini untuk mencegah kas terus terkuras.`
      } else {
        insightRecommendation = 'Evaluasi kembali seluruh rencana anggaran bulan depan agar defisit tidak berlanjut.'
      }

    } else if (balance > 0) {
      insightStatus = 'surplus'
      let percentageStr = ''
      if (currentStats.income > 0) {
        const pct = (balance / currentStats.income) * 100
        percentageStr = ` (${pct.toFixed(1)}% margin surplus dari total pemasukan)`
      }
      insightMessage = `Kondisi kas sehat! Organisasi memiliki surplus sebesar ${formatRupiah(balance)}${percentageStr} bulan ini.`
      
      if (incomeTrend < -20) {
         insightRecommendation = `Hati-hati, meski surplus tren pemasukan sedang menurun ${Math.abs(incomeTrend).toFixed(1)}%. Jaga stabilitas pemasukan agar tidak berubah menjadi defisit di bulan depan.`
      } else if (topExpenseIsDominant) {
         insightRecommendation = `Kas tetap surplus, namun kategori "${topExpenseCat![0]}" memakan porsi yang terlalu besar (${formatRupiah(topExpenseCat![1].expense)}). Alokasikan sisa dana dengan bijak.`
      } else {
         insightRecommendation = 'Gunakan surplus ini untuk mendanai Target & Agenda organisasi, atau pertahankan sebagai dana darurat (kas tak terduga).'
      }
      
    } else {
      insightStatus = 'balanced'
      insightMessage = 'Pemasukan dan pengeluaran bulan ini benar-benar seimbang (Break-even).'
      if (currentStats.income === 0 && currentStats.expense === 0) {
         insightStatus = 'neutral'
         insightMessage = 'Organisasi tidak memiliki aktivitas keuangan bulan ini.'
         insightRecommendation = 'Belum ada transaksi yang dicatat sama sekali.'
      } else {
         insightRecommendation = 'Pastikan tidak ada pengeluaran tambahan mendadak yang terlewat untuk dicatat agar kas tidak minus mendadak.'
      }
    }
  }

  const handleGenerateAiInsight = async () => {
    try {
      setAiLoading(true)
      const res = await api.post(`/org-financial/${orgSlug}/ai-insight`, {
        currentStats,
        previousStats,
        balance,
        categoryBreakdown
      })
      setAiInsight(res.data.insight)
    } catch (err) {
      console.error('Failed to generate AI insight:', err)
      toast.error('Gagal menghasilkan AI Insight. Pastikan API key sudah terkonfigurasi.')
    } finally {
      setAiLoading(false)
    }
  }

  const handlePrevMonth = () => {
    const [year, month] = selectedMonthStr.split('-').map(Number)
    let newYear = year
    let newMonth = month - 1
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setSelectedMonthStr(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [year, month] = selectedMonthStr.split('-').map(Number)
    let newYear = year
    let newMonth = month + 1
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setSelectedMonthStr(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  const getMonthName = (dateStr: string) => {
    const [y, m] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link 
              href={`/org/${orgSlug}/financial`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Keuangan
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              Analisis Keuangan Bulanan
            </h1>
          </div>

          <div className="flex items-center bg-slate-100 rounded-xl p-1 w-full md:w-auto shadow-inner">
            <button 
              onClick={handlePrevMonth}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 md:w-48 text-center font-bold text-sm text-slate-800">
              {getMonthName(selectedMonthStr)}
            </div>
            <button 
              onClick={handleNextMonth}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 mt-4">
        
        {/* Trend Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Income Comparison */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">
                  Uang Masuk (Debet)
                </span>
                <span className="text-3xl font-extrabold text-slate-900 block">
                  {formatRupiah(currentStats.income)}
                </span>
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${incomeTrend >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {incomeTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${incomeTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {incomeTrend > 0 ? '+' : ''}{incomeTrend.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">vs {formatRupiah(previousStats.income)} bln lalu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Comparison */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">
                  Uang Keluar (Kredit)
                </span>
                <span className="text-3xl font-extrabold text-slate-900 block">
                  {formatRupiah(currentStats.expense)}
                </span>
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${expenseTrend <= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {expenseTrend <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${expenseTrend <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {expenseTrend > 0 ? '+' : ''}{expenseTrend.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">vs {formatRupiah(previousStats.expense)} bln lalu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        {insightStatus !== 'neutral' && (
          <div className={`p-5 md:p-6 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm ${
            insightStatus === 'deficit' ? 'bg-rose-50 border-rose-200' : 
            insightStatus === 'surplus' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`p-3 rounded-full shrink-0 ${
              insightStatus === 'deficit' ? 'bg-rose-100 text-rose-600' : 
              insightStatus === 'surplus' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Activity className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg md:text-xl ${
                insightStatus === 'deficit' ? 'text-rose-900' : 
                insightStatus === 'surplus' ? 'text-emerald-900' : 'text-blue-900'
              }`}>
                {insightStatus === 'deficit' ? 'Peringatan Defisit Kas!' : 
                 insightStatus === 'surplus' ? 'Surplus Anggaran' : 'Analisis Imbang'}
              </h3>
              <p className={`text-sm md:text-base mt-1 font-medium ${
                insightStatus === 'deficit' ? 'text-rose-700' : 
                insightStatus === 'surplus' ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                {insightMessage}
              </p>
              
              <div className={`mt-4 p-4 md:p-5 rounded-2xl text-sm border shadow-inner relative overflow-hidden transition-all duration-500 ${
                insightStatus === 'deficit' ? 'bg-white border-rose-100' : 
                insightStatus === 'surplus' ? 'bg-white border-emerald-100' : 'bg-white border-blue-100'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-slate-700">Rekomendasi AI</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Beta</span>
                  </div>
                  
                  {aiLoading ? (
                    <div className="flex items-center gap-3 text-slate-500 py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span className="font-medium">Gemini sedang menganalisis data keuangan bulan ini...</span>
                    </div>
                  ) : aiInsight ? (
                    <div className="text-slate-800 leading-relaxed font-medium">
                      {aiInsight}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-slate-600">
                        {insightRecommendation}
                      </div>
                      <button
                        onClick={handleGenerateAiInsight}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" />
                        Tanya Gemini AI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Category Breakdown */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-500" />
                  Rincian Kategori
                </h3>
              </div>
              <div className="p-5">
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Tidak ada transaksi bulan ini.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {categoryBreakdown.map(([category, stats]) => {
                      const totalActivity = stats.income + stats.expense
                      const maxActivity = Math.max(...categoryBreakdown.map(c => c[1].income + c[1].expense))
                      const percentage = (totalActivity / maxActivity) * 100

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-700">{category}</span>
                          </div>
                          
                          {stats.income > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-emerald-600 font-medium">Pemasukan</span>
                              <span className="font-bold text-emerald-700">{formatRupiah(stats.income)}</span>
                            </div>
                          )}
                          
                          {stats.expense > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-rose-600 font-medium">Pengeluaran</span>
                              <span className="font-bold text-rose-700">{formatRupiah(stats.expense)}</span>
                            </div>
                          )}

                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                            {stats.income > 0 && (
                              <div 
                                className="bg-emerald-400 h-full rounded-l-full" 
                                style={{ width: `${(stats.income / totalActivity) * percentage}%` }}
                              ></div>
                            )}
                            {stats.expense > 0 && (
                              <div 
                                className="bg-rose-400 h-full rounded-r-full" 
                                style={{ width: `${(stats.expense / totalActivity) * percentage}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Aktivitas Bulan {getMonthName(selectedMonthStr)}
                </h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
                  {monthlyRecords.length} Transaksi
                </span>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {monthlyRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Belum ada transaksi di bulan ini.
                  </div>
                ) : (
                  monthlyRecords.map(record => (
                    <div key={record.id} className="p-4 md:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 md:gap-4 overflow-hidden">
                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                          record.type === 'income' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-rose-100 text-rose-600'
                        }`}>
                          {record.type === 'income' ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm md:text-base font-bold text-slate-900 truncate">
                            {record.description || record.category}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              {record.category}
                            </span>
                            <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                              {new Date(record.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`text-sm md:text-base font-extrabold whitespace-nowrap shrink-0 ${
                        record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {record.type === 'income' ? '+' : '-'}{formatRupiah(record.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
