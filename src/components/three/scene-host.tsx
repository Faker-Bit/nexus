"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { ACESFilmicToneMapping } from "three";
import { AuroraScene, CoinCoreScene, GalaxyScene, KnotFieldScene, ParticleBurstScene, SculptureScene, WaveGridScene } from "./scenes";

/**
 * Every WebGL scene is mounted from this one module.
 *
 * Nothing else may import three.js / R3F / postprocessing directly: this file is
 * only ever reached through `dynamic()` in `webgl-zone.tsx`, which keeps the whole
 * 3D stack in a separate chunk that is fetched after first paint. Pages pass a
 * scene *name*, not a component, so the server graph never pulls the library in.
 */

function resolutionTier(): [number, number] {
  if (typeof window === "undefined") return [1, 1.5];
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || cores <= 4 ? [1, 1] : [1, 1.5];
}

export type SceneName =
  | "wave"
  | "galaxy"
  | "coin"
  | "aurora"
  | "knots"
  | "burst"
  | "sculpture";

export type SceneSettings = {
  /** Camera distance and field of view. */
  distance?: number;
  fov?: number;
  position?: [number, number, number];
  bloom?: number;
  /** Per-scene props, all serialisable. */
  hue?: string;
  count?: number;
  seed?: string;
  opacity?: number;
};

function renderScene(name: SceneName, s: Required<Pick<SceneSettings, "hue">> & SceneSettings) {
  switch (name) {
    case "wave":
      return <WaveGridScene colorA={s.hue} colorB="#6fffd0" opacity={s.opacity ?? 0.5} rings={1} />;
    case "galaxy":
      return <GalaxyScene count={s.count ?? 2200} core="#6fffd0" arm={s.hue} />;
    case "coin":
      return <CoinCoreScene color={s.hue} accent="#6fffd0" shards={16} />;
    case "aurora":
      return <AuroraScene colorA={s.hue} colorB="#6fffd0" />;
    case "knots":
      return <KnotFieldScene color={s.hue} count={2} />;
    case "burst":
      return <ParticleBurstScene count={s.count ?? 1000} colorA={s.hue} colorB="#a8ff5c" duration={2.8} />;
    case "sculpture":
      return <SculptureScene seed={s.seed ?? "nexus"} colorA={s.hue} colorB="#6fffd0" nodes={36} />;
    default:
      return null;
  }
}

export default function SceneHost({ name, ...settings }: { name: SceneName } & SceneSettings) {
  const merged: SceneSettings & { hue: string } = { hue: settings.hue ?? "#00ff9d", ...settings };

  return (
    <Canvas
      dpr={resolutionTier()}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{
        position: [settings.position?.[0] ?? 0, settings.position?.[1] ?? 0, (settings.position?.[2] ?? 0) + (settings.distance ?? 9)],
        fov: settings.fov ?? 46,
        near: 0.1,
        far: 90,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      fallback={null}
    >
      <Suspense fallback={null}>
        {renderScene(name, merged)}
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={settings.bloom ?? 0.6}
            luminanceThreshold={0.16}
            luminanceSmoothing={0.72}
            mipmapBlur
            radius={0.7}
          />
          <Vignette eskil={false} offset={0.3} darkness={0.78} />
        </EffectComposer>
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}