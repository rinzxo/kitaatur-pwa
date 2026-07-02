'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Scissors, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Playfair_Display, Space_Mono, Caveat } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'] })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] })
const caveat = Caveat({ subsets: ['latin'], weight: ['600', '700'] })

export default function PublicInvoicePrintPage() {
  const params = useParams()
  const recordId = params.recordId as string
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await api.get(`/org-financial/public/invoice/${recordId}`)
        setRecord(res.data)
      } catch (err) {
        console.error('Error fetching public invoice:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecord()
  }, [recordId])

  useEffect(() => {
    if (record) {
      // Auto trigger print when data is loaded
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [record])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center p-10 text-center font-bold text-slate-500 bg-slate-50">Menyiapkan Kwitansi Digital...</div>
  }

  if (!record) {
    return <div className="min-h-screen flex items-center justify-center p-10 text-center text-rose-500 font-bold bg-slate-50">Kwitansi tidak ditemukan!</div>
  }

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val))
  }

  // URL validasi (Halaman ini sendiri)
  const validationUrl = typeof window !== 'undefined' ? window.location.href : `https://kitaatur.com/invoice/${record.id}`

  // ID Jejak Digital untuk anti-duplikasi
  const footprintId = `AUTH-${record.id.split('-')[1].toUpperCase()}-${new Date(record.transaction_date).getTime().toString(16).toUpperCase()}`

  const ReceiptBlock = ({ title }: { title: string }) => (
    <div 
      className="bg-[#f2fafe] h-[297mm] flex flex-col relative overflow-hidden border-[12px] border-double border-sky-200 p-2 shadow-inner w-[210mm] mx-auto print:w-[210mm] print:h-[280mm] print:border-[12px] print:m-0 print:shadow-none print:box-border"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: hidden !important;
            -webkit-print-color-adjust: exact; 
          }
          .print-safe-area {
            zoom: 0.93;
          }
        }
      `}} />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-radial-gradient(circle_at_0_0,transparent_0,#000_20px),repeating-linear-gradient(#000,#000)]" style={{ backgroundSize: '40px 40px' }}></div>
      
      {/* SECURITY FEATURES PADA FRAME */}
      {/* 1. Micro-printing (Teks super kecil yang terlihat seperti garis lurus) */}
      <div className="absolute top-0 bottom-0 left-1 w-4 overflow-hidden opacity-40 pointer-events-none">
         <p className="text-[5px] font-mono whitespace-nowrap -rotate-90 origin-top-left translate-y-full tracking-widest text-sky-800 absolute top-[100%]">
            {Array(50).fill(`KITAATUR AUTHENTIC DOCUMENT • ${record.id.toUpperCase()} •`).join(' ')}
         </p>
      </div>
      
      {/* KOP SURAT */}
      <div className="flex justify-between items-center pb-6 px-10 pt-8 border-b-2 border-slate-800 relative z-10 mx-6">
        
        {/* Kiri: Logo Organisasi */}
        <div className="w-24 h-24 shrink-0 flex items-center justify-start">
          {record.organization?.logo_url ? (
            <img src={record.organization.logo_url} alt="Logo" className="max-w-full max-h-full object-contain rounded-full" />
          ) : (
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-inner">
              {record.organization?.name?.charAt(0).toUpperCase() || 'O'}
            </div>
          )}
        </div>

        {/* Tengah: Judul & Nama Organisasi */}
        <div className="flex-1 text-center px-4 flex flex-col items-center justify-center">
          <h1 className={`text-3xl font-black uppercase tracking-widest text-slate-900 mb-3 whitespace-nowrap print:text-2xl ${spaceMono.className}`}>{title}</h1>
          <h2 className={`text-xl font-bold uppercase text-slate-800 tracking-widest ${spaceMono.className}`}>{record.organization?.name || 'Organisasi'}</h2>
        </div>

        {/* Kanan: Logo Aplikasi (KitaAtur) */}
        <div className="w-24 h-24 shrink-0 flex items-center justify-end">
          <img src="/logo.png" alt="KitaAtur Logo" className="w-20 h-20 object-contain" />
        </div>
      </div>

      {/* BODY (CLASSIC KWITANSI) */}
      <div className="flex-1 px-10 pt-8 pb-10 flex flex-col relative z-10">
        
        {/* Nomor & Tanggal */}
        <div className="flex justify-between items-end mb-12">
          <p className="text-base font-bold text-slate-800 uppercase tracking-widest flex items-end gap-2">
            No. <span className={`border-b border-slate-800 px-4 min-w-[150px] inline-block ${spaceMono.className} text-xl text-left`}>{record.id.split('-')[0].toUpperCase()}</span>
          </p>
          <p className={`text-2xl text-slate-700 ${caveat.className}`}>
            {new Date(record.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-10 mb-auto text-slate-800 text-lg">
          
          {/* Baris 1: Terima Dari / Dibayarkan Kepada */}
          <div className="flex items-end gap-4">
            <span className="font-medium whitespace-nowrap pb-1">
              {record.type === 'income' 
                ? 'Telah terima dari' 
                : (record.category === 'Alokasi Target' ? 'Dialokasikan ke' : 'Dibayarkan kepada')}
            </span>
            <span className={`flex-1 border-b border-slate-400 border-dashed pb-1 px-4 text-3xl text-blue-900 leading-none ${caveat.className}`}>
              {record.category === 'Alokasi Target'
                ? (record.description?.replace('Alokasi untuk target: ', '') || 'Target Tabungan')
                : (record.description?.includes(' - ') 
                  ? record.description.split(' - ')[0] 
                  : (record.profile?.full_name || (record.type === 'income' ? 'Anggota' : 'Pihak Terkait')))}
            </span>
          </div>
          
          {/* Baris 2: Untuk Pembayaran */}
          <div className="flex items-end gap-4 mt-12">
            <span className="font-medium whitespace-nowrap pb-1">
              {record.category === 'Alokasi Target' ? 'Tujuan pengeluaran' : 'Untuk pembayaran'}
            </span>
            <span className={`flex-1 border-b border-slate-400 border-dashed pb-1 px-4 text-3xl text-blue-900 leading-none ${caveat.className}`}>
              {record.category === 'Alokasi Target'
                ? 'Penambahan Saldo Target Tabungan'
                : (record.description?.includes(' - ') 
                  ? record.description.split(' - ').slice(1).join(' - ') 
                  : (record.description || record.category))}
            </span>
          </div>
        </div>

        {/* Bawah: Nominal & Tanda Tangan */}
        <div className="flex justify-between items-end mt-auto pt-16">
          
          {/* Nominal Kiri Bawah (Box) */}
          <div className="relative bg-sky-50 border-4 border-double border-slate-800 px-10 py-3 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center group">
            
            {/* 1. Complex Woven Security Pattern (Replacing the simple hatch & strip) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                   backgroundImage: `
                     repeating-linear-gradient(45deg, #0f172a 0, #0f172a 1px, transparent 1px, transparent 6px),
                     repeating-linear-gradient(-45deg, #0f172a 0, #0f172a 1px, transparent 1px, transparent 6px),
                     repeating-linear-gradient(0deg, #0f172a 0, #0f172a 1px, transparent 1px, transparent 15px)
                   `
                 }}>
            </div>
            
            <span className={`relative z-10 font-black text-3xl text-slate-900 tracking-wider ${spaceMono.className}`}>
              {formatCurrency(record.amount)}
            </span>
          </div>

          {/* Tanda Tangan & Segel (Kanan) */}
          <div className="w-56 text-center flex flex-col items-center relative">
            
            {/* ULTRA-SECURE GUILLOCHE SEAL */}
            <div 
              className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full opacity-60 mix-blend-multiply pointer-events-none flex items-center justify-center overflow-hidden"
              style={{
                background: `
                  repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 4px, #bae6fd 5px, #bae6fd 6px),
                  repeating-radial-gradient(circle at 40% 40%, transparent 0, transparent 5px, #7dd3fc 6px, #7dd3fc 7px),
                  repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 5deg, #e0f2fe 5deg 10deg)
                `,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
            >
              <div className="absolute w-44 h-44 rounded-full border-[6px] border-double border-sky-400"></div>
              <div className="absolute w-36 h-36 rounded-full border-[2px] border-dashed border-sky-500"></div>
              {/* Inner spirograph approximation */}
              <div className="absolute w-28 h-28 border border-sky-300 rounded-[40%] rotate-45"></div>
              <div className="absolute w-28 h-28 border border-sky-300 rounded-[40%] rotate-12"></div>
              <div className="absolute w-28 h-28 border border-sky-300 rounded-[40%] -rotate-12"></div>
            </div>

            <div className="relative z-10 w-full">
              <p className="text-sm font-bold text-slate-600">Bendahara,</p>
              <p className={`text-xl text-blue-900 mt-1 mb-2 ${caveat.className}`}>{record.created_by_name || record.organization?.name || 'Bendahara Organisasi'}</p>
            </div>
            
            {/* SECURE QR CODE (Digital Signature) */}
            <div className="relative z-10 bg-white p-2.5 rounded-xl shadow-lg border-[3px] border-slate-200"
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #f1f5f9 2px, #f1f5f9 4px)' }}>
              <div className="bg-white p-1 rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(validationUrl)}`} 
                  alt="QR Validasi" 
                  className="w-20 h-20 opacity-90 mix-blend-multiply grayscale contrast-125"
                  crossOrigin="anonymous"
                />
              </div>
              {/* Holographic-like Shield Badge */}
              <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-full p-1.5 border-4 border-white shadow-md flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            
            <p className={`text-[10px] font-bold text-slate-500 mt-5 uppercase tracking-widest relative z-10 ${spaceMono.className}`}>
              {footprintId}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white text-slate-900 py-8 px-4 font-sans">
      
      {/* Controls - Hidden when printing */}
      <div className="max-w-2xl mx-auto mb-8 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
        >
          <Printer className="h-4 w-4" />
          Cetak Struk
        </button>
      </div>

      {/* A4 Paper Container wrapped in a scaling container for mobile */}
      <div className="w-full bg-slate-100 py-6 sm:py-8 flex justify-center overflow-hidden print:py-0 print:bg-white print:flex print:justify-center">
        
        {/* Scaled wrapper: reserves exact scaled dimensions on mobile, full dimensions on desktop/print */}
        <div className="relative shrink-0 w-[94.5mm] h-[133.65mm] sm:w-[210mm] sm:h-[297mm] print:w-[210mm] print:h-[280mm] print:mx-auto print-safe-area">
          
          <div className="absolute sm:relative top-0 left-0 origin-top-left scale-[0.45] sm:scale-100 print:scale-100 print:relative print:w-[210mm] print:h-[280mm]">
            {/* Single Formal Copy */}
            <ReceiptBlock title="KWITANSI RESMI" />
          </div>
          
        </div>
        
      </div>
    </div>
  )
}
