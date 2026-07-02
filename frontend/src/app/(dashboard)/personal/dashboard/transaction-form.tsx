'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { ImagePlus, X } from 'lucide-react'
import { CustomUpload } from '@/components/ui/CustomUpload'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface TransactionFormProps {
  onSuccess: () => void
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('Makanan')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const categories = type === 'income' 
    ? ['Gaji', 'Investasi', 'Freelance', 'Hibah', 'Lain-lain']
    : ['Makanan', 'Transportasi', 'Belanja', 'Utilitas', 'Kesehatan', 'Pendidikan', 'Lain-lain']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (!amount || Number(amount) <= 0) {
      setError('Masukkan nominal transaksi yang valid')
      setLoading(false)
      return
    }

    try {
      await api.post('/personal/transaction', {
        amount: parseFloat(amount),
        type,
        category,
        description,
        transaction_date: date,
        receipt_url: receiptUrl
      })

      setSuccessMsg('Transaksi berhasil dicatat!')
      setAmount('')
      setDescription('')
      setReceiptUrl(null)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan transaksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-5">Catat Transaksi Baru</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Gaji') }}
              className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Makanan') }}
              className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                type === 'expense'
                  ? 'bg-rose-50 border-rose-500 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Nominal (Rupiah)
          </label>
          <input
            id="amount"
            type="number"
            required
            placeholder="Contoh: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              Kategori
            </label>
            <div className="space-y-2">
              <CustomSelect
                value={category}
                onChange={(value) => setCategory(value)}
                options={categories.map(cat => ({ label: cat, value: cat }))}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              Tanggal
            </label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Keterangan (Opsional)
          </label>
          <input
            id="description"
            type="text"
            placeholder="Beli kopi, jajan sore, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Bukti Transaksi (Opsional)
          </label>
          {receiptUrl ? (
            <div className="relative inline-block mt-2">
              <img src={receiptUrl} alt="Bukti Transaksi" className="h-24 w-auto rounded-xl border border-slate-200 shadow-sm object-cover" />
              <button
                type="button"
                onClick={() => setReceiptUrl(null)}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <CustomUpload 
              onUpload={(url) => setReceiptUrl(url)}
              label="Unggah Bukti Transaksi"
            />
          )}
        </div>

        {error && (
          <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-xl transition-all duration-300"
        >
          {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </div>
  )
}
