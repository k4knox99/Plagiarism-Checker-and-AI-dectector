import React, { useState } from 'react';
import { Target, CheckCircle2, AlertCircle, Edit3, Sparkles, Clock, FileText, Hash } from 'lucide-react';

interface WordCountGoalProps {
  currentWords: number;
  currentChars: number;
  currentSentences: number;
  currentParagraphs: number;
  goal: number;
  onSetGoal: (goal: number) => void;
}

const PRESET_GOALS = [
  { label: 'Short Form / Abstract', words: 250 },
  { label: 'Standard Essay / Post', words: 500 },
  { label: 'Long-form Article', words: 1000 },
  { label: 'Research / Term Paper', words: 2000 },
  { label: 'Comprehensive Thesis', words: 3500 },
];

export const WordCountGoal: React.FC<WordCountGoalProps> = ({
  currentWords,
  currentChars,
  currentSentences,
  currentParagraphs,
  goal,
  onSetGoal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState(goal.toString());

  const progressPercent = Math.min(100, Math.round((currentWords / (goal || 1)) * 100));
  const wordsRemaining = goal - currentWords;
  const isGoalReached = currentWords >= goal;
  const readingTimeMin = (currentWords / 220).toFixed(1);

  const handleSaveCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(customGoalInput, 10);
    if (!isNaN(val) && val > 0) {
      onSetGoal(val);
    }
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 shadow-xl space-y-3">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Word Count Goal
              </span>
              <button
                onClick={() => {
                  setCustomGoalInput(goal.toString());
                  setIsEditing(!isEditing);
                }}
                className="text-zinc-500 hover:text-indigo-400 transition"
                title="Change Target Word Goal"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Track manuscript velocity against target assignment criteria
            </p>
          </div>
        </div>

        {/* Goal Badge Status */}
        <div className="flex items-center gap-2">
          {isGoalReached ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Goal Reached ({currentWords} / {goal})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-medium">
              <span className="font-mono text-indigo-400 font-bold">{wordsRemaining}</span>
              <span className="text-zinc-400">words remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Numeric Reading */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-white">{currentWords}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{goal} words</span>
          </div>
          <span className={`font-bold ${isGoalReached ? 'text-emerald-400' : 'text-indigo-400'}`}>
            {progressPercent}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="h-2.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/50'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Preset Selector Buttons (or Inline Custom Editor) */}
      {isEditing ? (
        <form onSubmit={handleSaveCustom} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center gap-2 animate-in fade-in">
          <span className="text-xs text-zinc-400 font-medium">Set Custom Target:</span>
          <input
            type="number"
            min="50"
            max="100000"
            step="50"
            value={customGoalInput}
            onChange={(e) => setCustomGoalInput(e.target.value)}
            className="w-28 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <span className="text-xs text-zinc-500 font-mono">words</span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">Presets:</span>
            {PRESET_GOALS.map((p) => (
              <button
                key={p.words}
                onClick={() => onSetGoal(p.words)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition ${
                  goal === p.words
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {p.words}w
              </button>
            ))}
          </div>

          {/* Document Telemetry Snapshot */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1" title="Character count">
              <Hash className="w-3 h-3 text-zinc-500" />
              {currentChars} chars
            </span>
            <span>·</span>
            <span className="flex items-center gap-1" title="Paragraph count">
              <FileText className="w-3 h-3 text-zinc-500" />
              {currentParagraphs} paras
            </span>
            <span>·</span>
            <span className="flex items-center gap-1" title="Estimated reading time">
              <Clock className="w-3 h-3 text-zinc-500" />
              ~{readingTimeMin}m read
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
