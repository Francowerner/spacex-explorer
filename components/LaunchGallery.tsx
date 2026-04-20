"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function LaunchGallery({ images, alt }: Props) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const visible = images.filter((src) => !failed[src]);

  if (visible.length === 0) return null;

  return (
    <section aria-label="Mission photo gallery">
      <h2 className="mb-3 text-lg font-semibold">Gallery</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((src, idx) => (
          <li
            key={src}
            className="relative aspect-video overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800"
          >
            <Image
              src={src}
              alt={`${alt} — photo ${idx + 1}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              loading={idx < 2 ? "eager" : "lazy"}
              onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
              unoptimized
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
