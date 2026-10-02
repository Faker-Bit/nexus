"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { SceneZone } from "@/components/three/webgl-zone";
import { cn } from "@/lib/utils";

/**
 * Generative 3D preview for a listing. Deterministic from the project slug, so a
 * project always renders the same object — it reads as artwork, not random noise.
 */
export function ProjectPreview({
  seed,
  hue = "#00ff9d",
  className,
}: {
  seed: string;
  hue?: string;
  className?: string;
}) {
  const [spin, setSpin] = useState(0);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/8", className)}>
      <SceneZone
        key={spin}
        scene="sculpture"
        settings={{ distance: 6.4, fov: 44, bloom: 0.7, position: [0, 0.2, 0], seed, hue }}
        tone="emerald"
        className="absolute inset-0"
        margin="120px"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_45%,transparent,rgba(2,8,5,0.55))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-mist-500">Generative preview</p>
          <p className="text-[12.5px] text-mist-300">Seeded from this project&apos;s id</p>
        </div>
        <button
          onClick={() => setSpin((n) => n + 1)}
          className="glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-mist-200 transition-colors hover:text-white"
        >
          <RotateCw className="size-3.5" />
          Re-seed
        </button>
      </div>
    </div>
  );
}