'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Ticket, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  Copy, 
  Calendar, 
  Users, 
  Percent, 
  Tag, 
  X, 
  Loader2, 
  Power,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface Voucher {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_amount: number | null
  min_purchase_amount: number
  applicable_plans: string | null
  usage_limit: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const confirm = useConfirm()

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [formDiscountValue, setFormDiscountValue] = useState<number | ''>(20)
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>('')
  const [formMinPurchase, setFormMinPurchase] = useState<number | ''>(0)
  const [formApplicablePlans, setFormApplicablePlans] = useState('all')
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/vouchers')
      setVouchers(res.data || [])
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memuat daftar voucher.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Kode ${code} berhasil disalin!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const openCreateModal = () => {
    setEditingVoucher(null)
    setFormCode('')
    setFormDescription('')
    setFormDiscountType('percentage')
    setFormDiscountValue(20)
    setFormMaxDiscount('')
    setFormMinPurchase(0)
    setFormApplicablePlans('all')
    setFormUsageLimit('')
    setFormExpiresAt('')
    setFormIsActive(true)
    setModalOpen(true)
  }

  const openEditModal = (v: Voucher) => {
    setEditingVoucher(v)
    setFormCode(v.code)
    setFormDescription(v.description || '')
    setFormDiscountType(v.discount_type)
    setFormDiscountValue(v.discount_value)
    setFormMaxDiscount(v.max_discount_amount !== null ? v.max_discount_amount : '')
    setFormMinPurchase(v.min_purchase_amount || 0)
    setFormApplicablePlans(v.applicable_plans || 'all')
    setFormUsageLimit(v.usage_limit !== null ? v.usage_limit : '')
    setFormExpiresAt(v.expires_at ? v.expires_at.slice(0, 16) : '')
    setFormIsActive(v.is_active)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCode.trim()) {
      return toast.error('Kode voucher wajib diisi.')
    }
    if (formDiscountValue === '' || Number(formDiscountValue) <= 0) {
      return toast.error('Nilai diskon harus lebih besar dari 0.')
    }

    setSubmitting(true)
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || null,
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        max_discount_amount: formMaxDiscount !== '' ? Number(formMaxDiscount) : null,
        min_purchase_amount: formMinPurchase !== '' ? Number(formMinPurchase) : 0,
        applicable_plans: formApplicablePlans.trim() || 'all',
        usage_limit: formUsageLimit !== '' ? Number(formUsageLimit) : null,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        is_active: formIsActive
      }

      if (editingVoucher) {
        await api.put(`/admin/vouchers/${editingVoucher.id}`, payload)
        toast.success('Voucher berhasil diperbarui!')
      } else {
        await api.post('/admin/vouchers', payload)
        toast.success('Voucher baru berhasil dibuat!')
      }

      setModalOpen(false)
      fetchVouchers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan voucher.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (v: Voucher) => {
    try {
      const newStatus = !v.is_active
      await api.put(`/admin/vouchers/${v.id}`, { is_active: newStatus })
      toast.success(`Voucher ${v.code} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
      setVouchers(prev => prev.map(item => item.id === v.id ? { ...item, is_active: newStatus } : item))
    } catch (err: any) {
      toast.error('Gagal mengubah status voucher.')
    }
  }

  const handleDelete = async (v: Voucher) => {
    const isConfirmed = await confirm({
      title: 'Hapus Voucher',
      message: `Apakah Anda yakin ingin menghapus voucher "${v.code}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Voucher',
      variant: 'danger'
    })

    if (!isConfirmed) return

    try {
      await api.delete(`/admin/vouchers/${v.id}`)
      toast.success(`Voucher ${v.code} berhasil dihapus.`)
      setVouchers(prev => prev.filter(item => item.id !== v.id))
    } catch (err: any) {
      toast.error('Gagal menghapus voucher.')
    }
  }

  const filteredVouchers = vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(search.toLowerCase()) || 
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
    
    if (statusFilter === 'active') return matchSearch && v.is_active
    if (statusFilter === 'inactive') return matchSearch && !v.is_active
    return matchSearch
  })

  const totalActive = vouchers.filter(v => v.is_active).length
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.used_count || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F4FE] text-[#007AE6] flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Manajemen Voucher & Diskon
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kelola kode promo dan kupon potongan harga untuk pembayaran langganan pengguna.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0087FF] hover:bg-[#0077E6] text-white text-sm font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Voucher Baru</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Voucher</span>
            <span className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{vouchers.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Kode kupon terdaftar di sistem</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Voucher Aktif</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{totalActive}</div>
          <p className="text-[11px] text-slate-400 mt-1">Siap digunakan saat checkout</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#007AE6]">Total Digunakan</span>
            <span className="p-2 bg-[#E0F4FE] text-[#007AE6] rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-[#007AE6]">{totalUsed}x</div>
          <p className="text-[11px] text-slate-400 mt-1">Kali klaim potongan harga</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({vouchers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aktif ({totalActive})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'inactive'
                ? 'bg-slate-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Nonaktif ({vouchers.length - totalActive})
          </button>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0087FF] mb-3" />
            <span className="text-xs font-medium">Memuat data voucher...</span>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada voucher ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
              {search ? 'Tidak ada voucher yang cocok dengan pencarian Anda.' : 'Belum ada voucher diskon yang dibuat di panel admin.'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#0087FF] hover:bg-[#0077E6] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Buat Voucher Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                <tr>
                  <th className="px-5 py-4">Kode Voucher</th>
                  <th className="px-5 py-4">Besaran Diskon</th>
                  <th className="px-5 py-4">Paket & Ketentuan</th>
                  <th className="px-5 py-4">Penggunaan</th>
                  <th className="px-5 py-4">Masa Berlaku</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => {
                  const isExpired = v.expires_at && new Date(v.expires_at) < new Date()
                  const isExhausted = v.usage_limit !== null && v.used_count >= v.usage_limit

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code & Description */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg tracking-wider text-xs select-all">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                            title="Salin Kode"
                          >
                            {copiedCode === v.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {v.description && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">
                            {v.description}
                          </div>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {v.discount_type === 'percentage' ? (
                          <div>
                            <span className="text-emerald-600 font-bold text-sm">Diskon {v.discount_value}%</span>
                            {v.max_discount_amount && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                Maks. Rp {v.max_discount_amount.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold text-sm">
                            Potongan Rp {v.discount_value.toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      {/* Plan & Min Purchase */}
                      <td className="px-5 py-4 text-slate-600">
                        <div className="font-medium text-xs text-slate-800">
                          {v.applicable_plans === 'all' ? 'Semua Paket' : v.applicable_plans?.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Min. Beli: Rp {(v.min_purchase_amount || 0).toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            {v.used_count}
                          </span>
                          <span className="text-slate-400 text-xs">
                            / {v.usage_limit ? `${v.usage_limit} kuota` : 'Unlimited'}
                          </span>
                        </div>
                        {isExhausted && (
                          <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5">
                            Kuota Habis
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4 text-xs">
                        {v.expires_at ? (
                          <div>
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                              {new Date(v.expires_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            {isExpired && (
                              <div className="text-[10px] text-rose-500 font-medium">Kedaluwarsa</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Tanpa Kedaluwarsa</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(v)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            v.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${v.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{v.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 text-slate-500 hover:text-[#0087FF] hover:bg-blue-50 rounded-lg transition"
                            title="Edit Voucher"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Voucher */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E0F4FE] text-[#007AE6] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingVoucher ? 'Edit Voucher Diskon' : 'Buat Voucher Diskon Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Tentukan besaran potongan dan syarat penggunaan.</p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Kode Voucher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode Voucher <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: HEMAT50, RAMADHAN20"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white uppercase"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan Promo
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Potongan khusus launching 20%"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                />
              </div>

              {/* Tipe & Nilai Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Diskon
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e: any) => setFormDiscountType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Potongan Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nilai Diskon <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max={formDiscountType === 'percentage' ? 100 : 10000000}
                      placeholder={formDiscountType === 'percentage' ? '20' : '25000'}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formDiscountType === 'percentage' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Maks Diskon (Jika persentase) & Min Pembelian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formDiscountType === 'percentage' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Maks. Diskon (Opsional)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Min. Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Tanpa minimal"
                    value={formMinPurchase}
                    onChange={(e) => setFormMinPurchase(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                  />
                </div>
              </div>

              {/* Paket yang Berlaku & Kuota Pemakaian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Paket yang Berlaku
                  </label>
                  <select
                    value={formApplicablePlans}
                    onChange={(e) => setFormApplicablePlans(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                  >
                    <option value="all">Semua Paket</option>
                    <option value="plus">Hanya Paket Plus</option>
                    <option value="pro">Hanya Paket School</option>
                    <option value="family">Hanya Paket Family</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Batas Kuota (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100 klaim"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                  />
                </div>
              </div>

              {/* Tanggal Kedaluwarsa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Masa Berlaku Hingga (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0087FF] focus:bg-white"
                />
              </div>

              {/* Status Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Status Voucher Aktif</span>
                  <p className="text-[11px] text-slate-400">Pengguna dapat langsung memasukkan kode ini saat checkout.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0087FF]"></div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[#0087FF] hover:bg-[#0077E6] text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingVoucher ? 'Simpan Perubahan' : 'Buat Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
