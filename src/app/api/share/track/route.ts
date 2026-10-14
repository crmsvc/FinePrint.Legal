import { supabaseAdmin } from "@/lib/site/supabase";
import { NextResponse } from "next/server";

const VALID_PAGE_TYPES = ["company", "wall-of-shame", "hall-of-fame", "live-result"];
const VALID_PLATFORMS = ["facebook", "x", "linkedin", "reddit", "email", "copy-link"];

export async function POST(request: Request) {
  try {
    const { pageType, pageSlug, platform } = await request.json();

    if (
      !VALID_PAGE_TYPES.includes(pageType) ||
      !VALID_PLATFORMS.includes(platform) ||
      !pageSlug
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Insert share event — no IP tracking, just the event
    await supabaseAdmin.from("share_events").insert({
      page_type: pageType,
      page_slug: pageSlug,
      platform: platform,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Silently succeed — share tracking should never break UX
    return NextResponse.json({ success: true });
  }
}
