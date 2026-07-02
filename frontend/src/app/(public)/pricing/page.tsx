import Link from 'next/link'
import CheckoutButton from './checkout-button'
import { Check, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 relative overflow-hidden flex flex-col justify-between">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-blue-100 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-100 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <div className="max-w-6xl mx-auto w-full mb-12 relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full relative z-10 flex-grow flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <span className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-200 mb-4 inline-block shadow-sm">
            Harga & Paket Layanan
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Pilih Paket yang Sesuai untuk Organisasi Anda
          </h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm">
            Mulai kelola kas keuangan pribadi secara gratis, atau buka akses fitur organisasi penuh dengan paket premium.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* FREE PLAN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Personal (Free)</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium">Cocok untuk pencatatan kas pribadi sehari-hari.</p>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Rp 0</span>
                <span className="text-slate-500 text-sm font-bold"> / selamanya</span>
              </div>

              <ul className="space-y-3.5 mb-8 font-medium">
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Pencatatan pemasukan & pengeluaran personal</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Target keuangan pribadi (Personal Goals)</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400 text-sm line-through">
                  <span>Membuat dan mengelola organisasi</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400 text-sm line-through">
                  <span>Absensi presensi anggota via QR Code</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400 text-sm line-through">
                  <span>Ekspor laporan keuangan ke Excel/CSV</span>
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="w-full py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center transition-all duration-300"
            >
              Mulai Gratis
            </Link>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative">
            {/* Populer tag */}
            <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full shadow-lg">
              Rekomendasi
            </span>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Organisasi (Premium)</h3>
              <p className="text-slate-500 font-medium text-xs mb-6">Solusi lengkap untuk operasional organisasi terintegrasi.</p>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Rp 49.000</span>
                <span className="text-slate-500 text-sm font-bold"> / bulan</span>
              </div>

              <ul className="space-y-3.5 mb-8 font-medium">
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Semua fitur paket Personal (Free)</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span><strong>Hak penuh sebagai Head</strong> untuk membuat organisasi baru</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Sistem absensi dinamis berbasis QR Code scan</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Manajemen struktur organisasi & pembagian role staff</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-700 text-sm">
                  <Check className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Ekspor laporan keuangan bulanan (Excel/CSV)</span>
                </li>
              </ul>
            </div>

            <CheckoutButton planType="premium" amount={49000} />
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-400 font-medium text-xs mt-12 relative z-10">
        &copy; {new Date().getFullYear()} KitaAtur. All rights reserved.
      </footer>
    </div>
  )
}
