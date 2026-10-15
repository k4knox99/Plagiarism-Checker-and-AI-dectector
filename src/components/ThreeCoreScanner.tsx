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
  Sparkles,
  FileSearch,
  Wand2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { SentenceAnalysis, ScannerMode } from '../types';

export type Scanner3DStatus = 'idle' | 'scanning' | 'completed';
export type Scanner3DMode = 'radar' | 'core' | 'cadence';

interface ThreeCoreScannerProps {
  status: Scanner3DStatus;
  variant?: 'hero' | 'workspace';
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
  onOneClickHumanize?: () => void;
  onSelectMode?: (mode: ScannerMode) => void;
  onLaunchWorkspace?: () => void;
  onFileDrop?: (file: File) => void;
  className?: string;
}

// 1. Quantum Gyroscope Concentric Rings
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
          emissiveIntensity={status === 'scanning' ? 0.8 : 0.3}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.6, 0.03, 16, 100]} />
        <meshStandardMaterial
          color="#18181b"
          emissive={ringColor}
          emissiveIntensity={status === 'scanning' ? 0.9 : 0.25}
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.2, 0.025, 16, 80]} />
        <meshStandardMaterial
          color="#27272a"
          emissive={ringColor}
          emissiveIntensity={status === 'scanning' ? 1.0 : 0.35}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

// 2. Central Clickable Reactor Sphere with Pulsing Particle Shroud
function CentralReactorSphere({
  status,
  aiScore,
  onCoreClick
}: {
  status: Scanner3DStatus;
  aiScore?: number;
  onCoreClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (status === 'scanning' ? 3.0 : 0.6);
      meshRef.current.rotation.x += delta * (status === 'scanning' ? 1.5 : 0.3);
      const scale = 0.85 + Math.sin(state.clock.elapsedTime * (status === 'scanning' ? 8 : 2)) * 0.04;
      meshRef.current.scale.set(scale, scale, scale);
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.4;
      const glowScale = 1.05 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });

  const isHighAi = typeof aiScore === 'number' && aiScore >= 65;
  const isHuman = typeof aiScore === 'number' && aiScore < 35;

  const coreColor = status === 'scanning'
    ? '#6366f1'
    : isHighAi
    ? '#f43f5e'
    : isHuman
    ? '#10b981'
    : '#818cf8';

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onCoreClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[0.9, 3]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={hovered ? '#a855f7' : coreColor}
          emissiveIntensity={status === 'scanning' ? 1.4 : hovered ? 1.2 : 0.8}
          roughness={0.15}
          metalness={0.9}
          wireframe={status === 'scanning'}
        />
      </mesh>

      {/* Outer Holographic Energy Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.08, 24, 24]} />
        <meshStandardMaterial
          color={coreColor}
          transparent
          opacity={status === 'scanning' ? 0.35 : 0.15}
          wireframe
        />
      </mesh>
    </group>
  );
}

// 3. Interactive Hero Orbiting Tool Nodes ([1. Deep Scan], [2. AI Detector], [3. Plagiarism], [4. Humanizer])
function HeroOrbitalToolNodes({
  onSelectMode,
  onLaunchWorkspace
}: {
  onSelectMode?: (mode: ScannerMode) => void;
  onLaunchWorkspace?: () => void;
}) {
  const tools = [
    {
      mode: 'comprehensive' as ScannerMode,
      title: 'Deep Scan',
      badge: 'Full Forensic',
      angle: 0,
      icon: '🛡️',
      color: 'border-indigo-500/60 bg-indigo-950/80 text-indigo-200'
    },
    {
      mode: 'ai' as ScannerMode,
      title: 'AI Detector',
      badge: 'Stylometry',
      angle: (1 / 5) * Math.PI * 2,
      icon: '🤖',
      color: 'border-rose-500/60 bg-rose-950/80 text-rose-200'
    },
    {
      mode: 'plagiarism' as ScannerMode,
      title: 'Plagiarism Audit',
      badge: '5-Gram Shingles',
      angle: (2 / 5) * Math.PI * 2,
      icon: '🔍',
      color: 'border-purple-500/60 bg-purple-950/80 text-purple-200'
    },
    {
      mode: 'fixer' as ScannerMode,
      title: 'Humanizer Fixer',
      badge: '<5% AI Cadence',
      angle: (3 / 5) * Math.PI * 2,
      icon: '✨',
      color: 'border-emerald-500/60 bg-emerald-950/80 text-emerald-200'
    },
    {
      mode: 'surgeon' as ScannerMode,
      title: 'Doc Surgeon',
      badge: 'Word (.docx) & PDF',
      angle: (4 / 5) * Math.PI * 2,
      icon: '📑',
      color: 'border-teal-500/60 bg-teal-950/80 text-teal-200'
    }
  ];

  return (
    <group>
      {tools.map((t, i) => {
        const radius = 2.8;
        const x = Math.cos(t.angle) * radius;
        const y = Math.sin(t.angle) * 0.5;
        const z = Math.sin(t.angle) * radius;

        return (
          <group key={i} position={[x, y, z]}>
            <Html center distanceFactor={10} zIndexRange={[100, 0]}>
              <button
                type="button"
                onClick={() => {
                  onSelectMode?.(t.mode);
                  onLaunchWorkspace?.();
                }}
                className={`p-2.5 rounded-xl border backdrop-blur-xl shadow-2xl transition transform hover:scale-110 active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap pointer-events-auto ${t.color}`}
              >
                <span className="text-sm">{t.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1">
                    <span>{t.title}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-mono block">{t.badge}</span>
                </div>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// 4. Interactive Workspace Sentence Orbiting Beads
function SentenceOrbitingBeads({
  sentences,
  onSelectSentence
}: {
  sentences?: SentenceAnalysis[];
  onSelectSentence?: (sentence: SentenceAnalysis) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const displaySentences = useMemo(() => {
    if (!sentences || sentences.length === 0) return [];
    return sentences.slice(0, 14); // Display up to 14 orbital satellites
  }, [sentences]);

  if (displaySentences.length === 0) return null;

  return (
    <group ref={groupRef}>
      {displaySentences.map((s, idx) => {
        const total = displaySentences.length;
        const phi = Math.acos(-1 + (2 * idx) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        const radius = 2.4 + (idx % 2 === 0 ? 0.3 : -0.2);

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        const isHighAi = s.aiProbability >= 65;
        const isMixed = s.aiProbability >= 35 && s.aiProbability < 65;
        const beadColor = isHighAi ? '#f43f5e' : isMixed ? '#f59e0b' : '#10b981';

        const isHovered = hoveredIdx === idx;

        return (
          <group key={idx} position={[x, y, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectSentence?.(s);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredIdx(idx);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredIdx(null);
              }}
            >
              <sphereGeometry args={[isHovered ? 0.14 : 0.09, 16, 16]} />
              <meshStandardMaterial
                color={beadColor}
                emissive={beadColor}
                emissiveIntensity={isHovered ? 1.5 : 0.9}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>

            {isHovered && (
              <Html center distanceFactor={8} zIndexRange={[120, 0]}>
                <div 
                  onClick={() => onSelectSentence?.(s)}
                  className="p-2.5 rounded-xl bg-zinc-950/95 border border-zinc-700 text-xs shadow-2xl w-48 text-left pointer-events-auto cursor-pointer animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-800">
                    <span className="font-mono font-bold" style={{ color: beadColor }}>
                      {s.aiProbability}% AI Risk
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Sentence #{idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-zinc-200 line-clamp-2 leading-tight">
                    {s.sentence}
                  </p>
                  <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Click to Inspect &amp; Fix →</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// 5. Main Component: ThreeCoreScanner
export const ThreeCoreScanner: React.FC<ThreeCoreScannerProps> = ({
  status,
  variant = 'workspace',
  authenticityScore = 78,
  aiScore = 22,
  metrics,
  sentenceAnalysis,
  onSelectSentence,
  onTriggerScan,
  onOneClickHumanize,
  onSelectMode,
  onLaunchWorkspace,
  onFileDrop,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and drop directly onto 3D Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileDrop) {
      onFileDrop(file);
    }
  };

  const isHighAi = typeof aiScore === 'number' && aiScore >= 65;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950 border transition-all ${
        isDragOver
          ? 'border-indigo-500 ring-4 ring-indigo-500/30'
          : 'border-zinc-800/80 shadow-2xl'
      } ${variant === 'hero' ? 'h-[440px] sm:h-[500px]' : 'h-[360px] sm:h-[400px]'} ${className}`}
    >
      {/* 3D Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-indigo-500 animate-in fade-in">
          <Upload className="w-12 h-12 text-indigo-400 animate-bounce mb-3" />
          <h4 className="text-base font-bold text-white">Drop Word or PDF Directly onto 3D Core</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Drop .docx, .pdf, .txt, or .md to instantly parse text or trigger format-preserving surgery.
          </p>
        </div>
      )}

      {/* Top 3D Status HUD Header */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              status === 'scanning' ? 'bg-indigo-400 animate-ping' : isHighAi ? 'bg-rose-400' : 'bg-emerald-400'
            }`} />
            <span className="text-zinc-300 font-semibold uppercase tracking-wider text-[11px]">
              {variant === 'hero' ? '3D Neural Forensics Engine' : `Reactor: ${status.toUpperCase()}`}
            </span>
          </div>

          {variant === 'workspace' && typeof aiScore === 'number' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400">Authenticity:</span>
              <span className="font-bold text-emerald-400">{authenticityScore}%</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">AI Risk:</span>
              <span className={`font-bold ${isHighAi ? 'text-rose-400' : 'text-zinc-200'}`}>{aiScore}%</span>
            </div>
          )}
        </div>

        {/* Action Button inside 3D Viewport */}
        <div className="pointer-events-auto">
          {variant === 'hero' ? (
            <button
              onClick={onLaunchWorkspace}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : isHighAi && onOneClickHumanize ? (
            <button
              onClick={onOneClickHumanize}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>One-Click Humanize All</span>
            </button>
          ) : (
            <button
              onClick={onTriggerScan}
              disabled={status === 'scanning'}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition transform active:scale-95"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${status === 'scanning' ? 'animate-spin' : ''}`} />
              <span>{status === 'scanning' ? 'Scanning...' : 'Trigger 3D Re-Scan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom 3D Telemetry HUD Details (Workspace Mode) */}
      {variant === 'workspace' && metrics && (
        <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
            <span>Perplexity: <strong className="text-indigo-300">{metrics.perplexityScore ?? 45}/100</strong></span>
            <span>·</span>
            <span>Burstiness: <strong className="text-purple-300">{metrics.burstinessScore ?? 60}/100</strong></span>
            <span>·</span>
            <span>Syntactic: <strong className="text-amber-300">{metrics.syntacticUniformity ?? 40}%</strong></span>
          </div>

          <div className="text-[11px] text-zinc-400 font-mono hidden md:flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
            <span>💡 Click Central Core or Orbiting Beads to Inspect &amp; Fix</span>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <Canvas className="w-full h-full cursor-grab active:cursor-grabbing">
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#6366f1" />

        <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
          <group>
            {/* Concentric Rotating Orthogonal Rings */}
            <GyroscopeRings status={status} />

            {/* Central Interactive Clickable Core */}
            <CentralReactorSphere
              status={status}
              aiScore={aiScore}
              onCoreClick={() => {
                if (isHighAi && onOneClickHumanize) {
                  onOneClickHumanize();
                } else if (onTriggerScan) {
                  onTriggerScan();
                }
              }}
            />

            {/* In Hero mode: 4 Orbiting 3D Tool Nodes */}
            {variant === 'hero' ? (
              <HeroOrbitalToolNodes
                onSelectMode={onSelectMode}
                onLaunchWorkspace={onLaunchWorkspace}
              />
            ) : (
              /* In Workspace mode: Orbiting Sentence Satellite Beads */
              <SentenceOrbitingBeads
                sentences={sentenceAnalysis}
                onSelectSentence={onSelectSentence}
              />
            )}
          </group>
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 2.3}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
};
