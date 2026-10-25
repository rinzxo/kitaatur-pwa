'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { 
  CheckCircle2, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  AlertCircle,
  HelpCircle,
  Users,
  Wallet,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react'
import { api, supabase } from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

export default function PromoTrialPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [copied, setCopied] = useState(false)
  const [promoUrl, setPromoUrl] = useState('https://kitatur.rinzgroup.web.id/promo/trial')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPromoUrl(`${window.location.origin}/promo/trial`)
    }

    const checkAuthAndStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUser(session.user)
          setLoadingStatus(true)
          try {
            const res = await api.get('/trial/status')
            setTrialStatus(res.data)
          } catch (err: any) {
            console.error('Error fetching trial status:', err)
          } finally {
            setLoadingStatus(false)
          }
        }
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthAndStatus()
  }, [])

  // Fungsi salin tautan promo
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promoUrl)
      setCopied(true)
      toast.success('Tautan promosi berhasil disalin!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Fungsi unduh QR Code sebagai gambar PNG
  const handleDownloadQR = () => {
    try {
      const svg = qrRef.current?.querySelector('svg')
      if (!svg) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      const padding = 36
      const qrSize = 320
      canvas.width = qrSize + padding * 2
      canvas.height = qrSize + padding * 2 + 70

      img.onload = () => {
        if (!ctx) return
        ctx.fillStyle = '#FFFFFF'
        if (ctx.roundRect) {
          ctx.roundRect(0, 0, canvas.width, canvas.height, 20)
        } else {
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.fill()

        ctx.drawImage(img, padding, padding, qrSize, qrSize)

        ctx.fillStyle = '#0F172A'
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('KitaAtur Plus • Uji Coba 7 Hari Gratis', canvas.width / 2, qrSize + padding + 36)

        ctx.fillStyle = '#64748B'
        ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText('Pindai untuk mengaktifkan akses organisasi tanpa biaya', canvas.width / 2, qrSize + padding + 54)

        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = 'kitaatur-trial-qr.png'
        downloadLink.href = pngFile
        downloadLink.click()
        toast.success('Gambar QR berhasil diunduh!')
      }

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
    } catch (e) {
      console.error('Download QR failed', e)
      toast.error('Gagal mengunduh gambar QR')
    }
  }

  // Fungsi klaim trial untuk pengguna yang login
  const handleClaimTrial = async () => {
    setClaiming(true)
    try {
      await api.post('/trial/claim')
      toast.success('Masa uji coba 7 Hari KitaAtur Plus berhasil diaktifkan!')
      
      setTimeout(() => {
        router.push('/org/create')
      }, 1000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Gagal mengklaim masa uji coba. Silakan periksa kembali akun Anda.'
      toast.error(errorMsg)
      try {
        const statusRes = await api.get('/trial/status')
        setTrialStatus(statusRes.data)
      } catch {}
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      <Toaster position="top-center" />

      {/* Header Navigasi Bersih */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm p-1.5 flex items-center justify-center border border-slate-200 group-hover:border-slate-300 transition-colors">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">KitaAtur</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            <Link 
              href="/" 
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/personal/dashboard"
                className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white shadow-sm"
              >
                Dasbor Akun
              </Link>
            ) : (
              <>
                <Link
                  href={`/login?redirect=${encodeURIComponent('/promo/trial')}`}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register?promo=trial7d"
                  className="text-xs font-bold bg-[#0087FF] hover:bg-[#0077E6] text-white px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Daftar Akun
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        
        {/* Header Teks */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#0087FF] font-bold tracking-wider uppercase text-xs mb-2">
            Promo Spesial Pengguna Baru
          </p>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            Uji Coba Gratis KitaAtur Plus 7 Hari
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal max-w-xl mx-auto">
            Nikmati akses penuh ke presensi digital QR, buku kas transparan, dan kelola anggota organisasi tanpa batas tanpa biaya dan tanpa kartu kredit.
          </p>
        </div>

        {/* Core Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          
          {/* Card Kiri: Fitur & Aktivasi (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                Fitur Lengkap yang Dapat Anda Akses
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 font-normal">
                Seluruh fitur paket KitaAtur Plus aktif penuh selama 7 hari tanpa batasan:
              </p>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-[#0087FF] shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900">Presensi QR Digital</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sesi presensi mandiri dengan perlindungan presensi ganda dan validasi foto.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-[#0087FF] shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900">Buku Kas Transparan</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pencatatan arus uang masuk dan keluar dapat dipantau langsung oleh seluruh anggota.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-[#0087FF] shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900">Anggota Tanpa Batas</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tidak ada batasan 100 orang. Hubungkan seluruh jajaran dan anggota organisasi.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-[#0087FF] shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900">Ekspor Laporan Excel</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Unduh rekap kehadiran dan riwayat keuangan organisasi dalam format Excel siap pakai.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="pt-4 border-t border-slate-100">
              {checkingAuth || loadingStatus ? (
                <div className="py-4 text-center">
                  <div className="w-5 h-5 border-2 border-[#0087FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Memeriksa kelayakan akun...</p>
                </div>
              ) : currentUser ? (
                <div>
                  {trialStatus?.hasActiveTrial ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Masa Uji Coba Anda Sedang Aktif</span>
                      </div>
                      <p className="text-xs text-emerald-700 mb-3">
                        Tersisa <strong className="font-bold">{trialStatus.trial?.daysLeft} hari</strong> akses penuh KitaAtur Plus.
                      </p>
                      <Link
                        href="/org/create"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
                      >
                        <span>Kelola / Buat Organisasi Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : trialStatus?.hasClaimedBefore ? (
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 mb-3">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm mb-1">
                        <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Masa Uji Coba Telah Digunakan</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">
                        Akun ini telah memanfaatkan fasilitas uji coba 7 hari. Anda dapat terus menggunakan fitur lengkap dengan berlangganan.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
                      >
                        <span>Lihat Paket Berlangganan</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimTrial}
                      disabled={claiming}
                      className="w-full py-3.5 px-6 bg-[#0087FF] hover:bg-[#0077E6] disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      {claiming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengaktifkan Uji Coba...</span>
                        </>
                      ) : (
                        <>
                          <span>Aktifkan Trial 7 Hari Sekarang</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/register?promo=trial7d"
                    className="w-full py-3.5 px-6 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-sm text-center transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Daftar Akun & Mulai Uji Coba</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-center text-xs text-slate-500 font-medium">
                    Sudah memiliki akun terdaftar?{' '}
                    <Link href={`/login?redirect=${encodeURIComponent('/promo/trial')}`} className="text-[#0087FF] font-bold hover:underline">
                      Masuk di sini
                    </Link>
                  </p>
                </div>
              )}

              {/* Assurances */}
              <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Tanpa kartu kredit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0087FF]" /> Akses 7 hari penuh
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Data tersimpan aman
                </span>
              </div>
            </div>

          </div>

          {/* Card Kanan: QR Code Promo (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col items-center justify-between text-center">
            
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
                Pindai dari Smartphone
              </h3>
              <p className="text-xs text-slate-500 font-normal mb-5 leading-relaxed">
                Arahkan kamera ponsel Anda ke QR code ini untuk langsung membuka halaman aktivasi uji coba.
              </p>

              {/* QR Container */}
              <div 
                ref={qrRef}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 inline-block mb-4"
              >
                <QRCodeSVG 
                  value={promoUrl} 
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Utility Actions */}
            <div className="w-full space-y-2 mt-2 pt-4 border-t border-slate-100">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Promosi'}</span>
              </button>

              <button
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0087FF] hover:bg-[#0077E6] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar QR (Format PNG)</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center pt-1 font-normal">
                Bisa dicetak untuk pamflet, poster komunitas, atau story media sosial.
              </p>
            </div>

          </div>

        </div>

        {/* FAQ & Kebijakan Transparansi */}
        <div className="max-w-4xl mx-auto pt-6 border-t border-slate-200">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
              Pertanyaan Seputar Masa Uji Coba
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm font-normal">
              Informasi lengkap seputar ketentuan penggunaan dan masa aktif trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0087FF] shrink-0" />
                <span>Apakah ada pemotongan saldo atau kartu kredit?</span>
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Tidak. Kami tidak pernah meminta nomor kartu kredit, nomor rekening, ataupun deposit dana. Masa uji coba ini 100% gratis tanpa komitmen finansial.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0087FF] shrink-0" />
                <span>Apa yang terjadi setelah masa 7 hari berakhir?</span>
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Seluruh data organisasi, buku kas, dan riwayat presensi tetap tersimpan dengan aman. Anda dapat melanjutkan akses penuh kapan saja dengan memilih paket langganan.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0087FF] shrink-0" />
                <span>Berapa anggota yang dapat saya undang?</span>
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Paket KitaAtur Plus kini mendukung anggota tanpa batas (unlimited). Anda dapat mengundang seluruh jajaran dan anggota organisasi Anda tanpa batasan 100 orang.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0087FF] shrink-0" />
                <span>Bagaimana kebijakan penggunaan uji coba ini?</span>
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Setiap profil berhak mengklaim 1 kali masa uji coba. Sistem kami memvalidasi keaslian alamat email dan membatasi frekuensi klaim per IP demi menjaga kualitas ekosistem.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 font-normal">
        <p>© {new Date().getFullYear()} KitaAtur. Solusi Manajemen Komunitas & Presensi Terpadu.</p>
      </footer>
    </div>
  )
}
