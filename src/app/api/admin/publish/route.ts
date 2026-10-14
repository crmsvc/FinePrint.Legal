import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pendingId, companyName, slug, grade, verdict } =
    await request.json();

  if (!pendingId || !companyName || !slug) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get the pending analysis
  const { data: pending } = await supabaseAdmin
    .from("pending_analyses")
    .select("*")
    .eq("id", pendingId)
    .single();

  if (!pending) {
    return NextResponse.json(
      { error: "Pending analysis not found" },
      { status: 404 }
    );
  }

  // Create or update company record
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .upsert(
      {
        slug,
        name: companyName,
        domain: pending.domain,
        tos_url: pending.tos_url || pending.source_url,
        privacy_url: pending.pp_url || null,
        overall_grade: grade || pending.overall_grade,
        verdict: verdict || pending.verdict,
        source: "user_submitted",
        status: "published",
        last_analyzed_at: new Date().toISOString(),
        analysis_json: pending.analysis_json,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (companyError) {
    console.error("Company upsert error:", companyError);
    return NextResponse.json(
      { error: "Failed to publish" },
      { status: 500 }
    );
  }

  // Update pending analysis
  await supabaseAdmin
    .from("pending_analyses")
    .update({
      status: "published",
      published_company_id: company.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pendingId);

  // Revalidate relevant paths
  revalidatePath(`/company/${slug}`);
  revalidatePath("/company");
  revalidatePath("/hall-of-fame");

  return NextResponse.json({ success: true, slug: company.slug });
}
