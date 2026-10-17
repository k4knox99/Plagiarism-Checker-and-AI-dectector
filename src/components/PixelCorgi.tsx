import React, { useState, useEffect } from 'react';

export type CorgiState = 'running' | 'needs_fix' | 'fixed';

interface PixelCorgiProps {
  state: CorgiState;
  size?: number; // base scale
  className?: string;
  onClick?: () => void;
  caption?: string;
  statusMessage?: string;
}

export const PixelCorgi: React.FC<PixelCorgiProps> = ({
  state,
  size = 140,
  className = '',
  onClick,
  caption,
  statusMessage
}) => {
  const [frame, setFrame] = useState(0);

  // Animation frame loop for running & idle wagging
  useEffect(() => {
    const intervalTime = state === 'running' ? 180 : 350;
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [state]);

  const height = Math.round(size * 0.75);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center select-none ${className} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}`}
      title={
        state === 'running'
          ? 'Pixel Corgi running & searching for document text!'
          : state === 'needs_fix'
          ? 'Pixel Corgi alert: Needs repair / high AI risk!'
          : 'Pixel Corgi happy: 100% human & fixed!'
      }
    >
      {/* Dynamic Status Mood Bubble (hidden when size <= 24 to prevent badge overlap) */}
      {size > 24 && (
        <div className="mb-2">
          {state === 'running' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-black shadow-[2px_2px_0px_#000] text-[10px] font-pixel text-[#becd97] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#606C38] animate-ping" />
              <span>{statusMessage || 'No Text in Document · Corgi Running 🏃'}</span>
            </div>
          )}
          {state === 'needs_fix' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/90 border border-black shadow-[2px_2px_0px_#000] text-[10px] font-pixel text-rose-300 animate-bounce">
              <span className="text-rose-400 font-bold">❗</span>
              <span>{statusMessage || 'Needs Repair / AI Detected!'}</span>
            </div>
          )}
          {state === 'fixed' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#606C38]/30 border border-black shadow-[2px_2px_0px_#000] text-[10px] font-pixel text-[#d7e0be]">
              <span>✨</span>
              <span>{statusMessage || 'Repaired & 100% Authentic!'}</span>
            </div>
          )}
        </div>
      )}

      {/* SVG Pixel Corgi Character */}
      <div className="relative">
        <svg
          width={size}
          height={height}
          viewBox="0 0 64 48"
          fill="none"
          style={{ shapeRendering: 'crispEdges' }}
          className="overflow-visible"
        >
          {/* Ground Shadow */}
          <ellipse
            cx="32"
            cy="44"
            rx={state === 'running' ? 24 : 20}
            ry="3.5"
            fill="#09090b"
            opacity="0.8"
          />

          {/* ==================== STATE 1: RUNNING CORGI (ပြေးနေတဲ့ပုံ) ==================== */}
          {state === 'running' && (
            <g transform={frame % 2 === 0 ? 'translate(0, -1)' : 'translate(0, 1)'}>
              {/* Dust puffs behind running corgi */}
              {frame % 2 === 0 ? (
                <g fill="#71717a">
                  <rect x="2" y="38" width="3" height="3" />
                  <rect x="5" y="36" width="3" height="3" />
                  <rect x="1" y="35" width="2" height="2" />
                </g>
              ) : (
                <g fill="#a1a1aa">
                  <rect x="3" y="37" width="4" height="3" />
                  <rect x="6" y="39" width="3" height="2" />
                  <rect x="8" y="35" width="2" height="2" />
                </g>
              )}

              {/* Heart Nub Tail Wagging */}
              <g transform={frame % 2 === 0 ? 'translate(0, -2)' : 'translate(0, 1)'}>
                <rect x="7" y="19" width="5" height="5" fill="#D97706" />
                <rect x="6" y="20" width="4" height="4" fill="#FFFFFF" />
              </g>

              {/* Corgi Body (Stout golden loaf) */}
              <rect x="12" y="18" width="28" height="15" fill="#D97706" />
              <rect x="14" y="20" width="24" height="11" fill="#F59E0B" />
              {/* White Belly */}
              <rect x="18" y="27" width="16" height="5" fill="#FFFFFF" />
              <rect x="20" y="29" width="12" height="3" fill="#F8FAFC" />

              {/* Running Legs Cycle */}
              {frame === 0 || frame === 2 ? (
                // Extended gallop stride
                <g>
                  {/* Front Right Leg (reaching forward) */}
                  <rect x="38" y="30" width="4" height="7" fill="#D97706" />
                  <rect x="40" y="36" width="5" height="4" fill="#FFFFFF" />
                  {/* Front Left Leg */}
                  <rect x="33" y="29" width="4" height="6" fill="#B45309" />
                  <rect x="34" y="34" width="4" height="3" fill="#E2E8F0" />
                  {/* Back Left Leg (trailing back) */}
                  <rect x="10" y="30" width="4" height="6" fill="#B45309" />
                  <rect x="8" y="35" width="4" height="4" fill="#E2E8F0" />
                  {/* Back Right Leg */}
                  <rect x="15" y="31" width="4" height="6" fill="#D97706" />
                  <rect x="14" y="36" width="4" height="4" fill="#FFFFFF" />
                </g>
              ) : (
                // Tucked running stride
                <g>
                  {/* Front Legs bent */}
                  <rect x="36" y="31" width="4" height="5" fill="#D97706" />
                  <rect x="37" y="35" width="4" height="4" fill="#FFFFFF" />
                  <rect x="32" y="30" width="4" height="5" fill="#B45309" />
                  <rect x="31" y="34" width="4" height="4" fill="#E2E8F0" />
                  {/* Back Legs bent forward */}
                  <rect x="14" y="30" width="5" height="6" fill="#D97706" />
                  <rect x="16" y="35" width="4" height="4" fill="#FFFFFF" />
                  <rect x="18" y="29" width="4" height="6" fill="#B45309" />
                  <rect x="20" y="34" width="4" height="4" fill="#E2E8F0" />
                </g>
              )}

              {/* Red Collar & Gold Tag */}
              <rect x="38" y="20" width="3" height="10" fill="#EF4444" />
              <rect x="39" y="29" width="3" height="3" fill="#FBBF24" />

              {/* Head & Neck */}
              <rect x="38" y="10" width="18" height="16" fill="#D97706" />
              <rect x="40" y="12" width="14" height="13" fill="#F59E0B" />

              {/* White Muzzle & Blaze */}
              <rect x="45" y="17" width="14" height="8" fill="#FFFFFF" />
              <rect x="44" y="14" width="4" height="9" fill="#FFFFFF" />
              {/* Black Nose */}
              <rect x="57" y="18" width="4" height="3" fill="#0F172A" />

              {/* Determined Sniffing Eyes */}
              <rect x="47" y="14" width="3" height="3" fill="#0F172A" />
              <rect x="48" y="14" width="1" height="1" fill="#FFFFFF" />

              {/* Cute Happy Panting Tongue */}
              <rect x="52" y="24" width="4" height="4" fill="#F43F5E" />
              <rect x="53" y="27" width="2" height="2" fill="#FB7185" />

              {/* Pointy Corgi Ears (with wind flopping) */}
              <g transform={frame % 2 === 0 ? 'translate(0, 0)' : 'translate(1, 1)'}>
                {/* Back ear */}
                <polygon points="39,10 44,2 47,10" fill="#B45309" />
                <polygon points="41,9 44,4 46,9" fill="#FDA4AF" />
                {/* Front ear */}
                <polygon points="45,10 50,1 53,10" fill="#D97706" />
                <polygon points="47,9 50,3 52,9" fill="#F472B6" />
              </g>

              {/* Wind / Motion trails */}
              <line x1="58" y1="12" x2="64" y2="12" stroke="#606C38" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="60" y1="16" x2="64" y2="16" stroke="#A4B872" strokeWidth="1" />
            </g>
          )}

          {/* ==================== STATE 2: NEEDS FIX / ALERT CORGI (ပြင်ရန်လိုအပ်တဲ့ပုံ) ==================== */}
          {state === 'needs_fix' && (
            <g transform="translate(4, 0)">
              {/* Alert Badge / Exclamation Icon */}
              <g transform="translate(48, -2)">
                <rect x="0" y="0" width="8" height="8" fill="#E11D48" rx="1" />
                <rect x="3" y="1" width="2" height="3" fill="#FFFFFF" />
                <rect x="3" y="5" width="2" height="1.5" fill="#FFFFFF" />
              </g>

              {/* Worry Sweat Drop */}
              <g transform={frame % 2 === 0 ? 'translate(54, 10)' : 'translate(54, 12)'}>
                <path d="M2 0 L4 3 C4 4.5 3 5.5 2 5.5 C1 5.5 0 4.5 0 3 Z" fill="#38BDF8" />
              </g>

              {/* Nub tail with tiny medical band-aid */}
              <rect x="5" y="24" width="5" height="5" fill="#D97706" />
              <rect x="4" y="25" width="4" height="4" fill="#FFFFFF" />
              {/* Band-aid on back */}
              <rect x="18" y="18" width="8" height="4" fill="#FDE68A" transform="rotate(-15 22 20)" />
              <rect x="21" y="19" width="2" height="2" fill="#EF4444" transform="rotate(-15 22 20)" />

              {/* Corgi Sitting / Alert Body */}
              <rect x="10" y="20" width="26" height="16" fill="#D97706" />
              <rect x="12" y="22" width="22" height="13" fill="#F59E0B" />
              <rect x="18" y="27" width="14" height="8" fill="#FFFFFF" />

              {/* Front Paws planted attentively */}
              <rect x="28" y="32" width="4" height="8" fill="#D97706" />
              <rect x="28" y="38" width="5" height="3" fill="#FFFFFF" />
              <rect x="34" y="32" width="4" height="8" fill="#D97706" />
              <rect x="34" y="38" width="5" height="3" fill="#FFFFFF" />
              {/* Back Paws tucked sitting */}
              <rect x="9" y="34" width="6" height="6" fill="#B45309" />
              <rect x="8" y="38" width="6" height="3" fill="#E2E8F0" />

              {/* Red Collar with Alert Tag */}
              <rect x="32" y="22" width="3" height="10" fill="#E11D48" />
              <rect x="33" y="31" width="3" height="3" fill="#FBBF24" />

              {/* Head turned attentively */}
              <rect x="32" y="11" width="18" height="16" fill="#D97706" />
              <rect x="34" y="13" width="14" height="13" fill="#F59E0B" />
              <rect x="38" y="17" width="14" height="8" fill="#FFFFFF" />
              <rect x="38" y="14" width="4" height="8" fill="#FFFFFF" />
              <rect x="50" y="18" width="4" height="3" fill="#0F172A" />

              {/* Wide Alert / Concerned Eyes with Pupil */}
              <rect x="40" y="14" width="4" height="4" fill="#0F172A" />
              <rect x="41" y="14" width="1.5" height="1.5" fill="#FFFFFF" />
              {/* Little furrowed brow */}
              <rect x="39" y="12" width="5" height="1" fill="#78350F" />

              {/* Tiny Band-aid on left ear */}
              <polygon points="33,11 37,2 41,11" fill="#B45309" />
              <polygon points="35,10 37,4 39,10" fill="#FDA4AF" />
              <rect x="35" y="4" width="4" height="2" fill="#FEF08A" />

              {/* Right Ear Perked Up Alert */}
              <polygon points="41,11 46,1 49,11" fill="#D97706" />
              <polygon points="43,10 46,3 48,10" fill="#F472B6" />

              {/* Warning Sparks / Little Broken Syntax Blocks */}
              <g fill="#F43F5E" opacity="0.8">
                <rect x="2" y="12" width="3" height="3" />
                <rect x="8" y="6" width="2" height="2" />
                <rect x="26" y="6" width="3" height="3" />
              </g>
            </g>
          )}

          {/* ==================== STATE 3: FIXED / REPAIRED / AUTHENTIC CORGI (ပြင်ပြီးတဲ့ပုံ) ==================== */}
          {state === 'fixed' && (
            <g transform="translate(2, 0)">
              {/* Golden Crown of Authenticity */}
              <g transform="translate(39, -4)">
                <path d="M0 4 L2 0 L5 3 L8 0 L10 4 L10 7 L0 7 Z" fill="#FBBF24" />
                <rect x="1" y="6" width="8" height="2" fill="#F59E0B" />
                {/* Crown Emerald Gem */}
                <rect x="4" y="3" width="2" height="2" fill="#606C38" />
              </g>

              {/* Floating Pixel Hearts & Sparkles */}
              <g transform={frame % 2 === 0 ? 'translate(0, 0)' : 'translate(0, -2)'}>
                {/* Heart */}
                <path
                  d="M52 2h2v1h-2zM56 2h2v1h-2zM51 3h5v2h-5zM52 5h4v1h-4zM53 6h2v1h-2z"
                  fill="#F43F5E"
                />
                {/* Sparkle Left */}
                <rect x="4" y="8" width="2" height="2" fill="#FDE047" />
                <rect x="3" y="9" width="4" height="1" fill="#FDE047" />
                {/* Sparkle Right */}
                <rect x="58" y="16" width="2" height="2" fill="#606C38" />
              </g>

              {/* Happy Wagging Tail with Sparkle */}
              <g transform={frame % 2 === 0 ? 'translate(0, -3) rotate(-5 6 22)' : 'translate(0, 0) rotate(8 6 22)'}>
                <rect x="4" y="20" width="6" height="6" fill="#D97706" />
                <rect x="3" y="21" width="5" height="5" fill="#FFFFFF" />
              </g>

              {/* Proud Happy Loaf Body */}
              <rect x="10" y="19" width="28" height="16" fill="#D97706" />
              <rect x="12" y="21" width="24" height="13" fill="#F59E0B" />
              <rect x="18" y="27" width="16" height="7" fill="#FFFFFF" />

              {/* Paws */}
              <rect x="30" y="32" width="4" height="8" fill="#D97706" />
              <rect x="30" y="38" width="5" height="3" fill="#FFFFFF" />
              <rect x="36" y="32" width="4" height="8" fill="#D97706" />
              <rect x="36" y="38" width="5" height="3" fill="#FFFFFF" />
              <rect x="12" y="33" width="5" height="7" fill="#B45309" />
              <rect x="11" y="38" width="5" height="3" fill="#E2E8F0" />

              {/* Olive Leaf Theme Collar with Heart Tag */}
              <rect x="34" y="21" width="4" height="10" fill="#606C38" />
              <rect x="35" y="30" width="3" height="3" fill="#FEFAE0" />

              {/* Head with Proud Happy Tilt */}
              <rect x="34" y="10" width="18" height="16" fill="#D97706" />
              <rect x="36" y="12" width="14" height="13" fill="#F59E0B" />
              <rect x="40" y="16" width="14" height="8" fill="#FFFFFF" />
              <rect x="40" y="13" width="4" height="8" fill="#FFFFFF" />
              <rect x="52" y="17" width="4" height="3" fill="#0F172A" />

              {/* Happy Curved Wink Eyes (^ ‿ ^) */}
              <path d="M42 16 Q44 13 46 16" stroke="#0F172A" strokeWidth="1.5" fill="none" />
              <rect x="43" y="18" width="2" height="1" fill="#FDA4AF" /> {/* Blush */}

              {/* Happy Big Smile & Tongue */}
              <path d="M48 21 Q51 24 53 21" stroke="#0F172A" strokeWidth="1" fill="none" />
              <rect x="49" y="22" width="3" height="3" fill="#F43F5E" />

              {/* Happy Ears Perked and Wagging */}
              <polygon points="35,10 40,1 43,10" fill="#B45309" />
              <polygon points="37,9 40,3 42,9" fill="#FDA4AF" />
              <polygon points="43,10 48,1 51,10" fill="#D97706" />
              <polygon points="45,9 48,3 50,9" fill="#F472B6" />
            </g>
          )}
        </svg>
      </div>

      {/* Optional Caption */}
      {caption && (
        <span className="mt-1 text-[11px] font-pixel text-zinc-300 font-bold tracking-wider">
          {caption}
        </span>
      )}
    </div>
  );
};
