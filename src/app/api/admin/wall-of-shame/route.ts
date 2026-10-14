import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") || "pending";

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select(
      `
      id,
      slug,
      company_name,
      clause_text,
      ai_explanation,
      category_id,
      status,
      upvotes,
      created_at,
      categories (id, name, icon)
    `
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
