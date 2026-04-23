"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import type { Launch } from "@/lib/api/schemas";
import { FavoriteButton } from "./FavoriteButton";
import { formatLaunchDate } from "@/lib/format";

type Props = {
  launch: Launch;
};

function LaunchCardImpl({ launch }: Props) {
  const patch = launch.links?.patch?.small ?? launch.links?.patch?.large ?? null;
  const status = getStatus(launch);

  return (
    <article className="group relative h-full">
      <Link
        href={`/launches/${launch.id}`}
        className="flex h-full flex-row overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:flex-col"
      >
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-l-xl bg-zinc-100 sm:w-full sm:rounded-l-none sm:rounded-t-xl">
          {patch ? (
            <Image
              src={patch}
              alt={`${launch.name} mission patch`}
              fill
              sizes="(max-width: 639px) 112px, (max-width: 1023px) 44vw, (max-width: 1279px) 30vw, 238px"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs font-medium text-zinc-800">
              No patch
            </div>
          )}
          <div className="absolute left-2 top-2">
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:justify-start">
          <h3 className="truncate pr-1 text-sm font-semibold text-zinc-900">
            {launch.name}
          </h3>
          <p className="truncate text-xs text-zinc-600">
            <time dateTime={launch.date_utc}>{formatLaunchDate(launch.date_utc)}</time>
          </p>
          {typeof launch.flight_number === "number" ? (
            <p className="text-[11px] uppercase tracking-wide text-zinc-600">
              Flight #{launch.flight_number}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <FavoriteButton
          size="sm"
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
    </article>
  );
}

export const LaunchCard = memo(LaunchCardImpl);

type Status = "upcoming" | "success" | "failure" | "unknown";

function getStatus(launch: Launch): Status {
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  if (launch.success === false) return "failure";
  return "unknown";
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    upcoming: "border-sky-300 bg-sky-100 text-sky-950",
    success: "border-emerald-300 bg-emerald-100 text-emerald-950",
    failure: "border-rose-300 bg-rose-100 text-rose-950",
    unknown: "border-zinc-300 bg-zinc-200 text-zinc-900",
  };
  const label: Record<Status, string> = {
    upcoming: "Upcoming",
    success: "Success",
    failure: "Failure",
    unknown: "Unknown",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      {label[status]}
    </span>
  );
}
