import { notFound } from "next/navigation";
import Image from "next/image";
import { BackToLaunchesNav } from "@/components/BackToLaunchesNav";
import type { Metadata } from "next";
import { getLaunchById } from "@/lib/api/launches";
import { getRocketById } from "@/lib/api/rockets";
import { getLaunchpadById } from "@/lib/api/launchpads";
import { ApiError } from "@/lib/api/client";
import { formatLaunchDate } from "@/lib/format";
import { LaunchGallery } from "@/components/LaunchGallery";
import { FavoriteButton } from "@/components/FavoriteButton";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const launch = await getLaunchById(id);
    return {
      title: `${launch.name} · SpaceX Explorer`,
      description: launch.details ?? `Details for SpaceX launch ${launch.name}.`,
    };
  } catch {
    return { title: "Launch · SpaceX Explorer" };
  }
}

export default async function LaunchDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let launch;
  try {
    launch = await getLaunchById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [rocket, launchpad] = await Promise.all([
    launch.rocket ? safe(() => getRocketById(launch.rocket as string)) : Promise.resolve(null),
    launch.launchpad
      ? safe(() => getLaunchpadById(launch.launchpad as string))
      : Promise.resolve(null),
  ]);

  const patch = launch.links?.patch?.large ?? launch.links?.patch?.small ?? null;
  const flickr = launch.links?.flickr?.original ?? [];
  const statusLabel = launch.upcoming
    ? "Upcoming"
    : launch.success === true
      ? "Success"
      : launch.success === false
        ? "Failure"
        : "Unknown";

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-600">
        <BackToLaunchesNav className="cursor-pointer bg-transparent p-0 font-inherit text-inherit hover:underline" />
      </nav>

      <header className="flex flex-row items-start gap-3 sm:gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-28 sm:w-28">
          {patch ? (
            <Image
              src={patch}
              alt={`${launch.name} mission patch`}
              fill
              sizes="(max-width: 639px) 80px, 112px"
              className="object-contain p-1.5 sm:p-2"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-0.5 text-center text-[10px] font-medium leading-tight text-zinc-800 sm:px-1 sm:text-xs">
              No patch
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2 sm:gap-3">
            <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {launch.name}
            </h1>
            <FavoriteButton
              size="sm"
              className="shrink-0"
              launch={{
                id: launch.id,
                name: launch.name,
                date_utc: launch.date_utc,
                success: launch.success,
                upcoming: launch.upcoming,
                patchUrl: patch,
                addedAt: 0,
              }}
            />
          </div>
          <p className="text-sm text-zinc-600">
            <time dateTime={launch.date_utc}>{formatLaunchDate(launch.date_utc)}</time>
            {typeof launch.flight_number === "number" ? ` · Flight #${launch.flight_number}` : ""}
            {" · "}
            <span
              className={
                launch.upcoming
                  ? "text-sky-800"
                  : launch.success
                    ? "text-emerald-800"
                    : launch.success === false
                      ? "text-rose-800"
                      : "text-zinc-700"
              }
            >
              {statusLabel}
            </span>
          </p>
          {launch.details ? (
            <p className="max-w-prose text-zinc-700">{launch.details}</p>
          ) : (
            <p className="text-sm italic text-zinc-600">No mission details provided.</p>
          )}
          <LaunchLinks links={launch.links} />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Rocket">
          {rocket ? (
            <div className="space-y-1">
              <p className="text-base font-medium">{rocket.name}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-600">{rocket.type}</p>
              {rocket.description ? (
                <p className="line-clamp-4 text-sm text-zinc-600">
                  {rocket.description}
                </p>
              ) : null}
              {rocket.wikipedia ? (
                <a
                  href={rocket.wikipedia}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-sky-600 hover:underline"
                >
                  Wikipedia ↗
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Rocket data unavailable.</p>
          )}
        </InfoCard>

        <InfoCard title="Launchpad">
          {launchpad ? (
            <div className="space-y-1">
              <p className="text-base font-medium">{launchpad.full_name}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-600">
                {[launchpad.locality, launchpad.region].filter(Boolean).join(", ")}
              </p>
              {launchpad.details ? (
                <p className="line-clamp-4 text-sm text-zinc-600">
                  {launchpad.details}
                </p>
              ) : null}
              <p className="text-xs text-zinc-600">Status: {launchpad.status}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Launchpad data unavailable.</p>
          )}
        </InfoCard>
      </div>

      <LaunchGallery images={flickr} alt={launch.name} />
    </article>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">{title}</h2>
      {children}
    </section>
  );
}

function LaunchLinks({ links }: { links: NonNullable<Awaited<ReturnType<typeof getLaunchById>>["links"]> | undefined }) {
  if (!links) return null;
  const items: { label: string; href: string }[] = [];
  if (links.webcast) items.push({ label: "Webcast", href: links.webcast });
  if (links.wikipedia) items.push({ label: "Wikipedia", href: links.wikipedia });
  if (links.article) items.push({ label: "Article", href: links.article });
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700 hover:border-sky-400 hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            {item.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
