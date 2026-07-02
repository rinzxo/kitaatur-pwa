'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, Target, PlusCircle, CheckCircle } from 'lucide-react'

interface Goal {
  id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  deadline: string | null
  status: 'active' | 'completed' | 'failed'
}

export default function PersonalTargetsPage() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get('/personal/goals')
        setGoals(res.data)
      } catch (err) {
        console.error('Failed to fetch personal goals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGoals()
  }, [])

  const handleAddProgress = async (goalId: string) => {
    const amount = Number(addAmounts[goalId])
    if (!amount || amount <= 0) return

    setUpdating(goalId)
    try {
      await api.patch(`/personal/goals/${goalId}/progress`, { amount_to_add: amount })
      
      // Refresh data
      const res = await api.get('/personal/goals')
      setGoals(res.data)
      setAddAmounts(prev => ({ ...prev, [goalId]: '' }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menambah progress')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-bold">Memuat target impian Anda...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <header className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-purple-600" />
            Target Finansial
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Lacak pencapaian dan wujudkan impian finansial Anda.</p>
        </div>
        <Link 
          href="/personal/targets/create"
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5" />
          Buat Target Baru
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto">
        {goals.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Target</h3>
            <p className="text-slate-500 mb-6">Mulai rencanakan masa depan Anda dengan menetapkan target tabungan baru!</p>
            <Link 
              href="/personal/targets/create"
              className="inline-block px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Mulai Buat Target Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              
              return (
                <div key={goal.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                      {progress >= 100 && (
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="text-slate-500">Terkumpul</span>
                      <span className="text-purple-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Total Tabungan</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(goal.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium mb-1">Target Nominal</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(goal.target_amount)}</p>
                      </div>
                    </div>
                    
                    {progress < 100 && (
                      <div className="mt-6 pt-6 border-t border-slate-100 flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Tambah Nominal..."
                          value={addAmounts[goal.id] || ''}
                          onChange={(e) => setAddAmounts({ ...addAmounts, [goal.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleAddProgress(goal.id)}
                          disabled={updating === goal.id || !addAmounts[goal.id]}
                          className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {updating === goal.id ? 'Menyimpan...' : 'Tambah'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
