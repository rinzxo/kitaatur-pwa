export default function PersonalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans relative animate-pulse">
      <header className="flex justify-between items-center p-4 md:px-8 max-w-4xl mx-auto pt-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
          <div className="w-28 h-8 rounded-lg bg-slate-200"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:px-8 pb-32">
        <div className="h-40 md:h-48 bg-slate-200 rounded-3xl mb-6"></div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <div className="h-6 w-48 bg-slate-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl"></div>)}
          </div>
        </div>
      </main>
    </div>
  )
}
