import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, company_name, clause_text, ai_explanation, category_id } =
    await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (company_name !== undefined) updates.company_name = company_name;
  if (clause_text !== undefined) updates.clause_text = clause_text;
  if (ai_explanation !== undefined) updates.ai_explanation = ai_explanation;
  if (category_id !== undefined) updates.category_id = category_id;

  const { error } = await supabaseAdmin
    .from("submissions")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }

  revalidatePath("/wall-of-shame");

  return NextResponse.json({ success: true });
}
