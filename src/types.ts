export interface MetricData {
  perplexityScore: number;
  burstinessScore: number;
  repetitionScore: number;
  syntacticUniformity: number;
  clicheCount: number;
}

export interface ClicheItem {
  wordOrPhrase: string;
  count: number;
  reason: string;
  alternative: string;
}

export interface SentenceAnalysis {
  sentence: string;
  aiProbability: number;
  category: "human" | "mixed" | "ai";
  reasons: string[];
  suggestedRewrite: string;
}

export interface AIDetectionResult {
  engine?: string;
  overallAiScore: number;
  verdict: string;
  confidence: "High" | "Medium" | "Low";
  metrics: MetricData;
  overallSummary: string;
  flaggedCliches: ClicheItem[];
  sentenceAnalysis: SentenceAnalysis[];
}

export interface CitationFormat {
  apa?: string;
  mla?: string;
  chicago?: string;
  harvard?: string;
  bibtex?: string;
}

export interface MatchedSource {
  title: string;
  url: string;
  domain?: string;
  matchPercentage: number;
  matchedExcerpt?: string;
  studentExcerpt?: string;
  citationFormatted?: CitationFormat;
  id?: string;
  similarityPercentage?: number;
  matchedWordCount?: number;
  publishDate?: string;
}

export interface FlaggedPassage {
  passage: string;
  similarity: number;
  matchedSourceTitle?: string;
  matchedSourceUrl?: string;
  recommendation?: string;
  similarityPercentage?: number;
  charStart?: number;
  charEnd?: number;
}

export interface PlagiarismResult {
  similarityScore: number;
  verdict: string;
  summary: string;
  matchedSources: MatchedSource[];
  flaggedPassages: FlaggedPassage[];
  liveWebSources?: Array<{ title: string; url: string }>;
}

export type RewriteStyle = "natural" | "professional" | "academic" | "concise";

export interface WritingRewriteResult {
  rewrittenText: string;
  engine: string;
  changes?: string[];
  style: RewriteStyle;
  warnings?: string[];
}

export interface ProofreadResult {
  correctedText: string;
  summary: string;
  issues: { original: string; suggestion: string; category: string; explanation: string }[];
  engine: string;
  insights: { words: number; sentences: number; paragraphs: number; readingMinutes: number; averageSentenceWords: number; longSentences: number; readingEase: number | null; readingLabel: string };
}
export interface SummaryResult { summary: string; keyPoints: string[]; outline: string[]; engine: string; scope?: string }
export interface ComparisonResult {
  similarityScore: number; matchedWords: number; totalWords: number;
  matches: { text: string; sourceText: string; start: number; end: number; sourceStart: number; sourceEnd: number }[];
  engine: string; scope: string;
}
export interface CitationResult { apa: string; mla: string; chicago: string; bibtex: string; notes: string[]; engine: string }

export interface ComprehensiveReport {
  compositeAuthenticity: number;
  aiAnalysis: AIDetectionResult;
  plagiarismAnalysis: PlagiarismResult;
  localMetrics: {
    sentenceCount: number;
    wordCount: number;
    avgSentenceLength: number;
    burstinessScore: number;
    lexicalDiversity: number;
  };
  scannedAt: string;
  originalText: string;
}

export interface HumanizeChange {
  originalSnippet: string;
  rewrittenSnippet: string;
  reason: string;
}

export interface HumanizeResult {
  rewrittenText: string;
  summaryOfImprovements?: string;
  predictedAiScore?: number;
  predictedSimilarityScore?: number;
  changes?: HumanizeChange[];
  beforeAiScore?: number;
  afterAiScore?: number;
  burstinessDelta?: number;
  clichesRemoved?: number;
  perplexityGain?: number;
  improvements?: string[];
}

export type ScannerMode =
  | "comprehensive"
  | "ai"
  | "plagiarism"
  | "fixer"
  | "surgeon";
export type FixerStyle =
  | "academic"
  | "conversational"
  | "professional"
  | "creative"
  | "stealth";

// SaaS Subscription & Auth Types
export type SubscriptionPlanId =
  | "trial"
  | "3_months"
  | "6_months"
  | "1_year"
  | "lifetime"
  | "expired";
export type UserAccountStatus = "active" | "pending_payment" | "blocked";
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlanId;
  status: UserAccountStatus;
  registeredAt: string;
  subscriptionExpiresAt: string;
  pendingPaymentPlan?: SubscriptionPlanId;
}

export interface DBSBankSettings {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  payNowNumber: string;
  qrCodeUrl: string;
  prices: {
    "3_months": number;
    "6_months": number;
    "1_year": number;
  };
  instructions: string;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  userEmail: string;
  planId: "3_months" | "6_months" | "1_year";
  planName: string;
  amountSGD: number;
  transactionRef: string;
  receiptImageUrl: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedAt?: string;
}
