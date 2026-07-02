'use client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet } from 'lucide-react'
import OrgTransactionForm from '../org-transaction-form'

export default function CreateFinancialRecordPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const handleSuccess = () => {
    // Sengaja tidak me-redirect agar pengguna bisa input transaksi lain secara berurutan
    // Form sudah mereset isinya secara otomatis di komponen OrgTransactionForm
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <header className="mb-6">
          <Link 
            href={`/org/${orgSlug}/financial`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Keuangan
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-blue-600" />
            Catat Kas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tambahkan catatan uang masuk atau keluar ke pembukuan organisasi.</p>
        </header>

        <OrgTransactionForm orgSlug={orgSlug} onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
