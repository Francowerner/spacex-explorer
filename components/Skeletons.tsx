export function LaunchCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white"
    >
      <div className="skeleton aspect-square w-full rounded-t-xl" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function LaunchDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-2/3 rounded" />
      <div className="skeleton h-5 w-1/3 rounded" />
      <div className="skeleton h-40 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}
