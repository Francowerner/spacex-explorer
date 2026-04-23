"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryLaunches } from "@/lib/api/launches";
import { useDebounce } from "@/hooks/useDebounce";

type Slot = "a" | "b";

type Props = {
  slot: Slot;
  selectedId: string | null;
  selectedLabel?: string | null;
};

export function ComparePicker({ slot, selectedId, selectedLabel }: Props): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounced = useDebounce(term, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["compare-picker", debounced],
    queryFn: ({ signal }) =>
      queryLaunches({
        page: 1,
        filters: { search: debounced },
        sort: { field: "date_utc", direction: "desc" },
        signal,
      }),
    enabled: debounced.trim().length >= 2,
    staleTime: 60_000,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => data?.docs ?? [], [data]);

  const pick = (id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set(slot, id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setOpen(false);
    setTerm("");
  };

  const clear = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(slot);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={`compare-${slot}`}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600"
      >
        Launch {slot.toUpperCase()}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`compare-${slot}`}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={`compare-${slot}-listbox`}
          aria-autocomplete="list"
          placeholder={selectedLabel ?? "Search missions…"}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        />
        {selectedId ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 hover:text-rose-500"
            aria-label={`Clear launch ${slot.toUpperCase()}`}
          >
            Clear
          </button>
        ) : null}
      </div>
      {selectedLabel ? (
        <p className="mt-1 text-xs text-zinc-600">
          Selected: <span className="font-medium text-zinc-800">{selectedLabel}</span>
        </p>
      ) : null}

      {open && debounced.trim().length >= 2 ? (
        <ul
          id={`compare-${slot}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg"
        >
          {isFetching ? (
            <li className="px-3 py-2 text-xs text-zinc-600">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-zinc-600">No missions match.</li>
          ) : (
            results.slice(0, 10).map((r) => (
              <li key={r.id} role="option" aria-selected={r.id === selectedId}>
                <button
                  type="button"
                  onClick={() => pick(r.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-100"
                >
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {new Date(r.date_utc).getUTCFullYear()}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {term.trim().length > 0 && term.trim().length < 2 ? (
        <p className="absolute left-0 right-0 mt-1 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
          Type at least 2 characters…
        </p>
      ) : null}

      {!selectedId && !term ? (
        <p className="mt-1 text-xs text-zinc-600">
          Tip: <Link href="/" className="font-medium text-sky-800 underline">browse launches</Link> and come back.
        </p>
      ) : null}
    </div>
  );
}
