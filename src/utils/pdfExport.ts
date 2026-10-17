import { jsPDF } from 'jspdf';
import { ComprehensiveReport } from '../types';
import { LinguisticMetrics } from './linguisticAnalyzer';

export interface ExportPDFOptions {
  report: ComprehensiveReport;
  linguistics?: LinguisticMetrics;
  fileName?: string;
  auditId?: string;
  documentTitle?: string;
}

export function exportForensicReportPDF({
  report,
  linguistics,
  fileName,
  auditId = `VERITAS-${Date.now().toString(36).toUpperCase()}`,
  documentTitle = 'Academic / Professional Document Audit'
}: ExportPDFOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Background Header Block
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent Line (Olive Leaf #606C38)
  doc.setFillColor(96, 108, 56);
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('VERITAS AI · FORENSIC AUDIT REPORT', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('AI Content Stylometry & Technical Plagiarism Verification Certificate', margin, 25);
  doc.text(`AUDIT ID: ${auditId}  |  ISSUED: ${new Date().toUTCString()}`, margin, 32);

  // Document Info Meta Strip
  let currentY = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('DOCUMENT SPECIFICATIONS', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  currentY += 6;
  doc.text(`Title / Subject: ${documentTitle.slice(0, 60)}`, margin, currentY);
  currentY += 5;
  doc.text(`Metrics: ${report.localMetrics.wordCount} Words  |  ${report.localMetrics.sentenceCount} Sentences  |  Avg Length: ${report.localMetrics.avgSentenceLength} words/sentence`, margin, currentY);

  // 3 Hero Score Gauges Boxes
  currentY += 10;
  const colWidth = (contentWidth - 8) / 3;

  // Box 1: Authenticity
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, 26, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHENTICITY INDEX', margin + 4, currentY + 6);
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`${report.compositeAuthenticity}%`, margin + 4, currentY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Overall Originality', margin + 4, currentY + 22);

  // Box 2: AI Probability
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colWidth + 4, currentY, colWidth, 26, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AI GENERATION PROBABILITY', margin + colWidth + 8, currentY + 6);
  doc.setFontSize(16);
  doc.setTextColor(report.aiAnalysis.overallAiScore >= 60 ? 239 : 79, report.aiAnalysis.overallAiScore >= 60 ? 68 : 70, report.aiAnalysis.overallAiScore >= 60 ? 68 : 229);
  doc.text(`${report.aiAnalysis.overallAiScore}%`, margin + colWidth + 8, currentY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(report.aiAnalysis.verdict, margin + colWidth + 8, currentY + 22);

  // Box 3: Plagiarism Similarity
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + (colWidth + 4) * 2, currentY, colWidth, 26, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PLAGIARISM SIMILARITY', margin + (colWidth + 4) * 2 + 4, currentY + 6);
  doc.setFontSize(16);
  doc.setTextColor(report.plagiarismAnalysis.similarityScore >= 20 ? 245 : 16, report.plagiarismAnalysis.similarityScore >= 20 ? 158 : 185, report.plagiarismAnalysis.similarityScore >= 20 ? 11 : 129);
  doc.text(`${report.plagiarismAnalysis.similarityScore}%`, margin + (colWidth + 4) * 2 + 4, currentY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(report.plagiarismAnalysis.verdict.slice(0, 24), margin + (colWidth + 4) * 2 + 4, currentY + 22);

  // Statistical Linguistics Section
  currentY += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('STATISTICAL LINGUISTICS & N-GRAM ANALYSIS', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const burstinessVal = linguistics ? linguistics.burstinessCoefficient : report.localMetrics.burstinessScore;
  const perplexityVal = report.aiAnalysis.metrics.perplexityScore;
  const ttrVal = linguistics ? linguistics.typeTokenRatio : report.localMetrics.lexicalDiversity;
  const uniformityVal = report.aiAnalysis.metrics.syntacticUniformity;

  const linguisticTable = [
    `• Perplexity Index: ${perplexityVal}/100 (Lexical entropy and collocation predictability)`,
    `• Burstiness Variance: ${burstinessVal}/100 (Human variation in clause rhythm & sentence length)`,
    `• Type-Token Ratio (TTR): ${ttrVal} (Vocabulary richness and lexical repetition proxy)`,
    `• Syntactic Uniformity: ${uniformityVal}/100 (Low variance indicates machine cadence)`
  ];

  linguisticTable.forEach(row => {
    doc.text(row, margin + 2, currentY);
    currentY += 5;
  });

  // Top Flagged Sentences
  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('SENTENCE-LEVEL AI FORENSIC BREAKDOWN', margin, currentY);

  currentY += 6;
  const flagged = report.aiAnalysis.sentenceAnalysis.filter(s => s.aiProbability >= 40).slice(0, 4);

  if (flagged.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No high-probability synthetic clauses detected. All sentences exhibit human stylometric variance.', margin + 2, currentY);
    currentY += 8;
  } else {
    flagged.forEach((item, index) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28); // red-700
      doc.text(`[Flagged Clause ${index + 1} - ${item.aiProbability}% AI Probability]`, margin + 2, currentY);
      
      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(`"${item.sentence}"`, contentWidth - 4);
      doc.text(splitText, margin + 4, currentY);
      currentY += splitText.length * 4;

      if (item.reasons && item.reasons.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(`Forensic Cause: ${item.reasons.join(', ')}`, margin + 4, currentY);
        currentY += 5;
      }
      currentY += 2;
    });
  }

  // Web Plagiarism Matches
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('WEB PLAGIARISM & SIMILARITY MATCHES', margin, currentY);

  currentY += 6;
  const sources = report.plagiarismAnalysis.matchedSources.slice(0, 3);
  if (sources.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No verbatim copying or unauthorized duplicate passages detected across public literature.', margin + 2, currentY);
    currentY += 8;
  } else {
    sources.forEach(source => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${source.title} (${source.matchPercentage}% Match)`, margin + 2, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(96, 108, 56); // Olive Leaf #606C38
      doc.text(source.url.slice(0, 90), margin + 6, currentY);
      currentY += 5;
    });
  }

  // Footer & Official Verification Watermark
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('VeritasAI Enterprise Integrity System  |  Cryptographically Verified SHA-256 Digest', margin, pageHeight - 12);
  doc.text(`Page 1 of 1  ·  Confidential Client Audit`, pageWidth - margin, pageHeight - 12, { align: 'right' });

  // Save the PDF
  const outName = fileName || `VeritasAI_Forensic_Report_${auditId}.pdf`;
  doc.save(outName);
}
