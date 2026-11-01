'use client'
import Link from 'next/link'
import { ArrowLeft, Check, X, Ticket, Tag, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, supabase } from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro' | 'family'>('plus')

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState<{
    valid: boolean
    voucher: any
    originalAmount: number
    discountAmount: number
    finalAmount: number
    isFree: boolean
  } | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const isFamily = selectedPlan === 'family'
  const isPro = selectedPlan === 'pro'
  const baseMonthly = isFamily ? 250000 : (isPro ? 110000 : 40000)
  const baseYearly = isFamily ? 2500000 : (isPro ? 1100000 : 400000)
  const baseAmount = billingCycle === 'yearly' ? baseYearly : baseMonthly
  const tax = baseAmount * 0.11
  const subtotalWithTax = baseAmount + tax

  const handleSubscribeClick = (plan: 'plus' | 'pro' | 'family') => {
    if (!userId) return toast.error('Gagal mengambil data user.')
    setSelectedPlan(plan)
    setAppliedVoucher(null)
    setVoucherCodeInput('')
    setVoucherError(null)
    setShowModal(true)
  }

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Masukkan kode voucher terlebih dahulu')
      return
    }

    setVoucherLoading(true)
    setVoucherError(null)

    try {
      const res = await api.post('/payment/validate-voucher', {
        code: voucherCodeInput.trim(),
        planType: `${selectedPlan}-${billingCycle}`,
        baseAmount: subtotalWithTax
      })

      setAppliedVoucher(res.data)
      toast.success(`Voucher "${res.data.voucher.code}" berhasil diterapkan! Potongan Rp ${Number(res.data.discountAmount).toLocaleString('id-ID')}`)
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Kode voucher tidak valid atau sudah kedaluwarsa'
      setVoucherError(msg)
      toast.error(msg)
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput('')
    setVoucherError(null)
  }

  const confirmSubscription = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payment/checkout', {
        planType: `${selectedPlan}-${billingCycle}`,
        amount: subtotalWithTax,
        userId: userId,
        voucherCode: appliedVoucher?.voucher?.code || undefined
      })

      if (res.data.isFree) {
        toast.success(res.data.message || 'Langganan berhasil diaktifkan dengan voucher!')
        setShowModal(false)
        router.push('/personal/dashboard')
        return
      }

      if (res.data.subscriptionId) {
        toast.success('Tagihan berhasil dibuat!')
        router.push(`/payment/${res.data.subscriptionId}`)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Gagal membuat tagihan pembayaran')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col p-6 md:p-10">
      
      {/* Back Button */}
      <div className="max-w-5xl mx-auto w-full mb-8 pt-4">
        <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-500">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-900">
            Tingkatkan ke Premium
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-8">
            Buka akses penuh ke ekosistem KitaAtur. Kelola organisasi, presensi AI, dan transparansi keuangan secara efisien.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tahunan
              <span className="bg-[#E0F4FE] text-[#007AE6] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">Hemat 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start max-w-7xl mx-auto">
          
          {/* Card: KitaAtur Plus */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">KitaAtur Plus</h3>
            </div>
            
            <div className="mb-8">
              {billingCycle === 'yearly' && (
                <div className="text-slate-400 line-through text-sm font-medium mb-1">Rp 480.000 / tahun</div>
              )}
              <span className="text-3xl font-bold text-slate-900">
                {billingCycle === 'monthly' ? 'Rp 40.000' : 'Rp 400.000'}
              </span>
              <span className="text-slate-500"> {billingCycle === 'monthly' ? '/ bulan' : '/ tahun'}</span>
            </div>

            <ul className="space-y-4 mb-10 text-sm">
              {[
                'Buat dan kelola 1 Organisasi Penuh',
                'Anggota organisasi tanpa batas (Unlimited)',
                'Pemindai Kehadiran QR (Internal)',
                'Akses fitur Validasi Bukti dengan AI',
                'Laporan Presensi & Keuangan Ekspor ke Excel',
                'Prioritas Layanan Support',
                'Keamanan Data Tingkat Lanjut'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSubscribeClick('plus')}
              disabled={loading}
              className="w-full py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl transition-colors text-sm shadow-sm disabled:opacity-70"
            >
              Berlangganan Sekarang
            </button>
          </div>

          {/* Card: KitaAtur Pro (School) */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">KitaAtur School</h3>
            </div>
            
            <div className="mb-8">
              {billingCycle === 'yearly' && (
                <div className="text-slate-400 line-through text-sm font-medium mb-1">Rp 1.320.000 / tahun</div>
              )}
              <span className="text-3xl font-bold text-slate-900">
                {billingCycle === 'monthly' ? 'Rp 110.000' : 'Rp 1.100.000'}
              </span>
              <span className="text-slate-500"> {billingCycle === 'monthly' ? '/ bulan' : '/ tahun'}</span>
            </div>

            <ul className="space-y-4 mb-10 text-sm">
              <li className="flex items-start gap-3 text-slate-900 font-bold">
                <Check className="w-4 h-4 text-[#0087FF] flex-shrink-0 mt-0.5" />
                <span>Semua fitur KitaAtur Plus, ditambah:</span>
              </li>
              {[
                'Portal Publik KitaAtur School (Akses Siswa & Wali)',
                'Import Data Massal via Excel (Siswa/Tamu)',
                'Pembuatan PIN Akses Wali Murid',
                'Manajemen Tamu / Siswa Lanjutan',
                'Analitik Kehadiran Real-time'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-[#0087FF] flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSubscribeClick('pro')}
              disabled={loading}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors text-sm disabled:opacity-70"
            >
              Pilih Paket School
            </button>
          </div>

          {/* Card: KitaAtur Family */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#0087FF] shadow-md relative group hover:shadow-xl transition-all">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0087FF] text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-1 rounded-full shadow-sm whitespace-nowrap">
              Induk & Cabang
            </span>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">KitaAtur Family</h3>
            </div>
            
            <div className="mb-8">
              {billingCycle === 'yearly' && (
                <div className="text-slate-400 line-through text-sm font-medium mb-1">Rp 3.000.000 / tahun</div>
              )}
              <span className="text-3xl font-bold text-slate-900">
                {billingCycle === 'monthly' ? 'Rp 250.000' : 'Rp 2.500.000'}
              </span>
              <span className="text-slate-500"> {billingCycle === 'monthly' ? '/ bulan' : '/ tahun'}</span>
            </div>

            <ul className="space-y-4 mb-10 text-sm">
              <li className="flex items-start gap-3 text-slate-900 font-bold">
                <Check className="w-4 h-4 text-[#0087FF] flex-shrink-0 mt-0.5" />
                <span>1 Induk + Cabang Unlimited</span>
              </li>
              {[
                'Tautkan cabang mandiri dengan Kode Keluarga',
                'Seluruh cabang bebas biaya langganan tambahan',
                'Sesi Presensi Gabungan otomatis lintas cabang',
                'Pemilih Cepat Cabang (Fast Switcher)',
                'Semua fitur KitaAtur School (Anggota unlimited)',
                'Portal Publik & Manajemen Tamu',
                'Laporan & Analitik Konsolidasi'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-[#0087FF] flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSubscribeClick('family')}
              disabled={loading}
              className="w-full py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl transition-colors text-sm shadow-sm disabled:opacity-70"
            >
              Pilih Paket Family
            </button>
          </div>

          {/* Card: KitaAtur Enterprise */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">KitaAtur Enterprise</h3>
            </div>
            
            <div className="mb-8">
              <span className="text-3xl font-bold text-slate-900">Hubungi Kami</span>
            </div>

            <ul className="space-y-4 mb-10 text-sm">
              {[
                'Buat lebih dari 1 Organisasi',
                'White-label & Penyesuaian Fitur (Custom)',
                'Dedicated Account Manager',
                'Integrasi API Spesifik',
                'Pelatihan Penggunaan Platform',
                'SLA Uptime 99.9%'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link 
              href="https://wa.me/6281234567890?text=Halo%20Tim%20KitaAtur,%20saya%20tertarik%20dengan%20paket%20Enterprise" 
              target="_blank"
              className="flex w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-colors text-sm items-center justify-center"
            >
              Hubungi Tim Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Rincian Pembayaran</h3>
              <button onClick={() => !loading && setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Paket KitaAtur {selectedPlan === 'family' ? 'Family' : (selectedPlan === 'pro' ? 'School' : 'Plus')} ({billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'})
                  </span>
                  <span className="font-medium text-slate-900">
                    Rp {Number(baseAmount).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%)</span>
                  <span className="font-medium text-slate-900">
                    Rp {Number(tax).toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2 font-medium">
                  <span>Subtotal</span>
                  <span>Rp {Number(subtotalWithTax).toLocaleString('id-ID')}</span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between items-center text-emerald-600 font-medium bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5" />
                      Diskon Voucher ({appliedVoucher.voucher.code})
                    </span>
                    <span className="font-bold text-sm">
                      - Rp {Number(appliedVoucher.discountAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Pembayaran</span>
                  {appliedVoucher?.isFree ? (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through mr-2">
                        Rp {Number(subtotalWithTax).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xl font-black text-emerald-600 inline-flex items-center gap-1">
                        <Sparkles className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                        GRATIS
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      {appliedVoucher && (
                        <span className="text-xs text-slate-400 line-through mr-2">
                          Rp {Number(subtotalWithTax).toLocaleString('id-ID')}
                        </span>
                      )}
                      <span className="text-xl font-bold text-[#0087FF]">
                        Rp {Number(appliedVoucher ? appliedVoucher.finalAmount : subtotalWithTax).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Voucher Section */}
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#0087FF]" />
                    Punya Kode Voucher?
                  </span>
                  {appliedVoucher && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Tersimpan
                    </span>
                  )}
                </div>

                {!appliedVoucher ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: KITAHEMAT20"
                        value={voucherCodeInput}
                        onChange={(e) => {
                          setVoucherCodeInput(e.target.value.toUpperCase())
                          setVoucherError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyVoucher()
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0087FF] bg-white tracking-wider text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCodeInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        {voucherLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Cek...
                          </>
                        ) : (
                          'Terapkan'
                        )}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-medium">{voucherError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 tracking-wider">
                            {appliedVoucher.voucher.code}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {appliedVoucher.voucher.discount_type === 'percentage' 
                              ? `Diskon ${appliedVoucher.voucher.discount_value}%` 
                              : `Potongan Rp ${Number(appliedVoucher.voucher.discount_value).toLocaleString('id-ID')}`}
                          </span>
                        </div>
                        {appliedVoucher.voucher.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{appliedVoucher.voucher.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus voucher"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {appliedVoucher?.isFree ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3 rounded-lg mb-6 leading-relaxed font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Voucher ini memberikan diskon 100%! Anda tidak perlu membayar, langganan akan langsung diaktifkan sekarang.
                  </span>
                </div>
              ) : (
                <div className="bg-[#E0F4FE] text-[#007AE6] text-xs p-3 rounded-lg mb-6 leading-relaxed font-medium">
                  Anda akan dialihkan ke payment gateway aman (KitaPay) untuk menyelesaikan pembayaran.
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-70"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmSubscription}
                  disabled={loading}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${appliedVoucher?.isFree ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0087FF] hover:bg-[#0077E6]'}`}
                >
                  {loading ? 'Memproses...' : appliedVoucher?.isFree ? 'Aktifkan Sekarang' : 'Lanjut Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
