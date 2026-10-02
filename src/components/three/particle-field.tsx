"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute float aScale;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vSeed = aSeed;
    vec3 p = position;

    // Slow orbital drift + vertical wander so the field never looks static.
    float t = uTime * (0.06 + aSeed * 0.08);
    p.x += sin(t + aSeed * 12.0) * 0.42;
    p.y += cos(t * 0.85 + aSeed * 9.0) * 0.34;
    p.z += sin(t * 0.6 + aSeed * 5.0) * 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    vAlpha = smoothstep(16.0, 3.0, dist) * (0.35 + 0.65 * aScale);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (12.0 / max(dist, 0.6));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float soft = smoothstep(0.5, 0.02, d);
    float core = smoothstep(0.16, 0.0, d);
    vec3 color = mix(uColorA, uColorB, fract(vSeed + uTime * 0.05));
    gl_FragColor = vec4(color, (soft * 0.55 + core * 0.75) * vAlpha);
  }
`;

export type ParticleFieldProps = {
  count?: number;
  radius?: number;
  height?: number;
  colorA?: string;
  colorB?: string;
  size?: number;
  drift?: number;
  className?: string;
};

export function ParticleField({
  count = 1400,
  radius = 7,
  height = 8,
  colorA = "#00ff9d",
  colorB = "#6fffd0",
  size = 34,
  drift = 0.05,
}: ParticleFieldProps) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spherical shell distribution keeps the field even instead of clumped.
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.55 + 0.45 * Math.cbrt(Math.random()));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * (height / radius);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.random() * 0.95;
    }
    return { positions, seeds, scales };
  }, [count, radius, height]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    [size, colorA, colorB],
  );

  useFrame((state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta * drift * 8;
    if (points.current) points.current.rotation.y += delta * 0.012;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Concentric wire rings that read as an orbiting network. */
export function OrbitRings({
  count = 3,
  radius = 2.6,
  color = "#00ff9d",
  opacity = 0.28,
}: {
  count?: number;
  radius?: number;
  color?: string;
  opacity?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.06;
    group.current.children.forEach((child, i) => {
      child.rotation.x += delta * (0.05 + i * 0.02) * (i % 2 === 0 ? 1 : -1);
    });
    // Subtle parallax toward the pointer.
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      state.pointer.x * 0.06,
      0.045,
    );
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.42, i * 0.7, 0]}>
          <torusGeometry args={[radius * (1 + i * 0.34), 0.006, 8, 128]} />
          <meshBasicMaterial color={color} transparent opacity={opacity / (i + 1)} />
        </mesh>
      ))}
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={`b-${i}`} rotation={[i * 0.35, Math.PI / 2 + i * 0.3, i * 0.2]}>
          <torusGeometry args={[radius * (1.3 + i * 0.28), 0.004, 8, 96]} />
          <meshBasicMaterial color="#6fffd0" transparent opacity={opacity / (i + 1.4)} />
        </mesh>
      ))}
    </group>
  );
}