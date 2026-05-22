import mammoth from "mammoth";
import pdfParse from "pdf-parse";

// ─── Types ──────────────────────────────────────────────────────────
interface ExtractResult {
  rawText: string;
  pageCount?: number;
}

// ─── Text Cleaning ──────────────────────────────────────────────────
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/\s{3,}/g, "  ")
    .replace(/[ \t]+$/gm, "")
    .replace(/^\s*[\n\r]/gm, "\n")
    .trim();
}

// ─── PDF Extraction ─────────────────────────────────────────────────
export async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const data = await pdfParse(buffer);
  return {
    rawText: cleanText(data.text),
    pageCount: data.numpages,
  };
}

// ─── DOCX Extraction ────────────────────────────────────────────────
/**
 * Extracts text from a DOCX buffer using mammoth.
 */
export async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const result = await mammoth.extractRawText({ buffer });
  return {
    rawText: cleanText(result.value),
  };
}

// ─── Dispatch ───────────────────────────────────────────────────────
/**
 * Routes extraction to the correct parser based on file type.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string,
): Promise<ExtractResult> {
  switch (fileType) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ─── Remote File Download ───────────────────────────────────────────
/**
 * Downloads a file from a URL into a Buffer.
 */
export async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}