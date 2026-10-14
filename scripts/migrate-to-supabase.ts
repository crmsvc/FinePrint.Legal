/**
 * One-time migration: Move Tier 1 company JSON files into Supabase.
 * Run with: npx tsx scripts/migrate-to-supabase.ts
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Known PP URLs for Tier 1 companies
const PP_URLS: Record<string, string> = {
  instagram: "https://privacycenter.instagram.com/policy",
  facebook: "https://www.facebook.com/privacy/policy",
  tiktok: "https://www.tiktok.com/legal/page/us/privacy-policy/en",
  "x-twitter": "https://x.com/en/privacy",
  spotify: "https://www.spotify.com/us/legal/privacy-policy/",
  google: "https://policies.google.com/privacy",
  amazon: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ",
  discord: "https://discord.com/privacy",
  reddit: "https://www.reddit.com/policies/privacy-policy",
  uber: "https://www.uber.com/legal/en/document/?name=privacy-notice",
  linkedin: "https://www.linkedin.com/legal/privacy-policy",
  chatgpt: "https://openai.com/policies/privacy-policy",
};

// Domain mapping
const DOMAINS: Record<string, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  tiktok: "tiktok.com",
  "x-twitter": "x.com",
  spotify: "spotify.com",
  google: "google.com",
  amazon: "amazon.com",
  discord: "discord.com",
  reddit: "reddit.com",
  uber: "uber.com",
  linkedin: "linkedin.com",
  chatgpt: "openai.com",
};

async function migrate() {
  const companiesDir = path.join(process.cwd(), "src/content/companies");
  const files = fs.readdirSync(companiesDir).filter((f) => f.endsWith(".json"));

  console.log(`Found ${files.length} company files to migrate.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(".json", "");
    const filePath = path.join(companiesDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    // Check if already exists in Supabase
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      console.log(`⏭  ${data.name} (${slug}) — already in Supabase, skipping`);
      skipped++;
      continue;
    }

    const record = {
      slug: data.slug,
      name: data.name,
      domain: DOMAINS[slug] || data.slug + ".com",
      tos_url: data.sourceUrl,
      privacy_url: PP_URLS[slug] || null,
      overall_grade: data.grade,
      verdict: data.verdict,
      analysis_json: data.analysis,
      source: "editorial",
      status: "published",
      last_analyzed_at: data.lastAnalyzed
        ? new Date(data.lastAnalyzed).toISOString()
        : new Date("2026-03-13").toISOString(),
    };

    const { error } = await supabase.from("companies").insert(record);

    if (error) {
      console.log(`✗  ${data.name} (${slug}) — FAILED: ${error.message}`);
      failed++;
    } else {
      console.log(`✓  ${data.name} (${slug}) — migrated [${data.grade}]`);
      success++;
    }
  }

  console.log(`\n--- Migration Complete ---`);
  console.log(`✓ Success: ${success}`);
  console.log(`⏭ Skipped: ${skipped}`);
  console.log(`✗ Failed:  ${failed}`);
  console.log(`Total:    ${files.length}`);
}

migrate().catch(console.error);
