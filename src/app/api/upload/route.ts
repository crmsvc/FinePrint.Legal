import { NextRequest, NextResponse } from "next/server";
import { parsePDF } from "@/lib/shared/parsers/pdf";
import { parseDOCX } from "@/lib/shared/parsers/docx";
import { siteConfig } from "@/lib/site/config";

const MAX_SIZE_BYTES = siteConfig.fileUpload.maxSizeMB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${siteConfig.fileUpload.maxSizeMB}MB.`,
        },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["txt", "pdf", "docx"].includes(extension)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a .txt, .pdf, or .docx file.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    let wordCount: number;

    switch (extension) {
      case "pdf": {
        const parsed = await parsePDF(buffer);
        text = parsed.text;
        wordCount = parsed.wordCount;
        break;
      }
      case "docx": {
        const parsed = await parseDOCX(buffer);
        text = parsed.text;
        wordCount = parsed.wordCount;
        break;
      }
      case "txt": {
        text = buffer.toString("utf-8").trim();
        wordCount = text.split(/\s+/).filter(Boolean).length;
        break;
      }
      default:
        return NextResponse.json(
          { error: "Unsupported file type." },
          { status: 400 }
        );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract any text from this file." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      wordCount,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to process file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
