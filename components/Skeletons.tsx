export function LaunchCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="skeleton h-20 w-20 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
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
