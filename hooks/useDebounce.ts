"use client";

import { useCallback, useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/** Like useDebounce, plus `flush` to set the debounced value immediately (e.g. Clear filters). */
export function useDebouncedWithFlush<T>(value: T, delayMs = 300): readonly [T, (next: T) => void] {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  const flush = useCallback((next: T) => {
    setDebounced(next);
  }, []);
  return [debounced, flush] as const;
}
