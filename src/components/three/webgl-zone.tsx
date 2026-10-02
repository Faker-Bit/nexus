"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks";
import type { SceneName, SceneSettings } from "./scene-host";

/**
 * Viewport- and idle-gated WebGL host.
 *
 * Three things keep this cheap on a page that carries several scenes:
 *  1. The 3D stack lives behind `dynamic()`, so it is a separate chunk that never
 *     blocks the first paint.
 *  2. A scene mounts only once its zone is near the viewport.
 *  3. Even then it waits for an idle callback, so LCP is never competing with a
 *     WebGL context for the main thread.
 */

const SceneHost = dynamic(() => import("./scene-host"), {
  ssr: false,
  loading: () => null,
});

export type ZoneTone = "emerald" | "jade" | "lime" | "sky";

/** Static gradient shown before (and instead of) the canvas. */
export const ZONE_GRADIENTS: Record<ZoneTone, string> = {
  emerald: "radial-gradient(58% 62% at 50% 42%, rgba(0,255,157,0.16), transparent 72%), radial-gradient(46% 46% at 78% 74%, rgba(16,224,160,0.13), transparent 70%)",
  jade: "radial-gradient(58% 62% at 50% 38%, rgba(111,255,208,0.15), transparent 72%), radial-gradient(44% 44% at 22% 78%, rgba(0,255,157,0.12), transparent 70%)",
  lime: "radial-gradient(56% 60% at 50% 44%, rgba(168,255,92,0.13), transparent 72%), radial-gradient(42% 42% at 80% 24%, rgba(0,255,157,0.11), transparent 70%)",
  sky: "radial-gradient(56% 60% at 50% 40%, rgba(0,231,255,0.12), transparent 72%), radial-gradient(44% 44% at 24% 76%, rgba(0,255,157,0.11), transparent 70%)",
};

/** Waits for the browser to be idle so 3D never competes with first paint. */
function useIdleAfterPaint(delayMs = 220) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      if (!cancelled) setReady(true);
    };
    // Two frames guarantees LCP has been painted before we touch the GPU.
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(() => {
      const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
        .requestIdleCallback;
      if (idle) idle(go, { timeout: delayMs + 600 });
      else setTimeout(go, delayMs);
    }));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf2);
    };
  }, [delayMs]);
  return ready;
}

export type SceneZoneProps = {
  scene: SceneName;
  settings?: SceneSettings;
  tone?: ZoneTone;
  className?: string;
  /** How far outside the viewport the scene stays alive. */
  margin?: string;
};

function ZoneInner({ scene, settings, className, margin = "160px" }: SceneZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const idle = useIdleAfterPaint();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: margin,
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {visible && idle ? <SceneHost name={scene} {...settings} /> : null}
    </div>
  );
}

const WebGLZone = dynamic(() => Promise.resolve(ZoneInner), {
  ssr: false,
  loading: () => null,
}) as unknown as (props: SceneZoneProps) => React.ReactElement;

/**
 * A decorative 3D band. Renders a considered gradient immediately and upgrades
 * itself to WebGL once the visitor is idle and the band is in view.
 */
export function SceneZone({ tone = "emerald", className, scene, settings, margin }: SceneZoneProps) {
  const reduce = usePrefersReducedMotion();
  return (
    <div className={className} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: ZONE_GRADIENTS[tone] }} />
      {reduce ? null : (
        <WebGLZone className="absolute inset-0" scene={scene} settings={settings} margin={margin} />
      )}
    </div>
  );
}