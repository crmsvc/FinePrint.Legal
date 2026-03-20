import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import { isAdminAuthenticated } from "@/lib/site/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data || [] });
}

export async function DELETE() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("error_logs")
    .delete()
    .lt("created_at", new Date().toISOString());

  if (error) {
    return NextResponse.json(
      { error: "Failed to clear logs: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
