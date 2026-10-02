"use client";

import { Star, StarHalf } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

export function Stars({
  value,
  size = "sm",
  className,
  showValue,
  count,
}: {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  const px = { xs: "size-3", sm: "size-3.5", md: "size-4.5", lg: "size-6" }[size];
  const pct = clamp(value, 0, 5) / 5;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={`${value.toFixed(1)} out of 5`}>
      <span className="relative inline-flex">
        <span className="flex gap-0.5 text-white/14">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={px} strokeWidth={1.5} />
          ))}
        </span>
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct * 100}%` }}>
          <span className="flex gap-0.5 text-amber">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className={cn(px, "shrink-0")} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
        </span>
      </span>
      {showValue ? (
        <span className="tnum text-xs font-medium text-mist-300">{value > 0 ? value.toFixed(1) : "New"}</span>
      ) : null}
      {typeof count === "number" ? <span className="text-xs text-mist-500">({count})</span> : null}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const px = { sm: "size-5", md: "size-7", lg: "size-9" }[size];
  const labels = ["Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div className="inline-flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="group/star -m-0.5 p-0.5 transition-transform duration-150 hover:scale-115 active:scale-95"
          aria-label={`${n} star${n > 1 ? "s" : ""} - ${labels[n - 1]}`}
        >
          <Star
            className={cn(px, "transition-colors", n <= value ? "text-amber" : "text-white/16", "group-hover/star:text-amber")}
            fill={n <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-medium text-mist-300">{value ? labels[value - 1] : "Tap to rate"}</span>
    </div>
  );
}

/** Star half used inside the rating histogram. */
export function HalfStar() {
  return <StarHalf className="size-3" />;
}

export function RatingBreakdown({
  avg,
  count,
  buckets,
}: {
  avg: number;
  count: number;
  buckets: Array<{ rating: number; count: number }>;
}) {
  const byRating = new Map(buckets.map((b) => [b.rating, b.count]));
  const total = buckets.reduce((acc, b) => acc + b.count, 0) || 1;

  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:text-left">
        <p className="tnum text-5xl font-semibold tracking-tight text-mist-50">{avg > 0 ? avg.toFixed(1) : "-"}</p>
        <Stars value={avg} size="sm" className="mt-1.5 justify-center sm:justify-start" />
        <p className="mt-1 text-xs text-mist-500">{count} review{count === 1 ? "" : "s"}</p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((r) => {
          const c = byRating.get(r) ?? 0;
          const pct = (c / total) * 100;
          return (
            <div key={r} className="flex items-center gap-2.5 text-xs">
              <span className="tnum w-6 text-mist-400">{r}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber to-amber/60 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="tnum w-7 text-right text-mist-500">{c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}