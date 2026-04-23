"use client";

import { useState } from "react";

type Props = { label?: string; className?: string };

export function ShareButton({ label = "Copy link", className }: Props): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        if (typeof window === "undefined") return;
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      }
      aria-live="polite"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
