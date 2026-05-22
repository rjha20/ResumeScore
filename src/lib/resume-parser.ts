import mammoth from "mammoth";

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
  if (typeof globalThis.DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      get isIdentity() { return true; }
      static fromMatrix() { return new DOMMatrix(); }
      static fromFloat64Array() { return new DOMMatrix(); }
      invertSelf() { return this; }
      multiplySelf() { return this; }
      translateSelf() { return this; }
      scaleSelf() { return this; }
      rotateSelf() { return this; }
      skewXSelf() { return this; }
      skewYSelf() { return this; }
      flipX() { return new DOMMatrix(); }
      flipY() { return new DOMMatrix(); }
      toFloat64Array() { return new Float64Array(16); }
      toString() { return ""; }
    };
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@5.4.296/legacy/build/pdf.worker.min.mjs`;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
    page.cleanup();
  }

  await doc.destroy();

  return {
    rawText: cleanText(pages.join("\n\n")),
    pageCount: doc.numPages,
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