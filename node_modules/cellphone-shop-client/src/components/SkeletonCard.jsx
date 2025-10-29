const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl bg-white p-4 shadow">
    <div className="h-56 rounded-lg bg-slate-200" />
    <div className="mt-4 h-3 w-2/3 rounded bg-slate-200" />
    <div className="mt-2 h-3 w-full rounded bg-slate-200" />
    <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
    <div className="mt-3 flex gap-3">
      <div className="h-9 flex-1 rounded-full bg-slate-200" />
      <div className="h-9 w-9 rounded-full bg-slate-200" />
    </div>
  </div>
);

export default SkeletonCard;
