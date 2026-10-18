export default function SchoolDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="w-20 h-20 bg-slate-200 rounded-2xl mx-auto" />
        <div className="space-y-3 text-center">
          <div className="h-6 w-48 bg-slate-200 rounded-lg mx-auto" />
          <div className="h-4 w-64 bg-slate-100 rounded-md mx-auto" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-14 bg-slate-100 rounded-2xl w-full" />
          <div className="h-14 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  )
}
