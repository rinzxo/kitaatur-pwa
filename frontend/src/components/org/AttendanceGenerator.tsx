'use client'
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, QrCode } from "lucide-react";
import { generateAttendanceToken } from "@/app/actions/attendance";

interface AttendanceGeneratorProps {
  orgId: string;
  initialToken: string;
}

export function AttendanceGenerator({ orgId, initialToken }: AttendanceGeneratorProps) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await generateAttendanceToken(orgId);
      if (res.success && res.token) {
        setToken(res.token);
        setFeedback({ message: "QR Code absensi berhasil diperbarui.", type: "success" });
      } else {
        setFeedback({ message: res.error || "Gagal memperbarui QR Code.", type: "error" });
      }
    } catch (err) {
      setFeedback({ message: "Terjadi kesalahan sistem.", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-6 text-center border-b border-slate-200">
        <div className="mx-auto bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4 border border-blue-100">
          <QrCode className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">QR Code Absensi</h3>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Minta member untuk scan QR Code ini untuk mencatat kehadiran hari ini.
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

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <QRCodeSVG
            value={token}
            size={256}
            level={"H"}
            includeMargin={true}
            className="w-full h-auto max-w-[256px]"
          />
        </div>
        <div className="mt-6 text-center text-sm text-slate-500 font-medium">
          QR Code ini valid untuk hari ini.
        </div>
      </div>
      
      <div className="p-6 pt-0 flex justify-center">
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl shadow-sm font-bold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Perbarui QR Code
        </button>
      </div>
    </div>
  );
}
