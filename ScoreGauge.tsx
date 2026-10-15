import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 to 100
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'ai' | 'plagiarism' | 'authenticity';
  inverted?: boolean; // if true, high score is good (e.g., authenticity)
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  title,
  subtitle,
  size = 'md',
  type = 'ai',
  inverted = false
}) => {
  // Clamp score
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  // Determine color scheme
  let strokeColor = '#10B981'; // Green
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let statusText = 'Low Risk';

  if (!inverted) {
    // For AI & Plagiarism: Low is good, High is bad
    if (safeScore >= 65) {
      strokeColor = '#EF4444'; // Red
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      statusText = type === 'ai' ? 'Likely AI' : 'High Similarity';
    } else if (safeScore >= 25) {
      strokeColor = '#F59E0B'; // Amber
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      statusText = type === 'ai' ? 'Mixed Content' : 'Partial Matches';
    } else {
      strokeColor = '#10B981'; // Green
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      statusText = type === 'ai' ? 'Likely Human' : 'Original';
    }
  } else {
    // For Authenticity: High is good, Low is bad
    if (safeScore >= 80) {
      strokeColor = '#10B981'; // Green
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      statusText = 'Verified Human';
    } else if (safeScore >= 45) {
      strokeColor = '#F59E0B'; // Amber
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      statusText = 'Needs Review';
    } else {
      strokeColor = '#EF4444'; // Red
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      statusText = 'Heavy Synthetic / Copied';
    }
  }

  const dimensions = {
    sm: { width: 100, radius: 38, stroke: 7, text: 'text-2xl', label: 'text-xs' },
    md: { width: 140, radius: 52, stroke: 9, text: 'text-3xl', label: 'text-sm' },
    lg: { width: 180, radius: 68, stroke: 11, text: 'text-4xl', label: 'text-base' }
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.width, height: dimensions.width }}>
        <svg
          className="transform -rotate-90"
          width={dimensions.width}
          height={dimensions.width}
        >
          {/* Background track circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={dimensions.radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Animated score indicator */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.width / 2}
            r={dimensions.radius}
            stroke={strokeColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-bold tracking-tight text-white ${dimensions.text}`}>
            {safeScore}%
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
            {type === 'ai' ? 'AI Score' : type === 'plagiarism' ? 'Match' : 'Authentic'}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
          {statusText}
        </div>
      </div>
    </div>
  );
};
