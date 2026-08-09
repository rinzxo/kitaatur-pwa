'use client'
import { useState } from 'react'
import Link from 'next/link'
import CheckoutButton from './checkout-button'
import { Check, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
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
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm mb-8">
            Mulai kelola kas keuangan pribadi secara gratis, atau buka akses fitur organisasi penuh dengan paket premium.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center">
            <div className="bg-slate-100 p-1.5 rounded-full flex items-center relative">
              <button 
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tahunan
                <span className={`${isYearly ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors`}>Hemat 17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl mx-auto">
          
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

            <CheckoutButton planType="free" amount={0} />
          </div>

          {/* PLUS PLAN */}
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative transform lg:-translate-y-4">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
              Paling Direkomendasikan
            </span>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">KitaAtur Plus</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium min-h-[32px]">Solusi lengkap untuk manajemen organisasi komunitas.</p>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-3xl font-extrabold text-slate-900 leading-none whitespace-nowrap tracking-tight">
                    {isYearly ? "Rp 400.000" : "Rp 40.000"}
                  </span>
                  <span className="text-slate-500 text-sm font-bold whitespace-nowrap">
                    / {isYearly ? "tahun" : "bulan"}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 font-medium">
                {[
                  "Buat dan kelola 1 Organisasi Penuh",
                  "Maksimal 100 anggota organisasi",
                  "Pemindai Kehadiran QR (Internal)",
                  "Akses fitur Validasi Bukti dengan AI",
                  "Laporan Absensi & Keuangan Ekspor ke Excel",
                  "Prioritas Layanan Support",
                  "Keamanan Data Tingkat Lanjut"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                    <Check className="h-5 w-5 text-slate-300 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <CheckoutButton planType={isYearly ? "plus-yearly" : "plus-monthly"} amount={isYearly ? 400000 : 40000} />
          </div>

          {/* PRO PLAN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">KitaAtur School</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium min-h-[32px]">Fitur premium tanpa batas khusus untuk sekolah & institusi.</p>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-3xl font-extrabold text-slate-900 leading-none whitespace-nowrap tracking-tight">
                    {isYearly ? "Rp 1.100.000" : "Rp 110.000"}
                  </span>
                  <span className="text-slate-500 text-sm font-bold whitespace-nowrap">
                    / {isYearly ? "tahun" : "bulan"}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 font-medium">
                <li className="flex items-start gap-3 text-slate-900 text-sm font-bold">
                  <Check className="h-5 w-5 text-blue-600 shrink-0" />
                  <span>Semua fitur KitaAtur Plus, ditambah:</span>
                </li>
                {[
                  "Anggota organisasi tanpa batas",
                  "Portal Publik KitaAtur School",
                  "Import Data Massal via Excel (Siswa/Tamu)",
                  "Pembuatan PIN Akses Wali Murid",
                  "Manajemen Tamu / Siswa Lanjutan",
                  "Analitik Kehadiran Real-time"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <CheckoutButton planType={isYearly ? "pro-yearly" : "pro-monthly"} amount={isYearly ? 1100000 : 110000} />
          </div>

          {/* ENTERPRISE PLAN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">KitaAtur Enterprise</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium min-h-[32px]">Untuk skala besar dengan kebutuhan integrasi sistem kustom.</p>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Hubungi Kami</span>
              </div>

              <ul className="space-y-4 mb-8 font-medium">
                {[
                  "Buat lebih dari 1 Organisasi",
                  "White-label & Penyesuaian Fitur (Custom)",
                  "Dedicated Account Manager",
                  "Integrasi API Spesifik",
                  "Pelatihan Penggunaan Platform",
                  "SLA Uptime 99.9%"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                    <Check className="h-5 w-5 text-slate-300 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="https://wa.me/6281234567890?text=Halo%20Tim%20KitaAtur,%20saya%20tertarik%20dengan%20paket%20Enterprise" 
              target="_blank"
              className="w-full py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-center shadow-sm transition-all duration-300 block"
            >
              Hubungi Tim Sales
            </Link>
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
