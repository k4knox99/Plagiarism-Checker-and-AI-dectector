import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Activity, 
  Layers, 
  Zap, 
  RotateCcw, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Gauge,
  BarChart2
} from 'lucide-react';
import { SentenceAnalysis } from '../types';

export type Scanner3DStatus = 'idle' | 'scanning' | 'completed';
export type Scanner3DMode = 'radar' | 'core' | 'cadence';

interface ThreeCoreScannerProps {
  status: Scanner3DStatus;
  authenticityScore?: number;
  aiScore?: number;
  metrics?: {
    perplexityScore?: number;
    burstinessScore?: number;
    repetitionScore?: number;
    syntacticUniformity?: number;
    clicheCount?: number;
  };
  sentenceAnalysis?: SentenceAnalysis[];
  onSelectSentence?: (sentence: SentenceAnalysis) => void;
  onTriggerScan?: () => void;
  className?: string;
}

// 1. Quantum Gyroscope Rings (3 Concentric Orthogonal Rings)
function GyroscopeRings({ status }: { status: Scanner3DStatus }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
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
function NeuralCore({ 
  status, 
  score, 
  onClick 
}: { 
  status: Scanner3DStatus; 
  score?: number; 
  onClick?: () => void 
}) {
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
    <group onClick={onClick}>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 2.2, 64]} />
        <meshBasicMaterial
          color={beamColor}
          transparent={true}
          opacity={status === 'scanning' ? 0.45 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

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

// 4. Interactive 3D Stylometric Metric Nodes
function StylometryNodes({
  metrics,
  onHoverNode
}: {
  metrics?: {
    perplexityScore?: number;
    burstinessScore?: number;
    syntacticUniformity?: number;
    clicheCount?: number;
  };
  onHoverNode: (info: { title: string; score: string; status: string; desc: string } | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const nodes = [
    {
      pos: [1.8, 0.4, 0] as [number, number, number],
      color: '#818cf8',
      title: 'Perplexity Score',
      score: `${metrics?.perplexityScore ?? 14}/100`,
      status: (metrics?.perplexityScore ?? 14) < 40 ? 'AI Predictable' : 'Human Lexical Variety',
      desc: 'Lexical predictability index. AI text has low perplexity (<30).'
    },
    {
      pos: [-1.8, -0.3, 0] as [number, number, number],
      color: '#34d399',
      title: 'Burstiness Variance',
      score: `${metrics?.burstinessScore ?? 16}/100`,
      status: (metrics?.burstinessScore ?? 16) < 35 ? 'Uniform AI Cadence' : 'Dynamic Human Rhythm',
      desc: 'Standard deviation of sentence lengths. Humans alternate short and long clauses.'
    },
    {
      pos: [0, 1.7, 0.5] as [number, number, number],
      color: '#f59e0b',
      title: 'Syntactic Uniformity',
      score: `${metrics?.syntacticUniformity ?? 88}%`,
      status: (metrics?.syntacticUniformity ?? 88) > 60 ? 'Mechanical Balance' : 'Organic Variation',
      desc: 'Monotony score of syntactic tree clause structures.'
    },
    {
      pos: [0, -1.7, -0.5] as [number, number, number],
      color: '#f43f5e',
      title: 'AI Clichés & Tropes',
      score: `${metrics?.clicheCount ?? 4} found`,
      status: (metrics?.clicheCount ?? 4) > 2 ? 'Robotic Buzzwords' : 'Natural Phrasing',
      desc: 'Formulas like "delve into", "a testament to", and "crucial role".'
    }
  ];

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <group key={i} position={node.pos}>
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation();
              onHoverNode({
                title: node.title,
                score: node.score,
                status: node.status,
                desc: node.desc
              });
            }}
            onPointerOut={() => onHoverNode(null)}
          >
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Pulsing beacon glow ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.25, 0.32, 24]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 5. Interactive 3D Sentence Orbital Beads
function SentenceOrbitBeads({
  sentences = [],
  onSelect
}: {
  sentences?: SentenceAnalysis[];
  onSelect?: (s: SentenceAnalysis) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.25;
    }
  });

  const beadData = useMemo(() => {
    const count = Math.min(sentences.length, 24);
    if (count === 0) return [];

    return sentences.slice(0, count).map((s, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const radius = 2.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 3) * 0.3;

      const color = s.aiProbability >= 65 ? '#ef4444' : s.aiProbability >= 35 ? '#f59e0b' : '#10b981';

      return { x, y, z, color, sentence: s, idx };
    });
  }, [sentences]);

  if (beadData.length === 0) return null;

  return (
    <group ref={groupRef}>
      {beadData.map((b) => (
        <group key={b.idx} position={[b.x, b.y, b.z]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(b.sentence);
            }}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.9}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 6. Cadence Waveform (3D sinusoidal undulating burstiness mesh)
function CadenceWaveform({ status }: { status: Scanner3DStatus }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = (meshRef.current.geometry.attributes.position as THREE.BufferAttribute);
    if (!pos) return;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const wave = Math.sin(u * 3 + t * 2.5) * Math.cos(u * 1.5 + t) * (status === 'scanning' ? 0.6 : 0.35);
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, -0.2, 0]}>
      <planeGeometry args={[4.2, 1.8, 48, 12]} />
      <meshBasicMaterial
        color={status === 'completed' ? '#34d399' : '#818cf8'}
        wireframe={true}
        transparent={true}
        opacity={0.75}
      />
    </mesh>
  );
}

export const ThreeCoreScanner: React.FC<ThreeCoreScannerProps> = ({
  status,
  authenticityScore,
  aiScore,
  metrics,
  sentenceAnalysis = [],
  onSelectSentence,
  onTriggerScan,
  className = 'h-72 sm:h-80 w-full'
}) => {
  const [mode, setMode] = useState<Scanner3DMode>('radar');
  const [activeTooltip, setActiveTooltip] = useState<{
    title: string;
    score: string;
    status: string;
    desc: string;
  } | null>(null);

  const flaggedCount = sentenceAnalysis.filter(s => s.aiProbability >= 65).length;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center ${className}`}>
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0">
        <Canvas gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={45} />
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1.5} color="#818cf8" />
          <pointLight position={[-5, -5, -5]} intensity={0.8} color="#34d399" />
          <directionalLight position={[0, 4, 3]} intensity={1.2} />

          <Float speed={status === 'scanning' ? 3.0 : 1.2} rotationIntensity={0.5} floatIntensity={0.4}>
            <group>
              {mode === 'cadence' ? (
                <>
                  <CadenceWaveform status={status} />
                  <NeuralCore status={status} score={authenticityScore} onClick={onTriggerScan} />
                </>
              ) : (
                <>
                  <GyroscopeRings status={status} />
                  <NeuralCore status={status} score={authenticityScore} onClick={onTriggerScan} />
                  <LaserScannerBeam status={status} />
                  <StylometryNodes metrics={metrics} onHoverNode={setActiveTooltip} />
                  <SentenceOrbitBeads sentences={sentenceAnalysis} onSelect={onSelectSentence} />
                </>
              )}
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

      {/* Top 3D Control Bar & Mode Selector */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setMode('radar')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              mode === 'radar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Forensic Radar</span>
          </button>
          <button
            onClick={() => setMode('cadence')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
              mode === 'cadence' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Cadence Wave</span>
          </button>
        </div>

        {/* 1-Click Re-Scan or Calibrate Action Button */}
        {onTriggerScan && (
          <button
            onClick={onTriggerScan}
            disabled={status === 'scanning'}
            className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/80 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 shadow transition transform active:scale-95 disabled:opacity-50"
            title="Click to trigger deep diagnostic scan"
          >
            <Zap className={`w-3.5 h-3.5 ${status === 'scanning' ? 'text-indigo-400 animate-spin' : 'text-amber-400'}`} />
            <span>{status === 'scanning' ? 'Scanning...' : 'Calibrate 3D Core'}</span>
          </button>
        )}
      </div>

      {/* Interactive Tooltip HUD (when hovering 3D nodes) */}
      {activeTooltip && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none p-3 rounded-xl bg-zinc-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md max-w-xs text-center animate-in fade-in zoom-in-95">
          <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{activeTooltip.title}</span>
          </div>
          <div className="text-base font-bold font-mono text-indigo-400 my-0.5">
            {activeTooltip.score}
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 mb-1">
            {activeTooltip.status}
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            {activeTooltip.desc}
          </p>
        </div>
      )}

      {/* Bottom Telemetry Readout HUD */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10 text-[11px] font-mono">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300">
          <span className={`w-2 h-2 rounded-full ${
            status === 'scanning' ? 'bg-indigo-400 animate-pulse' : status === 'completed' ? 'bg-emerald-400' : 'bg-zinc-500'
          }`} />
          <span className="font-semibold uppercase tracking-wider">
            {status === 'scanning' ? 'Forensic Laser Sweep Active' : status === 'completed' ? 'Convergence Verified' : 'Neural Core: Standby'}
          </span>
          {authenticityScore !== undefined && (
            <>
              <span className="text-zinc-600">|</span>
              <span className="text-emerald-400 font-bold">{authenticityScore}% Authentic</span>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-400">
          <span>{sentenceAnalysis.length} Sentences</span>
          {flaggedCount > 0 && (
            <>
              <span>·</span>
              <span className="text-rose-400 font-bold">{flaggedCount} AI Flags</span>
            </>
          )}
          <span>·</span>
          <span>Interactive 3D Sensor</span>
        </div>
      </div>
    </div>
  );
};
