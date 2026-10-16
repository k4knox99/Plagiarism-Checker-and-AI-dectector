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
    <div className="rounded-3xl bg-zinc-950 border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_#000000] space-y-3">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-900 text-indigo-400 border-2 border-black shadow-[2px_2px_0px_#000]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-pixel">
                Target Word Count Goal
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
              Track manuscript velocity against target assignment or publication criteria
            </p>
          </div>
        </div>

        {/* Goal Badge Status */}
        <div className="flex items-center gap-2">
          {isGoalReached ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500 text-black border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-pixel font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Goal Reached ({currentWords} / {goal})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] text-zinc-300 text-xs font-pixel">
              <span className="text-amber-400 font-bold">{wordsRemaining}</span>
              <span className="text-zinc-400">words remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Numeric Reading */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-pixel">
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
        <div className="h-2.5 w-full rounded-none bg-zinc-900 pixel-meter overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${
              isGoalReached
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Preset Selector Buttons (or Inline Custom Editor) */}
      {isEditing ? (
        <form onSubmit={handleSaveCustom} className="p-3 rounded-xl bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] flex flex-wrap items-center gap-2 animate-in fade-in">
          <span className="text-xs text-zinc-300 font-pixel font-bold">Set Custom Target:</span>
          <input
            type="number"
            min="50"
            max="100000"
            step="50"
            value={customGoalInput}
            onChange={(e) => setCustomGoalInput(e.target.value)}
            className="w-28 px-2.5 py-1 rounded-lg bg-zinc-950 border-2 border-black text-white font-pixel text-xs focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          <span className="text-xs text-zinc-400 font-pixel">words</span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="submit"
              className="pixel-btn px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-pixel font-bold transition"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="pixel-btn px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-pixel transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-pixel text-zinc-500">Presets:</span>
            {PRESET_GOALS.map((p) => (
              <button
                key={p.words}
                onClick={() => onSetGoal(p.words)}
                className={`pixel-btn px-2.5 py-0.5 rounded-lg text-[11px] font-pixel font-bold transition border-2 border-black ${
                  goal === p.words
                    ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_#000]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.words}w
              </button>
            ))}
          </div>

          {/* Document Telemetry Snapshot */}
          <div className="flex items-center gap-3 text-[11px] font-pixel text-zinc-400">
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
