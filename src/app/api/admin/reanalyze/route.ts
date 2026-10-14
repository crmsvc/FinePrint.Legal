import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { analyzeTOS } from "@/lib/shared/gemini";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pendingId } = await request.json();

  if (!pendingId) {
    return NextResponse.json(
      { error: "Missing pending ID" },
      { status: 400 }
    );
  }

  // Get the pending analysis
  const { data: pending } = await supabaseAdmin
    .from("pending_analyses")
    .select("source_url")
    .eq("id", pendingId)
    .single();

  if (!pending?.source_url) {
    return NextResponse.json(
      { error: "Pending analysis not found or no source URL" },
      { status: 404 }
    );
  }

  // Fetch fresh content
  try {
    const fetchRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://fineprint.legal"}/api/fetch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pending.source_url }),
      }
    );

    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL content" },
        { status: 502 }
      );
    }

    const { text } = await fetchRes.json();

    // Re-analyze
    const analysis = await analyzeTOS(text);

    if (analysis.mode === "not_tos") {
      return NextResponse.json(
        { error: "Content is not a TOS/Privacy Policy" },
        { status: 422 }
      );
    }

    // Update pending analysis
    await supabaseAdmin
      .from("pending_analyses")
      .update({
        overall_grade: analysis.grade,
        verdict: analysis.verdict,
        analysis_json: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingId);

    return NextResponse.json({
      success: true,
      grade: analysis.grade,
      verdict: analysis.verdict,
    });
  } catch (err) {
    console.error("Re-analysis error:", err);
    return NextResponse.json(
      { error: "Re-analysis failed" },
      { status: 500 }
    );
  }
}
