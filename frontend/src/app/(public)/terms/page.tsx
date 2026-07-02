'use client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in fade-in duration-300">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold">Terms of Use</h1>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Ketentuan Penggunaan (Terms of Use)</h2>
        <p className="text-slate-500 font-medium">Terakhir diperbarui: 25 Juni 2026</p>
        
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            Selamat datang di KitaAtur! Dengan mengakses atau menggunakan platform kami, Anda setuju untuk terikat dengan Ketentuan Penggunaan ini.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">1. Penggunaan Layanan</h3>
          <p>
            Anda setuju untuk menggunakan layanan KitaAtur secara bertanggung jawab dan mematuhi semua hukum dan peraturan yang berlaku di yurisdiksi Anda. 
            Anda tidak diperkenankan menyalahgunakan layanan untuk tindakan ilegal atau penipuan finansial.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">2. Akun dan Keamanan</h3>
          <p>
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan kredensial akun Anda. KitaAtur tidak bertanggung jawab atas kehilangan atau kerusakan yang timbul dari kegagalan Anda menjaga keamanan akun.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">3. Pembatasan Tanggung Jawab</h3>
          <p>
            Layanan disediakan "sebagaimana adanya". Kami tidak menjamin layanan akan selalu bebas gangguan, tepat waktu, atau bebas error.
          </p>
        </div>
      </main>
    </div>
  )
}
