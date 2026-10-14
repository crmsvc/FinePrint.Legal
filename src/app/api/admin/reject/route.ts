import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, type, reason } = await request.json();

  if (!id || !type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const table =
    type === "pending" ? "pending_analyses" : "submissions";

  // Spam = hard delete from DB, Reject = soft status change
  if (reason === "spam") {
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete" },
        { status: 500 }
      );
    }
  } else {
    const { error } = await supabaseAdmin
      .from(table)
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to reject" },
        { status: 500 }
      );
    }
  }

  if (type === "submission") {
    revalidatePath("/wall-of-shame");
  }

  return NextResponse.json({ success: true });
}
