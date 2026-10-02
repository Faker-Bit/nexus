"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks";

const HeroScene = dynamic(() => import("@/components/three/hero-scene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

/** Matches the static look of the scene so there is no visual pop when it mounts. */
const HERO_FALLBACK =
  "radial-gradient(58% 58% at 50% 40%, rgba(0,255,157,0.16), transparent 70%), radial-gradient(45% 45% at 78% 72%, rgba(16,224,160,0.13), transparent 70%)";

/** Heavy scenes wait for the main thread; lighter devices get a lighter scene. */
function deviceTier() {
  if (typeof navigator === "undefined") return "low";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse || cores <= 4 || memory <= 4) return "low";
  return "high";
}

/**
 * The WebGL hero.
 *
 * Two rules keep it off the critical path:
 *  1. It is `ssr: false` and dynamically imported, so three.js is an async chunk.
 *  2. It only mounts after two animation frames *and* an idle callback, so it can
 *     never compete with FCP/LCP or block hydration.
 * Reduced-motion visitors get the static gradient permanently.
 */
export function HeroCanvas({
  className,
  particles,
  bloom,
}: {
  className?: string;
  particles?: number;
  bloom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tier, setTier] = useState<"low" | "high">("low");

  useEffect(() => {
    setTier(deviceTier());
    if (reduceMotion) return;

    const el = ref.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
      observer.observe(el);
      return () => observer.disconnect();
    }
    setVisible(true);
    return;
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !visible) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
          .requestIdleCallback;
        if (idle) idle(() => !cancelled && setReady(true), { timeout: 1200 });
        else setTimeout(() => !cancelled && setReady(true), 300);
      }),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, visible]);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <div className="size-full" style={{ background: HERO_FALLBACK }} />
      {ready ? (
        <HeroScene
          className="absolute inset-0 size-full"
          particles={tier === "high" ? (particles ?? 1500) : 520}
          bloom={bloom}
        />
      ) : null}
    </div>
  );
}