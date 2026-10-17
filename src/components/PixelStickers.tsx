import React from 'react';

// Crisp 8-bit Pixel Art Stickers inspired by the PixelPop Icon Kit
// All icons use SVG crispEdges for pixel-perfect retro aesthetics

export interface PixelIconProps {
  size?: number;
  className?: string;
}

export const PixelRobot: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Antenna */}
    <rect x="11" y="2" width="2" height="3" fill="#A855F7" />
    <rect x="10" y="1" width="4" height="2" fill="#F472B6" />
    {/* Head Outline */}
    <rect x="5" y="5" width="14" height="12" fill="#0F172A" />
    <rect x="6" y="6" width="12" height="10" fill="#606C38" />
    {/* Ears */}
    <rect x="3" y="9" width="2" height="4" fill="#82984E" />
    <rect x="19" y="9" width="2" height="4" fill="#82984E" />
    {/* Eyes Screen */}
    <rect x="7" y="8" width="10" height="4" fill="#0F172A" />
    {/* Pixel Glowing Eyes */}
    <rect x="8" y="9" width="2" height="2" fill="#D7E0BE" />
    <rect x="14" y="9" width="2" height="2" fill="#D7E0BE" />
    {/* Blush */}
    <rect x="7" y="13" width="2" height="1" fill="#DDA15E" />
    <rect x="15" y="13" width="2" height="1" fill="#DDA15E" />
    {/* Pixel Smile */}
    <rect x="10" y="13" width="4" height="1" fill="#FEFAE0" />
    {/* Neck */}
    <rect x="10" y="17" width="4" height="2" fill="#4C562C" />
    {/* Body Base */}
    <rect x="6" y="19" width="12" height="3" fill="#3D4525" />
  </svg>
);

export const PixelHeart: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    <path
      d="M4 6h4v2H4V6zm12 0h4v2h-4V6zM2 8h2v6H2V8zm20 8h-2v2h-2v2h-2v2h-2v2h-2v-2h-2v-2H8v-2H6v-2H4v-2H2v-2h2V8h4v2h2v2h4v-2h2V8h4v6h2v-4h2v6z"
      fill="#0F172A"
    />
    {/* Fill */}
    <rect x="4" y="8" width="4" height="6" fill="#F43F5E" />
    <rect x="16" y="8" width="4" height="6" fill="#F43F5E" />
    <rect x="8" y="10" width="8" height="6" fill="#FB7185" />
    <rect x="6" y="14" width="12" height="2" fill="#F43F5E" />
    <rect x="8" y="16" width="8" height="2" fill="#E11D48" />
    <rect x="10" y="18" width="4" height="2" fill="#BE123C" />
    <rect x="11" y="20" width="2" height="2" fill="#881337" />
    {/* Highlight shine */}
    <rect x="5" y="7" width="2" height="2" fill="#FFF1F2" />
    <rect x="5" y="9" width="1" height="2" fill="#FFF1F2" />
  </svg>
);

export const PixelDoc: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Outline */}
    <rect x="5" y="2" width="11" height="20" fill="#0F172A" />
    <rect x="16" y="7" width="3" height="15" fill="#0F172A" />
    {/* Page base */}
    <rect x="6" y="3" width="9" height="18" fill="#F8FAFC" />
    <rect x="15" y="8" width="3" height="13" fill="#F8FAFC" />
    {/* Fold corner */}
    <polygon points="15,3 19,7 15,7" fill="#CBD5E1" />
    <rect x="15" y="6" width="4" height="1" fill="#0F172A" />
    {/* Text lines */}
    <rect x="8" y="7" width="5" height="2" fill="#3B82F6" />
    <rect x="8" y="11" width="8" height="1" fill="#64748B" />
    <rect x="8" y="13" width="8" height="1" fill="#64748B" />
    <rect x="8" y="15" width="6" height="1" fill="#10B981" />
    <rect x="8" y="17" width="7" height="1" fill="#64748B" />
  </svg>
);

export const PixelSparkle: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Center 8-bit star */}
    <rect x="11" y="3" width="2" height="4" fill="#FACC15" />
    <rect x="11" y="17" width="2" height="4" fill="#FACC15" />
    <rect x="3" y="11" width="4" height="2" fill="#FACC15" />
    <rect x="17" y="11" width="4" height="2" fill="#FACC15" />
    <rect x="9" y="7" width="6" height="10" fill="#FDE047" />
    <rect x="7" y="9" width="10" height="6" fill="#FDE047" />
    {/* Core Shine */}
    <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
    {/* Little satellite star */}
    <rect x="19" y="4" width="2" height="2" fill="#F472B6" />
    <rect x="4" y="18" width="2" height="2" fill="#38BDF8" />
  </svg>
);

export const PixelSearch: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Glass Rim */}
    <rect x="6" y="3" width="8" height="2" fill="#0F172A" />
    <rect x="4" y="5" width="2" height="8" fill="#0F172A" />
    <rect x="14" y="5" width="2" height="8" fill="#0F172A" />
    <rect x="6" y="13" width="8" height="2" fill="#0F172A" />
    {/* Lens glass */}
    <rect x="6" y="5" width="8" height="8" fill="#818CF8" />
    {/* Lens highlight */}
    <rect x="7" y="6" width="3" height="2" fill="#E0E7FF" />
    <rect x="7" y="8" width="1" height="2" fill="#E0E7FF" />
    {/* Handle */}
    <rect x="13" y="13" width="3" height="3" fill="#0F172A" />
    <rect x="15" y="15" width="3" height="3" fill="#A855F7" />
    <rect x="17" y="17" width="3" height="3" fill="#7C3AED" />
    <rect x="19" y="19" width="3" height="3" fill="#0F172A" />
  </svg>
);

export const PixelBandAid: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Outer Bandage Strip Diagonal */}
    <rect x="8" y="2" width="8" height="20" rx="0" transform="rotate(45 12 12)" fill="#0F172A" />
    <rect x="9" y="3" width="6" height="18" rx="0" transform="rotate(45 12 12)" fill="#FBBF24" />
    {/* Center Pad */}
    <rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" fill="#FEF3C7" />
    {/* Cross in Pad */}
    <rect x="11" y="9" width="2" height="6" fill="#10B981" />
    <rect x="9" y="11" width="6" height="2" fill="#10B981" />
  </svg>
);

export const PixelShield: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Shield Outline */}
    <rect x="5" y="3" width="14" height="2" fill="#0F172A" />
    <rect x="4" y="5" width="2" height="8" fill="#0F172A" />
    <rect x="18" y="5" width="2" height="8" fill="#0F172A" />
    <rect x="6" y="13" width="2" height="3" fill="#0F172A" />
    <rect x="16" y="13" width="2" height="3" fill="#0F172A" />
    <rect x="8" y="16" width="2" height="3" fill="#0F172A" />
    <rect x="14" y="16" width="2" height="3" fill="#0F172A" />
    <rect x="10" y="19" width="4" height="2" fill="#0F172A" />
    <rect x="11" y="21" width="2" height="1" fill="#0F172A" />
    {/* Fill */}
    <rect x="6" y="5" width="12" height="8" fill="#10B981" />
    <rect x="8" y="13" width="8" height="3" fill="#059669" />
    <rect x="10" y="16" width="4" height="3" fill="#047857" />
    {/* White checkmark */}
    <rect x="8" y="10" width="2" height="2" fill="#FFFFFF" />
    <rect x="10" y="11" width="2" height="2" fill="#FFFFFF" />
    <rect x="12" y="9" width="2" height="2" fill="#FFFFFF" />
    <rect x="14" y="7" width="2" height="2" fill="#FFFFFF" />
  </svg>
);

export const PixelFloppy: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Disk Outline */}
    <rect x="3" y="3" width="18" height="18" fill="#0F172A" />
    {/* Main Casing */}
    <rect x="4" y="4" width="16" height="16" fill="#3B82F6" />
    <rect x="18" y="4" width="1" height="1" fill="#0F172A" />
    {/* Shutter Metal Slider */}
    <rect x="7" y="4" width="10" height="7" fill="#E2E8F0" />
    <rect x="9" y="5" width="2" height="4" fill="#0F172A" />
    {/* Label */}
    <rect x="6" y="13" width="12" height="6" fill="#FFFFFF" />
    <rect x="7" y="14" width="6" height="1" fill="#3B82F6" />
    <rect x="7" y="16" width="10" height="1" fill="#94A3B8" />
  </svg>
);

export const PixelCrown: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    <path
      d="M3 6h3v3H3V6zm15 0h3v3h-3V6zM9 4h6v3H9V4zM4 10h16v8H4v-8zm2 8h12v3H6v-3z"
      fill="#0F172A"
    />
    <rect x="4" y="11" width="16" height="6" fill="#FBBF24" />
    <rect x="9" y="5" width="6" height="5" fill="#FACC15" />
    <rect x="4" y="7" width="2" height="4" fill="#FBBF24" />
    <rect x="18" y="7" width="2" height="4" fill="#FBBF24" />
    <rect x="6" y="19" width="12" height="2" fill="#F59E0B" />
    {/* Gems */}
    <rect x="6" y="13" width="2" height="2" fill="#EF4444" />
    <rect x="11" y="13" width="2" height="2" fill="#3B82F6" />
    <rect x="16" y="13" width="2" height="2" fill="#10B981" />
  </svg>
);

export const PixelGamepad: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Body outline */}
    <rect x="3" y="8" width="18" height="10" rx="0" fill="#0F172A" />
    <rect x="4" y="9" width="16" height="8" rx="0" fill="#6366F1" />
    {/* D-Pad */}
    <rect x="6" y="11" width="4" height="4" fill="#0F172A" />
    <rect x="7" y="10" width="2" height="6" fill="#0F172A" />
    <rect x="7" y="11" width="2" height="4" fill="#E0E7FF" />
    {/* Buttons */}
    <rect x="16" y="11" width="2" height="2" fill="#F43F5E" />
    <rect x="14" y="13" width="2" height="2" fill="#FACC15" />
    {/* Screen / center light */}
    <rect x="11" y="12" width="2" height="1" fill="#22D3EE" />
  </svg>
);

export const PixelPotion: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Cork */}
    <rect x="10" y="3" width="4" height="2" fill="#92400E" />
    {/* Neck */}
    <rect x="9" y="5" width="6" height="4" fill="#0F172A" />
    <rect x="10" y="5" width="4" height="4" fill="#E2E8F0" />
    {/* Flask bulb */}
    <path d="M6 13l4-4h4l4 4v7H6v-7z" fill="#0F172A" />
    <path d="M7 14l3-3h4l3 3v5H7v-5z" fill="#A855F7" />
    {/* Liquid bubble */}
    <rect x="9" y="15" width="2" height="2" fill="#F472B6" />
    <rect x="13" y="16" width="1" height="1" fill="#FFFFFF" />
  </svg>
);

export const PixelPencil: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Tip */}
    <polygon points="3,21 3,17 7,21" fill="#0F172A" />
    <polygon points="4,20 4,18 6,20" fill="#38BDF8" />
    {/* Body */}
    <rect x="6" y="8" width="12" height="6" transform="rotate(-45 12 11)" fill="#0F172A" />
    <rect x="7" y="9" width="10" height="4" transform="rotate(-45 12 11)" fill="#FBBF24" />
    {/* Eraser */}
    <rect x="15" y="4" width="4" height="4" fill="#EC4899" />
  </svg>
);

export const PixelFire: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Flame outline */}
    <rect x="9" y="3" width="4" height="4" fill="#0F172A" />
    <rect x="7" y="7" width="10" height="13" fill="#0F172A" />
    {/* Outer Orange Flame */}
    <rect x="8" y="6" width="8" height="13" fill="#F97316" />
    {/* Inner Yellow Core */}
    <rect x="9" y="10" width="6" height="8" fill="#FDE047" />
    {/* Bright center */}
    <rect x="10" y="13" width="4" height="4" fill="#FFFFFF" />
  </svg>
);

export const PixelCheckBadge: React.FC<PixelIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`inline-block ${className}`}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Rosette outline */}
    <rect x="5" y="3" width="14" height="18" fill="#0F172A" />
    <rect x="3" y="5" width="18" height="14" fill="#0F172A" />
    {/* Fill */}
    <rect x="6" y="4" width="12" height="16" fill="#10B981" />
    <rect x="4" y="6" width="16" height="12" fill="#10B981" />
    {/* Checkmark */}
    <rect x="7" y="12" width="2" height="3" fill="#FFFFFF" />
    <rect x="9" y="14" width="3" height="3" fill="#FFFFFF" />
    <rect x="12" y="11" width="3" height="3" fill="#FFFFFF" />
    <rect x="15" y="8" width="2" height="3" fill="#FFFFFF" />
  </svg>
);

// Sticker Container with white die-cut pixel outline & drop shadow
export const PixelStickerBadge: React.FC<{
  children: React.ReactNode;
  color?: 'indigo' | 'olive' | 'emerald' | 'amber' | 'pink' | 'cyan' | 'purple' | 'rose';
  className?: string;
  tilt?: 'left' | 'right' | 'none';
}> = ({ children, color = 'olive', className = '', tilt = 'none' }) => {
  const colorMap = {
    olive: 'bg-[#606C38]/25 text-[#d7e0be] border-2 border-black shadow-[2px_2px_0px_#000]',
    indigo: 'bg-[#606C38]/25 text-[#becd97] border-2 border-black shadow-[2px_2px_0px_#000]',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-2 border-black shadow-[2px_2px_0px_#000]',
    amber: 'bg-amber-950/80 text-amber-300 border-2 border-black shadow-[2px_2px_0px_#000]',
    pink: 'bg-pink-950/80 text-pink-300 border-2 border-black shadow-[2px_2px_0px_#000]',
    cyan: 'bg-cyan-950/80 text-cyan-300 border-2 border-black shadow-[2px_2px_0px_#000]',
    purple: 'bg-purple-950/80 text-purple-300 border-2 border-black shadow-[2px_2px_0px_#000]',
    rose: 'bg-rose-950/80 text-rose-300 border-2 border-black shadow-[2px_2px_0px_#000]'
  };

  const tiltClass = tilt === 'left' ? 'rotate-[-2deg]' : tilt === 'right' ? 'rotate-[2deg]' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-pixel font-bold uppercase tracking-wider rounded-lg ${colorMap[color]} ${tiltClass} transition-transform hover:rotate-0 ${className}`}
    >
      {children}
    </span>
  );
};
