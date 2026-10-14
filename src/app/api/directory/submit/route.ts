import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/site/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: hash IP for privacy
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const hashedIp = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Simple rate limit: 3 submissions per IP per 24 hours
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { count } = await supabaseAdmin
      .from("pending_analyses")
      .select("id", { count: "exact", head: true })
      .eq("source", "community")
      .gte("submitted_at", twentyFourHoursAgo);

    if (count !== null && count >= 10) {
      return NextResponse.json(
        { error: "Too many submissions today. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.domain || !body.grade || !body.analysisJson) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Check if domain already exists in companies table
    const { data: existing } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("domain", body.domain)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This company is already in our directory." },
        { status: 409 }
      );
    }

    // Check if domain already has a pending submission
    const { data: pendingExisting } = await supabaseAdmin
      .from("pending_analyses")
      .select("id")
      .eq("domain", body.domain)
      .eq("status", "pending")
      .single();

    if (pendingExisting) {
      return NextResponse.json(
        { error: "A submission for this company is already under review." },
        { status: 409 }
      );
    }

    // Insert into pending_analyses table
    // source_url is NOT NULL in schema, use tosUrl as the primary source
    const { error } = await supabaseAdmin.from("pending_analyses").insert({
      company_name: body.companyName || body.domain,
      domain: body.domain,
      source_url: body.tosUrl || body.ppUrl || `https://${body.domain}`,
      tos_url: body.tosUrl || null,
      pp_url: body.ppUrl || null,
      overall_grade: body.grade || "F",
      verdict: body.verdict || null,
      analysis_json: body.analysisJson,
      source: "community",
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Directory submit error:", error);
      return NextResponse.json(
        { error: "Failed to submit. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Directory submit error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
