import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("submissions")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to unpublish" },
      { status: 500 }
    );
  }

  revalidatePath("/wall-of-shame");

  return NextResponse.json({ success: true });
}
