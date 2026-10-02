"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Splits text into words and animates each one as it scrolls into view.
 * Words (not characters) keep the DOM small and screen readers happy.
 */
export function RevealText({
  children,
  className,
  delay = 0,
  stagger = 0.045,
  once = true,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-14% 0px -8% 0px" });
  const MotionTag = motion[Tag];
  const words = children.split(" ");

  if (reduce) {
    const Plain = Tag;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <MotionTag
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: "0.55em", filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.62, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </MotionTag>
      ))}
    </span>
  );
}

/** Scroll-linked translation. Wraps any block without touching its internals. */
export function Parallax({
  children,
  distance = 60,
  className,
  axis = "y",
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
  axis?: "x" | "y";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const value = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.4 });
  const offset = axis === "y" ? { y: value } : { x: value };

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className}>
      <motion.div style={offset}>{children}</motion.div>
    </div>
  );
}

/** Scale + fade tied to scroll position — used behind feature sections. */
export function ScrollScale({
  children,
  className,
  from = 0.88,
  to = 1,
}: {
  children: ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.4"] });
  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 1]);

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, opacity }}>{children}</motion.div>
    </div>
  );
}

/** Page-level transition. Used by app/template.tsx so it fires on every route. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Thin gradient bar showing how far down the page the visitor is. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className={cn(
        "fixed inset-x-0 top-0 z-[131] h-[2px] origin-left bg-linear-to-r from-neon-300 via-neon-400 to-mint shadow-[0_0_14px] shadow-neon-400/70",
        className,
      )}
      aria-hidden="true"
    />
  );
}

/**
 * A soft light that trails the cursor across the whole document.
 *
 * Deliberately render-free: the pointer position is written straight to the DOM
 * node inside a `requestAnimationFrame`, so moving the mouse never schedules a
 * React render. Pointer-driven components that use state here will re-render the
 * whole tree on every mousemove, which is the single most expensive thing a page
 * like this can do.
 */
export function CursorGlow() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rafPending = useRef(false);

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    const node = ref.current;
    if (!node) return;
    node.style.opacity = "1";

    let x = -600;
    let y = -600;

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const onLeave = () => {
      node.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[2] size-[520px] opacity-0 transition-opacity duration-300"
      style={{
        marginLeft: -260,
        marginTop: -260,
        transform: "translate3d(-600px,-600px,0)",
        background:
          "radial-gradient(circle, rgba(0,255,157,0.07) 0%, rgba(0,255,157,0.035) 34%, transparent 66%)",
      }}
    />
  );
}

/** Counts how many times the wrapped block has entered the viewport. */
export function useEntryCount(count = 1, intervalMs = 1600) {
  const ref = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState(0);
  const inView = useInView(ref, { margin: "-10% 0px" });

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setEntries((n) => (n >= count ? n : n + 1)), intervalMs);
    return () => clearInterval(id);
  }, [inView, count, intervalMs]);

  return { ref, entries };
}

/** Cross-fades children when `value` changes — used for tab-style content swaps. */
export function CrossFade({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}