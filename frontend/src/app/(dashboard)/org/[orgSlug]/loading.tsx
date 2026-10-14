export default function OrgLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans relative animate-pulse">
      <header className="flex justify-between items-center p-4 md:px-8 max-w-4xl mx-auto pt-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200"></div>
          <div className="w-32 h-8 rounded-full bg-slate-200"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:px-8 pb-32">
        <div className="h-48 md:h-56 bg-slate-200 rounded-3xl mb-6"></div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 md:h-32 bg-slate-200 rounded-2xl md:rounded-3xl"></div>)}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </main>
    </div>
  )
}
