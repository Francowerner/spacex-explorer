"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefer real history back (preserves filter query strings). Falls back to same-origin
 * referrer for “open in new tab” flows, then to `/`.
 */
export function BackToLaunchesNav({
  className,
  children = "← Back to launches",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  const onNavigate = useCallback(() => {
    if (typeof window === "undefined") return;

    if (window.history.length > 1) {
      router.back();
      return;
    }

    const ref = document.referrer;
    if (ref) {
      try {
        const u = new URL(ref);
        if (u.origin === window.location.origin) {
          router.push(`${u.pathname}${u.search}`);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    router.push("/");
  }, [router]);

  return (
    <button type="button" onClick={onNavigate} className={className}>
      {children}
    </button>
  );
}
