'use client'
import toast from 'react-hot-toast'
import { useState, useEffect, Suspense } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

function PrintGuestsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string
  const sessionId = searchParams?.get('sessionId')

  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/org-attendance/${orgSlug}/guests`)
      setGuests(res.data)
    } catch (err) {
      toast.error('Gagal memuat daftar peserta eksternal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Non-printable Header */}
      <div className="print:hidden border-b border-slate-200 p-4 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Cetak Dokumen
        </button>
      </div>

      <div className="p-8 max-w-[210mm] mx-auto print:max-w-none print:p-0">
        <div className="print:hidden mb-8 text-center">
          <h1 className="text-2xl font-black">Cetak QR Code Peserta</h1>
          <p className="text-slate-500">Pastikan margin diatur ke "None" atau minimal pada pengaturan cetak browser Anda.</p>
        </div>

        {guests.length === 0 ? (
          <div className="text-center text-slate-500 py-10 print:hidden">Belum ada tamu.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-4 gap-6">
            {guests.map((guest, idx) => (
              <div key={guest.id} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center break-inside-avoid">
                <div className="bg-white p-2 rounded-lg mb-3">
                  <QRCodeSVG 
                    value={guest.identifier || guest.qr_token} 
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <h3 className="font-bold text-slate-800 text-sm line-clamp-2" title={guest.name}>{guest.name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{guest.identifier}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PrintGuestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>}>
      <PrintGuestsContent />
    </Suspense>
  )
}
