import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";

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

  // Fetch company first to get slug for revalidation
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id, slug, name")
    .eq("id", companyId)
    .single();

  if (!company) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 }
    );
  }

  // Clear foreign key references before deleting
  await supabaseAdmin
    .from("pending_analyses")
    .delete()
    .eq("published_company_id", companyId);

  await supabaseAdmin
    .from("error_logs")
    .delete()
    .eq("company_id", companyId);

  const { error } = await supabaseAdmin
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete: " + error.message },
      { status: 500 }
    );
  }

  // Revalidate all affected pages
  revalidatePath(`/company/${company.slug}`);
  revalidatePath("/company");
  revalidatePath("/hall-of-fame");

  return NextResponse.json({
    success: true,
    deleted: company.name,
  });
}
