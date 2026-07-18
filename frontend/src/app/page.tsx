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
  Globe2
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
            Tinggalkan kertas. Mulai dari absensi digital QR, pencatatan uang kas transparan, hingga manajemen anggota dalam satu aplikasi yang ramah lingkungan.
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
          <div className="mt-16 md:mt-24 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="relative rounded-3xl md:rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[21/9]">
              {/* Mockup Navbar */}
              <div className="absolute top-0 inset-x-0 h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2 z-10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto bg-white border border-slate-200 rounded-md px-32 py-1 text-xs text-slate-400 font-mono hidden md:block">
                  app.kitaatur.com
                </div>
              </div>
              
              <div className="w-full h-full pt-12 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                {/* Mobile Mockup overlapping to look cool */}
                <div className="absolute right-1/2 translate-x-[120%] md:translate-x-32 bottom-[-10%] md:bottom-[-20%] w-48 md:w-64 rotate-[-5deg] hover:rotate-0 transition-transform duration-500 z-20 drop-shadow-2xl">
                   <img src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id.webp" alt="KitaAtur Mobile App" className="w-full h-auto rounded-3xl border-[6px] border-slate-800" />
                </div>
                <div className="absolute left-1/2 -translate-x-[120%] md:-translate-x-96 bottom-[10%] w-48 md:w-64 rotate-[5deg] hover:rotate-0 transition-transform duration-500 z-10 drop-shadow-2xl">
                   <img src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (3).webp" alt="KitaAtur Wallet" className="w-full h-auto rounded-3xl border-[6px] border-slate-800" />
                </div>
                
                {/* Floating UI Elements */}
                <div className="absolute top-1/4 left-[10%] bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Absen Berhasil</p>
                      <p className="font-bold text-slate-900">+1 Kehadiran</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 right-[15%] bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block animate-bounce" style={{animationDuration: '4s'}}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            
            {/* Feature 1: Absensi (Large) */}
            <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-3xl p-8 border border-emerald-100 relative overflow-hidden group">
              <div className="relative z-10 w-full md:w-1/2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Absensi Bebas Kertas</h4>
                <p className="text-slate-700 font-medium mb-6">
                  Buat sesi kehadiran, scan QR Code sekilas, dan data langsung tersimpan di cloud. Tanpa rekap manual, tanpa buang kertas percuma.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-emerald-200/50 rounded-full blur-3xl -z-0" />
              <img 
                src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (1).webp" 
                alt="Absensi QR" 
                className="absolute right-[-10%] md:right-4 bottom-[-20%] w-48 md:w-64 rounded-[2rem] border-8 border-white shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 z-10" 
              />
            </div>

            {/* Feature 2: Keuangan */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-8 border border-blue-100 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Manajemen Kas Transparan</h4>
                <p className="text-slate-700 font-medium">
                  Catat pemasukan dan pengeluaran secara digital. Semua anggota bisa memantau saldo, menghindari prasangka, dan membangun kepercayaan.
                </p>
              </div>
              <img 
                src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (3).webp" 
                alt="Keuangan App" 
                className="absolute right-[-20%] bottom-[-30%] w-48 rounded-[2rem] border-8 border-white shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 opacity-60 mix-blend-multiply" 
              />
            </div>

            {/* Feature 3: Anggota */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-6 shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Database Anggota</h4>
                <p className="text-slate-700 font-medium">
                  Atur peran dari Ketua hingga Anggota biasa dengan sistem multi-role. Data terpusat, akses aman.
                </p>
              </div>
            </div>

            {/* Feature 4: Go Green */}
            <div className="md:col-span-2 bg-gradient-to-br from-teal-800 to-emerald-900 rounded-3xl p-8 border border-teal-700 relative overflow-hidden text-white flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik01NC42MjcgMTEuMzhBNDEuODYgNDEuODYgMCAwIDAgNDEuMzggMjguMjNhNDEuODYgNDEuODYgMCAwIDAgMTMuMjQ3IDE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAgMTMuMjQ3LTE2Ljg1IDQxLjg2 NDEuODYgMCAwIDAtMTMuMjQ3LTE2Ljg1eiIgZmlsbD0iIzEwYjliMSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-30" />
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-emerald-300 text-sm font-bold mb-4">
                  <Leaf className="w-4 h-4" />
                  Gerakan Penjagaan Bumi
                </div>
                <h4 className="text-3xl font-black mb-4">Wujudkan Organisasi Bebas Kertas</h4>
                <p className="text-teal-100 font-medium text-lg">
                  Dengan beralih ke KitaAtur, Anda berpartisipasi langsung dalam mengurangi limbah kertas (paperless). Satu langkah kecil digitalisasi, berdampak besar untuk masa depan bumi.
                </p>
              </div>
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
                src="/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id (2).webp" 
                alt="Dashboard Mockup" 
                className="rounded-3xl shadow-2xl border-4 border-white w-full h-auto"
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

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 -z-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 -z-10 opacity-90" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -z-0 translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-6">Siap Mengubah Cara<br/>Organisasi Anda Bekerja?</h2>
          <p className="text-xl text-blue-100 mb-10 font-medium max-w-2xl mx-auto">
            Bergabunglah dengan gerakan penjagaan bumi. Tinggalkan cara lama, mulai kelola komunitas Anda secara digital, modern, dan gratis hari ini.
          </p>
          <Link href="/register" className="inline-block bg-white text-blue-600 hover:bg-slate-50 text-lg font-bold px-10 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95">
            Daftar Sekarang - Gratis
          </Link>
          <p className="mt-6 text-sm text-blue-200 font-medium">Tidak perlu kartu kredit. Setup kurang dari 2 menit.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1.5">
              <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain brightness-0 invert opacity-80" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">KitaAtur</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} RinzGroup. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/privacy" className="hover:text-white transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
