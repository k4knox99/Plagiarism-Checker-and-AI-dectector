import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export type Scanner3DStatus = 'idle' | 'scanning' | 'completed';

interface ThreeCoreScannerProps {
  status: Scanner3DStatus;
  authenticityScore?: number;
  className?: string;
  showSplineAlternative?: boolean;
}

// 1. Quantum Gyroscope Rings (3 Concentric Orthogonal Rings)
function GyroscopeRings({ status }: { status: Scanner3DStatus }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const speedMult = status === 'scanning' ? 4.5 : status === 'completed' ? 0.8 : 1.2;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.8 * speedMult;
      ring1Ref.current.rotation.y += delta * 0.5 * speedMult;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 1.1 * speedMult;
      ring2Ref.current.rotation.z += delta * 0.7 * speedMult;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.6 * speedMult;
      ring3Ref.current.rotation.x += delta * 0.9 * speedMult;
    }
  });

  const ringColor = status === 'scanning' ? '#818cf8' : status === 'completed' ? '#34d399' : '#6366f1';

  return (
    <group>
      {/* Outer Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.0, 0.035, 16, 100]} />
        <meshStandardMaterial
          color="#1e1e24"
          emissive={ringColor}
          emissiveIntensity={status === 'scanning' ? 0.6 : 0.25}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Middle Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.6, 0.03, 16, 100]} />
        <meshStandardMaterial
          color="#18181b"
          emissive={ringColor}
          emissiveIntensity={status === 'scanning' ? 0.8 : 0.2}
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* Inner Ring */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.2, 0.025, 16, 80]} />
        <meshStandardMaterial
          color="#27272a"
          emissive={ringColor}
          emissiveIntensity={status === 'scanning' ? 1.0 : 0.3}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

// 2. Neural Polyhedral Core with Internal Emissive Pulse
function NeuralCore({ status, score }: { status: Scanner3DStatus; score?: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulseSpeed = status === 'scanning' ? 8.0 : 2.5;
    const pulseScale = 1 + Math.sin(t * pulseSpeed) * (status === 'scanning' ? 0.12 : 0.05);

    if (coreRef.current) {
      coreRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      coreRef.current.rotation.y = t * (status === 'scanning' ? 2.5 : 0.5);
      coreRef.current.rotation.x = t * 0.3;
    }
    if (wireRef.current) {
      wireRef.current.scale.set(pulseScale * 1.15, pulseScale * 1.15, pulseScale * 1.15);
      wireRef.current.rotation.y = -t * 0.8;
      wireRef.current.rotation.z = t * 0.4;
    }
  });

  const coreColor = useMemo(() => {
    if (status === 'scanning') return '#c084fc';
    if (status === 'completed') {
      return (score ?? 80) >= 70 ? '#10b981' : (score ?? 80) >= 40 ? '#f59e0b' : '#ef4444';
    }
    return '#6366f1';
  }, [status, score]);

  return (
    <group>
      {/* Faceted Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial
          color="#09090b"
          emissive={coreColor}
          emissiveIntensity={status === 'scanning' ? 1.8 : status === 'completed' ? 1.2 : 0.7}
          metalness={0.8}
          roughness={0.15}
          flatShading={true}
        />
      </mesh>

      {/* Holographic Wireframe Cage */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.78, 2]} />
        <meshBasicMaterial
          color={coreColor}
          wireframe={true}
          transparent={true}
          opacity={status === 'scanning' ? 0.8 : 0.35}
        />
      </mesh>
    </group>
  );
}

// 3. Dynamic Laser Scanning Plane
function LaserScannerBeam({ status }: { status: Scanner3DStatus }) {
  const beamRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!beamRef.current) return;
    if (status === 'scanning') {
      const t = clock.getElapsedTime() * 4.0;
      beamRef.current.position.y = Math.sin(t) * 1.6;
      beamRef.current.visible = true;
    } else if (status === 'completed') {
      beamRef.current.position.y = 0;
      beamRef.current.visible = true;
    } else {
      beamRef.current.visible = false;
    }
  });

  const beamColor = status === 'completed' ? '#34d399' : '#818cf8';

  return (
    <group ref={beamRef} visible={status !== 'idle'}>
      {/* Laser line disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 2.2, 64]} />
        <meshBasicMaterial
          color={beamColor}
          transparent={true}
          opacity={status === 'scanning' ? 0.45 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center sharp laser beam */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.0, 2.25, 4]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={status === 'scanning' ? 0.8 : 0.4}
          wireframe={true}
        />
      </mesh>
    </group>
  );
}

// 4. Orbital Quantum Particle Field
function OrbitalParticles({ status }: { status: Scanner3DStatus }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, count] = useMemo(() => {
    const particleCount = 180;
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return [pos, particleCount];
  }, []);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    const speed = status === 'scanning' ? 1.5 : 0.3;
    pointsRef.current.rotation.y += delta * speed;
    pointsRef.current.rotation.x += delta * (speed * 0.5);
  });

  const particleColor = status === 'scanning' ? '#a78bfa' : status === 'completed' ? '#6ee7b7' : '#93c5fd';

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={particleColor}
        transparent={true}
        opacity={status === 'scanning' ? 0.9 : 0.55}
        sizeAttenuation={true}
      />
    </points>
  );
}

export const ThreeCoreScanner: React.FC<ThreeCoreScannerProps> = ({
  status,
  authenticityScore,
  className = 'h-64 sm:h-72 w-full',
  showSplineAlternative = false
}) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-zinc-950/80 border border-zinc-800/80 shadow-2xl flex flex-col items-center justify-center ${className}`}>
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0">
        <Canvas gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={45} />
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={1.5} color="#818cf8" />
          <pointLight position={[-5, -5, -5]} intensity={0.8} color="#34d399" />
          <directionalLight position={[0, 4, 3]} intensity={1.2} />

          <Float speed={status === 'scanning' ? 3.0 : 1.5} rotationIntensity={0.6} floatIntensity={0.5}>
            <group>
              <GyroscopeRings status={status} />
              <NeuralCore status={status} score={authenticityScore} />
              <LaserScannerBeam status={status} />
              <OrbitalParticles status={status} />
            </group>
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={status === 'idle'}
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </div>

      {/* Minimal Status HUD Overlay (Collapsible & Unobtrusive) */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10 text-[11px] font-mono">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800/80 text-zinc-300">
          <span className={`w-2 h-2 rounded-full ${
            status === 'scanning'
              ? 'bg-indigo-400'
              : status === 'completed'
              ? 'bg-emerald-400'
              : 'bg-zinc-500'
          }`} />
          <span className="font-semibold uppercase tracking-wider">
            {status === 'scanning' ? 'Optical Laser Scanning...' : status === 'completed' ? 'Forensic Convergence Confirmed' : 'Neural Core: Standby'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800/80 text-zinc-400">
          <span>Three.js WebGL Core</span>
          <span>·</span>
          <span>60 FPS Reactive</span>
        </div>
      </div>
    </div>
  );
};
