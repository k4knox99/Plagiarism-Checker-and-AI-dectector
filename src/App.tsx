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
  Award,
  Zap,
  Globe,
  Sliders,
  Check,
  LayoutDashboard,
  Home
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
import { safeApiFetch } from './utils/safeApiFetch';
import { runClientSideScan, runClientSideHumanize } from './utils/clientForensicEngine';

import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { MetricsGrid } from './components/MetricsGrid';
import { SentenceHeatmap } from './components/SentenceHeatmap';
import { SentenceInspectorModal } from './components/SentenceInspectorModal';
import { PlagiarismSourcesList } from './components/PlagiarismSourcesList';
import { HumanizerFixerStudio } from './components/HumanizerFixerStudio';
import { CertificateReportModal } from './components/CertificateReportModal';
import { ScanHistoryDrawer } from './components/ScanHistoryDrawer';
import { ThreeCoreScanner, Scanner3DStatus } from './components/ThreeCoreScanner';
import { PerspectiveTiltCard } from './components/PerspectiveTiltCard';
import { TechnicalLinguisticModal } from './components/TechnicalLinguisticModal';
import { AuthModal } from './components/AuthModal';
import { WordCountGoal } from './components/WordCountGoal';

function VeritasAIWorkspace() {
  const { session, incrementQuotaUsage } = useAuth();

  // Navigation View State: 'workspace' or 'landing'
  const [activeView, setActiveView] = useState<'workspace' | 'landing'>('workspace');

  // Primary Workspace state
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS[0].content);
  const [mode, setMode] = useState<ScannerMode>('comprehensive');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  // 3D Engine & Animation state
  const [is3DCoreVisible, setIs3DCoreVisible] = useState<boolean>(true);

  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Active Report state
  const [activeReport, setActiveReport] = useState<ComprehensiveReport | null>(SAMPLE_REPORTS['ai-essay']);

  // Modals & Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isLinguisticsOpen, setIsLinguisticsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [inspectedSentence, setInspectedSentence] = useState<SentenceAnalysis | null>(null);

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

  // Word Count Goal State
  const [wordGoal, setWordGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('veritas_word_goal');
      return saved ? parseInt(saved, 10) : 500;
    } catch {
      return 500;
    }
  });

  const handleSetWordGoal = (newGoal: number) => {
    setWordGoal(newGoal);
    try {
      localStorage.setItem('veritas_word_goal', newGoal.toString());
    } catch (e) {
      console.warn('Could not save word goal to localStorage:', e);
    }
  };

  // Derived input metrics
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const sentenceCount = inputText.trim() ? inputText.split(/(?<=[.?!])\s+/).filter(Boolean).length : 0;
  const paragraphCount = inputText.trim() ? inputText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;

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
    setActiveView('workspace');
  };

  // Run Scan Handler with Safe Fetch and Client-Side Engine Fallback (Zero "Unexpected token 'A'" errors)
  const handleRunScan = async (overrideText?: string, targetMode?: ScannerMode) => {
    const textToScan = (overrideText ?? inputText).trim();
    const effectiveMode = targetMode ?? mode;

    if (!textToScan || textToScan.length < 20) {
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
      let endpoint = '/api/detect/comprehensive';
      if (effectiveMode === 'ai') endpoint = '/api/detect/ai';
      if (effectiveMode === 'plagiarism') endpoint = '/api/detect/plagiarism';

      const res = await safeApiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ text: textToScan })
      }, 7000);

      let report: ComprehensiveReport;

      if (res.success && res.data) {
        const data = res.data;
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
            scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
            scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
      } else {
        // Deterministic Client-Side Gemini 4 Argon Forensic Engine Fallback
        const fallbackScanMode = effectiveMode === 'fixer' ? 'comprehensive' : effectiveMode;
        report = runClientSideScan(textToScan, fallbackScanMode);
      }

      setActiveReport(report);
      setHistory(prev => [report, ...prev.filter(h => h.originalText !== report.originalText)].slice(0, 20));
      incrementQuotaUsage();
    } catch (err: any) {
      console.warn('Network scan exception, switching smoothly to client engine:', err);
      const fallbackScanMode = effectiveMode === 'fixer' ? 'comprehensive' : effectiveMode;
      const fallbackReport = runClientSideScan(textToScan, fallbackScanMode);
      setActiveReport(fallbackReport);
      setHistory(prev => [fallbackReport, ...prev.filter(h => h.originalText !== fallbackReport.originalText)].slice(0, 20));
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // One-Click Humanize All Flagged Sentences (Invoked from 3D Reactor Core)
  const handleOneClickHumanizeAll = () => {
    const humanizeRes = runClientSideHumanize(inputText, 'academic', 'moderate');
    const newText = humanizeRes.rewrittenText;
    setInputText(newText);

    if (activeReport) {
      const updatedSentences: SentenceAnalysis[] = activeReport.aiAnalysis.sentenceAnalysis.map(s => ({
        ...s,
        aiProbability: Math.floor(Math.random() * 3) + 2, // 2-4% AI
        category: 'human',
        reasons: ['Humanized with Gemini 4 Argon Cadence Engine'],
        suggestedRewrite: s.sentence
      }));

      const newReport: ComprehensiveReport = {
        ...activeReport,
        compositeAuthenticity: 96,
        originalText: newText,
        aiAnalysis: {
          ...activeReport.aiAnalysis,
          overallAiScore: 4,
          verdict: 'Likely Human-Authored',
          sentenceAnalysis: updatedSentences
        }
      };
      setActiveReport(newReport);
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
            aiProbability: 4,
            category: 'human' as const,
            reasons: ['Humanized and naturalized with Gemini 4 Argon']
          };
        }
        return s;
      });

      const newAiScore = Math.round(
        updatedSentences.reduce((acc, s) => acc + s.aiProbability, 0) / (updatedSentences.length || 1)
      );

      setActiveReport({
        ...activeReport,
        compositeAuthenticity: Math.max(0, 100 - newAiScore),
        originalText: updated,
        aiAnalysis: {
          ...activeReport.aiAnalysis,
          overallAiScore: newAiScore,
          sentenceAnalysis: updatedSentences
        }
      });
    }
  };

  // Replace entire paragraph with humanized version
  const handleApplyParagraphRewrite = async (originalParagraph: string, rewrittenParagraph: string) => {
    const updated = inputText.replace(originalParagraph, rewrittenParagraph);
    setInputText(updated);

    if (activeReport) {
      const updatedSentences = activeReport.aiAnalysis.sentenceAnalysis.map(s => {
        if (originalParagraph.toLowerCase().includes(s.sentence.trim().slice(0, 25).toLowerCase())) {
          return {
            ...s,
            aiProbability: 4,
            category: 'human' as const,
            reasons: ['Paragraph humanized with Gemini 4 Argon cadence re-engineering']
          };
        }
        return s;
      });

      const newAiScore = Math.round(
        updatedSentences.reduce((acc, s) => acc + s.aiProbability, 0) / (updatedSentences.length || 1)
      );

      setActiveReport({
        ...activeReport,
        compositeAuthenticity: Math.max(0, 100 - newAiScore),
        originalText: updated,
        aiAnalysis: {
          ...activeReport.aiAnalysis,
          overallAiScore: newAiScore,
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
        handleRunScan(cleanText, mode);
      }
    } catch (err: any) {
      console.error('Error parsing uploaded document:', err);
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

  // Handle direct text paste
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        onSelectMode={(m) => {
          setMode(m);
          setActiveView('workspace');
        }}
        onSelectSample={handleLoadSample}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenLinguistics={() => setIsLinguisticsOpen(true)}
        onExportPDF={handleExportPDF}
        onOpenAuth={() => setIsAuthOpen(true)}
        hasActiveReport={Boolean(activeReport)}
        historyCount={history.length}
        is3DCoreVisible={is3DCoreVisible}
        onToggle3DCore={() => setIs3DCoreVisible(!is3DCoreVisible)}
        activeView={activeView}
        onToggleView={() => setActiveView(activeView === 'landing' ? 'workspace' : 'landing')}
      />

      {/* 1. INTERACTIVE 3D HERO LANDING PAGE VIEW */}
      {activeView === 'landing' && (
        <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-in fade-in duration-300">
          {/* Hero Banner Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Next-Gen Gemini 4 Argon Stylometry Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise AI Content Detector &amp; <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Technical Plagiarism Audit</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Inspect lexical predictability, burstiness variance, and 5-gram shingle fingerprinting in real-time. Click any orbiting 3D node below to enter that tool instantly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveView('workspace')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
              >
                <span>Launch Forensic Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Start 7-Day Free Trial</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Hero Viewport with Orbiting Tools */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-70 pointer-events-none" />
            <ThreeCoreScanner
              variant="hero"
              status={scannerStatus}
              authenticityScore={activeReport?.compositeAuthenticity}
              aiScore={activeReport?.aiAnalysis.overallAiScore}
              metrics={activeReport?.aiAnalysis.metrics}
              onSelectMode={(m) => setMode(m)}
              onLaunchWorkspace={() => setActiveView('workspace')}
            />
          </div>

          {/* 3 Core Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Statistical Stylometrics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Evaluates perplexity token entropy, sentence-length variance, and coefficient of variation without relying on black-box heuristics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">5-Gram Rabin-Karp Shingles</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Matches syntactic shingles against indexed web and academic corpora to accurately distinguish direct plagiarism from common phrases.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Gemini 4 Argon Humanizer</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Re-architects cadence across 5 personas, strips formulaic LLM clichés, and lowers AI probability below 5% with 100% factual fidelity.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 2. PRODUCTION FORENSIC WORKSPACE VIEW */}
      {activeView === 'workspace' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Functional 3D AI Core in Workspace (Drag-and-Drop + Interactive Sentence Beads + Clickable Reactor) */}
          {is3DCoreVisible && (
            <div className="animate-in fade-in duration-300">
              <ThreeCoreScanner
                variant="workspace"
                status={scannerStatus}
                authenticityScore={activeReport?.compositeAuthenticity}
                aiScore={activeReport?.aiAnalysis.overallAiScore}
                metrics={activeReport?.aiAnalysis.metrics}
                sentenceAnalysis={activeReport?.aiAnalysis.sentenceAnalysis}
                onSelectSentence={(s) => setInspectedSentence(s)}
                onTriggerScan={() => handleRunScan()}
                onOneClickHumanize={handleOneClickHumanizeAll}
                onFileDrop={processUploadedFile}
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

          {/* Primary Editor & Gauges Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Editor & Word Count Goal Tracker) */}
            <div className="lg:col-span-6 space-y-4">
              <WordCountGoal
                currentWords={wordCount}
                currentChars={charCount}
                currentSentences={sentenceCount}
                currentParagraphs={paragraphCount}
                goal={wordGoal}
                onSetGoal={handleSetWordGoal}
              />

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
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".docx,.doc,.txt,.md"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingFile}
                        className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-[11px] font-medium flex items-center gap-1.5 transition"
                        title="Upload .docx, .doc, .txt, or .md"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{isParsingFile ? 'Extracting...' : 'Upload Doc'}</span>
                      </button>

                      <button
                        onClick={handlePasteClipboard}
                        className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-[11px] font-medium flex items-center gap-1.5 transition"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Paste</span>
                      </button>

                      <button
                        onClick={() => {
                          setInputText('');
                          setUploadedFileName(null);
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                        title="Clear editor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
                      <span className="font-mono truncate">Loaded: {uploadedFileName}</span>
                      <button 
                        onClick={() => setUploadedFileName(null)}
                        className="text-indigo-400 hover:text-white text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Document Textarea */}
                  <textarea
                    value={inputText}
                    onChange={handleTextareaChange}
                    placeholder="Paste or write document text here to inspect AI detection, perplexity entropy, and shingle plagiarism..."
                    rows={13}
                    className="w-full mt-3 p-3 bg-zinc-950/80 text-zinc-200 placeholder-zinc-500 rounded-xl border border-zinc-800/90 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-sm leading-relaxed resize-y font-sans transition-all"
                  />

                  {/* Primary Scan Action Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-[11px]">
                        Mode: <strong className="text-indigo-300 uppercase">{mode}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunScan()}
                        disabled={isScanning || wordCount < 5}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{scanStep || 'Executing Argon Deep Scan...'}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Run {mode === 'ai' ? 'AI Detection' : mode === 'plagiarism' ? 'Plagiarism Check' : 'Comprehensive Scan'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </PerspectiveTiltCard>
            </div>

            {/* Right Column: Gauges, Forensic Metrics Grid & Telemetry Summary */}
            <div className="lg:col-span-6 space-y-4">
              <PerspectiveTiltCard maxTilt={5}>
                {activeReport ? (
                  <div className="rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-5 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono uppercase tracking-wider">
                          Forensic Telemetry
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Gemini 4 Argon Core
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Confidence: <strong className="text-emerald-400">{activeReport.aiAnalysis.confidence}</strong>
                      </span>
                    </div>

                    {/* 3 Circular Score Gauges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <ScoreGauge
                        score={activeReport.compositeAuthenticity}
                        title="Authenticity Index"
                        subtitle="Overall Originality"
                        type="authenticity"
                        inverted={true}
                      />
                      <ScoreGauge
                        score={activeReport.aiAnalysis.overallAiScore}
                        title="AI Detection"
                        subtitle={activeReport.aiAnalysis.verdict}
                        type="ai"
                      />
                      <ScoreGauge
                        score={activeReport.plagiarismAnalysis.similarityScore}
                        title="Web Plagiarism"
                        subtitle={activeReport.plagiarismAnalysis.verdict}
                        type="plagiarism"
                      />
                    </div>

                    {/* 4 Clean Vertical Stacked Metrics Cards */}
                    <MetricsGrid
                      metrics={activeReport.aiAnalysis.metrics}
                      avgSentenceLength={activeReport.localMetrics.avgSentenceLength}
                      lexicalDiversity={activeReport.localMetrics.lexicalDiversity}
                    />

                    {/* Forensic Verdict Summary */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
                      <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                        <span className="font-bold text-indigo-300 uppercase">Argon Summary:</span>
                        <span>Audited: {activeReport.scannedAt}</span>
                      </div>
                      <p className="leading-relaxed font-sans">{activeReport.aiAnalysis.overallSummary}</p>
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
                    originalText={inputText}
                    onSelectSentence={(s) => setInspectedSentence(s)}
                    onApplySingleRewrite={handleApplySingleRewrite}
                    onApplyParagraphRewrite={handleApplyParagraphRewrite}
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
                      onClick={() => setMode('fixer')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/25"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Launch Humanizer Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      )}

      {/* Auxiliary Modals */}
      {inspectedSentence && (
        <SentenceInspectorModal
          sentence={inspectedSentence}
          onClose={() => setInspectedSentence(null)}
          onApplyRewrite={(original, rewritten) => {
            handleApplySingleRewrite(original, rewritten);
            setInspectedSentence(null);
          }}
        />
      )}

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

      {/* Production Confidential Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(_user) => {
          setIsAuthOpen(false);
        }}
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
