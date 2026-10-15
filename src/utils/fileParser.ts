import mammoth from 'mammoth';
import { safeApiFetch } from './safeApiFetch';

export interface DocumentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'bullet' | 'quote';
  text: string;
  level?: number;
  originalIndex: number;
}

export interface ParsedDocumentResult {
  fileName: string;
  rawText: string;
  blocks: DocumentBlock[];
  format: 'docx' | 'pdf' | 'text';
  numPages?: number;
}

/**
 * Extracts plain text cleanly from uploaded files (.docx, .pdf, .txt, .md, .rtf)
 */
export async function parseUploadedDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. PDF Document
  if (fileName.endsWith('.pdf')) {
    try {
      const pdfText = await parsePdfFile(file);
      if (pdfText && pdfText.trim().length > 0) {
        return cleanDocumentText(pdfText);
      }
    } catch (pdfErr) {
      console.warn('PDF parsing server route failed, trying client stream fallback:', pdfErr);
      const fallbackText = await extractTextFromPdfClientSide(file);
      if (fallbackText && fallbackText.trim().length > 0) {
        return cleanDocumentText(fallbackText);
      }
    }
  }

  // 2. DOCX Microsoft Word Document
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return cleanDocumentText(result.value);
      }
    } catch (docxErr) {
      console.warn('Mammoth extraction failed, trying raw XML fallback:', docxErr);
    }
  }

  // 3. Plain Text / Markdown / RTF / Fallback
  try {
    const rawContent = await file.text();
    // Check if user uploaded a docx that was incorrectly read as text (starts with PK\x03\x04)
    if (rawContent.startsWith('PK\x03\x04') || rawContent.includes('[Content_Types].xml')) {
      return extractTextFromRawDocxString(rawContent);
    }
    // Check if it's a PDF read as text
    if (rawContent.startsWith('%PDF-')) {
      return extractTextFromPdfString(rawContent);
    }
    return cleanDocumentText(rawContent);
  } catch (textErr) {
    console.error('Error reading file as text:', textErr);
    throw new Error('Failed to read file. Please ensure it is a valid .docx, .pdf, .txt, or .md file.');
  }
}

/**
 * Parses uploaded document into structured blocks with format awareness
 */
export async function parseStructuredDocument(file: File): Promise<ParsedDocumentResult> {
  const fileName = file.name;
  const rawText = await parseUploadedDocument(file);
  const blocks: DocumentBlock[] = [];

  const rawParagraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  rawParagraphs.forEach((para, idx) => {
    const trimmed = para.trim();
    // Check if it's a heading
    if (/^(Chapter\s+\d+|Section\s+\d+|Abstract|Introduction|Conclusion|References|Methodology|Results|Discussion)\b/i.test(trimmed) || (trimmed.length < 60 && !trimmed.endsWith('.'))) {
      blocks.push({
        id: `block-${idx}`,
        type: 'heading',
        text: trimmed,
        level: trimmed.length < 35 ? 1 : 2,
        originalIndex: idx
      });
    } else if (/^[•\-\*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      blocks.push({
        id: `block-${idx}`,
        type: 'bullet',
        text: trimmed,
        originalIndex: idx
      });
    } else {
      blocks.push({
        id: `block-${idx}`,
        type: 'paragraph',
        text: trimmed,
        originalIndex: idx
      });
    }
  });

  const format = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'text';

  return {
    fileName,
    rawText,
    blocks,
    format
  };
}

/**
 * Sends PDF file to server-side parser
 */
async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = bufferToBase64(arrayBuffer);

  const { data, error } = await safeApiFetch('/api/parse/pdf', {
    method: 'POST',
    body: JSON.stringify({
      fileBase64: base64,
      fileName: file.name
    })
  });

  if (error || !data || !data.success) {
    throw new Error(error || 'Failed to parse PDF via API');
  }

  return data.text || '';
}

/**
 * Client-side fallback text extractor for PDF
 */
async function extractTextFromPdfClientSide(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = Math.min(bytes.byteLength, 1500000); // 1.5MB max for client fallback
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return extractTextFromPdfString(binary);
}

/**
 * Extracts visible strings from PDF binary stream
 */
function extractTextFromPdfString(raw: string): string {
  const matches: string[] = [];
  // Match text inside BT ... ET blocks
  const btRegex = /BT[\s\S]*?ET/g;
  let btMatch;
  while ((btMatch = btRegex.exec(raw)) !== null) {
    const block = btMatch[0];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let tj;
    while ((tj = tjRegex.exec(block)) !== null) {
      if (tj[1] && tj[1].length > 1) {
        matches.push(cleanPdfString(tj[1]));
      }
    }
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tja;
    while ((tja = tjArrayRegex.exec(block)) !== null) {
      const parts = tja[1].match(/\(([^)]+)\)/g);
      if (parts) {
        matches.push(parts.map(p => cleanPdfString(p.slice(1, -1))).join(''));
      }
    }
  }

  if (matches.length > 5) {
    return cleanDocumentText(matches.join(' '));
  }

  return cleanDocumentText(raw.replace(/[^\x20-\x7E\n]/g, ' '));
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fallback parser if raw docx binary string was passed
 * Extracts text from <w:t> tags in word/document.xml
 */
export function extractTextFromRawDocxString(rawString: string): string {
  const textMatches: string[] = [];
  const regex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  let match;

  while ((match = regex.exec(rawString)) !== null) {
    if (match[1]) {
      const decoded = decodeXmlEntities(match[1]);
      textMatches.push(decoded);
    }
  }

  if (textMatches.length > 0) {
    return cleanDocumentText(textMatches.join(' '));
  }

  return cleanDocumentText(rawString);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function cleanDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
