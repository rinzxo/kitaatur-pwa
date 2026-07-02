import { Loader2 } from 'lucide-react'

export default function DashboardGlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col relative overflow-hidden">
      {/* Decorative background glow to match our premium aesthetic */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full space-y-8 animate-pulse relative z-10">
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            {/* Back button or tiny subtitle */}
            <div className="h-3 w-32 bg-slate-200 rounded-md mb-4"></div>
            {/* Main Title */}
            <div className="h-9 w-64 bg-slate-300 rounded-xl"></div>
            {/* Description */}
            <div className="h-4 w-48 bg-slate-200 rounded-md mt-3"></div>
          </div>
          <div className="flex items-center gap-3">
            {/* Action buttons */}
            <div className="h-11 w-32 bg-slate-200 rounded-xl hidden sm:block"></div>
            <div className="h-11 w-11 bg-slate-200 rounded-xl"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col min-h-[250px]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-6"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mx-auto mb-3"></div>
            <div className="h-4 w-5/6 bg-slate-100 rounded-lg mx-auto mb-8"></div>
            <div className="h-12 w-full bg-slate-100 rounded-xl mt-auto"></div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col min-h-[250px]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-6"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mx-auto mb-3"></div>
            <div className="h-4 w-5/6 bg-slate-100 rounded-lg mx-auto mb-8"></div>
            <div className="h-12 w-full bg-slate-100 rounded-xl mt-auto"></div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 hidden md:flex flex-col min-h-[250px]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-6"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mx-auto mb-3"></div>
            <div className="h-4 w-5/6 bg-slate-100 rounded-lg mx-auto mb-8"></div>
            <div className="h-12 w-full bg-slate-100 rounded-xl mt-auto"></div>
          </div>

        </div>

        {/* Large table or bottom area skeleton */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 mt-8 hidden lg:block">
           <div className="h-6 w-48 bg-slate-200 rounded-lg mb-6"></div>
           <div className="space-y-4">
             <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
             <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
             <div className="h-12 w-full bg-slate-50 rounded-xl"></div>
           </div>
        </div>

      </div>
      
      {/* Central Spinner for extra feedback */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-20">
        <Loader2 className="w-16 h-16 text-slate-400 animate-spin" />
      </div>
    </div>
  )
}
