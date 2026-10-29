const SkeletonCard = () => (
  <div className="animate-pulse flex h-full flex-col rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-3.5 shadow-sm min-w-0">
    <div className="relative mb-2 sm:mb-2.5 aspect-square rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center" />
    <div className="h-2 sm:h-2.5 w-1/4 rounded-full bg-slate-200 mb-1" />
    <div className="h-3 sm:h-4 w-5/6 rounded-full bg-slate-200 mb-1.5" />
    <div className="h-2.5 sm:h-3 w-1/2 rounded-full bg-slate-200 mb-2" />
    <div className="h-3.5 sm:h-5 w-2/3 rounded-full bg-slate-200 mb-3" />
    <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
      <div className="h-7 sm:h-9 flex-1 rounded-lg sm:rounded-xl bg-slate-200" />
      <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-200 shrink-0" />
    </div>
  </div>
);

export default SkeletonCard;
