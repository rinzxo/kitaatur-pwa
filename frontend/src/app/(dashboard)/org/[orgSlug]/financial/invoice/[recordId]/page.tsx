'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Scissors } from 'lucide-react'
import Link from 'next/link'

export default function InvoicePrintPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const recordId = params.recordId as string
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await api.get(`/org-financial/${orgSlug}/record/${recordId}`)
        setRecord(res.data)
      } catch (err) {
        console.error('Error fetching record:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecord()
  }, [orgSlug, recordId])

  useEffect(() => {
    if (record) {
      // Auto trigger print when data is loaded
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [record])

  if (loading) {
    return <div className="p-10 text-center font-bold text-slate-500">Menyiapkan Kwitansi...</div>
  }

  if (!record) {
    return <div className="p-10 text-center text-rose-500 font-bold">Kwitansi tidak ditemukan!</div>
  }

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val))
  }

  const ReceiptBlock = ({ title }: { title: string }) => (
    <div className="border-2 border-slate-900 rounded-xl p-6 bg-white">
      <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">{record.organization?.name || 'Organisasi'}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">BUKTI PENERIMAAN UANG KAS</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg uppercase">{title}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">No: {record.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex border-b border-slate-100 pb-2">
          <span className="w-40 font-bold text-slate-600">Telah terima dari</span>
          <span className="font-black text-slate-900">: {record.description?.split('-')[1]?.trim() || record.profile?.full_name || 'Anggota'}</span>
        </div>
        <div className="flex border-b border-slate-100 pb-2">
          <span className="w-40 font-bold text-slate-600">Uang Sebesar</span>
          <span className="font-black text-slate-900 text-lg">: {formatCurrency(record.amount)}</span>
        </div>
        <div className="flex border-b border-slate-100 pb-2">
          <span className="w-40 font-bold text-slate-600">Untuk Pembayaran</span>
          <span className="font-bold text-slate-900">: {record.description || record.category}</span>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="w-32 text-center">
          <p className="text-xs font-bold text-slate-500 mb-12">Penyetor,</p>
          <div className="border-b border-slate-400"></div>
          <p className="text-[10px] mt-1 text-slate-500">(Tanda Tangan)</p>
        </div>
        
        <div className="w-40 text-center">
          <p className="text-xs font-bold text-slate-500 mb-1">{new Date(record.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs font-bold text-slate-500 mb-8">Penerima (Bendahara),</p>
          <div className="border-b border-slate-400"></div>
          <p className="text-[10px] mt-1 text-slate-500">(Tanda Tangan)</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white text-slate-900 py-8 px-4 font-sans">
      
      {/* Controls - Hidden when printing */}
      <div className="max-w-2xl mx-auto mb-8 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <Link 
          href={`/org/${orgSlug}/financial/dues`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
        >
          <Printer className="h-4 w-4" />
          Cetak Ulang
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-2xl mx-auto bg-white print:shadow-none shadow-xl print:w-full print:max-w-none">
        
        {/* Top Copy (For Member) */}
        <ReceiptBlock title="Copy Anggota" />

        {/* Scissor Line */}
        <div className="flex items-center gap-4 my-8 text-slate-400 opacity-60">
          <Scissors className="h-5 w-5 -rotate-90" />
          <div className="flex-1 border-b-2 border-dashed border-slate-400"></div>
          <span className="text-xs font-bold uppercase tracking-widest">Potong di sini</span>
        </div>

        {/* Bottom Copy (For Treasurer) */}
        <ReceiptBlock title="Copy Bendahara" />

      </div>
    </div>
  )
}
