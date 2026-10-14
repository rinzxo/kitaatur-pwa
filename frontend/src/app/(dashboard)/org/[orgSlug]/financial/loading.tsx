export default function FinancialLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <div>
            <div className="h-7 w-36 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 w-48 bg-slate-100 rounded-md"></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <div className="h-6 w-40 bg-slate-200 rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
