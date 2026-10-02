"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Coins, Eye, HandCoins, MousePointerClick, Receipt, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dashboard visuals without the charting library.
 *
 * The recharts components live in `recharts-charts.tsx` and are mounted through
 * `LazyChart` below, which defers the library until the chart is on screen.
 */

export type ChartData = Array<{ date: string; revenue: number; sales?: number; views?: number }>;

/** Renders the same placeholder the charts used while they were loading. */
function ChartFrame({ height, label }: { height: number; label: string }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-xl border border-dashed border-white/10 text-[12.5px] text-mist-500"
    >
      {label}
    </div>
  );
}

type LazyKind = "revenue" | "views" | "donut";

const LAZY = {
  revenue: dynamic(() => import("./recharts-charts").then((m) => m.RevenueChart), {
    ssr: false,
    loading: () => <ChartFrame height={260} label="Loading revenue…" />,
  }) as React.ComponentType<{ data: ChartData }>,
  views: dynamic(() => import("./recharts-charts").then((m) => m.ViewsChart), {
    ssr: false,
    loading: () => <ChartFrame height={220} label="Loading traffic…" />,
  }) as React.ComponentType<{ data: Array<{ date: string; views: number }> }>,
  donut: dynamic(() => import("./recharts-charts").then((m) => m.CategoryDonut), {
    ssr: false,
    loading: () => <ChartFrame height={180} label="Loading split…" />,
  }) as React.ComponentType<{ data: Array<{ label: string; value: number; hue: string }> }>,
};

/**
 * Wraps a chart so it is only requested once scrolled near, keeping the initial
 * dashboard payload to the shell plus the stat cards.
 */
export function LazyChart({
  kind,
  height,
  empty,
  data,
}: {
  kind: LazyKind;
  height: number;
  empty?: boolean;
  data: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "300px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (empty) return <ChartFrame height={height} label="Nothing to chart yet" />;

  const Chart = LAZY[kind] as React.ComponentType<Record<string, unknown>>;
  return (
    <div ref={ref}>
      {near ? <Chart data={data} /> : <ChartFrame height={height} label="Scroll to load chart" />}
    </div>
  );
}

export function RevenueChart({ data }: { data: ChartData }) {
  const reduce = useReducedMotion();
  if (!data.length) return <ChartFrame height={260} label="No revenue in the last 30 days" />;
  if (reduce) return <ChartFrame height={260} label={`Revenue: ${data.length} days`} />;
  return <LazyChart kind="revenue" height={260} data={data} />;
}

export function ViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  if (!data.length) return <ChartFrame height={220} label="No traffic recorded yet" />;
  return <LazyChart kind="views" height={220} data={data} />;
}

export function CategoryDonut({ data }: { data: Array<{ label: string; value: number; hue: string }> }) {
  if (!data.length) return <ChartFrame height={180} label="Publish a project to see the split" />;
  return <LazyChart kind="donut" height={180} data={data} />;
}

/** Icons are referenced by name so server components can pass them safely. */
const STAT_ICONS = {
  coins: Coins,
  shoppingBag: ShoppingBag,
  mouse: MousePointerClick,
  handshake: HandCoins,
  trending: TrendingUp,
  receipt: Receipt,
  star: Star,
  eye: Eye,
} as const;

export type StatIcon = keyof typeof STAT_ICONS;

/** Renders a stat icon by name — used when the caller is a server component. */
export function StatGlyph({ name, className }: { name: StatIcon; className?: string }) {
  const Icon = STAT_ICONS[name];
  return <Icon className={className} />;
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
  accent = "neon",
  className,
}: {
  label: string;
  value: string;
  delta?: number | null;
  icon: StatIcon;
  hint?: string;
  accent?: "neon" | "violet" | "mint" | "amber";
  className?: string;
}) {
  const Icon = STAT_ICONS[icon];
  const accents = {
    neon: "from-neon-400/20 text-neon-300",
    violet: "from-violet-neon/20 text-violet-soft",
    mint: "from-mint/20 text-mint",
    amber: "from-amber-400/20 text-amber",
  }[accent];

  const up = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn("group glass relative overflow-hidden rounded-2xl p-5", className)}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-linear-to-br to-transparent opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-90",
          accents,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] uppercase tracking-[0.12em] text-mist-500">{label}</p>
          <p className="tnum mt-2 font-display text-[26px] font-semibold leading-none text-mist-50">{value}</p>
          {hint ? <p className="mt-1.5 text-[11.5px] text-mist-500">{hint}</p> : null}
        </div>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br to-transparent", accents)}>
          <Icon className="size-4" />
        </span>
      </div>
      {typeof delta === "number" && Number.isFinite(delta) ? (
        <p className={cn("relative mt-3 text-[11.5px]", up ? "text-mint" : "text-rose-300")}>
          {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs previous 30 days
        </p>
      ) : null}
    </motion.div>
  );
}

export function Sparkline({ values, hue = "#00ff9d" }: { values: number[]; hue?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={hue}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}