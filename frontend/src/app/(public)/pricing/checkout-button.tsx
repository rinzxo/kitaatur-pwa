'use client'
import toast from 'react-hot-toast'


import { useState } from 'react'
import { supabase } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface CheckoutButtonProps {
  planType: string
  amount: number
}

export default function CheckoutButton({ planType, amount }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const handleCheckout = async () => {
    setLoading(true)
    
    // 1. Dapatkan user session saat ini
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Jika belum login, redirect ke halaman login dengan query callback
      router.push('/login?redirect=/pricing')
      return
    }

    try {
      // 2. Memanggil Backend API untuk membuat sesi pembayaran Pakasir yang nyata
      const response = await fetch(`${backendUrl}/api/payment/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType,
          amount,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat sesi pembayaran')
      }

      // 3. Menampilkan log untuk developer jika ingin mengetes simulasi webhook lokal
      console.log(`[Webhook Tester] Anda bisa kirim POST ke http://localhost:5000/api/webhooks/pakasir dengan payload:
      {
        "event": "payment.success",
        "data": {
          "user_id": "${user.id}",
          "subscription_id": "${data.orderId}",
          "plan": "${planType}",
          "amount": ${amount}
        }
      }`)

      toast.success('Mengarahkan ke Payment Gateway Pakasir.com...')
      // 4. Redirect ke URL Checkout resmi dari Pakasir
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('Error initiating checkout:', err)
      toast.error('Gagal memulai transaksi pembayaran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Mempersiapkan Pembayaran...
        </>
      ) : (
        "Pilih Paket Premium"
      )}
    </button>
  )
}
