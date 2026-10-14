import { supabaseAdmin } from "@/lib/site/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSlug = searchParams.get("slug");

  if (!pageSlug) {
    return NextResponse.json({ count: 0 });
  }

  const { count } = await supabaseAdmin
    .from("share_events")
    .select("*", { count: "exact", head: true })
    .eq("page_slug", pageSlug);

  return NextResponse.json(
    { count: count || 0 },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
