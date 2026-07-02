'use client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in fade-in duration-300">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold">Privacy and Cookies</h1>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Kebijakan Privasi & Penggunaan Cookie</h2>
        <p className="text-slate-500 font-medium">Terakhir diperbarui: 25 Juni 2026</p>
        
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            Di KitaAtur, kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. 
            Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda saat Anda menggunakan layanan kami.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">1. Data yang Kami Kumpulkan</h3>
          <p>
            Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, seperti nama, email, dan detail organisasi.
            Kami juga secara otomatis mengumpulkan log penggunaan dan metrik performa untuk meningkatkan layanan.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">2. Penggunaan Cookie</h3>
          <p>
            Aplikasi kami menggunakan cookie dan teknologi pelacakan serupa untuk mengingat preferensi masuk Anda (sesi login) dan memahami bagaimana Anda menggunakan fitur aplikasi agar kami dapat terus berinovasi.
          </p>
          <h3 className="text-lg font-bold text-slate-900 pt-4">3. Keamanan Data</h3>
          <p>
            Semua data keuangan dan kehadiran Anda diamankan dengan enkripsi industri standar, dan disimpan dengan aman menggunakan layanan cloud terpercaya (Supabase).
          </p>
        </div>
      </main>
    </div>
  )
}
