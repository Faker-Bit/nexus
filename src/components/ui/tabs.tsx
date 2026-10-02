"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
  variant = "underline",
}: {
  tabs: Array<{ key: T; label: string; count?: number; icon?: React.ReactNode }>;
  active: T;
  onChange: (key: T) => void;
  className?: string;
  variant?: "underline" | "pills";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs.length]);

  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "relative flex gap-1 overflow-x-auto scrollbar-none",
        variant === "underline" ? "border-b border-white/8" : "p-1 rounded-xl glass w-fit",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          data-tab={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13.5px] font-medium transition-colors duration-200",
            variant === "underline"
              ? "px-3.5 py-2.5 text-mist-400 hover:text-mist-100"
              : "rounded-lg px-3 py-1.5",
            variant === "underline" && active === tab.key && "text-neon-200",
            variant !== "underline" && active === tab.key && "bg-white/8 text-mist-50 shadow-inner",
          )}
        >
          {tab.icon}
          {tab.label}
          {typeof tab.count === "number" ? (
            <span className="tnum rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] text-mist-400">{tab.count}</span>
          ) : null}
        </button>
      ))}
      {variant === "underline" && indicator ? (
        <span
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-linear-to-r from-neon-300 to-violet-soft shadow-[0_0_12px] shadow-neon-400/70 transition-all duration-300"
          style={{ left: indicator.left, width: indicator.width }}
        />
      ) : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: Array<{ key: T; label: string; icon?: React.ReactNode }>;
  value: T;
  onChange: (key: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("inline-flex gap-0.5 rounded-xl border border-white/8 bg-ink-900/60 p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          aria-pressed={value === opt.key}
          className={cn(
            "flex items-center gap-1.5 rounded-[10px] font-medium transition-all duration-200",
            size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]",
            value === opt.key
              ? "bg-white/10 text-mist-50 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
              : "text-mist-400 hover:text-mist-100",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ChipToggle({
  active,
  onClick,
  children,
  count,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200",
        active
          ? "border-neon-400/45 bg-neon-400/12 text-neon-100 shadow-[0_0_20px_-8px] shadow-neon-400/70"
          : "border-white/10 bg-white/4 text-mist-300 hover:border-white/20 hover:text-mist-100",
        className,
      )}
    >
      {children}
      {typeof count === "number" ? <span className="tnum text-[10.5px] text-mist-500">{count}</span> : null}
    </button>
  );
}