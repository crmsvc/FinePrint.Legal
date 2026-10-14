import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
