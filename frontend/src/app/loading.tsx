export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full space-y-8 animate-pulse relative z-10">
        {/* Top Bar Skeleton */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="h-6 w-36 bg-slate-200 rounded-lg" />
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
        </div>

        {/* Hero / Banner Skeleton */}
        <div className="h-44 md:h-52 bg-slate-200 rounded-3xl" />

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-56 flex flex-col justify-between">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-56 flex flex-col justify-between">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-56 flex flex-col justify-between hidden md:flex">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded-lg mb-6" />
          <div className="h-14 bg-slate-50 rounded-2xl" />
          <div className="h-14 bg-slate-50 rounded-2xl" />
          <div className="h-14 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
