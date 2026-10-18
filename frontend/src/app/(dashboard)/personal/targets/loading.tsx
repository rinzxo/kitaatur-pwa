export default function TargetsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden animate-pulse font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="h-3 w-28 bg-slate-200 rounded-md mb-3" />
            <div className="h-8 w-64 bg-slate-300 rounded-xl" />
            <div className="h-4 w-52 bg-slate-200 rounded-md mt-2" />
          </div>
          <div className="h-11 w-36 bg-slate-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-5 w-36 bg-slate-200 rounded-md" />
                <div className="w-6 h-6 bg-slate-100 rounded-full" />
              </div>
              <div className="h-7 w-28 bg-slate-300 rounded-lg" />
              <div className="h-3 w-full bg-slate-100 rounded-full" />
              <div className="flex justify-between pt-2">
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-4 w-12 bg-slate-200 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
