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
  ClipboardCheck
} from "lucide-react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fallback for auth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.has('code')) {
        window.location.href = `/auth/callback${window.location.search}`
      }
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
            <Link href="#faq" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors px-4 py-2">
              Masuk
            </Link>
            <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
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
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800">FAQ</Link>
          </div>
          <div className="flex flex-col gap-3 mt-8">
            <Link href="/login" className="w-full text-center bg-slate-100 text-slate-800 font-bold py-3.5 rounded-xl">Masuk</Link>
            <Link href="/register" className="w-full text-center bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20">Mulai Gratis</Link>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span>Dukung Gerakan Paperless & Penjagaan Bumi</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 max-w-4xl mx-auto">
            Kelola Organisasi <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lebih Modern & Hijau</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Tinggalkan kertas. Mulai dari absensi digital yang terintegrasi, pencatatan uang kas transparan, hingga manajemen anggota dalam satu aplikasi yang ramah lingkungan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base font-bold px-8 py-4 rounded-full shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 group flex items-center justify-center gap-2">
              Mulai Sekarang Gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#fitur" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold px-8 py-4 rounded-full transition-all hover:-translate-y-1">
              Pelajari Fitur
            </Link>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 md:mt-24 relative mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 flex justify-center items-center h-[500px] md:h-[700px] mb-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex justify-center items-center">
              
              {/* Wallet Mockup (Back) */}
              <div className="absolute left-1/2 -translate-x-[65%] md:-translate-x-[60%] top-[10%] md:top-12 z-10 w-48 md:w-[320px] rotate-[-8deg] hover:rotate-[-4deg] transition-transform duration-700">
                 <img src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (1).webp" alt="KitaAtur Wallet" className="w-full h-auto drop-shadow-2xl" />
              </div>
              
              {/* Main App Mockup (Front) */}
              <div className="absolute left-1/2 -translate-x-[35%] md:-translate-x-[30%] top-[-5%] md:-top-4 z-20 w-56 md:w-[380px] rotate-[6deg] hover:rotate-[3deg] transition-transform duration-700">
                 <img src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id.webp" alt="KitaAtur Mobile App" className="w-full h-auto drop-shadow-2xl" />
              </div>

              {/* Floating UI Elements */}
              <div className="absolute top-1/4 left-[5%] md:left-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100/50 hidden md:block animate-bounce z-30" style={{animationDuration: '3s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Absen Berhasil</p>
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
                    <p className="font-bold text-slate-900">Rp 1.500.000</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="fitur" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Fitur Lengkap</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
              Satu Aplikasi,<br/>Semua Kebutuhan Organisasi
            </h3>
            <p className="text-slate-600 text-lg">
              Desain modern yang mudah digunakan, membantu Anda menghemat waktu dan kertas.
            </p>
          </div>

          <div className="flex flex-col gap-24 md:gap-32 pb-12">
            
            {/* Feature 1: Absensi */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50">
                  <ClipboardCheck className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-4">Absensi Bebas Kertas</h4>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                  Buat sesi kehadiran dan rekam jejak absensi secara digital. Tersedia fitur delegasi absen (Bantu Absen) tanpa batasan lokasi untuk memudahkan pencatatan, tanpa perlu buang kertas percuma.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-emerald-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (3).webp" 
                  alt="Absensi QR" 
                  className="w-48 md:w-64 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

            {/* Feature 2: Keuangan */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-100/50">
                  <Wallet className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-4">Manajemen Kas Transparan</h4>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                  Catat pemasukan dan pengeluaran secara digital. Semua anggota bisa memantau saldo, menghindari prasangka, dan membangun kepercayaan.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-blue-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (6).webp" 
                  alt="Keuangan App" 
                  className="w-48 md:w-64 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

            {/* Feature 3: Analisis Kehadiran */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-100/50">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-4">Analisis Cerdas & AI</h4>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                  Dapatkan wawasan mendalam tentang kedisiplinan anggota. Dilengkapi dengan Rapor Kedisiplinan berbasis AI, deteksi dini pola kehadiran, dan klasemen otomatis untuk memotivasi organisasi Anda.
                </p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-indigo-200/40 rounded-full blur-3xl -z-10" />
                <img 
                  src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (4).webp" 
                  alt="Database Anggota" 
                  className="w-48 md:w-64 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transition-transform hover:-translate-y-2 duration-500" 
                />
              </div>
            </div>

          </div>

          {/* Feature 4: Go Green Banner (Moved Below Flex Layout) */}
          <div className="mt-8 bg-gradient-to-br from-teal-800 to-emerald-900 rounded-[2.5rem] p-10 md:p-16 border border-teal-700 relative overflow-hidden text-white flex flex-col justify-center items-center text-center">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik01NC42MjcgMTEuMzhBNDEuODYgNDEuODYgMCAwIDAgNDEuMzggMjguMjNhNDEuODYgNDEuODYgMCAwIDAgMTMuMjQ3IDE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAgMTMuMjQ3LTE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAtMTMuMjQ3LTE2Ljg1eiIgZmlsbD0iIzEwYjliMSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-sm font-bold mb-6">
                <Leaf className="w-4 h-4" />
                Gerakan Penjagaan Bumi
              </div>
              <h4 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Organisasi Bebas Kertas</h4>
              <p className="text-teal-100 font-medium text-lg leading-relaxed max-w-xl mx-auto">
                Beralih ke digital. Hemat waktu, kurangi limbah kertas, dan lindungi bumi mulai hari ini.
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
                src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (5).webp" 
                alt="Dashboard Mockup" 
                className="rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full h-auto"
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
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Fokus pada Tujuan,<br />Bukan Administrasi.</h2>
              <p className="text-lg text-slate-600 mb-8 font-medium">
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

      {/* Pricing Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Paket Harga</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
              Pilih Paket yang Sesuai untuk Organisasi Anda
            </h3>
            <p className="text-slate-600 text-lg">
              Mulai kelola kas keuangan pribadi secara gratis, atau buka akses fitur organisasi penuh dengan paket premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {/* PLUS PLAN */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative">
              <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded-full shadow-sm">
                POPULER
              </span>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">KitaAtur Plus</h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">Rp 45.000</span>
                  <span className="text-slate-500 text-sm font-bold"> / bulan</span>
                </div>

                <ul className="space-y-4 mb-8 font-medium">
                  {[
                    "Buat dan kelola 1 Organisasi Penuh",
                    "Anggota organisasi tanpa batas",
                    "Akses fitur Validasi Bukti dengan AI",
                    "Laporan Absensi & Keuangan Ekspor ke Excel",
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

              <Link
                href="/register"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center shadow-lg transition-all duration-300 block"
              >
                Berlangganan Sekarang
              </Link>
            </div>

            {/* ENTERPRISE PLAN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">KitaAtur Enterprise</h3>
                
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
                href="https://wa.me/6281234567890?text=Halo%20Tim%20KitaAtur,%20saya%20tertarik%20dengan%20paket%20Enterprise"
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

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-blue-600">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 pointer-events-none opacity-90" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-6">Siap Mengubah Cara<br/>Organisasi Anda Bekerja?</h2>
          <p className="text-xl text-blue-100 mb-10 font-medium max-w-2xl mx-auto">
            Tinggalkan cara manual. Beralih ke sistem digital yang cepat, modern, dan 100% gratis.
          </p>
          <Link href="/register" className="inline-block bg-white text-blue-600 hover:bg-slate-50 text-lg font-bold px-10 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
            Daftar Sekarang - Gratis
          </Link>
          <p className="mt-6 text-sm text-blue-200 font-medium">Tidak perlu kartu kredit. Setup kurang dari 2 menit.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Kolom 1: Brand & Kontak */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">KitaAtur</span>
            </div>
            <p className="text-sm mt-2 max-w-xs leading-relaxed">
              Aplikasi manajemen organisasi yang modern, transparan, dan bebas kertas. Fokus pada tujuan, bukan administrasi.
            </p>
            <div className="flex flex-col gap-1 mt-4 text-sm">
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-xs mb-1">Email Bantuan:</p>
              <a href="mailto:support.kitaatur@gmail.com" className="text-white hover:text-blue-400 font-medium inline-flex items-center transition-colors">
                support.kitaatur@gmail.com
              </a>
            </div>
          </div>

          {/* Kolom 2: Link Penting */}
          <div className="flex flex-col gap-4 md:pl-10">
            <h4 className="text-white font-bold mb-2">Tautan Penting</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              <Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Kolom 3: Powered by Rinz Group */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-2">Dipersembahkan oleh</h4>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2.5 inline-block shadow-sm">
                <img src="/icons/RINZ%20GROUP.png" alt="Rinz Group" className="h-6 object-contain" />
              </div>
            </div>
            <p className="text-xs mt-4">
              &copy; {new Date().getFullYear()} RinzGroup.<br/>All rights reserved.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
