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
import { PixelCorgi, CorgiState } from './PixelCorgi';
import { PixelShield, PixelCrown, PixelSparkle } from './PixelStickers';

export type Scanner3DStatus = 'idle' | 'scanning' | 'completed';
export type Scanner3DMode = 'radar' | 'core' | 'cadence';

interface ThreeCoreScannerProps {
  status: Scanner3DStatus;
  variant?: 'hero' | 'workspace';
  hasText?: boolean;
  isRepaired?: boolean;
  needsFix?: boolean;
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

  const ringColor = status === 'scanning' ? '#a4b872' : status === 'completed' ? '#34d399' : '#606C38';

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
    ? '#606C38'
    : isHighAi
    ? '#f43f5e'
    : isHuman
    ? '#10b981'
    : '#a4b872';

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
  hasText = false,
  isRepaired = false,
  needsFix = false,
  authenticityScore,
  aiScore,
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
  const [activeDisplay, setActiveDisplay] = useState<'corgi' | '3d'>('corgi');
  const [manualCorgiState, setManualCorgiState] = useState<CorgiState | null>(null);

  // Drag and drop directly onto Scanner Station
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

  // User synchronization requirements:
  // 1. input document ထဲ စာမရှိရင် ပြေးနေမယ် (If no text in input document -> running)
  // 2. စာထည့်ပြီး fix ရန်ရှိရင် need to fix ဆိုတဲ့ပုံကိုပြမယ် (If text needs fix -> need to fix)
  // 3. မလိုရင် fixed ဆိုတာကိုပြမယ် (If no fix needed / authentic -> fixed)
  // 4. ပြင်ပြီးရင် လည်း fixedဆိုတာကိုလည်းပြရန် (If repaired -> fixed)

  const isHighAi = typeof aiScore === 'number' ? aiScore >= 45 : needsFix;

  let autoCorgiState: CorgiState;
  let statusMessage: string;
  let headerStatusText: string;
  let headerDotColor: string;
  let rightHintText: string;

  if (status === 'scanning') {
    autoCorgiState = 'running';
    statusMessage = 'Sniffing AI & Burstiness...';
    headerStatusText = 'Sniffing & Scanning...';
    headerDotColor = 'bg-amber-400 animate-ping';
    rightHintText = '🐾 Galloping & analyzing sentence entropy...';
  } else if (!hasText) {
    // Rule 1: No text in input document -> Running!
    autoCorgiState = 'running';
    statusMessage = 'No Text in Document · Corgi Running 🏃';
    headerStatusText = 'No Document Text · Running';
    headerDotColor = 'bg-amber-400 animate-pulse';
    rightHintText = '🐾 Corgi is on the run! Paste or type document text to start.';
  } else if (isRepaired) {
    // Rule 4: Repaired -> Fixed!
    autoCorgiState = 'fixed';
    statusMessage = 'Repaired & 100% Authentic! ✨';
    headerStatusText = 'Document Repaired · Authentic';
    headerDotColor = 'bg-[#606C38]';
    rightHintText = '💖 Repaired & verified human cadence! Crown awarded.';
  } else if (isHighAi) {
    // Rule 2: Has text and needs fix -> Needs Fix!
    autoCorgiState = 'needs_fix';
    statusMessage = 'Needs Repair / AI Detected! ❗';
    headerStatusText = typeof aiScore === 'number' ? `Fix Needed · AI Risk ${aiScore}%` : 'Fix Needed · AI Detected';
    headerDotColor = 'bg-rose-500 animate-pulse';
    rightHintText = '⚠️ High AI risk detected! Click "One-Click Humanize All" to repair.';
  } else {
    // Rule 3: Has text and no fix needed -> Fixed!
    autoCorgiState = 'fixed';
    statusMessage = 'Verified Human · No Fix Needed! ✨';
    headerStatusText = 'Verified Human · No Fix Needed';
    headerDotColor = 'bg-[#606C38]';
    rightHintText = '💖 Original human cadence detected. No repair needed!';
  }

  const currentCorgiState = manualCorgiState ?? autoCorgiState;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl overflow-hidden bg-zinc-950 border-2 border-black shadow-[4px_4px_0px_#606C38] transition-all ${
        isDragOver
          ? 'border-[#82984E] ring-4 ring-[#606C38]/40'
          : 'border-black'
      } ${variant === 'hero' ? 'h-[240px] sm:h-[260px]' : 'h-[200px] sm:h-[220px]'} ${className}`}
    >
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#82984E] animate-in fade-in">
          <Upload className="w-10 h-10 text-[#a4b872] animate-bounce mb-2" />
          <h4 className="text-sm font-bold font-pixel text-white">Drop Word (.docx) or PDF Directly Here</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Auto-inspect or perform format-preserving surgical repair.
          </p>
        </div>
      )}

      {/* Top Status & Telemetry HUD Header */}
      <div className="absolute top-2.5 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-black shadow-[1.5px_1.5px_0px_#000] text-[10px] font-pixel">
            <span className={`w-2 h-2 rounded-full ${headerDotColor}`} />
            <span className="text-zinc-200 font-bold uppercase tracking-wider">
              {headerStatusText}
            </span>
          </div>

          {/* Authentic vs AI Risk Scores */}
          {typeof aiScore === 'number' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-black shadow-[1.5px_1.5px_0px_#000] text-[10px] font-pixel">
              <span className="text-zinc-400">Authentic:</span>
              <span className="font-bold text-[#a4b872]">{authenticityScore ?? 100 - aiScore}%</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">AI Risk:</span>
              <span className={`font-bold ${isHighAi ? 'text-rose-400' : 'text-[#d7e0be]'}`}>{aiScore}%</span>
            </div>
          )}
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Corgi State Preview Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-black shadow-[1.5px_1.5px_0px_#000] text-[9px] font-pixel">
            <button
              onClick={() => setManualCorgiState(null)}
              className={`px-1.5 py-0.5 rounded transition ${
                manualCorgiState === null ? 'bg-[#606C38] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Auto mode based on document scan score"
            >
              Auto
            </button>
            <button
              onClick={() => setManualCorgiState('running')}
              className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                currentCorgiState === 'running' && manualCorgiState === 'running'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Running Corgi (ပြေးနေတဲ့ပုံ)"
            >
              <span>🏃 Running</span>
            </button>
            <button
              onClick={() => setManualCorgiState('needs_fix')}
              className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                currentCorgiState === 'needs_fix' && manualCorgiState === 'needs_fix'
                  ? 'bg-rose-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Needs Fix Corgi (ပြင်ရန်လိုအပ်တဲ့ပုံ)"
            >
              <span>🩹 Needs Fix</span>
            </button>
            <button
              onClick={() => setManualCorgiState('fixed')}
              className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                currentCorgiState === 'fixed' && manualCorgiState === 'fixed'
                  ? 'bg-[#606C38] text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Repaired & Authentic Corgi (ပြင်ပြီးတဲ့ပုံ)"
            >
              <span>👑 Fixed</span>
            </button>
          </div>

          {/* Toggle between Corgi & 3D */}
          <button
            onClick={() => setActiveDisplay(activeDisplay === 'corgi' ? '3d' : 'corgi')}
            className="pixel-btn px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-pixel flex items-center gap-1 border border-black shadow-[1.5px_1.5px_0px_#000] transition"
            title="Toggle between Corgi Companion and 3D View"
          >
            {activeDisplay === 'corgi' ? '🌐 3D' : '🐶 Corgi'}
          </button>

          {/* Primary Action Button */}
          {variant === 'hero' ? (
            <button
              onClick={onLaunchWorkspace}
              className="pixel-btn px-3 py-1 rounded-lg bg-[#606C38] hover:bg-[#4c562c] text-white text-[10px] sm:text-xs font-pixel font-bold flex items-center gap-1.5 border border-black shadow-[2px_2px_0px_#000] transition"
            >
              <span>Launch</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : isHighAi && onOneClickHumanize ? (
            <button
              onClick={() => {
                onOneClickHumanize();
                setManualCorgiState('fixed');
              }}
              className="pixel-btn px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] sm:text-xs font-pixel font-bold flex items-center gap-1.5 border border-black shadow-[2px_2px_0px_#000] transition animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>One-Click Humanize All</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onTriggerScan?.();
                setManualCorgiState('running');
                setTimeout(() => setManualCorgiState(null), 1800);
              }}
              disabled={status === 'scanning'}
              className="pixel-btn px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[10px] font-pixel font-bold flex items-center gap-1 border border-black shadow-[1.5px_1.5px_0px_#000] disabled:opacity-50 transition"
            >
              <RotateCcw className={`w-3 h-3 ${status === 'scanning' ? 'animate-spin' : ''}`} />
              <span>{status === 'scanning' ? 'Sniffing...' : 'Re-Scan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport: Either Pixel Corgi Companion Station or 3D Wireframe */}
      {activeDisplay === 'corgi' ? (
        <div className="w-full h-full flex flex-col items-center justify-center pt-5 pb-8 relative bg-pixel-dots select-none">
          {/* Cute Retro Pixel Corgi Character in Active State */}
          <div className="z-10 flex flex-col items-center justify-center">
            <PixelCorgi
              state={currentCorgiState}
              statusMessage={statusMessage}
              size={variant === 'hero' ? 140 : 120}
              onClick={() => {
                if (currentCorgiState === 'needs_fix' && onOneClickHumanize) {
                  onOneClickHumanize();
                  setManualCorgiState('fixed');
                } else if (onTriggerScan) {
                  onTriggerScan();
                  setManualCorgiState('running');
                  setTimeout(() => setManualCorgiState(null), 1800);
                }
              }}
            />
          </div>

          {/* Interactive State Feedback Hint */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-1.5 text-right pointer-events-none">
            <span className="text-[10px] font-pixel text-zinc-300 bg-zinc-950/85 px-2.5 py-1 rounded border border-black shadow-[1.5px_1.5px_0px_#000]">
              {rightHintText}
            </span>
          </div>
        </div>
      ) : (
        /* 3D WebGL Canvas Viewport */
        <Canvas className="w-full h-full cursor-grab active:cursor-grabbing">
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#606C38" />

          <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
            <group>
              <GyroscopeRings status={status} />
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
              {variant === 'hero' ? (
                <HeroOrbitalToolNodes
                  onSelectMode={onSelectMode}
                  onLaunchWorkspace={onLaunchWorkspace}
                />
              ) : (
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
      )}

      {/* Bottom Compact Telemetry HUD Details */}
      {variant === 'workspace' && metrics && (
        <div className="absolute bottom-1.5 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950/85 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-zinc-800">
            <span>Perplexity: <strong className="text-[#a4b872]">{metrics.perplexityScore ?? 45}/100</strong></span>
            <span>·</span>
            <span>Burstiness: <strong className="text-purple-300">{metrics.burstinessScore ?? 60}/100</strong></span>
            <span>·</span>
            <span>Syntactic: <strong className="text-amber-300">{metrics.syntacticUniformity ?? 40}%</strong></span>
          </div>

          <div className="text-[10px] text-zinc-400 font-pixel hidden sm:flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-zinc-800">
            <span>💡 Click Corgi to Sniff &amp; Humanize</span>
          </div>
        </div>
      )}
    </div>
  );
};
