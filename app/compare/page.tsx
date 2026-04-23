import type { Metadata } from "next";
import Link from "next/link";
import { BackToLaunchesNav } from "@/components/BackToLaunchesNav";
import Image from "next/image";
import { getLaunchById } from "@/lib/api/launches";
import { getRocketById } from "@/lib/api/rockets";
import { getLaunchpadById } from "@/lib/api/launchpads";
import type { Launch, Launchpad, Rocket } from "@/lib/api/schemas";
import { formatLaunchDate } from "@/lib/format";
import { ComparePicker } from "@/components/ComparePicker";
import { ShareButton } from "@/components/ShareButton";

type SearchParams = Promise<{ a?: string; b?: string }>;

export const metadata: Metadata = {
  title: "Compare launches · SpaceX Explorer",
  description: "Side-by-side comparison of two SpaceX missions. Share the URL to share the pair.",
};

type Slot = {
  launch: Launch | null;
  rocket: Rocket | null;
  launchpad: Launchpad | null;
  error: string | null;
};

async function loadSlot(id: string | undefined): Promise<Slot> {
  if (!id) return { launch: null, rocket: null, launchpad: null, error: null };
  try {
    const launch = await getLaunchById(id);
    const [rocket, launchpad] = await Promise.all([
      launch.rocket ? safe(() => getRocketById(launch.rocket as string)) : Promise.resolve(null),
      launch.launchpad
        ? safe(() => getLaunchpadById(launch.launchpad as string))
        : Promise.resolve(null),
    ]);
    return { launch, rocket, launchpad, error: null };
  } catch (error) {
    return {
      launch: null,
      rocket: null,
      launchpad: null,
      error: error instanceof Error ? error.message : "Failed to load launch",
    };
  }
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { a, b } = await searchParams;

  const [slotA, slotB] = await Promise.all([loadSlot(a), loadSlot(b)]);
  const both = slotA.launch && slotB.launch;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
          <BackToLaunchesNav className="cursor-pointer bg-transparent p-0 font-inherit text-inherit hover:underline" />
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Compare launches</h1>
          {both ? <ShareButton label="Copy share link" /> : null}
        </div>
        <p className="text-sm text-zinc-600">
          Pick two missions to see date, outcome, rocket and launchpad side by side. The URL updates
          as you choose — share it to share the pair.
        </p>
      </header>

      <section
        aria-label="Pickers"
        className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2"
      >
        <ComparePicker slot="a" selectedId={a ?? null} selectedLabel={slotA.launch?.name ?? null} />
        <ComparePicker slot="b" selectedId={b ?? null} selectedLabel={slotB.launch?.name ?? null} />
      </section>

      {slotA.error || slotB.error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <p>{slotA.error ?? slotB.error}</p>
        </div>
      ) : null}

      {both ? (
        <section aria-label="Comparison" className="grid gap-4 sm:grid-cols-2">
          <ComparisonCard slot={slotA} label="A" accent="sky" />
          <ComparisonCard slot={slotB} label="B" accent="violet" />
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
          {slotA.launch || slotB.launch
            ? "Pick one more mission to compare."
            : "Pick two missions to start the comparison."}
        </div>
      )}

      {both ? <ComparisonMatrix a={slotA} b={slotB} /> : null}
    </div>
  );
}

function ComparisonCard({
  slot,
  label,
  accent,
}: {
  slot: Slot;
  label: string;
  accent: "sky" | "violet";
}): React.JSX.Element {
  const { launch, rocket, launchpad } = slot;
  if (!launch) return <div />;
  const patch = launch.links?.patch?.large ?? launch.links?.patch?.small ?? null;
  const statusLabel = launch.upcoming
    ? "Upcoming"
    : launch.success === true
      ? "Success"
      : launch.success === false
        ? "Failure"
        : "Unknown";
  const borderColor = accent === "sky" ? "border-sky-400/60" : "border-violet-400/60";
  const badgeColor =
    accent === "sky"
      ? "bg-sky-100 text-sky-950"
      : "bg-violet-100 text-violet-950";

  return (
    <article
      className={`rounded-xl border-2 ${borderColor} bg-white p-4 space-y-3`}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          {patch ? (
            <Image
              src={patch}
              alt={`${launch.name} patch`}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-0.5 text-center text-[10px] font-medium leading-tight text-zinc-800">
              No patch
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeColor}`}>
            {label}
          </span>
          <h2 className="mt-1 truncate text-lg font-semibold">
            <Link href={`/launches/${launch.id}`} className="hover:underline">
              {launch.name}
            </Link>
          </h2>
          <p className="text-xs text-zinc-600">
            <time dateTime={launch.date_utc}>{formatLaunchDate(launch.date_utc)}</time>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-xs uppercase tracking-wide text-zinc-600">Status</dt>
        <dd
          className={
            launch.upcoming
              ? "text-sky-600"
              : launch.success
                ? "text-emerald-600"
                : launch.success === false
                  ? "text-rose-600"
                  : "text-zinc-700"
          }
        >
          {statusLabel}
        </dd>
        <dt className="text-xs uppercase tracking-wide text-zinc-600">Flight #</dt>
        <dd>{launch.flight_number ?? "—"}</dd>
        <dt className="text-xs uppercase tracking-wide text-zinc-600">Rocket</dt>
        <dd>{rocket ? `${rocket.name} (${rocket.type})` : "—"}</dd>
        <dt className="text-xs uppercase tracking-wide text-zinc-600">Launchpad</dt>
        <dd className="truncate">{launchpad ? launchpad.full_name : "—"}</dd>
        <dt className="text-xs uppercase tracking-wide text-zinc-600">Location</dt>
        <dd className="truncate">
          {launchpad
            ? [launchpad.locality, launchpad.region].filter(Boolean).join(", ") || "—"
            : "—"}
        </dd>
      </dl>
    </article>
  );
}

function ComparisonMatrix({ a, b }: { a: Slot; b: Slot }): React.JSX.Element | null {
  if (!a.launch || !b.launch) return null;
  const rows: { label: string; a: string; b: string; diff?: boolean }[] = [
    {
      label: "Date",
      a: formatLaunchDate(a.launch.date_utc),
      b: formatLaunchDate(b.launch.date_utc),
      diff: a.launch.date_utc !== b.launch.date_utc,
    },
    {
      label: "Outcome",
      a: outcome(a.launch.upcoming, a.launch.success),
      b: outcome(b.launch.upcoming, b.launch.success),
    },
    {
      label: "Rocket",
      a: a.rocket?.name ?? "—",
      b: b.rocket?.name ?? "—",
      diff: (a.rocket?.id ?? null) !== (b.rocket?.id ?? null),
    },
    {
      label: "Launchpad",
      a: a.launchpad?.full_name ?? "—",
      b: b.launchpad?.full_name ?? "—",
      diff: (a.launchpad?.id ?? null) !== (b.launchpad?.id ?? null),
    },
  ];

  return (
    <section
      aria-label="Side by side"
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
    >
      <table className="w-full text-sm">
        <caption className="sr-only">Side-by-side comparison matrix</caption>
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-800">
            <th scope="col" className="w-32 px-3 py-2 font-semibold">Field</th>
            <th scope="col" className="px-3 py-2 font-semibold">A · {a.launch.name}</th>
            <th scope="col" className="px-3 py-2 font-semibold">B · {b.launch.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-zinc-100 last:border-0">
              <th scope="row" className="px-3 py-2 text-left font-medium text-zinc-700">
                {row.label}
              </th>
              <td className={`px-3 py-2 ${row.diff ? "font-medium" : ""}`}>{row.a}</td>
              <td className={`px-3 py-2 ${row.diff ? "font-medium" : ""}`}>{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function outcome(upcoming: boolean, success: boolean | null): string {
  if (upcoming) return "Upcoming";
  if (success === true) return "Success";
  if (success === false) return "Failure";
  return "Unknown";
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
