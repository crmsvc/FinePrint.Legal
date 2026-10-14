import mammoth from "mammoth";

export interface ParsedDOCX {
  text: string;
  wordCount: number;
}

export async function parseDOCX(buffer: Buffer): Promise<ParsedDOCX> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error(
      "Could not extract any text from this document. The file may be corrupted or contain only images."
    );
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text,
    wordCount,
  };
}
