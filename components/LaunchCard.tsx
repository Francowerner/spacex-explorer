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
        className="flex h-full gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {patch ? (
            <Image
              src={patch}
              alt=""
              fill
              sizes="80px"
              className="object-contain p-1"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              No patch
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {launch.name}
            </h3>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <time dateTime={launch.date_utc}>{formatLaunchDate(launch.date_utc)}</time>
            {typeof launch.flight_number === "number" ? ` · Flight #${launch.flight_number}` : ""}
          </p>
          {launch.details ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
              {launch.details}
            </p>
          ) : (
            <p className="mt-1 text-sm italic text-zinc-400">No mission details available.</p>
          )}
        </div>
      </Link>
      <div className="absolute right-3 top-3">
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
    upcoming: "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-800",
    success:
      "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800",
    failure: "bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-300 dark:border-rose-800",
    unknown:
      "bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700",
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
