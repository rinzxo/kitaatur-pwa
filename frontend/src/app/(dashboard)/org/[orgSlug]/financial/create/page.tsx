'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, Compass } from '@phosphor-icons/react'
import OrgTransactionForm from '../org-transaction-form'
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour'

export default function CreateFinancialRecordPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const [showTour, setShowTour] = useState(false)

  const createTxTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-tx-type"]',
      title: 'Jenis Transaksi Kas',
      description: 'Pilih "Uang Masuk (Debet)" untuk penerimaan kas/iuran/donasi, atau "Uang Keluar (Kredit)" untuk belanja logistik dan konsumsi kegiatan.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-tx-amount"]',
      title: 'Nominal Rupiah',
      description: 'Ketik nominal angka. Sistem otomatis memformat angka dalam format mata uang Rupiah rapi.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-tx-category"]',
      title: 'Kategori & Tanggal',
      description: 'Kelompokkan pos keuangan (misal: Konsumsi, Logistik, Iuran) dan atur tanggal transaksi sebenarnya.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-tx-receipt"]',
      title: 'Lampirkan Bukti Nota / Kwitansi',
      description: 'Unggah foto struk belanja, nota, atau bukti transfer agar pembukuan kas 100% transparan dan siap diaudit.',
      position: 'top'
    },
    {
      target: '[data-tour="tour-tx-submit"]',
      title: 'Simpan ke Buku Kas',
      description: 'Simpan transaksi ke pembukuan. Saldo kas organisasi akan otomatis diperbarui secara seketika.',
      position: 'top'
    }
  ]

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
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={`/org/${orgSlug}/financial`} 
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Kembali ke Keuangan
            </Link>

            <button
              type="button"
              onClick={() => setShowTour(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Panduan Fitur</span>
            </button>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-blue-600" />
            Catat Kas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tambahkan catatan uang masuk atau keluar ke pembukuan organisasi.</p>
        </header>

        <OrgTransactionForm orgSlug={orgSlug} onSuccess={handleSuccess} />
      </div>

      <SpotlightTour
        tourKey="financial_create_tx"
        steps={createTxTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  )
}
