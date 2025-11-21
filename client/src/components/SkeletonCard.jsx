const SkeletonCard = () => (
  <div className="animate-pulse rounded-3xl border border-white/50 bg-white/80 p-5 shadow-card backdrop-blur">
    <div className="relative h-60 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
      <span className="absolute inset-6 rounded-2xl border border-white/40" />
    </div>
    <div className="mt-4 h-3 w-2/3 rounded-full bg-slate-200" />
    <div className="mt-2 h-3 w-full rounded-full bg-slate-200" />
    <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
    <div className="mt-4 flex gap-3">
      <div className="h-11 flex-1 rounded-full bg-slate-200" />
      <div className="h-11 w-11 rounded-full bg-slate-200" />
    </div>
  </div>
);

export default SkeletonCard;
