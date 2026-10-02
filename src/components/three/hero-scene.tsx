"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { FloatingShapes } from "./floating-shapes";
import { OrbitRings, ParticleField } from "./particle-field";

/** Eases the camera forward as the visitor scrolls, adding depth to the hero. */
function ScrollRig({ strength = 1 }: { strength?: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const scroll = typeof window !== "undefined" ? Math.min(window.scrollY / 800, 1) : 0;
    const px = state.pointer.x * 0.32 * strength;
    const py = state.pointer.y * 0.22 * strength;
    target.current.set(px, py - scroll * 0.6 * strength, 7.2 - scroll * 1.4 * strength);
    camera.position.lerp(target.current, Math.min(1, delta * 2.2));
    camera.lookAt(0, -scroll * 0.25, 0);
  });

  return null;
}

/** Keeps the render loop cheap when the hero scrolls out of view. */
function VisibilityGate({ children }: { children: React.ReactNode }) {
  const frameloop = useThree((state) => state.frameloop);
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const el = document.getElementById("hero-canvas-host");
    if (!el) return;
    const visible = el.getBoundingClientRect().bottom > -200;
    const next = visible ? "always" : "never";
    if (frameloop !== next) setFrameloop(next);
  }, [frameloop, setFrameloop]);

  return <>{children}</>;
}

export type HeroSceneProps = {
  className?: string;
  particles?: number;
  bloom?: number;
  shapes?: boolean;
  parallax?: number;
};

/** Resolution is the single biggest lever on fill-rate cost for this scene. */
function resolutionTier(): [number, number] {
  if (typeof window === "undefined") return [1, 1.5];
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || cores <= 4 ? [1, 1] : [1, 1.75];
}

export function HeroScene({ className, particles = 1500, bloom = 0.85, shapes = true, parallax = 1 }: HeroSceneProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const dpr = useMemo(resolutionTier, []);

  return (
    <div id="hero-canvas-host" className={className} aria-hidden="true">
      {!webglFailed ? (
        <Canvas
          dpr={dpr}
          gl={{
            antialias: dpr[1] > 1,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [0, 0, 7.2], fov: 42, near: 0.1, far: 100 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
          }}
          fallback={null}
          onError={() => setWebglFailed(true)}
        >
          <Suspense fallback={null}>
            <VisibilityGate>
              <fog attach="fog" args={["#020805", 9, 22]} />
              <ParticleField count={particles} radius={7.5} height={9} size={30} />
              <OrbitRings count={3} radius={3.1} />
              {shapes ? <FloatingShapes parallax={parallax} /> : null}
              <ScrollRig strength={parallax} />

              <EffectComposer enableNormalPass={false}>
                <Bloom
                  intensity={bloom}
                  luminanceThreshold={0.18}
                  luminanceSmoothing={0.7}
                  mipmapBlur
                  radius={0.72}
                />
                <ChromaticAberration
                  offset={new THREE.Vector2(0.00055, 0.00055)}
                  blendFunction={BlendFunction.NORMAL}
                  radialModulation={false}
                  modulationOffset={0}
                />
                <Vignette eskil={false} offset={0.28} darkness={0.82} />
              </EffectComposer>

              <AdaptiveDpr pixelated={false} />
              <Preload all />
            </VisibilityGate>
          </Suspense>
        </Canvas>
      ) : (
        <div className="size-full bg-[radial-gradient(60%_60%_at_50%_35%,rgba(45,226,255,0.18),transparent_70%),radial-gradient(50%_50%_at_75%_70%,rgba(139,92,246,0.16),transparent_70%)]" />
      )}
    </div>
  );
}