'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, Instagram } from 'lucide-react'
import { changelogData, Release } from '@/data/changelog'

export default function ChangelogPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReleases = changelogData
    .map((release) => {
      if (!searchQuery.trim()) return release

      const q = searchQuery.toLowerCase()
      const titleMatches = release.title.toLowerCase().includes(q)
      const versionMatches = release.version.toLowerCase().includes(q)
      const descMatches = (release.description || '').toLowerCase().includes(q)

      const matchingSections = release.sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) => item.toLowerCase().includes(q) || titleMatches || versionMatches || descMatches
          ),
        }))
        .filter((section) => section.items.length > 0)

      if (titleMatches || versionMatches || descMatches || matchingSections.length > 0) {
        return {
          ...release,
          sections: matchingSections.length > 0 ? matchingSections : release.sections,
        }
      }

      return null
    })
    .filter(Boolean) as Release[]

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900 flex flex-col justify-between overflow-x-hidden">
      
      {/* Brand Header */}
      <header className="sticky top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs py-3.5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 border border-slate-100">
              <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">KitaAtur</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#fitur" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Fitur Utama</Link>
            <Link href="/#keunggulan" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Keunggulan</Link>
            <Link href="/#unduh" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Unduh</Link>
            <Link href="/#faq" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="/school" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Portal Siswa</Link>
            <Link href="/changelog" className="text-sm font-semibold text-[#0087FF] transition-colors">
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
            type="button"
            aria-label="Toggle menu"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-8 md:hidden flex flex-col justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-6 text-center">
            <Link href="/#fitur" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-blue-600">Fitur Utama</Link>
            <Link href="/#keunggulan" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-blue-600">Keunggulan</Link>
            <Link href="/#unduh" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-blue-600">Unduh</Link>
            <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-blue-600">FAQ</Link>
            <Link href="/school" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 hover:text-blue-600">Portal Siswa</Link>
            <Link href="/changelog" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-[#0087FF]">
              Changelog
            </Link>
          </div>
          <div className="flex flex-col gap-3 mt-8">
            <Link href="/login" className="w-full text-center bg-slate-100 text-slate-800 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="w-full text-center bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
              Mulai Gratis
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Page Title & Search Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0087FF]">
            Pembaruan Produk
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Catatan Pembaruan
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-2 leading-relaxed">
            Riwayat pembaruan sistem, fitur baru, dan peningkatan performa di KitaAtur.
          </p>

          {/* Search Box */}
          <div className="relative mt-6 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pembaruan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0087FF] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Releases List */}
        {filteredReleases.length === 0 ? (
          <div className="py-12 text-center bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs">
            <p className="text-sm font-medium text-slate-600">Tidak ada catatan pembaruan yang cocok dengan pencarian.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-bold text-[#0087FF] hover:underline"
            >
              Tampilkan semua pembaruan
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReleases.map((release) => (
              <article 
                key={release.version} 
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Release Card Header */}
                <div className="border-b border-slate-100 pb-5 mb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base sm:text-lg font-bold text-[#0087FF] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/80">
                        {release.version}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-400">
                        {release.date}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-3">
                    {release.title}
                  </h2>
                  {release.description && (
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {release.description}
                    </p>
                  )}
                </div>

                {/* Categorized Bullet Points */}
                <div className="space-y-6">
                  {release.sections.map((section) => (
                    <div key={section.category}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                        {section.category}
                      </h3>
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0087FF] mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

              </article>
            ))}
          </div>
        )}

      </main>

      {/* KitaAtur Brand Footer */}
      <footer className="bg-slate-50 text-slate-600 py-16 border-t border-slate-200 mt-12">
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
              <Link href="/changelog" className="text-[#0087FF] font-semibold hover:underline transition-colors">
                Changelog
              </Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Syarat & Ketentuan</Link>
              <Link href="/#unduh" className="hover:text-blue-600 transition-colors">Unduh Aplikasi (.apk & .exe)</Link>
              <Link href="/school" className="hover:text-blue-600 transition-colors">Portal Siswa</Link>
              <Link href="/#faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
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
  )
}

