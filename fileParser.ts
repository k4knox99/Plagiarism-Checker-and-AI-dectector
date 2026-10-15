import mammoth from 'mammoth';

/**
 * Extracts plain text cleanly from uploaded files (.docx, .txt, .md, .rtf)
 */
export async function parseUploadedDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. DOCX Microsoft Word Document
  if (fileName.endsWith('.docx')) {
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

  // 2. Plain Text / Markdown / RTF
  try {
    const rawContent = await file.text();
    // Check if user uploaded a docx that was incorrectly read as text (starts with PK\x03\x04)
    if (rawContent.startsWith('PK\x03\x04') || rawContent.includes('[Content_Types].xml')) {
      return extractTextFromRawDocxString(rawContent);
    }
    return cleanDocumentText(rawContent);
  } catch (textErr) {
    console.error('Error reading file as text:', textErr);
    throw new Error('Failed to read file. Please ensure it is a valid .docx, .txt, or .md file.');
  }
}

/**
 * Fallback parser if raw docx binary string was passed
 * Extracts text from <w:t> tags in word/document.xml
 */
export function extractTextFromRawDocxString(rawString: string): string {
  // Find all <w:t> or <w:t xml:space="preserve"> text fragments
  const textMatches: string[] = [];
  const regex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  let match;

  while ((match = regex.exec(rawString)) !== null) {
    if (match[1]) {
      // Decode XML entities like &amp;, &lt;, &gt;, &quot;, &#39;
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
