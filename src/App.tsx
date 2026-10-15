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
  FileDown,
  Layers,
  Binary,
  RotateCw,
  FileCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Award
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
import { analyzeStatisticalLinguistics, extractShingles, LinguisticMetrics, ShingleMatch } from './utils/linguisticAnalyzer';
import { exportForensicReportPDF } from './utils/pdfExport';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import { ThreeCoreScanner, Scanner3DStatus } from './components/ThreeCoreScanner';
import { PerspectiveTiltCard } from './components/PerspectiveTiltCard';
import { TechnicalLinguisticModal } from './components/TechnicalLinguisticModal';
import { EnterpriseAuthModal } from './components/EnterpriseAuthModal';

function VeritasAIWorkspace() {
  const { session, incrementQuotaUsage } = useAuth();

  // Primary Workspace state
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS[0].content);
  const [mode, setMode] = useState<ScannerMode>('comprehensive');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  // 3D Engine & Animation state
  const [is3DCoreVisible, setIs3DCoreVisible] = useState<boolean>(true);
  const [isDiagnosticFlipped, setIsDiagnosticFlipped] = useState<boolean>(false);

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Active Report state
  const [activeReport, setActiveReport] = useState<ComprehensiveReport | null>(SAMPLE_REPORTS['ai-essay']);

  // Modals & Drawers
  const [inspectedSentence, setInspectedSentence] = useState<SentenceAnalysis | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDeployOpen, setIsDeployOpen] = useState<boolean>(false);
  const [isLinguisticsOpen, setIsLinguisticsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Saved history in localStorage
  const [history, setHistory] = useState<ComprehensiveReport[]>(() => {
    try {
      const saved = localStorage.getItem('veritas_scan_history');
      if (saved) return JSON.parse(saved);
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

  // Compute live statistical linguistics & 5-gram shingles
  const linguistics: LinguisticMetrics = React.useMemo(() => {
    return analyzeStatisticalLinguistics(inputText);
  }, [inputText]);

  const shingles: ShingleMatch[] = React.useMemo(() => {
    return extractShingles(inputText, 5);
  }, [inputText]);

  // 3D Scanner status derived state
  const scannerStatus: Scanner3DStatus = isScanning ? 'scanning' : activeReport ? 'completed' : 'idle';

  // Switch to a sample: instantly load its cached baseline
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
      incrementQuotaUsage();
      return;
    }

    setIsScanning(true);
    setScanStep('Computing N-gram entropy, burstiness variance & syntax tokens...');

    try {
      const progressTimer1 = setTimeout(() => {
        setScanStep('Querying Gemini 2.5 Pro Neural Forensics & Search Grounding...');
      }, 700);

      const progressTimer2 = setTimeout(() => {
        setScanStep('Cross-referencing web shingle fingerprints & authenticating sources...');
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
        report = {
          compositeAuthenticity: data.compositeAuthenticity,
          aiAnalysis: data.aiAnalysis,
          plagiarismAnalysis: data.plagiarismAnalysis,
          localMetrics: data.localMetrics,
          scannedAt: data.scannedAt,
          originalText: data.originalText
        };
      }

      setActiveReport(report);
      setHistory(prev => [report, ...prev.filter(h => h.originalText !== report.originalText)].slice(0, 20));
      incrementQuotaUsage();
    } catch (err: any) {
      console.error('Scan error:', err);
      alert('Scan error: ' + (err.message || 'Server error occurred during scan.'));
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Replace single sentence with rewritten version
  const handleApplySingleRewrite = (originalSentence: string, rewrittenSentence: string) => {
    const updated = inputText.replace(originalSentence, rewrittenSentence);
    setInputText(updated);

    if (activeReport) {
      const updatedSentences = activeReport.aiAnalysis.sentenceAnalysis.map(s => {
        if (s.sentence.trim() === originalSentence.trim()) {
          return {
            ...s,
            sentence: rewrittenSentence,
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

  // Document processing for .docx, .doc, .txt, .md
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

  // Textarea input change: check if user pasted raw Word ZIP bytes
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

  // Trigger PDF Export
  const handleExportPDF = () => {
    if (!activeReport) return;
    exportForensicReportPDF({
      report: activeReport,
      linguistics,
      documentTitle: uploadedFileName || (inputText.slice(0, 50).trim() || 'VeritasAI Document Audit')
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <Header
        currentMode={mode}
        onSelectMode={(m) => setMode(m)}
        onSelectSample={handleLoadSample}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenLinguistics={() => setIsLinguisticsOpen(true)}
        onExportPDF={handleExportPDF}
        onOpenAuth={() => setIsAuthOpen(true)}
        hasActiveReport={Boolean(activeReport)}
        historyCount={history.length}
        is3DCoreVisible={is3DCoreVisible}
        onToggle3DCore={() => setIs3DCoreVisible(!is3DCoreVisible)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 3D AI Core & Laser Scanner Showcase Viewport */}
        {is3DCoreVisible && (
          <div className="animate-in fade-in duration-300">
            <ThreeCoreScanner
              status={scannerStatus}
              authenticityScore={activeReport?.compositeAuthenticity}
            />
          </div>
        )}

        {/* Sample Quick Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 font-mono">Benchmark Corpus Samples:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_TEXTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center gap-1.5"
              >
                <span>{sample.category === 'ai' ? '🤖' : sample.category === 'plagiarism' ? '🔍' : '✍️'}</span>
                <span>{sample.title}</span>
                <span className="text-[10px] text-indigo-400 font-mono">({sample.badge})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Editor & 3D Interactive Card Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Editor & Controls with Interactive 3D Perspective Tilt) */}
          <div className="lg:col-span-6">
            <PerspectiveTiltCard maxTilt={5}>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl bg-zinc-900/80 backdrop-blur-xl border p-5 shadow-2xl flex flex-col h-full transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/40' : 'border-zinc-800'
                }`}
              >
                {/* Drag & Drop Overlay */}
                {isDragging && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/95 rounded-2xl backdrop-blur-sm border-2 border-dashed border-indigo-500 pointer-events-none animate-in fade-in">
                    <Upload className="w-10 h-10 text-indigo-400 animate-bounce mb-2" />
                    <span className="text-sm font-bold text-white">Drop Word Document (.docx) or Text file here</span>
                    <span className="text-xs text-zinc-400 mt-1">Automatic text extraction and formatting</span>
                  </div>
                )}

                {/* Textarea Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80 text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-200">Input Document</span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
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
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsingFile}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1"
                      title="Upload Word Document (.docx) or Text (.txt, .md)"
                    >
                      {isParsingFile ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline font-medium">Upload File</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.doc,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => {
                        setInputText('');
                        setUploadedFileName(null);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                      title="Clear text"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Uploaded Document Banner */}
                {uploadedFileName && (
                  <div className="mt-2.5 p-2 px-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold truncate">Attached: {uploadedFileName}</span>
                    </div>
                    <button
                      onClick={() => setUploadedFileName(null)}
                      className="text-zinc-400 hover:text-white text-xs ml-2"
                    >
                      ✕
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
                    placeholder="Paste or type academic text, technical documentation, or prose to scan for AI predictability and web source similarity..."
                    className="w-full h-full min-h-[340px] p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder:text-zinc-600 text-sm leading-relaxed resize-y outline-none transition font-sans custom-scrollbar"
                  />
                </div>

                {/* Action Button Strip */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Mode:</span>
                    <span className="text-xs font-semibold text-indigo-400 capitalize">
                      {mode === 'comprehensive' ? 'Dual AI & Plagiarism Scan' : mode === 'ai' ? 'AI Detector Only' : mode === 'plagiarism' ? 'Web Plagiarism Only' : 'Humanizer Studio'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {mode !== 'fixer' && (
                      <button
                        onClick={() => setMode('fixer')}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition"
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
                              ? 'Run Veritas Deep Scan'
                              : mode === 'ai'
                              ? 'Check AI Probability'
                              : mode === 'plagiarism'
                              ? 'Check Plagiarism'
                              : 'Run Scan'}
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
                    <span>{scanStep || 'Executing deep forensic stylometry...'}</span>
                  </div>
                )}
              </div>
            </PerspectiveTiltCard>
          </div>

          {/* Right Column: Score Gauges & Diagnostics with 3D Flip Card Transition */}
          <div className="lg:col-span-6 space-y-4">
            <PerspectiveTiltCard
              maxTilt={6}
              isFlipped={isDiagnosticFlipped}
              backContent={
                /* 3D Back Face: Statistical Linguistics & Shingle Snapshot */
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                      <Binary className="w-4 h-4 text-purple-400" />
                      <span>NLP Statistical Linguistics Snapshot</span>
                    </div>
                    <button
                      onClick={() => setIsDiagnosticFlipped(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition"
                    >
                      <RotateCw className="w-3 h-3 text-indigo-400" />
                      <span>Flip to Gauges</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block">Perplexity Index</span>
                      <span className="text-xl font-bold font-mono text-indigo-400">{linguistics.perplexityProxy}/100</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block">Burstiness (CV)</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">{linguistics.coefficientOfVariation}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block">Type-Token (TTR)</span>
                      <span className="text-xl font-bold font-mono text-amber-400">{linguistics.typeTokenRatio}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 block">5-Gram Shingles</span>
                      <span className="text-xl font-bold font-mono text-purple-400">{shingles.length}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400">
                    Fingerprint Checksum: <strong className="text-indigo-300 font-mono">0x{linguistics.fingerprintHash}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setIsLinguisticsOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Open Full Shingle Inspector</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>
              }
            >
              {/* 3D Front Face: Gauges & Diagnostic Metrics */}
              {activeReport ? (
                <div className="space-y-4">
                  {/* Score Gauges Row with Flip Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Verification Indicators
                      </span>
                      <button
                        onClick={() => setIsDiagnosticFlipped(true)}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-zinc-900/80 px-2 py-0.5 rounded-lg border border-zinc-800 transition"
                        title="3D Flip to view N-Gram Shingle & Linguistic Metrics"
                      >
                        <RotateCw className="w-3 h-3 text-indigo-400" />
                        <span>3D Flip: NLP Stats</span>
                      </button>
                    </div>

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
                  </div>

                  {/* Stylometric Metrics Grid */}
                  <MetricsGrid
                    metrics={activeReport.aiAnalysis.metrics}
                    avgSentenceLength={activeReport.localMetrics.avgSentenceLength}
                    lexicalDiversity={activeReport.localMetrics.lexicalDiversity}
                  />

                  {/* AI Summary Banner */}
                  <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Forensic Verdict Summary
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Audited: {activeReport.scannedAt}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {activeReport.aiAnalysis.overallSummary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                  <FileSearch className="w-12 h-12 text-zinc-600" />
                  <h3 className="text-base font-semibold text-zinc-300">No Document Scanned Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Paste your text in the editor or choose one of the pre-configured sample essays above to inspect the audit results.
                  </p>
                </div>
              )}
            </PerspectiveTiltCard>
          </div>
        </div>

        {/* Mode-Specific Workspaces: Fixer Studio OR Heatmap & Sources */}
        {mode === 'fixer' ? (
          <HumanizerFixerStudio
            originalText={inputText}
            initialAiScore={activeReport?.aiAnalysis.overallAiScore || 85}
            onApplyFixedTextToMain={(newText: string) => setInputText(newText)}
            onRequestReScan={(newText: string) => handleRunScan(newText, 'comprehensive')}
          />
        ) : (
          activeReport && (
            <div className="space-y-6">
              {/* 1. Sentence-by-Sentence AI Heatmap */}
              {(mode === 'comprehensive' || mode === 'ai') && (
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

              {/* 3. Bottom Banner: Call-to-action to Humanize & Fix & Export */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                    <span>Neural Humanizer Studio &amp; Executive PDF Export</span>
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Re-engineer syntactic cadence with Gemini, view sentence burstiness, or export an official cryptographic audit PDF.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow shadow-indigo-600/30"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export Audit PDF</span>
                  </button>

                  <button
                    onClick={() => setIsCertificateOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
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

      {activeReport && (
        <TechnicalLinguisticModal
          isOpen={isLinguisticsOpen}
          onClose={() => setIsLinguisticsOpen(false)}
          report={activeReport}
          linguistics={linguistics}
          shingles={shingles}
          sourceText={inputText}
        />
      )}

      {/* Enterprise Confidential Authentication Modal */}
      <EnterpriseAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400 font-mono">VeritasAI Enterprise</span>
            <span>· 3D WebGL Neural Core &amp; Statistical Linguistics</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <span>Google Search Grounded</span>
            <span>·</span>
            <span>Rabin-Karp Shingle Fingerprints</span>
            <span>·</span>
            <span>Zero Data Storage Retention</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VeritasAIWorkspace />
    </AuthProvider>
  );
}
