import { BackToLaunchesNav } from "@/components/BackToLaunchesNav";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <h1 className="text-xl font-semibold">Launch not found</h1>
      <p className="mt-2 text-sm text-zinc-600">
        The launch you are looking for doesn&apos;t exist or has been removed.
      </p>
      <BackToLaunchesNav className="mt-4 inline-block cursor-pointer rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700" />
    </div>
  );
}
