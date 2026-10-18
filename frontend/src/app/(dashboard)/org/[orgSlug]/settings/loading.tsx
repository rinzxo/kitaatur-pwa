export default function OrgSettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 p-4 md:p-8 animate-pulse font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="h-4 w-32 bg-slate-200 rounded-md mb-3" />
          <div className="h-8 w-60 bg-slate-300 rounded-xl" />
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-200 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-36 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-200 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
