import Link from 'next/link'
import { Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Sistem Sedang Diperbaiki</h1>
        <p className="text-slate-500 mb-8">
          Kami sedang melakukan pemeliharaan sistem rutin untuk meningkatkan layanan. Harap kembali lagi beberapa saat lagi.
        </p>
        <Link href="/" className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
