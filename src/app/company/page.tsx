import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";
import { supabaseAdmin } from "@/lib/site/supabase";
import { CompanyGrid } from "@/components/site/CompanyGrid";
import { HallOfFameSection } from "@/components/site/HallOfFameSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Analyzed Companies — ${siteConfig.name}`,
  description:
    "Browse letter grades and plain-English breakdowns of Terms of Service from popular companies. See how your favorite apps treat your data.",
  alternates: { canonical: `${siteConfig.url}/company` },
};

export const revalidate = 300; // Revalidate every 5 minutes for new Supabase entries

interface CompanySummary {
  slug: string;
  name: string;
  grade: string;
  verdict: string;
  lastAnalyzed: string;
}

async function getAllCompanies(): Promise<CompanySummary[]> {
  try {
    const { data } = await supabaseAdmin
      .from("companies")
      .select("slug, name, overall_grade, verdict, last_analyzed_at")
      .eq("status", "published")
      .order("name");

    if (!data) return [];

    return data.map((c) => ({
      slug: c.slug,
      name: c.name,
      grade: c.overall_grade?.trim() || "N/A",
      verdict: c.verdict || "",
      lastAnalyzed: c.last_analyzed_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function CompanyIndexPage() {
  const companies = await getAllCompanies();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Analyzed Companies
      </h1>
      <p className="mt-2 text-muted-foreground">
        Browse TOS grades for popular apps and services.
      </p>

      {/* Hall of Fame */}
      <div className="mt-6">
        <HallOfFameSection companies={companies} />
      </div>

      {/* Grading methodology blurb */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          FinePrint grades Terms of Service and Privacy Policies on a scale from
          A (excellent) to F (avoid). We evaluate data collection, data sharing,
          user rights, exit difficulty, and transparency.{" "}
          <Link
            href="/how-we-grade"
            className="font-medium text-accent hover:underline"
          >
            How do we calculate grades? →
          </Link>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Don&apos;t see your company?{" "}
          <Link href="/" className="font-medium text-accent hover:underline">
            Analyze any TOS →
          </Link>
        </p>
      </div>

      <div className="mt-8">
        {companies.length > 0 ? (
          <CompanyGrid companies={companies} />
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Company analyses coming soon. In the meantime,{" "}
            <Link href="/" className="text-accent hover:underline">
              analyze any TOS
            </Link>{" "}
            yourself.
          </p>
        )}
      </div>
    </div>
  );
}
