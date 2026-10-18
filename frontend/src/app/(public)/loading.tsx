export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-pulse space-y-6">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto" />
        <div className="space-y-3 text-center">
          <div className="h-6 w-3/4 bg-slate-200 rounded-lg mx-auto" />
          <div className="h-4 w-1/2 bg-slate-100 rounded-md mx-auto" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-12 bg-slate-100 rounded-xl w-full" />
          <div className="h-12 bg-slate-100 rounded-xl w-full" />
          <div className="h-12 bg-slate-200 rounded-xl w-full mt-6" />
        </div>
      </div>
    </div>
  )
}
