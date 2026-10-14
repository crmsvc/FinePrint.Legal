import { supabaseAdmin } from "@/lib/site/supabase";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submission ID" },
        { status: 400 }
      );
    }

    // Check for existing vote
    const { data: existingVote } = await supabaseAdmin
      .from("votes")
      .select("id")
      .eq("submission_id", submissionId)
      .eq("voter_ip_hash", ipHash)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: "Already voted", alreadyVoted: true },
        { status: 409 }
      );
    }

    // Insert vote
    await supabaseAdmin.from("votes").insert({
      submission_id: submissionId,
      voter_ip_hash: ipHash,
    });

    // Increment upvote count on submission
    await supabaseAdmin.rpc("increment_upvotes", {
      submission_id_param: submissionId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Vote failed" }, { status: 500 });
  }
}
