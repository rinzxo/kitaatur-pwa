'use client'
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { processAttendanceScan } from "@/app/actions/attendance";
import { Loader2, Camera, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ScanAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleScan = async (detectedCodes: any[]) => {
    if (loading || result) return; // Prevent multiple scans while processing or if already got a result
    
    if (detectedCodes && detectedCodes.length > 0) {
      const token = detectedCodes[0].rawValue;
      if (!token) return;

      setLoading(true);
      try {
        const res = await processAttendanceScan(token);
        setResult({
          success: res.success,
          message: res.message,
          error: res.error,
        });

        if (res.success) {
          setFeedback({ message: "Kehadiran Anda telah dicatat.", type: "success" });
        } else {
          setFeedback({ message: res.error || "QR Code tidak valid.", type: "error" });
        }
      } catch (err) {
        setResult({
          success: false,
          error: "Terjadi kesalahan sistem.",
        });
        setFeedback({ message: "Terjadi kesalahan sistem saat memproses QR Code.", type: "error" });
      } finally {
        setLoading(false);
        setTimeout(() => setFeedback(null), 3000);
      }
    }
  };

  const handleReset = () => {
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md mx-auto mt-10 relative z-10">
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 text-center border-b border-slate-200">
            <div className="mx-auto bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Scan Absensi</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Arahkan kamera ke QR Code absensi organisasi Anda.
            </p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
            
            {feedback && (
              <div className={`w-full mb-4 px-4 py-3 rounded-xl text-sm text-center font-medium shadow-sm ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {feedback.message}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-sm text-slate-500 font-medium">Memproses absensi...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-black aspect-square shadow-sm">
                <Scanner
                  onScan={(detectedCodes) => handleScan(detectedCodes)}
                  formats={["qr_code"]}
                  styles={{
                    container: { width: "100%", height: "100%" },
                  }}
                />
              </div>
            )}

            {result && (
              <div className="flex flex-col items-center justify-center py-8 w-full text-center">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Berhasil!</h3>
                    <p className="text-slate-500 font-medium mb-6">{result.message}</p>
                    <Link href="/dashboard" passHref className="w-full">
                      <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
                        Kembali ke Dashboard
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-rose-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Gagal</h3>
                    <p className="text-slate-500 font-medium mb-6">{result.error}</p>
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={handleReset} 
                        className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-all"
                      >
                        Coba Lagi
                      </button>
                      <Link href="/dashboard" passHref className="flex-1">
                        <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
                          Dashboard
                        </button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
