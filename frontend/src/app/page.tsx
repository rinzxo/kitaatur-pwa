'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { QrCode, Wallet, ShieldCheck } from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fallback for auth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.has('code')) {
        window.location.href = `/auth/callback${window.location.search}`
      }
    }
  }, [])

  const slides = [
    {
      id: 0,
      title: "Ready to change the way you manage?",
      subtitle: "Welcome to KitaAtur",
      theme: "blue",
      graphic: (
        <div key="0" className="absolute inset-0 bg-white rounded-full border-[3px] border-blue-200/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ transform: 'translateZ(0px)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-80" />
          <img src="/logo.png" alt="KitaAtur Logo" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md transform rotate-[15deg] object-contain select-none" />
        </div>
      )
    },
    {
      id: 1,
      title: "Kelola kehadiran dengan cepat & akurat",
      subtitle: "Absensi Digital",
      theme: "emerald",
      graphic: (
        <div key="1" className="absolute inset-0 bg-emerald-50 rounded-full border-[3px] border-emerald-200/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ transform: 'translateZ(0px)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-80" />
          <QrCode className="w-24 h-24 sm:w-28 sm:h-28 text-emerald-600 drop-shadow-md transform rotate-[15deg] select-none" strokeWidth={1.5} />
        </div>
      )
    },
    {
      id: 2,
      title: "Catat kas & keuangan tanpa ribet",
      subtitle: "Manajemen Keuangan",
      theme: "violet",
      graphic: (
        <div key="2" className="absolute inset-0 bg-violet-50 rounded-full border-[3px] border-violet-200/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ transform: 'translateZ(0px)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-80" />
          <Wallet className="w-24 h-24 sm:w-28 sm:h-28 text-violet-600 drop-shadow-md transform rotate-[15deg] select-none" strokeWidth={1.5} />
        </div>
      )
    },
    {
      id: 3,
      title: "Mulai langkah cerdas bersama kami",
      subtitle: "Aman & Terpercaya",
      theme: "rose",
      graphic: (
        <div key="3" className="absolute inset-0 bg-rose-50 rounded-full border-[3px] border-rose-200/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-500" style={{ transform: 'translateZ(0px)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-80" />
          <ShieldCheck className="w-24 h-24 sm:w-28 sm:h-28 text-rose-600 drop-shadow-md transform rotate-[15deg] select-none" strokeWidth={1.5} />
        </div>
      )
    }
  ];

  // Auto-advance logic: simple and idiomatic React pattern
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const activeSlide = slides[currentSlide];

  // Helper for dynamic colors
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'emerald': return { bg1: 'bg-emerald-600', bg2: 'bg-emerald-500', from1: 'from-emerald-400/60', from2: 'from-emerald-400/40', from3: 'from-emerald-500/50', from4: 'from-emerald-600/50', from5: 'from-emerald-500/40', textBase: 'to-emerald-100', ext1: 'bg-emerald-800', ext2: 'bg-emerald-700', border: 'border-emerald-500/20', deep: 'bg-emerald-950' };
      case 'violet': return { bg1: 'bg-violet-600', bg2: 'bg-violet-500', from1: 'from-violet-400/60', from2: 'from-violet-400/40', from3: 'from-violet-500/50', from4: 'from-violet-600/50', from5: 'from-violet-500/40', textBase: 'to-violet-100', ext1: 'bg-violet-800', ext2: 'bg-violet-700', border: 'border-violet-500/20', deep: 'bg-violet-950' };
      case 'rose': return { bg1: 'bg-rose-600', bg2: 'bg-rose-500', from1: 'from-rose-400/60', from2: 'from-rose-400/40', from3: 'from-rose-500/50', from4: 'from-rose-600/50', from5: 'from-rose-500/40', textBase: 'to-rose-100', ext1: 'bg-rose-800', ext2: 'bg-rose-700', border: 'border-rose-500/20', deep: 'bg-rose-950' };
      case 'blue':
      default: return { bg1: 'bg-blue-600', bg2: 'bg-sky-500', from1: 'from-blue-400/60', from2: 'from-sky-400/40', from3: 'from-blue-500/50', from4: 'from-blue-600/50', from5: 'from-sky-500/40', textBase: 'to-blue-100', ext1: 'bg-blue-800', ext2: 'bg-blue-700', border: 'border-blue-500/20', deep: 'bg-blue-950' };
    }
  }

  const themeVars = getThemeClasses(activeSlide.theme);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans transition-colors duration-1000">
      
      {/* Dynamic Background Rays / Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Core glows - Optimized: Removed mix-blend-screen and transition-all */}
        <div className={`absolute w-[300px] h-[300px] ${themeVars.bg1} rounded-full blur-[100px] opacity-30 transition-colors duration-1000`} />
        <div className={`absolute w-[400px] h-[400px] ${themeVars.bg2} rounded-full blur-[120px] opacity-20 translate-y-32 transition-colors duration-1000`} />
        
        {/* Subtle light streaks simulating rays */}
        <div className="absolute inset-0 opacity-40">
          <div className={`absolute top-0 left-1/2 w-0.5 h-[60%] bg-gradient-to-b ${themeVars.from1} to-transparent transform -translate-x-[100px] rotate-[15deg] origin-top transition-colors duration-1000`} />
          <div className={`absolute top-0 left-1/2 w-[1px] h-[80%] bg-gradient-to-b ${themeVars.from2} to-transparent transform -translate-x-[200px] rotate-[30deg] origin-top transition-colors duration-1000`} />
          <div className={`absolute top-0 right-1/2 w-0.5 h-[50%] bg-gradient-to-b ${themeVars.from3} to-transparent transform translate-x-[150px] -rotate-[20deg] origin-top transition-colors duration-1000`} />
          <div className={`absolute bottom-0 left-1/2 w-0.5 h-[60%] bg-gradient-to-t ${themeVars.from4} to-transparent transform -translate-x-[50px] -rotate-[10deg] origin-bottom transition-colors duration-1000`} />
          <div className={`absolute bottom-0 right-1/2 w-[1px] h-[70%] bg-gradient-to-t ${themeVars.from5} to-transparent transform translate-x-[180px] rotate-[25deg] origin-bottom transition-colors duration-1000`} />
        </div>
      </div>

      {/* Top Header Section */}
      <div className="relative z-10 px-6 pt-12 flex flex-col">
        {/* Story Progress Indicators */}
        <div className="flex gap-2 w-full mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-1 flex-1 rounded-full cursor-pointer overflow-hidden bg-white/20"
            >
              <div 
                className={`h-full bg-white ${idx === currentSlide ? 'shadow-[0_0_8px_rgba(255,255,255,0.8)]' : idx < currentSlide ? 'w-full' : 'w-0'}`} 
                style={{ animation: idx === currentSlide ? 'progress-fill 2s linear forwards' : 'none' }}
              />
            </div>
          ))}
        </div>

        {/* Logo Text */}
        <div className="flex items-center gap-3 mb-8 transition-all duration-500">
          <div className="w-7 h-7 bg-white rounded flex items-center justify-center p-0.5 shadow-sm">
             <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-slate-100">{activeSlide.subtitle}</span>
        </div>

        {/* Big Headline & Desktop Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-start justify-between w-full gap-6">
          <h1 
            key={activeSlide.id}
            className={`text-[40px] md:text-5xl leading-[1.05] font-black tracking-tight max-w-sm uppercase text-transparent bg-clip-text bg-gradient-to-br from-white ${themeVars.textBase} drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 h-[180px] md:h-[220px]`}
          >
            {activeSlide.title}
          </h1>
          
          {/* Action Buttons (Desktop Only) */}
          <div className="hidden md:flex flex-col gap-3 shrink-0">
            <Link 
              href="/login" 
              className="py-3 px-10 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white font-bold rounded-full text-center transition-all duration-300 border border-slate-600/50 active:scale-95 whitespace-nowrap"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="py-3 px-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-center transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/20 active:scale-95 whitespace-nowrap"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Center Stylized Graphic */}
      <div className="relative z-10 flex-1 flex items-center justify-center -mt-8">
        <div 
          className="relative w-56 h-56 sm:w-64 sm:h-64 animate-[float_6s_ease-in-out_infinite]"
          style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px) rotateX(60deg) rotateZ(-15deg)' }}
        >
          {/* Fake 3D Extrusion Layers - Optimized to 4 layers */}
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute inset-0 rounded-full ${i % 2 === 0 ? themeVars.ext1 : themeVars.ext2} ${themeVars.border} transition-colors duration-1000`}
              style={{ transform: `translateZ(-${i * 5}px)` }} 
            />
          ))}
          
          {/* Deep Shadow - Optimized: removed heavy blur in 3D context */}
          <div 
            className={`absolute inset-0 ${themeVars.deep} rounded-full opacity-60 transition-colors duration-1000`} 
            style={{ transform: 'translateZ(-40px) scale(0.95)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
          />

          {/* Top Face */}
          {activeSlide.graphic}
        </div>
      </div>

      {/* Bottom Action Buttons (Mobile Only) */}
      <div className="relative z-10 px-6 pb-12 flex md:hidden gap-4 w-full max-w-md mx-auto mt-4">
        <Link 
          href="/login" 
          className="flex-1 py-4 px-6 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 text-white font-bold rounded-full text-center transition-all duration-300 border border-slate-600/50 active:scale-95"
        >
          Log in
        </Link>
        <Link 
          href="/register" 
          className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-center transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/20 active:scale-95"
        >
          Sign up
        </Link>
      </div>

    </div>
  );
}
