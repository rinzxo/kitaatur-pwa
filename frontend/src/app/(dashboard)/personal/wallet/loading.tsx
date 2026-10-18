export default function WalletLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden animate-pulse font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="h-3 w-28 bg-slate-200 rounded-md mb-3" />
          <div className="h-8 w-64 bg-slate-300 rounded-xl" />
          <div className="h-4 w-44 bg-slate-200 rounded-md mt-2" />
        </div>

        <div className="h-36 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-48 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                <div className="w-16 h-6 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-7 w-40 bg-slate-300 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
