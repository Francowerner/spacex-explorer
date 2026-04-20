import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold">Launch not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        The launch you are looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
      >
        ← Back to launches
      </Link>
    </div>
  );
}
