export default function OrgMembersLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 p-4 md:p-8 animate-pulse font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded-md mb-2" />
            <div className="h-8 w-52 bg-slate-300 rounded-xl" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-5 w-44 bg-slate-200 rounded-md" />
                  <div className="h-3 w-28 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-7 w-20 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
