/**
 * Enterprise Statistical Linguistics & N-Gram Shingle Fingerprinting Engine
 * VeritasAI Core Forensic Analysis
 */

export interface LinguisticMetrics {
  // Lexical & Structural Metrics
  totalWords: number;
  uniqueWords: number;
  totalSentences: number;
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  sentenceLengthStdDev: number;

  // AI Forensics
  burstinessCoefficient: number; // in range [-1, 1], normalized to [0, 100]
  coefficientOfVariation: number; // CV = stdDev / mean
  perplexityProxy: number; // 0-100 (lower means more predictable/synthetic)
  typeTokenRatio: number; // TTR = V / N (0-1)
  rootTypeTokenRatio: number; // Guiraud's R = V / sqrt(N)
  syntacticUniformityScore: number; // 0-100 (high = repetitive structure)
  
  // Plagiarism Shingling
  totalShingles: number;
  uniqueShingleRatio: number;
  fingerprintHash: string;
}

export interface ShingleMatch {
  shingleText: string;
  hash: string;
  occurrences: number;
  positions: number[];
}

// 32-bit FNV-1a Hash Algorithm for Shingles
function fnv1a32(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Extracts N-Gram Shingles from tokenized text
 */
export function extractShingles(text: string, shingleSize = 5): ShingleMatch[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length < shingleSize) {
    return [];
  }

  const shingleMap = new Map<string, { text: string; positions: number[] }>();

  for (let i = 0; i <= words.length - shingleSize; i++) {
    const shingleWords = words.slice(i, i + shingleSize);
    const shingleStr = shingleWords.join(' ');
    const hash = fnv1a32(shingleStr);

    const existing = shingleMap.get(hash);
    if (existing) {
      existing.positions.push(i);
    } else {
      shingleMap.set(hash, { text: shingleStr, positions: [i] });
    }
  }

  const results: ShingleMatch[] = [];
  for (const [hash, data] of shingleMap.entries()) {
    results.push({
      hash,
      shingleText: data.text,
      occurrences: data.positions.length,
      positions: data.positions
    });
  }

  return results;
}

/**
 * Calculates deep statistical linguistic metrics
 */
export function analyzeStatisticalLinguistics(text: string): LinguisticMetrics {
  const clean = text.trim();
  if (!clean) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      totalSentences: 0,
      avgSentenceLength: 0,
      sentenceLengthVariance: 0,
      sentenceLengthStdDev: 0,
      burstinessCoefficient: 50,
      coefficientOfVariation: 0.5,
      perplexityProxy: 50,
      typeTokenRatio: 0.5,
      rootTypeTokenRatio: 1.0,
      syntacticUniformityScore: 50,
      totalShingles: 0,
      uniqueShingleRatio: 1.0,
      fingerprintHash: '00000000'
    };
  }

  // Tokenize sentences
  const sentences = clean
    .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/)
    .map(s => s.trim())
    .filter(s => s.length > 4);

  const words = clean
    .toLowerCase()
    .match(/\b[a-z]{2,}\b/g) || [];

  const totalWords = words.length;
  const uniqueWordsSet = new Set(words);
  const uniqueWords = uniqueWordsSet.size;

  const sentenceWordCounts = sentences.map(s => (s.match(/\b\w+\b/g) || []).length);
  const totalSentences = Math.max(1, sentences.length);
  const avgSentenceLength = totalWords / totalSentences;

  // Standard deviation & variance
  const variance = sentenceWordCounts.reduce((acc, count) => acc + Math.pow(count - avgSentenceLength, 2), 0) / totalSentences;
  const stdDev = Math.sqrt(variance);

  // Burstiness Coefficient B = (stdDev - mean) / (stdDev + mean)
  const rawBurstiness = (stdDev - avgSentenceLength) / (stdDev + avgSentenceLength || 1);
  const normalizedBurstiness = Math.max(5, Math.min(98, Math.round((rawBurstiness + 0.6) * 75)));

  // Coefficient of Variation CV = stdDev / mean
  const cv = avgSentenceLength > 0 ? Number((stdDev / avgSentenceLength).toFixed(3)) : 0.5;

  // Type-Token Ratio (TTR) & Guiraud's Index
  const ttr = totalWords > 0 ? Number((uniqueWords / totalWords).toFixed(3)) : 0.5;
  const rootTTR = totalWords > 0 ? Number((uniqueWords / Math.sqrt(totalWords)).toFixed(2)) : 1.0;

  // Syntactic uniformity: low sentence length variance + high formulaic bigram predictability
  const uniformity = Math.max(5, Math.min(95, Math.round((1 - Math.min(1, cv)) * 80 + 10)));

  // Perplexity proxy (higher entropy in word choices = higher perplexity)
  const perplexity = Math.max(10, Math.min(95, Math.round(ttr * 60 + cv * 40)));

  // Shingling computation
  const shingles = extractShingles(clean, 5);
  const totalShingles = shingles.reduce((acc, s) => acc + s.occurrences, 0);
  const uniqueShingleRatio = totalShingles > 0 ? Number((shingles.length / totalShingles).toFixed(3)) : 1.0;
  const fingerprintHash = fnv1a32(clean.slice(0, 500));

  return {
    totalWords,
    uniqueWords,
    totalSentences,
    avgSentenceLength: Number(avgSentenceLength.toFixed(1)),
    sentenceLengthVariance: Number(variance.toFixed(1)),
    sentenceLengthStdDev: Number(stdDev.toFixed(2)),
    burstinessCoefficient: normalizedBurstiness,
    coefficientOfVariation: cv,
    perplexityProxy: perplexity,
    typeTokenRatio: ttr,
    rootTypeTokenRatio: rootTTR,
    syntacticUniformityScore: uniformity,
    totalShingles,
    uniqueShingleRatio,
    fingerprintHash
  };
}
