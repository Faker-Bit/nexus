"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Infinite marquee of live listings. Duplicated track + CSS animation keeps it
 * GPU-cheap; the mask fades both edges so nothing clips abruptly.
 */
export function TickerStrip({
  items,
}: {
  items: Array<{ slug: string; title: string; price: string; hue: string; creator: string }>;
}) {
  const track = [...items, ...items];
  if (!track.length) return null;

  return (
    <div className="mask-fade-x relative mt-14 overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-void to-transparent" />
      <div
        className="flex w-max gap-3 py-1"
        style={{ animation: "marquee 42s linear infinite", animationDirection: "alternate-reverse" }}
      >
        {track.map((item, i) => (
          <Link
            key={`${item.slug}-${i}`}
            href={`/p/${item.slug}`}
            className={cn(
              "group flex shrink-0 items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 transition-colors hover:border-white/20 hover:bg-white/6",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: item.hue, boxShadow: `0 0 10px ${item.hue}` }} />
            <span className="max-w-[13rem] truncate text-[12.5px] text-mist-300 group-hover:text-mist-50">{item.title}</span>
            <span className="tnum text-[12px] font-medium text-mist-100">{item.price}</span>
            <span className="text-[11px] text-mist-600">@{item.creator}</span>
            <ArrowUpRight className="size-3 text-mist-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neon-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}