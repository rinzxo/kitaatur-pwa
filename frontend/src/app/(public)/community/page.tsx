'use client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CommunityPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in fade-in duration-300">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold">Community Standards</h1>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Standar Komunitas</h2>
        <p className="text-slate-500 font-medium">Berlaku untuk semua organisasi di KitaAtur</p>
        
        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            KitaAtur dibangun untuk memfasilitasi kerja sama tim dan pengelolaan finansial yang transparan. 
            Oleh karena itu, kami mengharapkan seluruh pengguna untuk menjaga etika dan standar profesional.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-700">
            <li>Saling menghormati sesama anggota organisasi.</li>
            <li>Tidak menggunakan platform untuk tujuan manipulasi data atau pemerasan.</li>
            <li>Melaporkan segala aktivitas mencurigakan kepada admin organisasi atau tim dukungan kami.</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
