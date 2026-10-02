"use client";

import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fade + rise on scroll into view. Respects prefers-reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  once = true,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px -8% 0px" });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065, delayChildren: 0.05 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function Stagger({
  children,
  className,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerVariants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** Subtle magnetic pull toward the cursor. Adds tactility without hijacking scroll. */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={cn("inline-block", className)}
      whileHover={{ x: 0, y: 0 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * strength;
        const y = (event.clientY - rect.top - rect.height / 2) * strength;
        event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translate3d(0,0,0)";
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Count-up number that animates once when it scrolls into view.
 * Formatting options are primitives so this can be used from server components.
 */
export function CountUp({
  to,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  compact = false,
  className,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compact?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduce = useReducedMotion();
  const format = useCallback(
    (value: number) =>
      `${prefix}${
        compact
          ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
          : value.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
      }${suffix}`,
    [prefix, suffix, decimals, compact],
  );

  if (reduce) return <span className={cn("tnum", className)}>{format(to)}</span>;

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {inView ? <AnimatedNumber to={to} duration={duration} format={format} /> : format(0)}
    </span>
  );
}

function AnimatedNumber({
  to,
  duration,
  format,
}: {
  to: number;
  duration: number;
  format: (value: number) => string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{format(display)}</>;
}

/** Page-level transition wrapper. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}