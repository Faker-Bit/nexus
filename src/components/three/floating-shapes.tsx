"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh } from "three";

type ShapeConfig = {
  position: [number, number, number];
  scale: number;
  kind: "crystal" | "torus" | "knot" | "ring" | "sphere";
  color: string;
  emissive: string;
  speed: number;
  metalness?: number;
  roughness?: number;
};

/**
 * Hand-placed geometry that reacts to pointer position and page scroll.
 * Kept deliberately sparse: five objects read as "designed" instead of noisy.
 */
export function FloatingShapes({ parallax = 1 }: { parallax?: number }) {
  const group = useRef<Group>(null);
  const crystal = useRef<Mesh>(null);
  const knot = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const orb = useRef<Mesh>(null);

  const shapes: ShapeConfig[] = [
    {
      position: [-2.55, 1.15, -0.6],
      scale: 0.82,
      kind: "crystal",
      color: "#04140c",
      emissive: "#00ff9d",
      speed: 0.24,
      metalness: 0.35,
      roughness: 0.18,
    },
    {
      position: [2.75, 0.75, -1.4],
      scale: 0.62,
      kind: "knot",
      color: "#04211a",
      emissive: "#10e0a0",
      speed: 0.16,
      metalness: 0.5,
      roughness: 0.22,
    },
    {
      position: [1.45, -1.55, 0.6],
      scale: 0.44,
      kind: "ring",
      color: "#032015",
      emissive: "#a8ff5c",
      speed: 0.32,
      metalness: 0.7,
      roughness: 0.15,
    },
    {
      position: [-1.15, -1.95, 0.9],
      scale: 0.5,
      kind: "sphere",
      color: "#0a1f12",
      emissive: "#00e7ff",
      speed: 0.2,
      metalness: 0.1,
      roughness: 0.4,
    },
    {
      position: [3.35, 1.9, -2.2],
      scale: 0.34,
      kind: "crystal",
      color: "#06180f",
      emissive: "#f5b642",
      speed: 0.28,
      metalness: 0.4,
      roughness: 0.2,
    },
  ];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const px = state.pointer.x * parallax;
    const py = state.pointer.y * parallax;
    const scroll = typeof window !== "undefined" ? Math.min(window.scrollY / 900, 1.4) : 0;

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, px * 0.22 + scroll * 0.28, 0.04);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -py * 0.14, 0.04);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -scroll * 0.85, 0.05);
    }
    if (crystal.current) {
      crystal.current.rotation.x += delta * 0.24;
      crystal.current.rotation.y += delta * 0.18;
    }
    if (knot.current) {
      knot.current.rotation.z -= delta * 0.14;
      knot.current.rotation.x += delta * 0.07;
    }
    if (ring.current) ring.current.rotation.z += delta * 0.42;
    if (orb.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.06;
      orb.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {shapes.map((shape, i) => (
        <Float
          key={i}
          speed={shape.speed * 2.2}
          rotationIntensity={0.55}
          floatIntensity={1.15}
          floatingRange={[-0.22, 0.22]}
        >
          <mesh position={shape.position} scale={shape.scale} castShadow={false}>
            {shape.kind === "crystal" ? <octahedronGeometry args={[1, 0]} /> : null}
            {shape.kind === "knot" ? <torusKnotGeometry args={[0.72, 0.22, 160, 24]} /> : null}
            {shape.kind === "ring" ? <torusGeometry args={[0.85, 0.09, 24, 96]} /> : null}
            {shape.kind === "sphere" ? <sphereGeometry args={[0.85, 48, 48]} /> : null}
            {shape.kind === "torus" ? <torusGeometry args={[0.9, 0.3, 32, 96]} /> : null}

            {shape.kind === "sphere" ? (
              <MeshDistortMaterial
                color={shape.color}
                emissive={shape.emissive}
                emissiveIntensity={0.32}
                roughness={shape.roughness ?? 0.3}
                metalness={shape.metalness ?? 0.2}
                distort={0.28}
                speed={1.6}
              />
            ) : (
              <meshPhysicalMaterial
                color={shape.color}
                emissive={shape.emissive}
                emissiveIntensity={0.42}
                metalness={shape.metalness ?? 0.4}
                roughness={shape.roughness ?? 0.2}
                clearcoat={1}
                clearcoatRoughness={0.15}
                iridescence={0.65}
                iridescenceIOR={1.9}
                reflectivity={0.85}
              />
            )}
          </mesh>
        </Float>
      ))}

      {/* Glowing wireframes double the read of each solid without extra lights. */}
      <mesh position={[-2.55, 1.15, -0.6]} scale={1.35}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#00ff9d" wireframe transparent opacity={0.16} />
      </mesh>
      <mesh position={[2.75, 0.75, -1.4]} scale={0.86}>
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial color="#6fffd0" wireframe transparent opacity={0.13} />
      </mesh>

      <pointLight position={[-3, 2.5, 3]} intensity={22} distance={12} color="#00ff9d" />
      <pointLight position={[3.4, -1.2, 2.4]} intensity={16} distance={11} color="#10e0a0" />
      <pointLight position={[0, -3.5, 1.5]} intensity={9} distance={9} color="#a8ff5c" />
      <ambientLight intensity={0.34} color="#a6ffd0" />
    </group>
  );
}