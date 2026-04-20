"use client";

import { ErrorState } from "@/components/ErrorState";

export default function LaunchDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this launch"
      message={error.message || "An unexpected error occurred while loading the launch details."}
      onRetry={reset}
    />
  );
}
