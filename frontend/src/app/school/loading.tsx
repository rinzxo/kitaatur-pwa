export default function SchoolLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded-md mb-3" />
            <div className="h-8 w-60 bg-slate-300 rounded-xl" />
            <div className="h-4 w-44 bg-slate-200 rounded-md mt-2" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>

        {/* Search bar skeleton */}
        <div className="h-14 w-full bg-white border border-slate-200 rounded-2xl shadow-sm" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-5 w-44 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-28 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
