'use client'
import toast from 'react-hot-toast'


import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlusCircle } from 'lucide-react'

export default function CreatePersonalTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.post('/personal/transaction', {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        transaction_date: formData.transaction_date
      })
      toast.success('Transaksi berhasil dicatat!')
      router.push('/personal/wallet')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 shadow-lg rounded-3xl p-8 relative z-10">
        <Link href="/personal/wallet" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" />
          Batal & Kembali
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-8">
          <PlusCircle className="h-6 w-6 text-blue-600" />
          Catat Transaksi Personal
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`py-3 px-4 rounded-xl font-bold border transition-all ${
                formData.type === 'income' 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`py-3 px-4 rounded-xl font-bold border transition-all ${
                formData.type === 'expense' 
                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nominal (Rp)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="Contoh: 50000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kategori</label>
            <input
              type="text"
              required
              placeholder="Misal: Makanan, Gaji, Transportasi"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tanggal</label>
            <input
              type="date"
              required
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
            <textarea
              placeholder="Deskripsi singkat transaksi..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 font-medium px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  )
}
