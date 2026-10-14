import { NextRequest, NextResponse } from "next/server";
import { analyzeTOS } from "@/lib/shared/gemini";
import { checkRateLimit } from "@/lib/shared/rate-limit";
import { supabaseAdmin } from "@/lib/site/supabase";
import type { AnalysisResult } from "@/lib/shared/gemini";

const MAX_CHARS = 200_000; // ~50k words

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceUrl, canGrade, documentType, inputMethod, companionUrl, isCombined } = body;

    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Text is required (minimum 50 characters)." },
        { status: 400 }
      );
    }

    if (text.length > MAX_CHARS) {
      return NextResponse.json(
        { error: "Text exceeds the maximum length. Try a shorter document." },
        { status: 422 }
      );
    }

    // Rate limit check (skip in dev)
    let remaining: number | undefined;
    let limit: number | undefined;

    if (process.env.RATE_LIMIT_DISABLED !== "true") {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const rateResult = await checkRateLimit(ip);
      if (!rateResult.success) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Try again tomorrow.",
            remaining: 0,
            limit: rateResult.limit,
          },
          { status: 429 }
        );
      }
      remaining = rateResult.remaining;
      limit = rateResult.limit;
    }

    // Analyze with Gemini
    const result = await analyzeTOS(text.trim());

    // Auto-save to pending queue if from a URL and feature is enabled
    if (
      process.env.AUTO_SAVE_ANALYSES === "true" &&
      sourceUrl &&
      result.mode === "full"
    ) {
      saveToPendingQueue(sourceUrl, result).catch(() => {});
    }

    return NextResponse.json({
      result,
      remaining,
      limit,
      canGrade: canGrade ?? false,
      documentType: documentType ?? null,
      inputMethod: inputMethod ?? "text",
      companionUrl: companionUrl ?? null,
      isCombined: isCombined ?? false,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

async function saveToPendingQueue(
  sourceUrl: string,
  analysis: AnalysisResult
) {
  try {
    const domain = new URL(sourceUrl).hostname.replace("www.", "");

    // Skip if a published company page already exists for this domain
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("domain", domain)
      .eq("status", "published")
      .single();

    if (existingCompany) return;

    // Check if a pending analysis already exists for this domain
    const { data: existingPending } = await supabaseAdmin
      .from("pending_analyses")
      .select("id, submission_count")
      .eq("domain", domain)
      .eq("status", "pending")
      .single();

    if (existingPending) {
      await supabaseAdmin
        .from("pending_analyses")
        .update({
          submission_count: existingPending.submission_count + 1,
          analysis_json: analysis,
          overall_grade: analysis.grade,
          verdict: analysis.verdict,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPending.id);
    } else {
      const namePart = domain.split(".")[0];
      const companyName =
        namePart.charAt(0).toUpperCase() + namePart.slice(1);

      await supabaseAdmin.from("pending_analyses").insert({
        domain,
        company_name: companyName,
        source_url: sourceUrl,
        overall_grade: analysis.grade,
        verdict: analysis.verdict,
        analysis_json: analysis,
      });
    }
  } catch (err) {
    console.error("Auto-save to pending queue failed:", err);
  }
}
