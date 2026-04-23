"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

type Props = {
  images: string[];
  alt: string;
};

export function LaunchGallery({ images, alt }: Props) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const visibleUrls = useMemo(
    () => images.filter((src) => !failed[src]),
    [images, failed],
  );

  const slides = useMemo(
    () =>
      visibleUrls.map((src, idx) => ({
        src,
        alt: `${alt} — photo ${idx + 1}`,
      })),
    [visibleUrls, alt],
  );

  if (images.length === 0) return null;
  const failedCount = images.reduce((acc, src) => acc + (failed[src] ? 1 : 0), 0);

  return (
    <section aria-label="Mission photo gallery">
      <h2 className="mb-3 text-lg font-semibold">Gallery</h2>
      {failedCount === images.length ? (
        <p className="text-sm text-zinc-600">
          Photos are unavailable for this mission.
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, idx) => (
          <li
            key={src}
            className="relative aspect-video overflow-hidden rounded-lg bg-zinc-200"
          >
            {failed[src] ? (
              <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-zinc-600">
                Image unavailable
              </div>
            ) : (
              <button
                type="button"
                className="group relative block h-full w-full cursor-zoom-in border-0 p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                aria-label={`Open photo ${idx + 1} in gallery (${alt})`}
                onClick={() => {
                  const i = visibleUrls.indexOf(src);
                  if (i >= 0) {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} — photo ${idx + 1}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading={idx < 2 ? "eager" : "lazy"}
                  onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
                />
              </button>
            )}
          </li>
        ))}
      </ul>

      {slides.length > 0 ? (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          plugins={[Counter]}
          on={{ view: ({ index }) => setLightboxIndex(index) }}
          carousel={{ finite: true }}
        />
      ) : null}
    </section>
  );
}
