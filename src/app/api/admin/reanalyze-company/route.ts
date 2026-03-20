import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { analyzeTOS } from "@/lib/shared/gemini";
import { scrapeUrl } from "@/lib/site/url-scraper";

export const maxDuration = 60; // Allow up to 60s for fetch + AI analysis

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await request.json();

  if (!companyId) {
    return NextResponse.json(
      { error: "Missing company ID" },
      { status: 400 }
    );
  }

  // Fetch company record
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!company) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 }
    );
  }

  try {
    // Fetch both TOS and PP URLs fresh
    let tosText: string | null = null;
    let ppText: string | null = null;

    if (company.tos_url) {
      try {
        const result = await scrapeUrl(company.tos_url);
        tosText = result.text;
      } catch {
        // TOS fetch failed
      }
    }

    if (company.privacy_url) {
      try {
        const result = await scrapeUrl(company.privacy_url);
        ppText = result.text;
      } catch {
        // PP fetch failed
      }
    }

    if (!tosText && !ppText) {
      return NextResponse.json(
        {
          error:
            "Could not fetch either document. URLs may need updating.",
          tosStatus: "failed",
          ppStatus: "failed",
        },
        { status: 422 }
      );
    }

    // Build combined text
    let combinedText = "";
    if (tosText && ppText) {
      combinedText = `=== TERMS OF SERVICE ===\nSource: ${company.tos_url}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${company.privacy_url}\n\n${ppText}`;
    } else if (tosText) {
      combinedText = tosText;
    } else if (ppText) {
      combinedText = ppText!;
    }

    // Run analysis
    const analysis = await analyzeTOS(combinedText);

    if (analysis.mode === "not_tos") {
      return NextResponse.json(
        { error: "Content is not a TOS/Privacy Policy" },
        { status: 422 }
      );
    }

    const previousGrade = company.overall_grade;

    // Update company record
    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        overall_grade: analysis.grade && analysis.grade !== "N/A" ? analysis.grade : "F",
        verdict: analysis.verdict,
        analysis_json: analysis,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update company: " + error.message },
        { status: 500 }
      );
    }

    // Revalidate all affected pages (ISR)
    revalidatePath(`/company/${company.slug}`);
    revalidatePath("/company");
    revalidatePath("/hall-of-fame");

    return NextResponse.json({
      success: true,
      previousGrade,
      newGrade: analysis.grade,
      gradeChanged: previousGrade !== analysis.grade,
    });
  } catch (err) {
    console.error("Re-analysis error:", err);
    return NextResponse.json(
      { error: "Re-analysis failed" },
      { status: 500 }
    );
  }
}
