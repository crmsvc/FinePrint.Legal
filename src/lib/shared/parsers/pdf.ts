import { extractText, getDocumentProxy } from "unpdf";

const MAX_PAGES = 15;
const MIN_CHARS_PER_PAGE = 50;

export interface ParsedPDF {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const numPages = pdf.numPages;

  if (numPages > MAX_PAGES) {
    throw new Error(
      `This PDF has ${numPages} pages. We currently support up to ${MAX_PAGES} pages. Try uploading a shorter section.`
    );
  }

  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  const trimmed = (typeof text === "string" ? text : (text as string[]).join("\n")).trim();

  // Detect scanned / image-only PDFs
  if (
    !trimmed ||
    (numPages > 1 && trimmed.length < numPages * MIN_CHARS_PER_PAGE)
  ) {
    throw new Error(
      "This PDF appears to be a scanned image. We can only process text-based PDFs right now. Try copying and pasting the text instead."
    );
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  return {
    text: trimmed,
    pageCount: numPages,
    wordCount,
  };
}
