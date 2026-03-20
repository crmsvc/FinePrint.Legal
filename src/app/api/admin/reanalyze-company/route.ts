import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { analyzeTOS } from "@/lib/shared/gemini";
import { scrapeUrl } from "@/lib/site/url-scraper";

export const maxDuration = 60; // Allow up to 60s for fetch + AI analysis

async function logError(
  companyId: string,
  companyName: string,
  action: string,
  errorMessage: string,
  context: Record<string, unknown> = {}
) {
  try {
    await supabaseAdmin.from("error_logs").insert({
      company_id: companyId,
      company_name: companyName,
      action,
      error_message: errorMessage,
      context,
    });
  } catch {
    // Don't let logging failures break the flow
    console.error("Failed to write error log:", errorMessage);
  }
}

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
    let tosError: string | null = null;
    let ppError: string | null = null;

    if (company.tos_url) {
      try {
        const result = await scrapeUrl(company.tos_url);
        tosText = result.text;
      } catch (err) {
        tosError = err instanceof Error ? err.message : "TOS fetch failed";
      }
    } else {
      tosError = "No TOS URL configured";
    }

    if (company.privacy_url) {
      try {
        const result = await scrapeUrl(company.privacy_url);
        ppText = result.text;
      } catch (err) {
        ppError = err instanceof Error ? err.message : "PP fetch failed";
      }
    } else {
      ppError = "No Privacy Policy URL configured";
    }

    if (!tosText && !ppText) {
      const errorMsg = "Could not fetch either document. URLs may need updating.";
      await logError(company.id, company.name, "reanalyze", errorMsg, {
        tosUrl: company.tos_url,
        ppUrl: company.privacy_url,
        tosError,
        ppError,
      });

      return NextResponse.json(
        { error: errorMsg, tosStatus: "failed", ppStatus: "failed" },
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
      const errorMsg = "Content is not a TOS/Privacy Policy";
      await logError(company.id, company.name, "reanalyze", errorMsg, {
        tosUrl: company.tos_url,
        ppUrl: company.privacy_url,
        tosLength: tosText?.length || 0,
        ppLength: ppText?.length || 0,
        tosError,
        ppError,
      });

      return NextResponse.json({ error: errorMsg }, { status: 422 });
    }

    const previousGrade = company.overall_grade;

    // If AI couldn't determine a grade, don't overwrite — log and return error
    if (!analysis.grade || analysis.grade === "N/A") {
      const errorMsg = `AI returned grade "${analysis.grade || "null"}" — grade unchanged at ${previousGrade}`;
      await logError(company.id, company.name, "reanalyze", errorMsg, {
        tosUrl: company.tos_url,
        ppUrl: company.privacy_url,
        tosLength: tosText?.length || 0,
        ppLength: ppText?.length || 0,
        tosError,
        ppError,
        aiMode: analysis.mode,
        aiVerdict: analysis.verdict,
      });

      return NextResponse.json(
        { error: errorMsg },
        { status: 422 }
      );
    }

    // Update company record
    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        overall_grade: analysis.grade,
        verdict: analysis.verdict,
        analysis_json: analysis,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      await logError(company.id, company.name, "reanalyze", `DB update failed: ${error.message}`, {
        grade: analysis.grade,
      });

      return NextResponse.json(
        { error: "Failed to update company: " + error.message },
        { status: 500 }
      );
    }

    // Log partial fetch warnings (succeeded overall but one doc failed)
    if (tosError || ppError) {
      await logError(company.id, company.name, "reanalyze_warning", "Partial fetch — one document failed", {
        tosUrl: company.tos_url,
        ppUrl: company.privacy_url,
        tosError,
        ppError,
        newGrade: analysis.grade,
      });
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
    const errorMsg = err instanceof Error ? err.message : "Re-analysis failed";
    await logError(company.id, company.name, "reanalyze", errorMsg, {
      tosUrl: company.tos_url,
      ppUrl: company.privacy_url,
    });

    return NextResponse.json(
      { error: "Re-analysis failed" },
      { status: 500 }
    );
  }
}
