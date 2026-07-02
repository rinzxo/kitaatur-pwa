'use client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ThirdPartyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in fade-in duration-300">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold">Third Party Notices</h1>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Pemberitahuan Pihak Ketiga</h2>
        
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            Aplikasi KitaAtur dibangun dengan menggunakan beberapa perangkat lunak sumber terbuka (Open Source Software). 
            Kami berterima kasih kepada komunitas pengembang open source yang telah membagikan karya mereka.
          </p>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4">
            <h3 className="font-bold text-slate-900 mb-2">Supabase</h3>
            <p className="text-sm">Lisensi Apache 2.0</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-2">
            <h3 className="font-bold text-slate-900 mb-2">Next.js & React</h3>
            <p className="text-sm">Lisensi MIT</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-2">
            <h3 className="font-bold text-slate-900 mb-2">Tailwind CSS</h3>
            <p className="text-sm">Lisensi MIT</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-2">
            <h3 className="font-bold text-slate-900 mb-2">Lucide Icons</h3>
            <p className="text-sm">Lisensi ISC</p>
          </div>
        </div>
      </main>
    </div>
  )
}
