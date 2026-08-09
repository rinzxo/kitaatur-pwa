'use client'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'
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
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro'>('plus')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const handleSubscribeClick = (plan: 'plus' | 'pro') => {
    if (!userId) return toast.error('Gagal mengambil data user.')
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const confirmSubscription = async () => {
    setLoading(true)
    try {
      const isPro = selectedPlan === 'pro';
      const baseMonthly = isPro ? 110000 : 40000;
      const baseYearly = isPro ? 1100000 : 400000;
      const baseAmount = billingCycle === 'yearly' ? baseYearly : baseMonthly;
      const tax = baseAmount * 0.11;
      const totalAmount = baseAmount + tax;

      const res = await api.post('/payment/checkout', {
        planType: `${selectedPlan}-${billingCycle}`,
        amount: totalAmount,
        userId: userId
      })

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
            Buka akses penuh ke ekosistem KitaAtur. Kelola organisasi, absensi AI, dan transparansi keuangan secara efisien.
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
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Hemat 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          
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
                'Maksimal 100 anggota organisasi',
                'Pemindai Kehadiran QR (Internal)',
                'Akses fitur Validasi Bukti dengan AI',
                'Laporan Absensi & Keuangan Ekspor ke Excel',
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm shadow-md shadow-blue-500/30 disabled:opacity-70"
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
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Semua fitur KitaAtur Plus, ditambah:</span>
              </li>
              {[
                'Anggota organisasi tanpa batas',
                'Portal Publik KitaAtur School',
                'Import Data Massal via Excel (Siswa/Tamu)',
                'Pembuatan PIN Akses Wali Murid',
                'Manajemen Tamu / Siswa Lanjutan',
                'Analitik Kehadiran Real-time'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
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
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Paket KitaAtur {selectedPlan === 'pro' ? 'School' : 'Plus'} ({billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'})</span>
                  <span className="font-medium text-slate-900">
                    Rp {selectedPlan === 'pro' ? (billingCycle === 'monthly' ? '110.000' : '1.100.000') : (billingCycle === 'monthly' ? '40.000' : '400.000')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%)</span>
                  <span className="font-medium text-slate-900">
                    Rp {selectedPlan === 'pro' ? (billingCycle === 'monthly' ? '12.100' : '121.000') : (billingCycle === 'monthly' ? '4.400' : '44.000')}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Pembayaran</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {selectedPlan === 'pro' ? (billingCycle === 'monthly' ? '122.100' : '1.221.000') : (billingCycle === 'monthly' ? '44.400' : '444.000')}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg mb-6 leading-relaxed">
                Anda akan dialihkan ke payment gateway aman (Pakasir) untuk menyelesaikan pembayaran.
              </div>

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
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? 'Memproses...' : 'Lanjut Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
