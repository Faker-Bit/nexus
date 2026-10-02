"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, Group, Mesh, ShaderMaterial } from "three";
import { OrbitRings, ParticleField } from "./particle-field";
import { FloatingShapes } from "./floating-shapes";

/* ------------------------------------------------------------------ 1. waves */

const waveVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uSpeed;
  varying float vWave;
  varying vec3 vPos;

  void main() {
    vec3 p = position;
    float w =
      sin(p.x * 0.55 + uTime * uSpeed) * 0.55 +
      sin(p.y * 0.38 - uTime * uSpeed * 0.72) * 0.34 +
      sin((p.x + p.y) * 0.24 + uTime * uSpeed * 0.42) * 0.42;
    p.z += w * uAmplitude;
    vWave = w;
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const waveFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vWave;
  varying vec3 vPos;

  void main() {
    float crest = smoothstep(0.35, 1.05, vWave);
    float edge = smoothstep(15.0, 2.5, length(vPos.xy));
    vec3 color = mix(uColorA, uColorB, crest);
    float alpha = (0.1 + crest * 0.9) * edge * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

function WaveSurface({
  size = 30,
  segments = 96,
  amplitude = 0.85,
  speed = 0.6,
  colorA = "#00ff9d",
  colorB = "#6fffd0",
  opacity = 0.5,
  rotation = [-Math.PI / 2.35, 0, 0],
  position = [0, -1.4, -3] as [number, number, number],
}: {
  size?: number;
  segments?: number;
  amplitude?: number;
  speed?: number;
  colorA?: string;
  colorB?: string;
  opacity?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
}) {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: amplitude },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    }),
    [amplitude, speed, opacity, colorA, colorB],
  );

  useFrame((state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
    void state;
  });

  return (
    <mesh rotation={rotation} position={position}>
      <planeGeometry args={[size, size, segments, segments]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={waveVertex}
        fragmentShader={waveFragment}
        transparent
        depthWrite={false}
        wireframe
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  );
}

/** Tron-like wireframe terrain. Used as a section backdrop. */
export function WaveGridScene({
  colorA = "#00ff9d",
  colorB = "#6fffd0",
  rings = 2,
  opacity = 0.5,
}: {
  colorA?: string;
  colorB?: string;
  rings?: number;
  opacity?: number;
}) {
  return (
    <>
      <fog attach="fog" args={["#020805", 10, 30]} />
      <WaveSurface colorA={colorA} colorB={colorB} opacity={opacity} rotation={[-Math.PI / 2.3, 0, 0.2]} />
      <WaveSurface
        size={22}
        amplitude={0.6}
        speed={0.42}
        colorA={colorB}
        colorB={colorA}
        opacity={opacity * 0.6}
        rotation={[-Math.PI / 2.1, 0, -0.35]}
        position={[0, 1.6, -7]}
      />
      {Array.from({ length: rings }).map((_, i) => (
        <OrbitRings key={i} count={1} radius={5 + i * 3} color={colorA} opacity={0.18} />
      ))}
      <ambientLight intensity={0.5} color="#a6ffd0" />
    </>
  );
}

/* ----------------------------------------------------------------- 2. aurora */

const auroraVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 p = position;
    float w = sin(uv.x * 6.0 + uTime * 0.5) * 0.5 + sin(uv.x * 11.0 - uTime * 0.32) * 0.24;
    p.z += w;
    vWave = w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const auroraFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vWave;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    float bands = sin(vUv.y * 5.0 + uTime * 0.4 + sin(vUv.x * 3.0) * 0.8);
    float curtain = smoothstep(0.0, 0.75, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
    float streak = smoothstep(0.2, 1.0, bands * 0.5 + 0.5) * curtain;
    float shimmer = 0.75 + 0.25 * sin(vUv.x * 40.0 + hash(floor(vUv.x * 24.0)) * 12.0 + uTime);
    float edge = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
    vec3 color = mix(uColorA, uColorB, clamp(vUv.y + vWave * 0.2, 0.0, 1.0));
    gl_FragColor = vec4(color, streak * shimmer * edge * uOpacity);
  }
`;

function AuroraCurtain({
  colorA = "#00ff9d",
  colorB = "#6fffd0",
  opacity = 0.55,
  position = [0, 0, -4] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
}: {
  colorA?: string;
  colorB?: string;
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 10 },
      uOpacity: { value: opacity },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    }),
    [opacity, colorA, colorB],
  );

  useFrame((state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[18, 9, 120, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={auroraVertex}
        fragmentShader={auroraFragment}
        transparent
        depthWrite={false}
        side={DoubleSide}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

/** Flowing light curtains — soft, atmospheric, cheap. */
export function AuroraScene({
  colorA = "#00ff9d",
  colorB = "#6fffd0",
}: {
  colorA?: string;
  colorB?: string;
}) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y = THREE_LERP(group.current.rotation.y, state.pointer.x * 0.12, delta);
      group.current.rotation.x = THREE_LERP(group.current.rotation.x, -state.pointer.y * 0.06, delta);
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.32;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#020805", 12, 34]} />
      <group ref={group}>
        <AuroraCurtain colorA={colorA} colorB={colorB} opacity={0.6} position={[0, 1.4, -6]} rotation={[0.12, 0, 0]} />
        <AuroraCurtain
          colorA={colorB}
          colorB={colorA}
          opacity={0.42}
          position={[-1.5, -1.2, -8]}
          rotation={[-0.1, 0.2, 0.08]}
          scale={1.35}
        />
        <AuroraCurtain
          colorA={colorA}
          colorB="#a8ff5c"
          opacity={0.3}
          position={[2.2, 0.2, -10]}
          rotation={[0.05, -0.25, -0.06]}
          scale={1.7}
        />
      </group>
      <ParticleField count={520} radius={10} height={10} size={22} colorA={colorA} colorB={colorB} drift={0.04} />
      <ambientLight intensity={0.45} color="#a6ffd0" />
    </>
  );
}

/* ----------------------------------------------------------------- 3. galaxy */

const galaxyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aArm;
  varying float vAlpha;
  varying float vArm;

  void main() {
    vArm = aArm;
    vec3 p = position;
    float t = uTime * 0.05;
    float c = cos(t), s = sin(t);
    p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = smoothstep(26.0, 3.0, -mv.z);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (26.0 / max(-mv.z, 0.8));
  }
`;

const galaxyFragment = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uArm;
  uniform float uTime;
  varying float vAlpha;
  varying float vArm;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float pulse = 0.7 + 0.3 * sin(uTime * 1.6 + vArm * 6.28);
    vec3 color = mix(uCore, uArm, vArm) * pulse;
    gl_FragColor = vec4(color, soft * vAlpha * (0.45 + 0.55 * vArm));
  }
`;

/** Spiral galaxy of point sprites. Header art for creator profiles and 404s. */
export function GalaxyScene({
  count = 2600,
  core = "#6fffd0",
  arm = "#00ff9d",
}: {
  count?: number;
  core?: string;
  arm?: string;
}) {
  const material = useRef<ShaderMaterial>(null);

  const { positions, scales, arms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const arms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const armIndex = i % 3;
      const armRatio = armIndex / 3;
      const t = Math.pow(Math.random(), 0.62);
      const radius = t * 7.2;
      const branch = radius * 0.42;
      const theta = armRatio * Math.PI * 2 + t * 3.4 + (Math.random() - 0.5) * 0.85;
      const scatter = (Math.random() - 0.5) * branch;
      positions[i * 3] = Math.cos(theta) * radius + scatter;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.55 * (1 - t * 0.6);
      positions[i * 3 + 2] = Math.sin(theta) * radius + scatter;
      scales[i] = 0.35 + Math.random() * 1.5;
      arms[i] = t;
    }
    return { positions, scales, arms };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2) },
      uCore: { value: new Color(core) },
      uArm: { value: new Color(arm) },
    }),
    [core, arm],
  );

  useFrame((state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <>
      <fog attach="fog" args={["#020805", 8, 26]} />
      <points rotation={[-0.42, 0, 0.16]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
          <bufferAttribute attach="attributes-aArm" args={[arms, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={galaxyVertex}
          fragmentShader={galaxyFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      {/* hot core */}
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#dcffe9" />
      </mesh>
      <OrbitRings count={2} radius={3.4} color={arm} opacity={0.22} />
      <ambientLight intensity={0.5} color="#a6ffd0" />
    </>
  );
}

/* ------------------------------------------------------------ 4. coin core */

function CoreShell({ color }: { color: string }) {
  const shell = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!shell.current) return;
    shell.current.rotation.x += delta * 0.18;
    shell.current.rotation.y -= delta * 0.24;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.045;
    shell.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={shell}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshPhysicalMaterial
        color="#032014"
        emissive={color}
        emissiveIntensity={0.55}
        metalness={0.62}
        roughness={0.16}
        clearcoat={1}
        clearcoatRoughness={0.1}
        iridescence={0.7}
        iridescenceIOR={2}
        flatShading
      />
    </mesh>
  );
}

/** The "coin" motif: a faceted core wrapped in rings and orbiting shards. */
export function CoinCoreScene({
  color = "#00ff9d",
  accent = "#6fffd0",
  shards = 14,
}: {
  color?: string;
  accent?: string;
  shards?: number;
}) {
  const group = useRef<Group>(null);
  const shardGroup = useRef<Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = Math.sin(t * 0.24) * 0.18;
      group.current.position.y = Math.sin(t * 0.6) * 0.22;
      group.current.rotation.z = THREE_LERP(group.current.rotation.z, state.pointer.x * 0.2, delta * 2);
    }
    if (shardGroup.current) {
      shardGroup.current.rotation.y -= delta * 0.42;
      shardGroup.current.rotation.z += delta * 0.16;
    }
  });

  const shardData = useMemo(
    () =>
      Array.from({ length: shards }).map((_, i) => {
        const a = (i / shards) * Math.PI * 2;
        return {
          position: [Math.cos(a) * 2.35, (Math.random() - 0.5) * 1.1, Math.sin(a) * 2.35] as [number, number, number],
          scale: 0.06 + Math.random() * 0.11,
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
        };
      }),
    [shards],
  );

  return (
    <>
      <fog attach="fog" args={["#020805", 9, 24]} />
      <group ref={group}>
        <CoreShell color={color} />
        <mesh rotation={[Math.PI / 2.1, 0, 0.2]}>
          <torusGeometry args={[2, 0.014, 8, 160]} />
          <meshBasicMaterial color={accent} transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[0.4, Math.PI / 2.4, 0]}>
          <torusGeometry args={[2.45, 0.01, 8, 160]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} />
        </mesh>
        <group ref={shardGroup}>
          {shardData.map((shard, i) => (
            <mesh key={i} position={shard.position} scale={shard.scale} rotation={shard.rotation}>
              <tetrahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={i % 3 === 0 ? accent : color} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      </group>
      <pointLight position={[0, 0, 3]} intensity={14} distance={12} color={color} />
      <pointLight position={[-3, 2, -2]} intensity={8} distance={10} color={accent} />
      <ambientLight intensity={0.4} color="#a6ffd0" />
    </>
  );
}

/* ------------------------------------------------------------- 5. burst */

const burstVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uPixelRatio;
  attribute vec3 aVelocity;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vSeed = aSeed;
    float eased = 1.0 - pow(1.0 - uProgress, 2.2);
    vec3 p = position + aVelocity * eased * 3.2;
    p.y += sin(aSeed * 20.0 + uProgress * 6.0) * 0.4 * eased;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vAlpha = (1.0 - uProgress) * smoothstep(18.0, 2.0, -mv.z);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (10.0 + aSeed * 22.0) * uPixelRatio * (1.0 - uProgress * 0.6) * (14.0 / max(-mv.z, 0.8));
  }
`;

const burstFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.22, 0.0, d);
    float soft = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(uColorA, uColorB, vSeed), (soft * 0.6 + core * 0.8) * vAlpha);
  }
`;

/** Celebration burst — fires once on payment confirmation. */
export function ParticleBurstScene({
  count = 900,
  colorA = "#00ff9d",
  colorB = "#a8ff5c",
  duration = 2.6,
}: {
  count?: number;
  colorA?: string;
  colorB?: string;
  duration?: number;
}) {
  const material = useRef<ShaderMaterial>(null);

  const { positions, velocities, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const speed = 0.45 + Math.random() * 0.85;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities[i * 3] = r * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = (u * 0.75 + 0.35) * speed;
      velocities[i * 3 + 2] = r * Math.sin(theta) * speed * 0.6;
      seeds[i] = Math.random();
    }
    return { positions, velocities, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    }),
    [colorA, colorB],
  );

  useFrame((_, delta) => {
    if (!material.current) return;
    const current = material.current.uniforms.uProgress.value as number;
    if (current >= 1) return;
    material.current.uniforms.uProgress.value = Math.min(1, current + delta / duration);
  });

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aVelocity" args={[velocities, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={burstVertex}
          fragmentShader={burstFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <pointLight position={[0, 0, 2]} intensity={18} distance={10} color={colorA} />
      <ambientLight intensity={0.4} color="#a6ffd0" />
    </>
  );
}

/* ---------------------------------------------------------- 6. showcase */

/**
 * Seeded generative sculpture used as the 3D preview on a project page.
 * Deterministic from the slug so a listing always renders the same object.
 */
export function SculptureScene({
  seed = "nexus",
  colorA = "#00ff9d",
  colorB = "#6fffd0",
  nodes = 34,
}: {
  seed?: string;
  colorA?: string;
  colorB?: string;
  nodes?: number;
}) {
  const group = useRef<Group>(null);

  const points = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return Array.from({ length: nodes }, () => {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 1.25 + rand() * 0.95;
      return [Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(theta) * r] as [
        number,
        number,
        number,
      ];
    });
  }, [seed, nodes]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x = Math.sin(t * 0.3) * 0.22;
    group.current.position.y = Math.sin(t * 0.7) * 0.12;
  });

  return (
    <>
      <fog attach="fog" args={["#020805", 6, 18]} />
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshPhysicalMaterial
            color="#04210f"
            emissive={colorA}
            emissiveIntensity={0.45}
            metalness={0.55}
            roughness={0.2}
            clearcoat={1}
            flatShading
          />
        </mesh>
        {points.map((p, i) => (
          <mesh key={i} position={p} scale={0.045}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color={i % 3 === 0 ? colorB : colorA} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[2.1, 0.012, 8, 140]} />
          <meshBasicMaterial color={colorB} transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[0.5, Math.PI / 2.2, 0.3]}>
          <torusGeometry args={[2.45, 0.008, 8, 140]} />
          <meshBasicMaterial color={colorA} transparent opacity={0.4} />
        </mesh>
      </group>
      <pointLight position={[2.4, 2.4, 3]} intensity={16} distance={12} color={colorA} />
      <pointLight position={[-3, -1.5, 1]} intensity={9} distance={10} color={colorB} />
      <ambientLight intensity={0.45} color="#a6ffd0" />
    </>
  );
}

/* ------------------------------------------------------------- 7. tangle */

/** Interlocked torus knots — decorative filler for wide empty bands. */
export function KnotFieldScene({
  color = "#00ff9d",
  count = 3,
}: {
  color?: string;
  count?: number;
}) {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.1;
      group.current.children.forEach((child, i) => {
        child.rotation.x += delta * (0.14 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
      });
    }
  });

  return (
    <>
      <fog attach="fog" args={["#020805", 9, 26]} />
      <group ref={group} position={[0, 0, -2]}>
        {Array.from({ length: count }).map((_, i) => (
          <mesh key={i} position={[(i - (count - 1) / 2) * 3.4, Math.sin(i) * 0.6, -i * 0.8]} scale={0.85 - i * 0.12}>
            <torusKnotGeometry args={[0.85, 0.24, 150, 22]} />
            <meshStandardMaterial
              color="#04210f"
              emissive={color}
              emissiveIntensity={0.42}
              metalness={0.5}
              roughness={0.24}
            />
          </mesh>
        ))}
      </group>
      <FloatingShapes parallax={0.4} />
      <pointLight position={[0, 3, 4]} intensity={20} distance={14} color={color} />
      <ambientLight intensity={0.4} color="#a6ffd0" />
    </>
  );
}

/** Frame-rate independent lerp helper used by the scenes above. */
function THREE_LERP(current: number, target: number, delta: number) {
  return current + (target - current) * Math.min(1, delta * 2.4);
}