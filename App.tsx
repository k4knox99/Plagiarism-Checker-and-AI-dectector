import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileSearch, 
  Wand2, 
  Upload, 
  Clipboard, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Hash, 
  ArrowRight,
  ExternalLink,
  Award,
  Layers,
  HelpCircle,
  Zap,
  Info,
  FileCheck
} from 'lucide-react';

import { 
  ScannerMode, 
  ComprehensiveReport, 
  SentenceAnalysis, 
  AIDetectionResult, 
  PlagiarismResult 
} from './types';
import { SAMPLE_TEXTS, SampleText } from './data/samples';
import { SAMPLE_REPORTS } from './data/sampleReports';
import { parseUploadedDocument, extractTextFromRawDocxString } from './utils/fileParser';
import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { MetricsGrid } from './components/MetricsGrid';
import { SentenceHeatmap } from './components/SentenceHeatmap';
import { SentenceInspectorModal } from './components/SentenceInspectorModal';
import { PlagiarismSourcesList } from './components/PlagiarismSourcesList';
import { HumanizerFixerStudio } from './components/HumanizerFixerStudio';
import { CertificateReportModal } from './components/CertificateReportModal';
import { ScanHistoryDrawer } from './components/ScanHistoryDrawer';
import { VercelDeployModal } from './components/VercelDeployModal';

export default function App() {
  // Primary state: initialized with Sample 1 and its pre-computed rich report
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS[0].content);
  const [mode, setMode] = useState<ScannerMode>('comprehensive');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Active Report state: Pre-populated with baseline report to avoid unneeded API calls on load
  const [activeReport, setActiveReport] = useState<ComprehensiveReport | null>(SAMPLE_REPORTS['ai-essay']);

  // Modals & Drawers
  const [inspectedSentence, setInspectedSentence] = useState<SentenceAnalysis | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);

  // Saved history in localStorage
  const [history, setHistory] = useState<ComprehensiveReport[]>(() => {
    try {
      const saved = localStorage.getItem('veritas_scan_history');
      if (saved) {
        return JSON.parse(saved);
      }
      return [SAMPLE_REPORTS['ai-essay']];
    } catch {
      return [SAMPLE_REPORTS['ai-essay']];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('veritas_scan_history', JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  // Derived input metrics
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const sentenceCount = inputText.trim() ? inputText.split(/(?<=[.?!])\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Switch to a sample: instantly load its cached baseline without burning Gemini API quota
  const handleLoadSample = (sample: SampleText) => {
    setInputText(sample.content);
    setUploadedFileName(null);
    if (SAMPLE_REPORTS[sample.id]) {
      setActiveReport(SAMPLE_REPORTS[sample.id]);
    } else {
      handleRunScan(sample.content, mode);
    }
  };

  // Run Scan Handler
  const handleRunScan = async (overrideText?: string, targetMode?: ScannerMode) => {
    const textToScan = (overrideText ?? inputText).trim();
    const effectiveMode = targetMode ?? mode;

    if (!textToScan || textToScan.length < 20) {
      alert('Please enter at least 20 characters of text to scan.');
      return;
    }

    // Check if it matches an exact pre-computed sample
    const matchedSample = SAMPLE_TEXTS.find(s => s.content.trim() === textToScan);
    if (matchedSample && SAMPLE_REPORTS[matchedSample.id]) {
      setActiveReport(SAMPLE_REPORTS[matchedSample.id]);
      return;
    }

    setIsScanning(true);
    setScanStep('Analyzing syntax tokens and sentence burstiness...');

    try {
      const progressTimer1 = setTimeout(() => {
        setScanStep('Evaluating vocabulary perplexity & neural predictability...');
      }, 700);

      const progressTimer2 = setTimeout(() => {
        setScanStep('Auditing web citations & integrity score...');
      }, 1600);

      let endpoint = '/api/detect/comprehensive';
      if (effectiveMode === 'ai') endpoint = '/api/detect/ai';
      if (effectiveMode === 'plagiarism') endpoint = '/api/detect/plagiarism';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToScan })
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Scan failed.');
      }

      let report: ComprehensiveReport;

      if (effectiveMode === 'ai') {
        const aiAnalysis: AIDetectionResult = data.analysis;
        report = {
          compositeAuthenticity: Math.max(0, 100 - aiAnalysis.overallAiScore),
          aiAnalysis,
          plagiarismAnalysis: {
            similarityScore: 0,
            verdict: 'Not requested in AI-only scan',
            summary: 'Plagiarism check was bypassed in AI Detector mode.',
            matchedSources: [],
            flaggedPassages: []
          },
          localMetrics: data.localMetrics,
          scannedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          originalText: textToScan
        };
      } else if (effectiveMode === 'plagiarism') {
        const plagiarismAnalysis: PlagiarismResult = data.analysis;
        report = {
          compositeAuthenticity: Math.max(0, 100 - plagiarismAnalysis.similarityScore),
          aiAnalysis: {
            overallAiScore: 0,
            verdict: 'Not requested in Plagiarism-only scan',
            confidence: 'Low',
            metrics: {
              perplexityScore: 50,
              burstinessScore: 50,
              repetitionScore: 0,
              syntacticUniformity: 0,
              clicheCount: 0
            },
            overallSummary: 'AI detection was bypassed in Plagiarism mode.',
            flaggedCliches: [],
            sentenceAnalysis: []
          },
          plagiarismAnalysis,
          localMetrics: {
            sentenceCount,
            wordCount,
            avgSentenceLength: Math.round(wordCount / (sentenceCount || 1)),
            burstinessScore: 50,
            lexicalDiversity: 0.5
          },
          scannedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          originalText: textToScan
        };
      } else {
        // Comprehensive mode
        report = {
          compositeAuthenticity: data.compositeAuthenticity,
          aiAnalysis: data.aiAnalysis,
          plagiarismAnalysis: data.plagiarismAnalysis,
          localMetrics: data.localMetrics,
          scannedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          originalText: textToScan
        };
      }

      setActiveReport(report);
      setHistory(prev => [report, ...prev.filter(h => h.originalText !== report.originalText)].slice(0, 20));
    } catch (err: any) {
      console.error('Scan error:', err);
      alert('Failed to complete scan: ' + (err.message || 'Server error.'));
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Handle single sentence inline replacement
  const handleApplySingleRewrite = (originalSentence: string, replacement: string) => {
    const updated = inputText.replace(originalSentence, replacement);
    setInputText(updated);

    if (activeReport) {
      const updatedSentences = activeReport.aiAnalysis.sentenceAnalysis.map(s => {
        if (s.sentence === originalSentence) {
          return {
            ...s,
            sentence: replacement,
            aiProbability: 5,
            category: 'human' as const,
            reasons: ['Humanized and naturalized']
          };
        }
        return s;
      });

      setActiveReport({
        ...activeReport,
        originalText: updated,
        aiAnalysis: {
          ...activeReport.aiAnalysis,
          sentenceAnalysis: updatedSentences
        }
      });
    }
  };

  // Robust document processing for .docx, .doc, .txt, .md
  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    try {
      const cleanText = await parseUploadedDocument(file);
      if (cleanText && cleanText.trim().length > 0) {
        setInputText(cleanText);
        setUploadedFileName(file.name);
      } else {
        alert('Could not extract readable text from this file. Please make sure the document is not empty.');
      }
    } catch (err: any) {
      console.error('Error parsing uploaded document:', err);
      alert('Error reading document: ' + (err.message || 'Failed to parse file.'));
    } finally {
      setIsParsingFile(false);
    }
  };

  // File upload input change
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  // Textarea input change: check if user pasted raw Word ZIP bytes (starts with PK\x03\x04)
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.startsWith('PK\x03\x04') || val.includes('[Content_Types].xml')) {
      const extracted = extractTextFromRawDocxString(val);
      setInputText(extracted);
      setUploadedFileName('Pasted Word Document');
    } else {
      setInputText(val);
    }
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (text.startsWith('PK\x03\x04') || text.includes('[Content_Types].xml')) {
          const extracted = extractTextFromRawDocxString(text);
          setInputText(extracted);
          setUploadedFileName('Pasted Word Document');
        } else {
          setInputText(text);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Header
        currentMode={mode}
        onSelectMode={(m) => setMode(m)}
        onSelectSample={handleLoadSample}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        hasActiveReport={Boolean(activeReport)}
        historyCount={history.length}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sample Quick Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Quick Test Samples:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_TEXTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <span>{sample.category === 'ai' ? '🤖' : sample.category === 'plagiarism' ? '🔍' : '✍️'}</span>
                <span>{sample.title}</span>
                <span className="text-[10px] text-indigo-400 font-mono">({sample.badge})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Editor Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Input Column (Editor & Controls) */}
          <div className="lg:col-span-6 space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl bg-slate-900/70 border p-4 shadow-xl flex flex-col h-full transition-all ${
                isDragging ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/50' : 'border-slate-800'
              }`}
            >
              {/* Drag & Drop Overlay */}
              {isDragging && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl backdrop-blur-sm border-2 border-dashed border-indigo-500 pointer-events-none animate-in fade-in">
                  <Upload className="w-10 h-10 text-indigo-400 animate-bounce mb-2" />
                  <span className="text-sm font-bold text-white">Drop Word Document (.docx) or Text file here</span>
                  <span className="text-xs text-slate-400 mt-1">Automatic text extraction and formatting</span>
                </div>
              )}

              {/* Textarea Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-200">Input Document</span>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>{wordCount} words</span>
                    <span>·</span>
                    <span>{charCount} chars</span>
                    <span>·</span>
                    <span>~{readingTimeMinutes} min read</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePasteClipboard}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingFile}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                    title="Upload Word Document (.docx) or Text (.txt, .md)"
                  >
                    {isParsingFile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.txt,.md,.text"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText('');
                        setUploadedFileName(null);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition"
                      title="Clear text"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Active Uploaded Document Badge if present */}
              {uploadedFileName && (
                <div className="mt-2.5 p-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">Extracted from: <strong>{uploadedFileName}</strong></span>
                  </div>
                  <button
                    onClick={() => setUploadedFileName(null)}
                    className="text-[10px] text-slate-400 hover:text-white ml-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Parsing status banner */}
              {isParsingFile && (
                <div className="mt-2.5 p-2 px-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Parsing and extracting text from Word Document (.docx)...</span>
                </div>
              )}

              {/* Main Textarea */}
              <div className="relative mt-3 flex-1 min-h-[340px]">
                <textarea
                  value={inputText}
                  onChange={handleTextChange}
                  placeholder="Paste or write your essay, article, or academic paper here, or upload / drag & drop a .docx or .txt document..."
                  className="w-full h-full min-h-[340px] p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 text-sm leading-relaxed resize-y outline-none transition font-sans custom-scrollbar"
                />
              </div>

              {/* Action Button Strip */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Mode:</span>
                  <span className="text-xs font-semibold text-indigo-400 capitalize">
                    {mode === 'comprehensive' ? 'Dual AI & Plagiarism Scan' : mode === 'ai' ? 'AI Detector Only' : mode === 'plagiarism' ? 'Web Plagiarism Only' : 'Humanizer Studio'}
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {mode !== 'fixer' && (
                    <button
                      onClick={() => setMode('fixer')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Switch to Fixer</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRunScan()}
                    disabled={isScanning || !inputText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {mode === 'comprehensive'
                            ? 'Run Full Deep Scan'
                            : mode === 'ai'
                            ? 'Check AI Probability'
                            : mode === 'plagiarism'
                            ? 'Check Plagiarism'
                            : 'Scan & Load in Fixer'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scanning status banner */}
              {isScanning && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>{scanStep || 'Executing deep forensics analysis...'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Score Gauges & Quick Diagnostics */}
          <div className="lg:col-span-6 space-y-4">
            {activeReport ? (
              <div className="space-y-4">
                {/* Score Gauges Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gauge 1: Composite Originality */}
                  <ScoreGauge
                    score={activeReport.compositeAuthenticity}
                    title="Authenticity Index"
                    subtitle="Overall Originality"
                    type="authenticity"
                    inverted={true}
                  />

                  {/* Gauge 2: AI Probability */}
                  <ScoreGauge
                    score={activeReport.aiAnalysis.overallAiScore}
                    title="AI Detection"
                    subtitle={activeReport.aiAnalysis.verdict}
                    type="ai"
                  />

                  {/* Gauge 3: Plagiarism / Web Similarity */}
                  <ScoreGauge
                    score={activeReport.plagiarismAnalysis.similarityScore}
                    title="Web Plagiarism"
                    subtitle={activeReport.plagiarismAnalysis.verdict}
                    type="plagiarism"
                  />
                </div>

                {/* Stylometric Metrics Grid */}
                <MetricsGrid
                  metrics={activeReport.aiAnalysis.metrics}
                  avgSentenceLength={activeReport.localMetrics.avgSentenceLength}
                  lexicalDiversity={activeReport.localMetrics.lexicalDiversity}
                />

                {/* AI Summary Banner */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Linguistic Forensic Assessment</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      Confidence: <strong className="text-white">{activeReport.aiAnalysis.confidence}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeReport.aiAnalysis.overallSummary}
                  </p>
                </div>

                {/* Detected Clichés Pill Drawer */}
                {activeReport.aiAnalysis.flaggedCliches && activeReport.aiAnalysis.flaggedCliches.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Flagged AI Clichés & Stereotypical Tropes ({activeReport.aiAnalysis.flaggedCliches.length})
                      </span>
                      <span className="text-[10px] text-slate-500">Click to replace</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {activeReport.aiAnalysis.flaggedCliches.map((cliche, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 group"
                        >
                          <span className="font-semibold font-mono">"{cliche.wordOrPhrase}"</span>
                          <span className="text-[10px] text-slate-400">({cliche.count}x)</span>
                          <span className="text-[10px] text-slate-500">→</span>
                          <span className="text-[11px] text-emerald-400 font-medium">{cliche.alternative}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-3 h-full">
                <ShieldCheck className="w-12 h-12 text-indigo-400/40" />
                <h3 className="text-sm font-semibold text-slate-300">Awaiting Analysis</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click "Run Full Deep Scan" to generate forensic stylometry metrics, web plagiarism citations, and sentence heatmaps.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Dedicated Tabs / Detailed Sections */}
        {mode === 'fixer' ? (
          <HumanizerFixerStudio
            originalText={inputText}
            initialAiScore={activeReport?.aiAnalysis.overallAiScore ?? 85}
            onApplyFixedTextToMain={(newText) => {
              setInputText(newText);
              handleRunScan(newText, 'comprehensive');
            }}
            onRequestReScan={(text) => handleRunScan(text, 'comprehensive')}
          />
        ) : (
          activeReport && (
            <div className="space-y-6 pt-2">
              {/* 1. Sentence-by-Sentence Heatmap */}
              {(mode === 'comprehensive' || mode === 'ai') && activeReport.aiAnalysis.sentenceAnalysis.length > 0 && (
                <SentenceHeatmap
                  sentenceAnalysis={activeReport.aiAnalysis.sentenceAnalysis}
                  flaggedPassages={activeReport.plagiarismAnalysis.flaggedPassages}
                  onSelectSentence={(s) => setInspectedSentence(s)}
                  onApplySingleRewrite={handleApplySingleRewrite}
                />
              )}

              {/* 2. Plagiarism Web Matches & Citation Generator */}
              {(mode === 'comprehensive' || mode === 'plagiarism') && (
                <PlagiarismSourcesList
                  similarityScore={activeReport.plagiarismAnalysis.similarityScore}
                  verdict={activeReport.plagiarismAnalysis.verdict}
                  summary={activeReport.plagiarismAnalysis.summary}
                  matchedSources={activeReport.plagiarismAnalysis.matchedSources}
                  flaggedPassages={activeReport.plagiarismAnalysis.flaggedPassages}
                  liveWebSources={activeReport.plagiarismAnalysis.liveWebSources}
                />
              )}

              {/* 3. Bottom Banner: Call-to-action to Humanize & Fix */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                    <span>Want to fix flagged sentences and lower your AI score to &lt;5%?</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Use our Humanizer Studio to re-engineer clause cadence, add natural human burstiness, and eliminate robotic clichés.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCertificateOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>View Certificate</span>
                  </button>

                  <button
                    onClick={() => setMode('fixer')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Launch Humanizer Fixer</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Modals & Drawers */}
      <SentenceInspectorModal
        sentence={inspectedSentence}
        onClose={() => setInspectedSentence(null)}
        onApplyRewrite={handleApplySingleRewrite}
      />

      {activeReport && isCertificateOpen && (
        <CertificateReportModal
          report={activeReport}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}

      <ScanHistoryDrawer
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={(item) => {
          setInputText(item.originalText);
          setActiveReport(item);
        }}
        onClearHistory={() => {
          setHistory([]);
          localStorage.removeItem('veritas_scan_history');
        }}
      />

      <VercelDeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-mono">VeritasAI Integrity</span>
            <span>· Dual AI Stylometry & Web Grounding Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Search Grounded</span>
            <span>·</span>
            <span>Academic Integrity Standards</span>
            <span>·</span>
            <span>Zero Data Storage Retention</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
