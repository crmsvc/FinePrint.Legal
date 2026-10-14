import { supabaseAdmin } from "@/lib/site/supabase";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { analyzeClause } from "@/lib/shared/gemini";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Rate limit: 2 submissions per IP per 24 hours
    const { count } = await supabaseAdmin
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by_ip_hash", ipHash)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if ((count || 0) >= 2) {
      return NextResponse.json(
        {
          error:
            "You can submit up to 2 entries per day. Try again tomorrow!",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      sourceUrl,
      clauseText,
      categoryId,
      // Pre-filled AI data from existing red flags (skip AI analysis if present)
      prefillHeadline,
      prefillExplanation,
      prefillIndustryContext,
      prefillRiskLevel,
    } = body;

    // Validate
    if (!companyName || !clauseText || clauseText.length < 50 || !categoryId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields or clause text too short (minimum 50 characters)",
        },
        { status: 400 }
      );
    }

    // --- AI analysis or use prefilled data ---
    let aiHeadline: string | null = prefillHeadline || null;
    let aiExplanation: string | null = prefillExplanation || null;
    let aiIndustryContext: string | null = prefillIndustryContext || null;
    let riskLevel: string = prefillRiskLevel || "HIGH";

    // Only run AI analysis if we don't have prefilled data
    if (!prefillHeadline) {
      try {
        const aiResult = await analyzeClause(clauseText, companyName);

        if ("error" in aiResult) {
          return NextResponse.json(
            {
              error:
                "This doesn't appear to be a Terms of Service clause. Please paste the actual text from a TOS or Privacy Policy.",
            },
            { status: 422 }
          );
        }

        aiHeadline = aiResult.headline;
        aiExplanation = aiResult.explanation;
        aiIndustryContext = aiResult.industryContext;
        riskLevel = aiResult.riskLevel;
      } catch (err) {
        console.error("AI clause analysis failed:", err);
        // If AI fails, still allow submission — admin will review manually
        aiHeadline = null;
        aiExplanation = null;
        aiIndustryContext = null;
      }
    }

    // Generate slug
    const slug = `${companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

    // Check if company exists in companies table
    const companySlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id, slug")
      .eq("slug", companySlug)
      .single();

    // Insert submission
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .insert({
        company_name: companyName,
        company_slug: companySlug,
        company_id: existingCompany?.id || null,
        slug,
        source_url: sourceUrl || null,
        clause_text: clauseText,
        ai_headline: aiHeadline,
        ai_explanation: aiExplanation,
        ai_industry_context: aiIndustryContext,
        category_id: categoryId,
        risk_level: riskLevel,
        submitted_by_ip_hash: ipHash,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Submission insert error:", error);
      return NextResponse.json(
        { error: "Submission failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, slug: data.slug });
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
