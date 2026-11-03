import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  FolderOpen,
  LoaderCircle,
  LogOut,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { AIDetectionResult, PlagiarismResult } from "./types";
import { readApiResponse } from "./utils/apiResponse";
type Account = { id: string; email: string };
type SavedDocument = { id: string; title: string; updated_at: string };
type Report = {
  ai?: AIDetectionResult;
  plagiarism?: PlagiarismResult;
  scannedAt: string;
  originalText: string;
};
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
    [mode, setMode] = useState<"ai" | "plagiarism">("ai");
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false);
  const [auth, setAuth] = useState<"login" | "register" | null>(null),
    [search, setSearch] = useState("");
  const input = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | null>(null);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
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
    if (user) refreshDocuments().catch((e) => setError(e.message));
    else setDocuments([]);
  }, [user?.id]);
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
    if (!user) {
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
    if (!user) {
      setAuth("login");
      return;
    }
    if (busy || text.trim().length < 20) return;
    setBusy("Analyzing");
    setError("");
    setNotice("");
    controller.current = new AbortController();
    const timer = setTimeout(() => controller.current?.abort(), 90000);
    try {
      const data = await api(
        `/detect/${mode}`,
        "POST",
        { text },
        controller.current.signal,
      );
      setReport((previous) => ({
        ...(previous?.originalText === text ? previous : {}),
        [mode]: data.analysis,
        scannedAt: new Date().toISOString(),
        originalText: text,
      }));
      setDirty(true);
      setNotice("Analysis complete. Save to keep this result.");
    } catch (e: any) {
      setError(
        e.name === "AbortError"
          ? "Analysis stopped. Your document is still here."
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
        if (!user)
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
          <section className="page-intro">
            <div>
              <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
              <h1>Make every word your own.</h1>
              <p>
                A calmer space to check your writing, explore sources, and move
                forward with confidence.
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
            <aside className="analysis-column">
              <section className="analysis-card">
                <div className="section-heading">
                  <Sparkles size={19} />
                  <h2>A fresh perspective</h2>
                </div>
                <p>Choose what you’d like to explore.</p>
                {(["ai", "plagiarism"] as const).map((m) => (
                  <button
                    key={m}
                    className={`check-option ${mode === m ? "chosen" : ""}`}
                    disabled={!!busy}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                  >
                    <span className="option-icon">
                      {m === "ai" ? (
                        <Sparkles size={19} />
                      ) : (
                        <Search size={19} />
                      )}
                    </span>
                    <span>
                      <strong>
                        {m === "ai" ? "AI writing signals" : "Web similarity"}
                      </strong>
                      <small>
                        {m === "ai"
                          ? "Patterns, rhythm & sentence variation"
                          : "Discover possible source matches"}
                      </small>
                    </span>
                    <span className="radio">{mode === m && <span />}</span>
                  </button>
                ))}
                <button
                  className="button analyze-button"
                  disabled={!!busy || text.trim().length < 20 || checking}
                  onClick={scan}
                >
                  {busy === "Analyzing" ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      {user ? "Analyze document" : "Sign in to analyze"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
                {busy === "Analyzing" && (
                  <button
                    className="cancel-button"
                    onClick={() => controller.current?.abort()}
                  >
                    Cancel analysis
                  </button>
                )}
                <div className="analysis-footnote">
                  <ShieldCheck size={14} />
                  <span>
                    Analysis sends your text to our server and, when configured,
                    Google Gemini.
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
                  Use these checks as a second pair of eyes. AI signals are
                  estimates, and a source match always deserves a closer look.
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
            {busy && busy !== "Analyzing" && (
              <span>
                <LoaderCircle size={16} className="spin" />
                {busy}…
              </span>
            )}
          </div>
          <section className="results-section">
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
                    Add at least 20 characters, choose a check, and explore
                    what’s behind your words.
                  </p>
                </div>
              </div>
            ) : (
              <div className="report-grid">
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
                    <span className="eyebrow">WEB SIMILARITY</span>
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
}: {
  mode: "login" | "register";
  onMode: (m: "login" | "register") => void;
  onClose: () => void;
  onSuccess: (u: Account) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSuccess((await api(`/auth/${mode}`, "POST", { email, password })).user);
    } catch (e: any) {
      setError(e.message);
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
        {mode === "login" ? "Welcome back." : "A space of your own."}
      </h2>
      <p>
        {mode === "login"
          ? "Sign in to your private writing workspace."
          : "Create an account to save documents and explore your writing."}
      </p>
      <form onSubmit={submit}>
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
          Use 12–128 characters. Your password is never stored in the browser.
        </small>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
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
        Legacy demo accounts are no longer accepted. New accounts do not yet
        include email ownership verification.
      </small>
    </dialog>
  );
}
