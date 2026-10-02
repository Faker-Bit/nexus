"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, ImageOff, Play, Video } from "lucide-react";
import { cn, coverArtFor } from "@/lib/utils";

export type GalleryAsset = { id: string; url: string; kind: string; alt: string | null };

/**
 * Screenshot + video gallery with keyboard navigation, a lightbox and a
 * scroll-spy filmstrip. Falls back to generated art when nothing is uploaded.
 */
export function Gallery({
  assets,
  title,
  hue = "#00ff9d",
  previewVideo,
}: {
  assets: GalleryAsset[];
  title: string;
  hue?: string;
  previewVideo?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const slides = assets.filter((a) => a.kind !== "archive");

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  const current = slides[index];

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/8 bg-ink-900"
        onMouseEnter={() => undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? "empty"}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {current?.kind === "video" || current?.kind === "gif" ? (
              <video
                src={current.url}
                poster={undefined}
                muted
                loop
                playsInline
                autoPlay
                controls
                className="size-full object-cover"
              />
            ) : current?.url ? (
              <Image
                src={current.url}
                alt={current.alt ?? `${title} screenshot`}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                // This is the LCP element on a listing page: fetch it first.
                priority
                fetchPriority="high"
                quality={60}
                className="object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center" style={{ background: coverArtFor(title).background }}>
                <div className="text-center">
                  <ImageOff className="mx-auto size-8 text-mist-500" />
                  <p className="mt-2 text-[12.5px] text-mist-500">No screenshots provided</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950/60 via-transparent to-transparent" />

        {current?.url ? (
          <button
            onClick={() => setLightbox(true)}
            className="glass absolute right-3 top-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-mist-200 opacity-0 transition-opacity hover:text-mist-50 group-hover:opacity-100"
          >
            <Expand className="size-3.5" />
            Expand
          </button>
        ) : null}

        {previewVideo && (
          <a
            href={previewVideo}
            target="_blank"
            rel="noreferrer noopener"
            className="glass absolute bottom-3 left-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-mist-100 transition-colors hover:text-white"
          >
            <Video className="size-3.5 text-neon-300" />
            Watch demo video
          </a>
        )}

        {slides.length > 1 ? (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="glass absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-mist-200 opacity-0 transition-all hover:text-white group-hover:opacity-100"
            >
              -
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="glass absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-mist-200 opacity-0 transition-all hover:text-white group-hover:opacity-100"
            >
              -
            </button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {slides.map((asset, i) => (
            <button
              key={asset.id}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-lg border transition-all",
                i === index ? "border-neon-400/60" : "border-white/8 opacity-60 hover:opacity-100",
              )}
            >
              {asset.kind === "video" || asset.kind === "gif" ? (
                <video src={asset.url} muted playsInline className="size-full object-cover" />
              ) : (
                <Image src={asset.url} alt="" fill sizes="112px" loading="lazy" quality={55} className="object-cover" />
              )}
              {i === index ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: hue }} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {lightbox && current?.url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] grid place-items-center bg-void/95 p-4 backdrop-blur-md"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-white/12 bg-white/6 text-mist-200 hover:text-white"
              aria-label="Close"
            >
              ‹
            </button>
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.url}
                alt={current.alt ?? title}
                width={1920}
                height={1080}
                quality={60}
                className="w-full rounded-xl border border-white/10"
              />
              <p className="mt-3 text-center text-[12px] text-mist-500">
                {current.alt ?? `${title} screenshot`} · {index + 1} / {slides.length}
              </p>
              <div className="mt-3 flex justify-center gap-3">
                <button onClick={prev} className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px]">
                  - Previous
                </button>
                <button onClick={next} className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px]">
                  Next -
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function VideoBlock({ url }: { url: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/8 bg-ink-900">
      <video src={url} controls playsInline className="size-full object-contain" />
    </div>
  );
}

export function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass grid size-14 place-items-center rounded-full text-mist-50 transition-transform hover:scale-105"
      aria-label="Play video"
    >
      <Play className="size-5 fill-current" />
    </button>
  );
}