"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "glass" | "meme";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-void bg-linear-to-r from-neon-300 via-neon-400 to-violet-soft shadow-[0_10px_34px_-12px] shadow-neon-500/70 hover:brightness-110 active:brightness-95",
  secondary:
    "text-mist-50 bg-white/6 hover:bg-white/10 border border-white/10 backdrop-blur-md",
  glass: "glass text-mist-50 hover:bg-white/8 hover:border-white/14",
  ghost: "text-mist-400 hover:text-mist-50 hover:bg-white/6",
  outline:
    "text-mist-100 border border-white/14 hover:border-neon-400/50 hover:text-white hover:bg-neon-400/6",
  danger: "text-rose-100 bg-rose-500/16 border border-rose-400/32 hover:bg-rose-500/26",
  meme: "text-amber-100 bg-amber-400/14 border border-amber-300/32 hover:bg-amber-400/22",
};

const SIZES: Record<Size, string> = {
  xs: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-10.5 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  xl: "h-14 px-8 text-base gap-2.5 rounded-2xl",
};

const BASE =
  "group/btn relative inline-flex select-none items-center justify-center overflow-hidden font-medium tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Sheen sweep on primary actions - a small reward for clicking. */
function Sheen() {
  return (
    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/28 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { type?: "button" | "submit" | "reset" }
>(function Button(
  { variant = "primary", size = "md", loading, icon, iconRight, full, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && "w-full", className)}
      {...rest}
    >
      {variant === "primary" ? <Sheen /> : null}
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export const ButtonLink = forwardRef<
  HTMLAnchorElement,
  CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }
>(function ButtonLink({ variant = "primary", size = "md", icon, iconRight, full, className, children, href, ...rest }, ref) {
  return (
    <Link
      ref={ref}
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && "w-full", className)}
      {...rest}
    >
      {variant === "primary" ? <Sheen /> : null}
      {icon}
      {children}
      {iconRight}
    </Link>
  );
});

/** Icon-only control; keep the accessible name via `label`. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function IconButton({ label, variant = "ghost", size = "md", className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        BASE,
        VARIANTS[variant],
        "aspect-square px-0",
        size === "xs" && "size-8",
        size === "sm" && "size-9",
        size === "md" && "size-10.5",
        size === "lg" && "size-12",
        size === "xl" && "size-14",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export { Sheen as ButtonSheen };