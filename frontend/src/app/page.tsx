'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Leaf, 
  QrCode, 
  Wallet, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Globe2,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Download,
  Smartphone,
  Monitor,
  Instagram,
  ChevronDown,
  MessageCircle
} from "lucide-react";

import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [promoUrl, setPromoUrl] = useState('https://kitatur.rinzgroup.web.id/promo/trial');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mockupFlipped, setMockupFlipped] = useState(false);
  const [isMockupHovered, setIsMockupHovered] = useState(false);

  // Auto flip hero mockups back and forth continuously
  useEffect(() => {
    if (isMockupHovered) return;
    const interval = setInterval(() => {
      setMockupFlipped((prev) => !prev);
    }, 3800);
    return () => clearInterval(interval);
  }, [isMockupHovered]);

  const faqs = [
    {
      q: "Apakah KitaAtur benar-benar gratis?",
      a: "Ya! Paket Personal kami 100% gratis selamanya. Anda bisa menggunakannya untuk mencatat kas harian pribadi, memantau riwayat pemasukan/pengeluaran, dan mengatur target keuangan tanpa dikenakan biaya apapun."
    },
    {
      q: "Apa bedanya Paket Plus dan Paket School?",
      a: "Perbedaannya terletak pada peruntukan dan fitur spesial: Paket Plus (Rp 40.000/bulan) ditujukan untuk organisasi komunitas, karang taruna, dan UKM dengan anggota tak terbatas serta presensi QR internal. Sedangkan Paket School (Rp 110.000/bulan) dirancang untuk sekolah & madrasah dengan Portal Siswa publik, impor data siswa massal via Excel, dan verifikasi PIN wali murid."
    },
    {
      q: "Bagaimana sistem Presensi QR bekerja?",
      a: "Setiap anggota memiliki kode QR unik. Untuk menjamin akurasi dan mencegah kecurangan kehadiran, pemindaian hanya dapat dilakukan oleh pengurus berwenang (Ketua, Sekretaris, atau Panitia yang ditunjuk) menggunakan smartphone mereka untuk merekam kehadiran secara instan dan real-time."
    },
    {
      q: "Apakah tersedia aplikasi untuk HP Android dan Laptop?",
      a: "Tentu ada! Selain dapat diakses langsung melalui browser web, KitaAtur juga tersedia dalam format aplikasi mandiri: file APK Android (.apk) untuk presensi cepat di lapangan, serta installer desktop Windows (.exe) untuk pengelolaan kas dan laporan di layar lebar."
    },
    {
      q: "Bagaimana standar keamanan dan privasi data di KitaAtur?",
      a: "Seluruh data keuangan, presensi, dan dokumen organisasi dilindungi menggunakan standar enkripsi perbankan AES-256 bit. Kami juga menerapkan isolasi multi-tenant yang ketat dan pencadangan (backup) otomatis agar privasi data organisasi Anda selalu terjamin."
    },
    {
      q: "Metode pembayaran apa saja yang didukung untuk langganan?",
      a: "Kami mendukung metode pembayaran instan dan resmi melalui QRIS (dapat dibayar dari BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay), Transfer Bank (Virtual Account), dan e-Wallet untuk aktivasi otomatis tanpa konfirmasi manual."
    }
  ];

  // Auto-redirect logged-in users directly to /app
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (user) {
        window.location.href = '/app'
      } else if (error) {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      }
    })
  }, [])

  // Fallback for auth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.has('code')) {
        window.location.href = `/auth/callback${window.location.search}`
      }
      setPromoUrl(`${window.location.origin}/promo/trial`);
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 border border-slate-100">
              <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">KitaAtur</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#fitur" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Fitur Utama</Link>
            <Link href="#keunggulan" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Keunggulan</Link>
            <Link href="#unduh" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Unduh</Link>
            <Link href="#faq" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="/school" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Portal Siswa</Link>
            <Link href="/changelog" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Changelog
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors px-4 py-2">
              Masuk
            </Link>
            <Link href="/register" className="bg-[#0087FF] hover:bg-[#0077E6] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
              Mulai Gratis
            </Link>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-4 pb-6 md:hidden flex flex-col justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-6 text-center">
            <Link href="#fitur" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">Fitur Utama</Link>
            <Link href="#keunggulan" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">Keunggulan</Link>
            <Link href="#unduh" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">Unduh</Link>
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">FAQ</Link>
            <Link href="/school" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">Portal Siswa</Link>
            <Link href="/changelog" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">
              Changelog
            </Link>
          </div>
          <div className="flex flex-col gap-3 mt-8">
            <Link href="/login" className="w-full text-center bg-slate-100 text-slate-800 font-bold py-3.5 rounded-xl">Masuk</Link>
            <Link href="/register" className="w-full text-center bg-[#0087FF] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20">Mulai Gratis</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 inset-x-0 h-full w-full bg-slate-50 -z-10" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl -z-10 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50/80 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 max-w-4xl mx-auto">
            Kelola Organisasi <br className="hidden md:block" />
            <span className="text-shine-glass">Lebih Modern & Praktis</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Tinggalkan kertas. Mulai dari presensi digital yang terintegrasi, pencatatan uang kas transparan, hingga manajemen anggota dalam satu aplikasi yang ramah lingkungan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link href="/register" className="w-full sm:w-auto bg-[#0087FF] hover:bg-[#0077E6] text-white text-base font-bold px-8 py-4 rounded-full shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 group flex items-center justify-center gap-2">
              Mulai Sekarang Gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#fitur" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold px-8 py-4 rounded-full transition-all hover:-translate-y-1">
              Pelajari Fitur
            </Link>
          </div>

          {/* Hero Image/Mockup with Smooth Flip / Swap Animation */}
          <div 
            className="mt-16 md:mt-24 relative mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 flex justify-center items-center h-[500px] md:h-[700px] mb-12 select-none"
            onMouseEnter={() => setIsMockupHovered(true)}
            onMouseLeave={() => setIsMockupHovered(false)}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex justify-center items-center">
              
              {/* Mockup 1: Dasbor Utama */}
              <div 
                onClick={() => setMockupFlipped(!mockupFlipped)}
                className={`absolute left-1/2 cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] w-56 md:w-[380px] ${
                  !mockupFlipped
                    ? '-translate-x-[35%] md:-translate-x-[28%] top-[-5%] md:-top-4 rotate-[6deg] scale-100 md:scale-105 z-20 opacity-100 drop-shadow-[0_25px_35px_rgba(0,0,0,0.22)]'
                    : '-translate-x-[65%] md:-translate-x-[62%] top-[10%] md:top-12 rotate-[-8deg] scale-[0.88] md:scale-[0.85] z-10 opacity-85 brightness-[0.96] drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)]'
                }`}
                title="Klik untuk menukar tampilan mockup"
              >
                <img 
                  src="/images/mockups/KitaAturMockNew (5).png" 
                  alt="KitaAtur Dasbor Utama" 
                  className="w-full h-auto pointer-events-none transition-transform duration-500 hover:scale-[1.02]" 
                />
              </div>
              
              {/* Mockup 2: Kartu Presensi Digital QR */}
              <div 
                onClick={() => setMockupFlipped(!mockupFlipped)}
                className={`absolute left-1/2 cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] w-56 md:w-[380px] ${
                  mockupFlipped
                    ? '-translate-x-[35%] md:-translate-x-[28%] top-[-5%] md:-top-4 rotate-[6deg] scale-100 md:scale-105 z-20 opacity-100 drop-shadow-[0_25px_35px_rgba(0,0,0,0.22)]'
                    : '-translate-x-[65%] md:-translate-x-[62%] top-[10%] md:top-12 rotate-[-8deg] scale-[0.88] md:scale-[0.85] z-10 opacity-85 brightness-[0.96] drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)]'
                }`}
                title="Klik untuk menukar tampilan mockup"
              >
                <img 
                  src="/images/mockups/KitaAturMockNew (6).png" 
                  alt="KitaAtur Kartu Presensi Digital" 
                  className="w-full h-auto pointer-events-none transition-transform duration-500 hover:scale-[1.02]" 
                />
              </div>

              {/* Floating UI Elements */}
              <div className="absolute top-1/4 left-[5%] md:left-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100/50 hidden md:block animate-bounce z-30" style={{animationDuration: '3s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Presensi Berhasil</p>
                    <p className="font-bold text-slate-900">+1 Kehadiran</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 right-[5%] md:right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100/50 hidden md:block animate-bounce z-30" style={{animationDuration: '4s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Kas Organisasi</p>
                    <p className="font-bold text-slate-900">Rp 1.004.000</p>
                  </div>
                </div>
              </div>

              {/* Interactive Flip Dots */}
              <div className="absolute -bottom-6 md:-bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setMockupFlipped(false)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    !mockupFlipped ? 'w-6 bg-[#0087FF]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label="Tampilkan Dasbor Utama"
                />
                <button
                  type="button"
                  onClick={() => setMockupFlipped(true)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    mockupFlipped ? 'w-6 bg-[#0087FF]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label="Tampilkan Kartu Presensi Digital"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* School Partner Social Proof */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
            Sekolah yang Telah Bertransformasi Bersama KitaAtur
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-all shadow-sm">
              <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
                <img 
                  src="/images/partners/sman2babelan.png" 
                  alt="SMA Negeri 2 Babelan" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">SMA Negeri 2 Babelan</h4>
                <p className="text-xs text-slate-500 font-medium">Kabupaten Bekasi • Implementasi Presensi Digital</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="fitur" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2.5">Fitur Lengkap</h2>
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-6 tracking-tight">
              Satu Aplikasi, <br className="hidden sm:inline" />Semua Kebutuhan Organisasi
            </h3>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-xl mx-auto">
              Desain modern yang mudah digunakan, membantu Anda menghemat waktu dan kertas.
            </p>
          </div>

          <div className="flex flex-col gap-24 md:gap-32 pb-12">
            
            {/* Feature 1: Presensi */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50">
                  <ClipboardCheck className="w-8 h-8" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">Presensi Bebas Kertas</h4>
                <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                  Buat sesi kehadiran dan rekam jejak presensi secara digital. Tersedia fitur delegasi (Bantu Presensi) tanpa batasan lokasi untuk memudahkan pencatatan, tanpa perlu buang kertas percuma.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-emerald-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/KitaAturMockNew (2).png" 
                  alt="Kelola dan Validasi Presensi" 
                  className="w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

            {/* Feature 2: Keuangan */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-100/50">
                  <Wallet className="w-8 h-8" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">Manajemen Kas Transparan</h4>
                <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                  Catat pemasukan dan pengeluaran secara digital. Semua anggota bisa memantau saldo, menghindari prasangka, dan membangun kepercayaan.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-blue-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/KitaAturMockNew(8).png" 
                  alt="Manajemen Kas dan Keuangan Organisasi" 
                  className="w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

            {/* Feature 3: Analisis Kehadiran */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-100/50">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">Analisis Cerdas & AI</h4>
                <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                  Dapatkan wawasan mendalam tentang kedisiplinan anggota. Dilengkapi dengan Rapor Kedisiplinan berbasis AI, deteksi dini pola kehadiran, dan klasemen otomatis untuk memotivasi organisasi Anda.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-indigo-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/KitaAturMockNew(7).png" 
                  alt="Analisis Kehadiran dan Rapor AI" 
                  className="w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

          </div>

          {/* Feature 4: Biar Kita Yang Atur Banner */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 border-2 sm:border-4 border-white shadow-xl shadow-blue-500/15 relative overflow-hidden text-white flex flex-col justify-center items-center text-center group">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik01NC42MjcgMTEuMzhBNDEuODYgNDEuODYgMCAwIDAgNDEuMzggMjguMjNhNDEuODYgNDEuODYgMCAwIDAgMTMuMjQ3IDE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAgMTMuMjQ3LTE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAtMTMuMjQ3LTE2Ljg1eiIgZmlsbD0iIzEwYjliMSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-20 mix-blend-overlay" />
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/20 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 max-w-xl px-2">
              <h4 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 leading-snug tracking-tight">
                Biar Kita Yang Atur!
              </h4>
              <p className="text-blue-50 font-normal text-xs sm:text-sm md:text-base leading-relaxed mx-auto">
                Anda fokus capai tujuan organisasi. Urusan administrasi, presensi, dan keuangan, biar sistem otomatis kami yang selesaikan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition / Details */}
      <section id="keunggulan" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-blue-200/50 rounded-3xl transform rotate-3 scale-105 -z-10" />
              <img 
                src="/images/mockups/KitaAturMockNew (4).png" 
                alt="Akses Cepat dan Fleksibel" 
                className="w-56 sm:w-72 md:w-80 mx-auto h-auto drop-shadow-2xl"
              />
              
              {/* Floating Stat */}
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Efisiensi Waktu</p>
                  <p className="text-2xl font-black text-slate-900">+80%</p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-6 tracking-tight">
                Fokus pada Tujuan, <br className="hidden sm:inline" />Bukan Administrasi.
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-6 sm:mb-8 font-medium leading-relaxed">
                KitaAtur menangani semua urusan remeh administrasi sehingga Anda bisa fokus mengembangkan komunitas dan mencapai target organisasi Anda.
              </p>
              
              <ul className="space-y-6">
                {[
                  { title: "Mudah Digunakan", desc: "Desain antarmuka bersih (UI/UX modern) yang dirancang agar bisa dipakai siapa saja tanpa perlu panduan rumit.", icon: CheckCircle2 },
                  { title: "Akses Kapan Saja", desc: "Berbasis cloud (Progressive Web App). Buka dari HP, tablet, maupun laptop dengan sinkronisasi instan.", icon: Globe2 },
                  { title: "Keamanan Data Prioritas", desc: "Kami menggunakan teknologi enkripsi standar industri dari Supabase untuk menjaga kerahasiaan data Anda.", icon: ShieldCheck }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="mt-1">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Day Trial Promotional Section (Clean KitaAtur Brand) */}
      <section className="py-16 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left: Value Proposition */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                <p className="text-[#0087FF] font-bold tracking-wider uppercase text-xs sm:text-sm mb-2">
                  Uji Coba 7 Hari
                </p>

                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                  Coba Gratis Fitur KitaAtur Plus
                </h3>

                <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 max-w-xl font-normal">
                  Rasakan kemudahan presensi digital QR, pencatatan kas transparan, dan kelola anggota organisasi tanpa batas tanpa biaya dan tanpa perlu kartu kredit.
                </p>

                {/* Benefit highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8 text-sm text-slate-700 font-medium">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0087FF] shrink-0" />
                    <span>Anggota organisasi tanpa batas (unlimited)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0087FF] shrink-0" />
                    <span>Presensi QR & pencatatan kehadiran digital</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0087FF] shrink-0" />
                    <span>Buku kas pemasukan & pengeluaran terbuka</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0087FF] shrink-0" />
                    <span>Ekspor rekapitulasi data ke format Excel</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3.5 w-full">
                  <Link
                    href="/promo/trial"
                    className="px-6 py-3.5 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-sm sm:text-base flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Coba Gratis 7 Hari Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/promo/trial"
                    className="px-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-sm flex items-center gap-2 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-[#0087FF]" />
                    <span>Lihat Halaman Promo & QR</span>
                  </Link>
                </div>
              </div>

              {/* Right: Clean Branded QR Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-xs rounded-2xl bg-slate-50 p-6 border border-slate-200 flex flex-col items-center text-center">
                  <div className="p-3.5 bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
                    <QRCodeSVG 
                      value={promoUrl} 
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <p className="text-slate-900 text-sm font-bold tracking-tight mb-1">
                    Pindai dari Smartphone
                  </p>
                  <p className="text-slate-500 text-xs font-normal mb-4 leading-relaxed">
                    Arahkan kamera smartphone Anda untuk langsung mengklaim uji coba di ponsel.
                  </p>

                  <Link
                    href="/promo/trial"
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0087FF] text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Buka Halaman Promo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Paket Harga</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
              Pilih Paket yang Sesuai untuk Organisasi Anda
            </h3>
            <p className="text-slate-600 text-lg mb-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl mx-auto">
            {/* FREE PLAN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Personal (Free)</h3>
                <p className="text-slate-500 text-sm mb-6 font-medium">Cocok untuk pencatatan kas pribadi sehari-hari.</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">Rp 0</span>
                  <span className="text-slate-500 text-sm font-bold"> / selamanya</span>
                </div>

                <ul className="space-y-4 mb-8 font-medium">
                  <li className="flex items-start gap-3 text-slate-700 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0" />
                    <span>Pencatatan pemasukan & pengeluaran personal</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-700 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0" />
                    <span>Target keuangan pribadi (Personal Goals)</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-400 text-sm line-through opacity-70">
                    <span>Membuat dan mengelola organisasi</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-400 text-sm line-through opacity-70">
                    <span>Akses fitur Validasi Bukti dengan AI</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-400 text-sm line-through opacity-70">
                    <span>Ekspor laporan keuangan organisasi</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center transition-all duration-300 block"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* PLUS PLAN */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative transform lg:-translate-y-4">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0087FF] text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
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
                    "Anggota organisasi tanpa batas (Unlimited)",
                    "Pemindai Kehadiran QR (Internal)",
                    "Akses fitur Validasi Bukti dengan AI",
                    "Laporan Presensi & Keuangan Ekspor ke Excel",
                    "Prioritas Layanan Support",
                    "Keamanan Data Tingkat Lanjut"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href="/register"
                  className="w-full py-3.5 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-center shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200 block text-sm"
                >
                  Berlangganan Sekarang
                </Link>
                <Link
                  href="/promo/trial"
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-center text-xs transition-colors block border border-slate-200"
                >
                  Uji Coba Gratis 7 Hari
                </Link>
              </div>
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
                    <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                    <span>Semua fitur KitaAtur Plus, ditambah:</span>
                  </li>
                  {[
                    "Portal Publik KitaAtur School (Akses Siswa & Wali)",
                    "Import Data Massal via Excel (Siswa/Tamu)",
                    "Pembuatan PIN Akses Wali Murid",
                    "Manajemen Tamu / Siswa Lanjutan",
                    "Analitik Kehadiran Real-time"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-center shadow-sm transition-all duration-300 block"
              >
                Pilih Paket School
              </Link>
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
                      <CheckCircle2 className="h-5 w-5 text-slate-300 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="https://wa.me/6281219363321?text=Halo%20Tim%20KitaAtur,%20saya%20tertarik%20dengan%20paket%20Enterprise"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-center transition-all duration-300 block"
              >
                Hubungi Tim Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Interactive Modern Accordion (Option 1) */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2.5">FAQ</h2>
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Pertanyaan yang Sering Diajukan
            </h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Temukan jawaban cepat seputar fitur, langganan, keamanan, dan penggunaan aplikasi KitaAtur.
            </p>
          </div>
          
          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'bg-white border-blue-500/40 shadow-sm shadow-blue-500/5 ring-1 ring-blue-500/10' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left p-5 sm:p-6 gap-4 group"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-base sm:text-lg font-bold transition-colors ${
                      isOpen ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {faq.q}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen 
                          ? 'bg-blue-50 text-blue-600 rotate-180' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100/80">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help CTA Card */}
          <div className="mt-10 sm:mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
            <div className="text-center sm:text-left">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Masih punya pertanyaan lain?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                Tim kami siap membantu menjawab seputar paket langganan, setup presensi, atau kebutuhan kustom organisasi Anda.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="https://wa.me/6281219363321?text=Halo%20Tim%20KitaAtur,%20saya%20ingin%20bertanya%20seputar%20aplikasi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp</span>
              </a>
              <a
                href="mailto:support.kitaatur@gmail.com"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                <span>Email Kami</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section (Mobile & Windows Desktop) */}
      <section id="unduh" className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Aplikasi</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Unduh KitaAtur untuk Perangkat Anda
            </h3>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Gunakan aplikasi mandiri untuk akses presensi lebih cepat di lapangan dan pengelolaan kas yang lebih leluasa di layar komputer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Card 1: Android */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full">
                    v1.0.0 • 3.8 MB
                  </span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-2">Android (.apk)</h4>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Untuk panitia dan seluruh anggota. Presensi langsung lewat pemindai kamera tanpa perlu membuka browser.
                </p>

                <ul className="space-y-3 mb-8 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Pemindai kamera QR presensi langsung aktif</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Dukungan masuk dengan Google dan akun email</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Kompatibel dengan Android 7.0 hingga versi terbaru</span>
                  </li>
                </ul>
              </div>

              <div>
                <a
                  href="/downloads/KitaAtur.apk"
                  download="KitaAtur.apk"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl text-center transition flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh untuk Android (.apk)</span>
                </a>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Instal langsung di perangkat Android • Bebas iklan
                </p>
              </div>
            </div>

            {/* Card 2: Windows */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full">
                    v1.0.0 • 81 MB
                  </span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-2">Windows (.exe)</h4>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Untuk ketua dan bendahara. Kelola pembukuan, transaksi kas, dan ekspor laporan di layar penuh.
                </p>

                <ul className="space-y-3 mb-8 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Shortcut otomatis di Desktop dan Windows Start Menu</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Pengelolaan tabel kas luas dan ekspor laporan</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Kompatibel dengan Windows 10 & 11 (64-bit)</span>
                  </li>
                </ul>
              </div>

              <div>
                <a
                  href="/downloads/KitaAtur-Setup.exe"
                  download="KitaAtur-Setup.exe"
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl text-center transition flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh untuk Windows (.exe)</span>
                </a>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Installer mandiri untuk PC dan laptop
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 md:py-24 relative overflow-hidden bg-[#0087FF]">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 pointer-events-none opacity-90" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10 text-white">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight tracking-tight">
            Siap Mengubah Cara <br className="hidden sm:inline" />Organisasi Anda Bekerja?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-6 sm:mb-8 font-normal max-w-xl mx-auto leading-relaxed">
            Tinggalkan cara manual. Beralih ke sistem digital yang cepat, modern, dan 100% gratis.
          </p>
          <Link href="/register" className="inline-block bg-white text-blue-600 hover:bg-slate-50 text-sm sm:text-base font-bold px-7 py-3 sm:px-9 sm:py-3.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
            Daftar Sekarang - Gratis
          </Link>
          <p className="mt-4 text-xs sm:text-sm text-blue-200 font-normal">Tidak perlu kartu kredit • Setup kurang dari 2 menit</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-600 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Kolom 1: Brand & Kontak */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm border border-slate-200">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">KitaAtur</span>
            </div>
            <p className="text-sm mt-2 max-w-xs leading-relaxed text-slate-500">
              Aplikasi manajemen organisasi yang modern, transparan, dan bebas kertas. Fokus pada tujuan, bukan administrasi.
            </p>
            <div className="flex flex-col gap-1 mt-4 text-sm">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-1">Email Bantuan:</p>
              <a href="mailto:support.kitaatur@gmail.com" className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center transition-colors">
                support.kitaatur@gmail.com
              </a>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-sm">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-1">Instagram Resmi:</p>
              <a 
                href="https://www.instagram.com/kitaekosistem.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-slate-700 hover:text-blue-600 font-semibold transition-colors group w-fit"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <span className="group-hover:underline">@kitaekosistem.id</span>
              </a>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-sm">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-xs mb-1">Alamat:</p>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs">
                Jl. Baru Perjuangan No.70 RT01/07, MargaMulya, Bekasi Utara, Kota Bks 17121
              </p>
            </div>
          </div>

          {/* Kolom 2: Link Penting */}
          <div className="flex flex-col gap-4 md:pl-10">
            <h4 className="text-slate-900 font-bold mb-2">Tautan Penting</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              <Link href="/changelog" className="hover:text-blue-600 transition-colors">
                Changelog
              </Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Syarat & Ketentuan</Link>
              <Link href="#unduh" className="hover:text-blue-600 transition-colors">Unduh Aplikasi (.apk & .exe)</Link>
              <Link href="/school" className="hover:text-blue-600 transition-colors">Portal Siswa</Link>
              <Link href="#faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Kolom 3: Powered by Rinz Group & Keamanan */}
          <div className="flex flex-col gap-6 justify-between h-full">
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-slate-900 font-bold mb-2">Dipersembahkan oleh</h4>
                <div className="flex items-center gap-3 mt-1">
                  <img src="/icons/RINZ%20GROUP.png" alt="Rinz Group" className="h-7 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div>
                <h4 className="text-slate-900 font-bold mb-2.5">Keamanan Data</h4>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <img 
                    src="/licenses-AES-256.webp" 
                    alt="AES 256" 
                    className="w-9 h-9 object-contain select-none shrink-0" 
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">AES 256</span>
                    <span className="text-[11px] text-slate-400">Standar Enkripsi Keamanan</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs mt-auto pt-4 text-slate-500 border-t border-slate-200/80 md:border-t-0">
              &copy; {new Date().getFullYear()} RinzGroup.<br className="hidden sm:inline" /> All rights reserved.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
