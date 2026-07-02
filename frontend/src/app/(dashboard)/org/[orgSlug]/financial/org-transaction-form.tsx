'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { ImagePlus, X } from 'lucide-react'
import { CustomUpload } from '@/components/ui/CustomUpload'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface OrgTransactionFormProps {
  orgSlug: string
  onSuccess: () => void
}

export default function OrgTransactionForm({ orgSlug, onSuccess }: OrgTransactionFormProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('Uang Kas / Iuran')
  const [customCategory, setCustomCategory] = useState('')
  const [partyName, setPartyName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const categories = type === 'income'
    ? ['Uang Kas / Iuran', 'Sponsorship', 'Donasi', 'Usaha Mandiri', 'Kategori Lainnya...']
    : ['Operasional', 'Konsumsi', 'Perlengkapan', 'Publikasi', 'Logistik', 'Kategori Lainnya...']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (!amount || Number(amount) <= 0) {
      setError('Masukkan nominal kas yang valid')
      setLoading(false)
      return
    }

    const finalCategory = category === 'Kategori Lainnya...' ? customCategory.trim() : category;

    if (!finalCategory) {
      setError('Masukkan nama kategori yang valid')
      setLoading(false)
      return
    }

    try {
      await api.post(`/org-financial/${orgSlug}`, {
        amount: parseFloat(amount),
        type,
        category: finalCategory,
        description: partyName ? `${partyName} - ${description}` : description,
        transaction_date: date,
        receipt_url: receiptUrl
      })

      setSuccessMsg('Transaksi kas berhasil dicatat!')
      setAmount('')
      setPartyName('')
      setDescription('')
      setCustomCategory('')
      setReceiptUrl(null)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan transaksi kas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Catat Keuangan Baru</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Uang Kas / Iuran') }}
              className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              Uang Masuk (Debet)
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Operasional') }}
              className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                type === 'expense'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              Uang Keluar (Kredit)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            Nominal (Rupiah)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            required
            placeholder="Contoh: 100.000"
            value={amount ? new Intl.NumberFormat('id-ID').format(parseInt(amount, 10)) : ''}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, '')
              setAmount(rawValue)
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Kategori
            </label>
            <div className="space-y-2">
              <CustomSelect
                value={category}
                onChange={(value) => setCategory(value)}
                options={categories.map(cat => ({ label: cat, value: cat }))}
                className="w-full"
              />
              {category === 'Kategori Lainnya...' && (
                <input
                  type="text"
                  placeholder="Ketik kategori baru..."
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              )}
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Tanggal Transaksi
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
          <label htmlFor="partyName" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            {type === 'income' ? 'Terima Dari (Opsional)' : 'Dibayarkan Kepada'}
          </label>
          <input
            id="partyName"
            type="text"
            required={type === 'expense'}
            placeholder={type === 'income' ? 'Nama donatur, dll.' : 'Toko, Vendor, dll.'}
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            Keterangan Kegiatan
          </label>
          <input
            id="description"
            type="text"
            placeholder="Pembelian konsumsi rapat, sponsor acara, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            Bukti Transaksi (Opsional)
          </label>
          {receiptUrl ? (
            <div className="relative inline-block mt-2">
              <img src={receiptUrl} alt="Bukti Transaksi" className="h-24 w-auto rounded-xl border border-slate-200 object-cover shadow-sm" />
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
          <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-400 font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all duration-300"
        >
          {loading ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
        </button>
      </form>
    </div>
  )
}
