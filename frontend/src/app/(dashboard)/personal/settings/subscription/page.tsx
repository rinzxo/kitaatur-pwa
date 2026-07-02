'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Package } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

export default function SubscriptionSettingsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await api.get('/subscription/me')
        setSubs(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSubs()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dasbor
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Riwayat Langganan</h1>

        {loading ? (
          <div className="text-slate-500">Memuat data langganan...</div>
        ) : subs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Belum ada langganan</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Anda belum pernah membuat tagihan atau berlangganan paket apapun.</p>
            <Link href="/upgrade" className="inline-flex px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
              Lihat Paket
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {subs.map(sub => (
                <Link 
                  href={`/payment/${sub.id}`} 
                  key={sub.id}
                  className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900 capitalize">KitaAtur {sub.plan_type.replace('-', ' ')}</span>
                      {sub.status === 'unpaid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Menunggu Pembayaran
                        </span>
                      ) : sub.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          {sub.status}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      Dibuat pada {dayjs(sub.created_at).locale('id').format('DD MMM YYYY HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">Rp {Number(sub.amount_paid).toLocaleString('id-ID')}</span>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
