import { ArrowLeft } from 'lucide-react'

export default function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <div>
            <div className="h-7 w-40 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 w-56 bg-slate-100 rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-32"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
