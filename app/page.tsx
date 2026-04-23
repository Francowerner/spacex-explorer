import { Suspense } from "react";
import { LaunchesList } from "@/components/LaunchesList";
import { LaunchCardSkeleton } from "@/components/Skeletons";
import { searchParamsRecordToString } from "@/lib/serialize-search-params";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const initialQueryString = searchParamsRecordToString(sp);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Launches</h1>
        <p className="text-sm text-zinc-600">
          Browse every SpaceX mission. Search by name, filter by status or date, and save the ones
          you care about.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-3" aria-busy="true" aria-label="Loading launches">
            {Array.from({ length: 6 }).map((_, i) => (
              <LaunchCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <LaunchesList initialQueryString={initialQueryString} />
      </Suspense>
    </div>
  );
}
