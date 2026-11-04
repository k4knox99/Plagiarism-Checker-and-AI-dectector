import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  LoaderCircle,
  LogOut,
  Plus,
  PenLine,
  ListChecks,
  AlignLeft,
  Files,
  BookOpen,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AIDetectionResult,
  PlagiarismResult,
  RewriteStyle,
  WritingRewriteResult,
  ProofreadResult,
  SummaryResult,
  ComparisonResult,
  CitationResult,
} from "./types";
import { readApiResponse } from "./utils/apiResponse";
import ExtendedToolResults from "./components/ExtendedToolResults";
type Account = { id: string; email: string; verified: boolean };
type SavedDocument = { id: string; title: string; updated_at: string };
type Report = {
  ai?: AIDetectionResult;
  plagiarism?: PlagiarismResult;
  rewrite?: WritingRewriteResult;
  proofread?: ProofreadResult;
  summarize?: SummaryResult;
  compare?: ComparisonResult;
  citations?: CitationResult;
  scannedAt: string;
  originalText: string;
};
type ToolMode = "ai" | "plagiarism" | "rewrite" | "proofread" | "summarize" | "compare" | "citations";
const writingTools = [
  {
    id: "ai",
    title: "AI detector",
    description: "Explore writing patterns and sentence signals.",
    action: "Check AI signals",
    icon: Sparkles,
  },
  {
    id: "plagiarism",
    title: "Plagiarism checker",
    description: "Search the web for possible source matches.",
    action: "Check for source matches",
    icon: Search,
  },
  {
    id: "rewrite",
    title: "Humanize & rewrite",
    description: "Get a clearer, more natural version of your draft.",
    action: "Rewrite my draft",
    icon: PenLine,
  },
  { id: "proofread", title: "Grammar & clarity", description: "Review corrections, explanations, and reading insights.", action: "Review my writing", icon: ListChecks },
  { id: "summarize", title: "Summarizer", description: "Turn your document into a summary, key points, and outline.", action: "Summarize my draft", icon: AlignLeft },
  { id: "compare", title: "Compare documents", description: "Find shared passages in two documents without an AI provider.", action: "Compare these documents", icon: Files },
  { id: "citations", title: "Citation builder", description: "Format the source details you provide in four citation styles.", action: "Build citations", icon: BookOpen },
] as const;
const rewriteStyles: { id: RewriteStyle; label: string; description: string }[] = [
  {
    id: "natural",
    label: "Natural",
    description: "Clear, conversational wording",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Polished and direct",
  },
  { id: "academic", label: "Academic", description: "Formal, precise language" },
  { id: "concise", label: "Concise", description: "Fewer words, same meaning" },
];
async function api(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  return readApiResponse(response);
}
const safeLink = (url: string) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
};
export default function App() {
  const [user, setUser] = useState<Account | null>(null),
    [checking, setChecking] = useState(true);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [id, setId] = useState<string>(() => crypto.randomUUID()),
    [title, setTitle] = useState("Untitled document"),
    [text, setText] = useState("");
  const [report, setReport] = useState<Report | null>(null),
    [mode, setMode] = useState<ToolMode>("ai");
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>("natural");
  const [audience, setAudience] = useState("general"),
    [rewriteLength, setRewriteLength] = useState("preserve"),
    [voiceSample, setVoiceSample] = useState(""),
    [preserveTerms, setPreserveTerms] = useState("");
  const [comparisonText, setComparisonText] = useState(""),
    [excludeQuotes, setExcludeQuotes] = useState(false),
    [excludeReferences, setExcludeReferences] = useState(false);
  const [citation, setCitation] = useState({ title: "", author: "", year: "", url: "", accessed: "" });
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false);
  const [auth, setAuth] = useState<"login" | "register" | null>(null),
    [search, setSearch] = useState("");
  const input = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | null>(null);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const activeTool = writingTools.find((tool) => tool.id === mode)!;
  async function refreshDocuments() {
    setDocuments((await api("/documents")).documents);
  }
  useEffect(() => {
    try {
      for (const key of [
        "veritas_saas_users",
        "veritas_current_user",
        "veritas_secure_session",
        "veritas_payment_submissions",
        "veritas_dbs_settings",
        "veritas_scan_history",
      ]) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    } catch {
      /* Storage can be blocked; server sessions still work. */
    }
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    if (user?.verified) refreshDocuments().catch((e) => setError(e.message));
    else setDocuments([]);
  }, [user?.id, user?.verified]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function reset(force = false) {
    if (
      !force &&
      dirty &&
      !window.confirm("Discard unsaved changes and start a new document?")
    )
      return;
    setId(crypto.randomUUID());
    setTitle("Untitled document");
    setText("");
    setComparisonText("");
    setVoiceSample("");
    setPreserveTerms("");
    setCitation({ title: "", author: "", year: "", url: "", accessed: "" });
    setReport(null);
    setDirty(false);
    setError("");
    setNotice("");
  }
  async function load(documentId: string) {
    if (
      dirty &&
      !window.confirm("Discard unsaved changes and open this document?")
    )
      return;
    setBusy("Loading");
    setError("");
    setNotice("");
    try {
      const { document: d } = await api(`/documents/${documentId}`);
      setId(d.id);
      setTitle(d.title);
      setText(d.content);
      setReport(d.report);
      setDirty(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function save() {
    if (!user?.verified) {
      setAuth("login");
      return;
    }
    setBusy("Saving");
    setError("");
    setNotice("");
    try {
      await api(`/documents/${id}`, "PUT", { title, content: text, report });
      setDirty(false);
      setNotice("Saved to your private library.");
      await refreshDocuments();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function remove(documentId: string) {
    if (!window.confirm("Permanently delete this saved document?")) return;
    setBusy("Deleting");
    setError("");
    try {
      await api(`/documents/${documentId}`, "DELETE", {});
      await refreshDocuments();
      if (documentId === id) reset(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function scan() {
    if (!user?.verified) {
      setAuth("login");
      return;
    }
    if (busy || (mode !== "citations" && text.trim().length < 20)) return;
    if (mode === "compare" && comparisonText.trim().length < 20) {
      setError("Add at least 20 characters to the comparison document.");
      return;
    }
    setBusy(mode === "rewrite" ? "Rewriting" : "Analyzing");
    setError("");
    setNotice("");
    controller.current = new AbortController();
    const timer = setTimeout(() => controller.current?.abort(), 90000);
    try {
      const data = await api(
        mode === "rewrite" ? "/fix/humanize" : ["ai", "plagiarism"].includes(mode) ? `/detect/${mode}` : `/tools/${mode}`,
        "POST",
        mode === "rewrite" ? { text, style: rewriteStyle, audience, length: rewriteLength, voiceSample, preserveTerms }
          : mode === "compare" ? { text, comparisonText, excludeQuotes, excludeReferences }
          : mode === "citations" ? { text, ...citation } : { text },
        controller.current.signal,
      );
      let result: AIDetectionResult | PlagiarismResult | WritingRewriteResult | ProofreadResult | SummaryResult | ComparisonResult | CitationResult;
      if (mode === "rewrite") {
        if (
          typeof data.rewrittenText !== "string" ||
          !data.rewrittenText.trim() ||
          data.rewrittenText.length > 15000
        )
          throw new Error("The rewrite could not be completed. Please try again.");
        result = {
          rewrittenText: data.rewrittenText,
          engine:
            typeof data.engine === "string" ? data.engine : "Writing rewrite",
          changes: Array.isArray(data.changes)
            ? data.changes
                .filter(
                  (change: unknown): change is string =>
                    typeof change === "string",
                )
                .slice(0, 12)
            : [],
          style: rewriteStyle,
          warnings: Array.isArray(data.warnings) ? data.warnings.filter((warning: unknown) => typeof warning === "string").slice(0, 12) : [],
        };
      } else {
        if (!data.analysis || typeof data.analysis !== "object") throw new Error("The tool returned an incomplete result. Please try again.");
        result = data.analysis;
      }
      setReport((previous) => ({
        ...(previous?.originalText === text ? previous : {}),
        [mode]: result,
        scannedAt: new Date().toISOString(),
        originalText: text,
      }));
      setDirty(true);
      setNotice(
        mode === "rewrite"
          ? "Your rewrite is ready. Review it below, then copy, download, or use it in your document."
          : "Analysis complete. Save to keep this result.",
      );
    } catch (e: any) {
      setError(
        e.name === "AbortError"
          ? "Request stopped. Your document is still here."
          : e.message,
      );
    } finally {
      clearTimeout(timer);
      controller.current = null;
      setBusy("");
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (!/\.(txt|md|docx|pdf)$/i.test(file.name) || file.size > 2_000_000) {
      setError("Choose a TXT, Markdown, DOCX, or PDF file under 2 MB.");
      return;
    }
    setBusy("Importing");
    setError("");
    try {
      let value: string;
      if (/\.pdf$/i.test(file.name)) {
        if (!user?.verified)
          throw new Error(
            "Sign in before importing a PDF. PDFs are processed by the server.",
          );
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        value = (
          await api("/parse/pdf", "POST", {
            fileBase64: btoa(binary),
            fileName: file.name,
          })
        ).text;
      } else if (/\.docx$/i.test(file.name)) {
        const mammoth = await import("mammoth");
        value = (
          await mammoth.extractRawText({
            arrayBuffer: await file.arrayBuffer(),
          })
        ).value;
      } else value = await file.text();
      if (!value.trim())
        throw new Error("No readable text found in this file.");
      if (value.length > 15000)
        throw new Error(
          "This document exceeds the 15,000-character limit. Import a shorter excerpt.",
        );
      if (
        dirty &&
        !window.confirm("Replace your unsaved document with this file?")
      )
        return;
      setId(crypto.randomUUID());
      setText(value);
      setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 120));
      setReport(null);
      setDirty(true);
      setNotice("Document imported. Review it before analyzing.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
      if (input.current) input.current.value = "";
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ title, content: text, report }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9_-]/gi, "_") || "document"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copyRewrite() {
    if (!report?.rewrite) return;
    setError("");
    try {
      await navigator.clipboard.writeText(report.rewrite.rewrittenText);
      setNotice("Rewritten text copied.");
    } catch {
      setError(
        "Copy is unavailable in this browser. Select the rewritten text or download it instead.",
      );
    }
  }
  function downloadRewrite() {
    if (!report?.rewrite) return;
    const url = URL.createObjectURL(
      new Blob([report.rewrite.rewrittenText], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9_-]/gi, "_") || "document"}_rewritten.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function applyRewrite() {
    if (!report?.rewrite) return;
    setText(report.rewrite.rewrittenText);
    setReport(null);
    setDirty(true);
    setError("");
    setNotice(
      "Rewrite applied to your document. Save to keep it, or run a fresh check.",
    );
    document.getElementById("editor")?.focus();
  }
  async function copyResult(value: string) {
    setError("");
    try { await navigator.clipboard.writeText(value); setNotice("Result copied."); }
    catch { setError("Copy is unavailable. Select and copy the result text instead."); }
  }
  function applyResult(value: string) {
    setText(value); setReport(null); setDirty(true); setError("");
    setNotice("Updated text applied. Save it or run a fresh check.");
    document.getElementById("editor")?.focus();
  }
  async function logout() {
    if (dirty && !window.confirm("Sign out and discard unsaved changes?"))
      return;
    setBusy("Signing out");
    try {
      await api("/auth/logout", "POST", {});
      setUser(null);
      reset(true);
      setNotice("Signed out.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#workspace">
          <span className="brand-mark">
            <ShieldCheck size={23} />
          </span>
          veritas<span className="brand-dot">.</span>
        </a>
        <div className="space-label">YOUR WORKSPACE</div>
        <button
          className="nav-item selected"
          onClick={() => document.getElementById("editor")?.focus()}
        >
          <FileText size={18} />
          Writing studio
          <ChevronRight size={15} />
        </button>
        <div className="library-heading">
          <span>DOCUMENT LIBRARY</span>
          <button
            className="icon-button"
            disabled={!!busy}
            onClick={() => reset()}
            aria-label="New document"
          >
            <Plus size={17} />
          </button>
        </div>
        <label className="library-search">
          <Search size={15} />
          <input
            aria-label="Search saved documents"
            placeholder="Find a document…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="document-list">
          {documents
            .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
            .map((d) => (
              <div
                key={d.id}
                className={`document-row ${d.id === id ? "active" : ""}`}
              >
                <button disabled={!!busy} onClick={() => load(d.id)}>
                  <FileText size={16} />
                  <span>
                    <strong>{d.title}</strong>
                    <small>
                      {new Date(d.updated_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </span>
                </button>
                <button
                  className="icon-button"
                  disabled={!!busy}
                  onClick={() => remove(d.id)}
                  aria-label={`Delete ${d.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          {!documents.length && (
            <div className="library-empty">
              <FolderOpen size={27} />
              <p>
                {user
                  ? "A place for your next great idea."
                  : "Your documents, in one place."}
              </p>
              <small>
                {user
                  ? "Save a document to find it here."
                  : "Sign in to save and reopen your work."}
              </small>
            </div>
          )}
        </div>
        <div className="privacy-card">
          <ShieldCheck size={20} />
          <strong>Made for thoughtful writing</strong>
          <p>
            Your saved documents belong to your account. Run an analysis when
            you’re ready to share text with the AI provider.
          </p>
        </div>
        <div className="account-row">
          <span className="avatar">
            {user ? user.email[0].toUpperCase() : "G"}
          </span>
          <div>
            <strong>{user ? user.email : "Guest workspace"}</strong>
            <small>
              {user ? "Private library" : "Explore before signing in"}
            </small>
          </div>
          {user && (
            <button
              className="icon-button"
              disabled={!!busy}
              onClick={logout}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>
      <div className="main-area" id="workspace">
        <header className="topbar">
          <span>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={14} />
            Writing studio
          </span>
          <div>
            <span className="desktop-label">
              <span className="status-dot" />
              Focus mode
            </span>
            {user && (
              <button
                className="button secondary small"
                disabled={!!busy}
                onClick={logout}
              >
                <LogOut size={15} />
                Sign out
              </button>
            )}
            {!user && (
              <button
                className="button small"
                disabled={checking}
                onClick={() => setAuth("login")}
              >
                {checking ? "Connecting…" : "Sign in"}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main>
          {user && !user.verified && (
            <div className="verification-banner" role="status">
              <ShieldCheck size={20} />
              <span>
                <strong>Verify your email</strong>Confirm your email to save
                documents and use analysis tools.
              </span>
              <button className="button small" onClick={() => setAuth("login")}>
                Enter confirmation code
              </button>
            </div>
          )}
          <section className="page-intro">
            <div>
              <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
              <h1>Make every word your own.</h1>
              <p>
                Check sources, improve clarity, and shape your draft in a voice
                that feels like you. Seven tools, one private workspace.
              </p>
            </div>
            <button
              className="button secondary"
              disabled={!!busy}
              onClick={() => reset()}
            >
              <Plus size={17} />
              New document
            </button>
          </section>
          <div className="tool-picker tool-suite" role="group" aria-label="Writing tools">
            {writingTools.map((tool) => (
              <button
                key={tool.id}
                className={`tool-tab ${mode === tool.id ? "active" : ""}`}
                disabled={!!busy}
                onClick={() => setMode(tool.id)}
                aria-pressed={mode === tool.id}
                aria-controls="tool-settings"
              >
                <tool.icon size={21} aria-hidden="true" />
                <span>
                  <strong>{tool.title}</strong>
                  <small>{tool.description}</small>
                </span>
                {mode === tool.id && <Check size={17} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="workspace-grid">
            <section className="editor-card" aria-label="Document editor">
              <div className="editor-heading">
                <div className="document-icon">
                  <FileText size={21} />
                </div>
                <div className="document-title">
                  <label className="sr-only" htmlFor="title">
                    Document title
                  </label>
                  <input
                    id="title"
                    maxLength={120}
                    disabled={!!busy}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setDirty(true);
                    }}
                  />
                  <span>
                    {dirty ? "Unsaved changes" : "Ready when you are"}
                  </span>
                </div>
                <button
                  className="icon-button"
                  disabled={!!busy || !text}
                  onClick={download}
                  aria-label="Export document and report"
                >
                  <ArrowDownToLine size={19} />
                </button>
              </div>
              <div className="editor-toolbar">
                <span>YOUR DOCUMENT</span>
                <button
                  disabled={!!busy}
                  onClick={() => input.current?.click()}
                >
                  <Upload size={15} />
                  Import file
                </button>
                <input
                  ref={input}
                  type="file"
                  accept=".txt,.md,.docx,.pdf"
                  className="sr-only"
                  onChange={(e) => importFile(e.target.files?.[0])}
                />
              </div>
              <label className="sr-only" htmlFor="editor">
                Document text
              </label>
              <textarea
                id="editor"
                disabled={!!busy}
                maxLength={15000}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setReport(null);
                  setDirty(true);
                  setNotice("");
                }}
                placeholder={
                  "Start with your words.\n\nPaste your draft here, or import a document. We’ll help you take a closer look."
                }
              />
              <div className="editor-footer">
                <span>
                  <strong>{words.toLocaleString()}</strong> words
                  <span className="divider">·</span>
                  {text.length.toLocaleString()} / 15,000 characters
                </span>
                <button
                  className="save-button"
                  disabled={!!busy || !title.trim()}
                  onClick={save}
                >
                  <Save size={15} />
                  {busy === "Saving" ? "Saving…" : "Save document"}
                </button>
              </div>
            </section>
            <aside className={`analysis-column ${["rewrite", "compare", "citations"].includes(mode) ? "has-tool-form" : ""}`}>
              <section
                className="analysis-card"
                id="tool-settings"
                aria-label={`${activeTool.title} settings`}
              >
                <div className="section-heading">
                  <activeTool.icon size={19} />
                  <h2>{activeTool.title}</h2>
                </div>
                <p>{activeTool.description}</p>
                {mode === "rewrite" && (
                  <>
                  <fieldset className="rewrite-styles" disabled={!!busy}>
                    <legend>Choose your tone</legend>
                    {rewriteStyles.map((style) => (
                      <label
                        key={style.id}
                        className={`rewrite-style ${rewriteStyle === style.id ? "chosen" : ""}`}
                      >
                        <input
                          type="radio"
                          name="rewrite-style"
                          value={style.id}
                          checked={rewriteStyle === style.id}
                          onChange={() => setRewriteStyle(style.id)}
                        />
                        <span>
                          <strong>{style.label}</strong>
                          <small>{style.description}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <details className="advanced-writing">
                    <summary>Voice & writing preferences</summary>
                    <fieldset disabled={!!busy} className="tool-form">
                      <label>Audience<select value={audience} onChange={(e) => setAudience(e.target.value)}><option value="general">General readers</option><option value="academic">Academic readers</option><option value="business">Business readers</option></select></label>
                      <label>Length<select value={rewriteLength} onChange={(e) => setRewriteLength(e.target.value)}><option value="preserve">Keep a similar length</option><option value="shorter">Make it shorter</option><option value="expanded">Develop the explanation</option></select></label>
                      <label>A sample of your voice <span>(optional)</span><textarea value={voiceSample} maxLength={1500} onChange={(e) => setVoiceSample(e.target.value)} placeholder="Paste a short example of your own writing." rows={4} /></label>
                      <label>Terms to preserve <span>(optional)</span><textarea value={preserveTerms} maxLength={500} onChange={(e) => setPreserveTerms(e.target.value)} placeholder="Names, technical terms, or phrases to keep." rows={2} /></label>
                      <p className="field-help">Names, facts, citations, and the document language should be preserved. Review the revision before using it.</p>
                    </fieldset>
                  </details>
                  </>
                )}
                {(mode === "ai" || mode === "plagiarism") && (
                  <div className="tool-explainer">
                    <strong>
                      {mode === "ai"
                        ? "A second perspective on your writing"
                        : "Web similarity & attribution review"}
                    </strong>
                    <p>
                      {mode === "ai"
                        ? "Review sentence patterns, repetition, and variation. Signals are estimates and cannot prove who wrote a text."
                        : "Find possible source matches and open the linked pages to review them. Web search does not cover every publication or private database."}
                    </p>
                  </div>
                )}
                {mode === "proofread" && <div className="tool-explainer"><strong>Corrections you can understand</strong><p>Review grammar, punctuation, clarity, and style suggestions with a reason for each edit. Reading insights help you find dense passages.</p></div>}
                {mode === "summarize" && <div className="tool-explainer"><strong>Find the thread in your draft</strong><p>Get a concise summary, key points, and an outline using only the information in your document.</p></div>}
                {mode === "compare" && <fieldset className="tool-form" disabled={!!busy}>
                  <label>Comparison document<textarea value={comparisonText} onChange={(e) => setComparisonText(e.target.value)} maxLength={15000} rows={8} placeholder="Paste the second document. Minimum 20 characters." /></label>
                  <span className="field-help">{comparisonText.length.toLocaleString()} / 15,000 characters</span>
                  <label className="inline-check"><input type="checkbox" checked={excludeQuotes} onChange={(e) => setExcludeQuotes(e.target.checked)} />Exclude quoted text</label>
                  <label className="inline-check"><input type="checkbox" checked={excludeReferences} onChange={(e) => setExcludeReferences(e.target.checked)} />Exclude reference sections</label>
                  <p className="field-help">Compares these two documents on our server. No AI provider or web search is used.</p>
                </fieldset>}
                {mode === "citations" && <fieldset className="tool-form" disabled={!!busy}>
                  <label>Source title<input value={citation.title} maxLength={300} onChange={(e) => setCitation({ ...citation, title: e.target.value })} placeholder="Article or page title" /></label>
                  <label>Author <span>(optional)</span><input value={citation.author} maxLength={200} onChange={(e) => setCitation({ ...citation, author: e.target.value })} placeholder="Name or organization" /></label>
                  <label>Year <span>(optional)</span><input value={citation.year} maxLength={4} inputMode="numeric" onChange={(e) => setCitation({ ...citation, year: e.target.value })} placeholder="2026" /></label>
                  <label>Source URL <span>(optional)</span><input type="url" value={citation.url} maxLength={2000} onChange={(e) => setCitation({ ...citation, url: e.target.value })} placeholder="https://example.com/article" /></label>
                  <label>Access date <span>(optional)</span><input type="date" value={citation.accessed} onChange={(e) => setCitation({ ...citation, accessed: e.target.value })} /></label>
                  <p className="field-help">Uses the details you enter. Missing authors and dates are not invented. Verify formatting against your institution's requirements.</p>
                </fieldset>}
                <button
                  className="button analyze-button"
                  disabled={!!busy || checking || (mode === "citations" ? !citation.title.trim() : text.trim().length < 20) || (mode === "compare" && comparisonText.trim().length < 20)}
                  onClick={scan}
                >
                  {busy === "Analyzing" || busy === "Rewriting" ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      {busy}…
                    </>
                  ) : (
                    <>
                      {user?.verified
                        ? activeTool.action
                        : user
                          ? "Verify email to continue"
                          : "Sign in to continue"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
                {(busy === "Analyzing" || busy === "Rewriting") && (
                  <button
                    className="cancel-button"
                    onClick={() => controller.current?.abort()}
                  >
                    Cancel request
                  </button>
                )}
                <div className="analysis-footnote">
                  <ShieldCheck size={14} />
                  <span>
                    {mode === "compare" || mode === "citations" ? "This tool runs on our server without an AI provider. Save the result to keep it in your account." : "This tool sends your text to our server and its configured AI provider. Review the result before using it."}
                  </span>
                </div>
              </section>
              <section className="tip-card">
                <span className="tip-symbol">“</span>
                <div className="eyebrow">KEEP YOUR VOICE</div>
                <h3>
                  Good writing starts
                  <br />
                  with your perspective.
                </h3>
                <p>
                  Rewrites help with clarity and flow. Check facts, keep your
                  citations, and make the final wording your own.
                </p>
                <span className="tip-rule" />
              </section>
            </aside>
          </div>
          <div aria-live="polite" className="feedback">
            {error && (
              <div role="alert" className="error-message">
                {error}
                <button
                  className="icon-button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {notice && (
              <div className="success-message">
                <Check size={16} />
                {notice}
              </div>
            )}
            {busy && busy !== "Analyzing" && busy !== "Rewriting" && (
              <span>
                <LoaderCircle size={16} className="spin" />
                {busy}…
              </span>
            )}
          </div>
          <section
            className="results-section"
            id="tool-results"
            aria-label="Tool results"
          >
            <div className="results-heading">
              <div>
                <div className="eyebrow">THE BIGGER PICTURE</div>
                <h2>Your writing, a little clearer.</h2>
              </div>
              <span className="results-badge">
                {report ? "Review your findings" : "Results appear here"}
              </span>
            </div>
            {!report ? (
              <div className="results-empty">
                <span>
                  <FileText size={25} />
                </span>
                <div>
                  <h3>Room for your next discovery</h3>
                  <p>
                    Choose a tool above. Add your draft to check or improve it,
                    or enter source details to build a citation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="report-grid">
                <ExtendedToolResults report={report} busy={!!busy} copy={copyResult} apply={applyResult} save={save} canSave={!!title.trim()} />
                {report.rewrite && (
                  <article className="result-card rewrite-result">
                    <div className="rewrite-result-heading">
                      <div>
                        <span className="eyebrow">
                          HUMANIZE & REWRITE · {(report.rewrite.style || "natural").toUpperCase()}
                        </span>
                        <h3>Your rewritten draft</h3>
                      </div>
                      <span className="rewrite-engine">
                        {report.rewrite.engine}
                      </span>
                    </div>
                    <div className="rewrite-comparison">
                      <div>
                        <h4>Original</h4>
                        <p className="rewrite-text original-text" tabIndex={0} aria-label="Original draft">
                          {report.originalText}
                        </p>
                      </div>
                      <div>
                        <h4>Rewritten</h4>
                        <p className="rewrite-text" tabIndex={0} aria-label="Rewritten draft">
                          {report.rewrite.rewrittenText}
                        </p>
                      </div>
                    </div>
                    {!!report.rewrite.changes?.length && (
                      <div className="rewrite-notes">
                        <h4>What changed</h4>
                        <ul>
                          {report.rewrite.changes.map((change, index) => (
                            <li key={index}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!!report.rewrite.warnings?.length && <div className="rewrite-notes verification-notes"><h4>Review before using</h4><ul>{report.rewrite.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
                    <div className="rewrite-actions">
                      <button className="button" onClick={applyRewrite} disabled={!!busy}>
                        <Check size={16} />Use in editor
                      </button>
                      <button className="button secondary" onClick={copyRewrite} disabled={!!busy}>
                        <Copy size={16} />Copy text
                      </button>
                      <button className="button secondary" onClick={downloadRewrite} disabled={!!busy}>
                        <ArrowDownToLine size={16} />Download TXT
                      </button>
                      <button className="button secondary" onClick={save} disabled={!!busy || !title.trim()}>
                        <Save size={16} />Save result
                      </button>
                    </div>
                    <small className="result-caution">
                      Review meaning, facts, and citations before using this
                      draft. A rewrite does not guarantee a particular detector
                      score or originality.
                    </small>
                  </article>
                )}
                {report.ai && (
                  <article className="result-card">
                    <span className="eyebrow">
                      AI WRITING SIGNALS · ESTIMATE
                    </span>
                    <div className="score">
                      {Math.max(
                        0,
                        Math.min(100, Number(report.ai.overallAiScore) || 0),
                      )}
                      <small>/ 100</small>
                    </div>
                    <h3>{report.ai.verdict}</h3>
                    <small>
                      {report.ai.engine || "AI writing signal estimate"}
                    </small>
                    <p>{report.ai.overallSummary}</p>
                    <small className="result-caution">
                      This is a pattern-based estimate, not proof of authorship.
                      Never use it alone for academic or employment decisions.
                    </small>
                    <details>
                      <summary>Explore sentence signals</summary>
                      {(report.ai.sentenceAnalysis || [])
                        .slice(0, 100)
                        .map((s, i) => (
                          <div className="sentence-result" key={i}>
                            <span>{s.aiProbability}% signal</span>
                            <p>{s.sentence}</p>
                            <small>{s.reasons?.join(" · ")}</small>
                          </div>
                        ))}
                    </details>
                  </article>
                )}
                {report.plagiarism && (
                  <article className="result-card">
                    <span className="eyebrow">PLAGIARISM CHECK · WEB SIMILARITY</span>
                    <h3>
                      {report.plagiarism.verdict === "Not checked"
                        ? "Search unavailable"
                        : "Possible source matches"}
                    </h3>
                    <p>{report.plagiarism.summary}</p>
                    <small className="result-caution">
                      Similarity is not a plagiarism verdict. Verify each source
                      and its attribution. No matches do not establish
                      originality.
                    </small>
                    {(report.plagiarism.matchedSources || [])
                      .slice(0, 30)
                      .map((s, i) => (
                        <div className="source-result" key={i}>
                          {safeLink(s.url) ? (
                            <a
                              target="_blank"
                              rel="noopener noreferrer"
                              href={safeLink(s.url)}
                            >
                              {s.title}
                              <ArrowRight size={14} />
                            </a>
                          ) : (
                            <strong>{s.title}</strong>
                          )}
                          <p>{s.matchedExcerpt}</p>
                        </div>
                      ))}
                  </article>
                )}
              </div>
            )}
          </section>
          <footer className="page-footer">
            <span>
              veritas. <span>Clarity for the words that matter.</span>
            </span>
            <span>
              <ShieldCheck size={13} />
              Account-protected storage
            </span>
          </footer>
        </main>
      </div>
      {auth && (
        <AuthDialog
          initialAccount={user && !user.verified ? user : null}
          onPending={setUser}
          mode={auth}
          onMode={setAuth}
          onClose={() => setAuth(null)}
          onSuccess={(account) => {
            setUser(account);
            setAuth(null);
          }}
        />
      )}
    </div>
  );
}
function AuthDialog({
  mode,
  onMode,
  onClose,
  onSuccess,
  onPending,
  initialAccount,
}: {
  mode: "login" | "register";
  onMode: (m: "login" | "register") => void;
  onClose: () => void;
  onSuccess: (u: Account) => void;
  onPending: (u: Account) => void;
  initialAccount: Account | null;
}) {
  const [email, setEmail] = useState(initialAccount?.email || ""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [verifying, setVerifying] = useState(Boolean(initialAccount)),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [cooldown, setCooldown] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  function accept(data: any) {
    if (
      typeof data.user?.id !== "string" ||
      typeof data.user?.email !== "string" ||
      typeof data.user?.verified !== "boolean"
    )
      throw new Error(
        "The account server sent an incomplete response. Please reload and try again.",
      );
    if (!data.user.verified) {
      setVerifying(true);
      setEmail(data.user.email);
      setPassword("");
      setCooldown(60);
      onPending(data.user);
      if (data.verificationSent)
        setMessage(
          "Your confirmation email was accepted for delivery. Check your inbox; it may take a few minutes to arrive.",
        );
      else setError(data.message || "Request a confirmation code to continue.");
    } else onSuccess(data.user);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      accept(
        await api(
          verifying ? "/auth/verify-email" : `/auth/${mode}`,
          "POST",
          verifying ? { code } : { email, password },
        ),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/auth/resend-verification", "POST", {});
      setMessage("A new confirmation email was accepted for delivery. Use the latest code when it arrives.");
      setCooldown(60);
    } catch (e: any) {
      setError(e.message);
      setCooldown(60);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="auth-dialog"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="auth-heading"
    >
      <button
        className="icon-button close-dialog"
        disabled={busy}
        onClick={onClose}
        aria-label="Close sign in"
      >
        <X size={21} />
      </button>
      <span className="brand-mark">
        <ShieldCheck size={25} />
      </span>
      <h2 id="auth-heading">
        {verifying
          ? "Confirm your email."
          : mode === "login"
            ? "Welcome back."
            : "A space of your own."}
      </h2>
      <p>
        {verifying
          ? `Enter the latest 6-digit code for ${email}, or request a new code below.`
          : mode === "login"
            ? "Sign in to your private writing workspace."
            : "Create an account, then confirm your email to unlock your private workspace."}
      </p>
      <form onSubmit={submit}>
        {verifying ? (
          <label>
            Confirmation code
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              minLength={6}
              maxLength={6}
              className="otp-input"
              disabled={busy}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        ) : (
          <>
            <label>
              Email address
              <input
                autoFocus
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                disabled={busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <small>
              Use 12–128 characters. Your password is never stored in the
              browser.
            </small>
          </>
        )}
        {message && (
          <p className="auth-feedback" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Please wait…"
            : verifying
              ? "Verify email"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
      {verifying ? (
        <>
          <button
            className="switch-auth"
            disabled={busy || cooldown > 0}
            onClick={resend}
          >
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Send a new confirmation code"}
          </button>
          <small className="auth-note">
            Codes expire and can be used only once. Existing accounts also need
            to verify their email before using tools. Your saved documents stay
            with your account.
          </small>
        </>
      ) : (
        <>
          <button
            className="switch-auth"
            disabled={busy}
            onClick={() => {
              onMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
          <small className="auth-note">
            Email confirmation is required for all accounts. One account per
            email address.
          </small>
        </>
      )}
    </dialog>
  );
}
