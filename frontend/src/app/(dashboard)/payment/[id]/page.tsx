'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function PaymentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await api.get(`/subscription/${id}`)
        setSub(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSub()
  }, [id])

  useEffect(() => {
    if (!sub || sub.status !== 'unpaid' || !sub.expires_at) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(sub.expires_at).getTime()
      const distance = expiry - now

      if (distance < 0) {
        setTimeLeft('Kedaluwarsa')
        clearInterval(interval)
        return
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [sub])
  if (loading) {
    return <div className="p-10 text-center text-slate-500">Memuat tagihan...</div>
  }

  if (!sub) {
    return <div className="p-10 text-center text-red-500">Tagihan tidak ditemukan.</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-12 p-6">
      <div className="w-full max-w-md">
        <Link href="/personal/settings/subscription" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pengaturan
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-1">Tagihan Langganan</h2>
            <p className="text-slate-400 text-sm">Order ID: {sub.pakasir_subscription_id}</p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-500 text-sm">Status</span>
              {sub.status === 'unpaid' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                </span>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Paket</span>
                <span className="font-medium text-slate-900 capitalize">{sub.plan_type.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Harga</span>
                <span className="font-bold text-slate-900 text-lg">Rp {Number(sub.amount_paid).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {sub.status === 'unpaid' && sub.payment_url && (
              <div className="flex flex-col items-center w-full">
                {sub.payment_url.startsWith('http') ? (
                  <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-6 flex flex-col">
                    <iframe 
                      src={sub.payment_url} 
                      className="w-full h-[600px] border-none"
                      title="Pembayaran Pakasir"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm flex flex-col items-center">
                    <QRCodeSVG value={sub.payment_url} size={200} />
                    <p className="text-slate-500 text-sm mt-4 text-center">Scan QRIS ini menggunakan aplikasi M-Banking atau E-Wallet Anda</p>
                  </div>
                )}
                
                {timeLeft && (
                  <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Sisa Waktu Pembayaran</span>
                    <span className="text-2xl font-black text-blue-700 tracking-widest">{timeLeft}</span>
                  </div>
                )}
                
                <p className="text-xs text-slate-400 text-center px-4 leading-relaxed">
                  Catatan: Tergantung pada metode pembayaran yang Anda pilih, mungkin terdapat tambahan biaya layanan dari pihak payment gateway.
                </p>
              </div>
            )}
            
            {sub.status === 'active' && (
              <Link 
                href="/personal/dashboard" 
                className="flex items-center justify-center w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Mulai Menggunakan KitaAtur
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
