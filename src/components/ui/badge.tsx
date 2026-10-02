import type { ReactNode } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small status / taxonomy pill. */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: "neutral" | "neon" | "violet" | "mint" | "amber" | "rose" | "glass" | "meme";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}) {
  const tones = {
    neutral: "bg-white/6 text-mist-300 border-white/10",
    neon: "bg-neon-400/12 text-neon-200 border-neon-400/28",
    violet: "bg-violet-neon/14 text-violet-200 border-violet-neon/30",
    mint: "bg-mint/12 text-mint border-mint/26",
    amber: "bg-amber-400/12 text-amber-200 border-amber-400/28",
    rose: "bg-rose-400/12 text-rose-200 border-rose-400/26",
    meme: "bg-amber-300/14 text-amber-100 border-amber-300/32",
    glass: "glass text-mist-200",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]",
        tones,
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function VerifiedMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex align-middle", className)} title="Verified creator">
      <ShieldCheck className="size-3.5 text-neon-300 drop-shadow-[0_0_6px] drop-shadow-neon-400/60" />
    </span>
  );
}

export function TrendingBadge({ rank }: { rank?: number }) {
  return (
    <Badge tone="neon" className="backdrop-blur-md">
      <TrendingUp className="size-3" />
      {rank ? `#${rank} trending` : "Trending"}
    </Badge>
  );
}

export function HotBadge({ children = "Hot" }: { children?: ReactNode }) {
  return (
    <Badge tone="meme" className="backdrop-blur-md">
      <Sparkles className="size-3" />
      {children}
    </Badge>
  );
}

export function VerifiedChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neon-400/12 px-2 py-0.5 text-[10.5px] font-medium text-neon-200 ring-1 ring-neon-400/25">
      <CheckCircle2 className="size-3" />
      Verified
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/12 bg-white/6 px-1.5 font-mono text-[10px] text-mist-300">
      {children}
    </kbd>
  );
}