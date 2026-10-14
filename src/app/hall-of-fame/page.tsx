import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { siteConfig } from "@/lib/site/config";
import { supabaseAdmin } from "@/lib/site/supabase";
import { CompanyGrid } from "@/components/site/CompanyGrid";
import { isHallOfFame, gradeValue } from "@/lib/site/grades";

export const metadata: Metadata = {
  title: `Hall of Fame — Companies That Respect Your Privacy | ${siteConfig.name}`,
  description:
    "These companies earned a B- or higher from FinePrint for fair terms of service and transparent privacy policies. See who's doing it right.",
  alternates: { canonical: `${siteConfig.url}/hall-of-fame` },
  openGraph: {
    title: `Hall of Fame — Companies That Respect Your Privacy | ${siteConfig.name}`,
    description:
      "These companies earned a B- or higher from FinePrint for fair terms of service and transparent privacy policies. See who's doing it right.",
    images: [`${siteConfig.url}/api/og/hall-of-fame`],
  },
  twitter: {
    card: "summary_large_image",
    title: `Hall of Fame — Companies That Respect Your Privacy | ${siteConfig.name}`,
    description:
      "These companies earned a B- or higher from FinePrint for fair terms of service and transparent privacy policies.",
    images: [`${siteConfig.url}/api/og/hall-of-fame`],
  },
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

export default async function HallOfFamePage() {
  const allCompanies = await getAllCompanies();

  const qualifying = allCompanies
    .filter((c) => isHallOfFame(c.grade))
    .sort(
      (a, b) =>
        gradeValue(b.grade) - gradeValue(a.grade) ||
        a.name.localeCompare(b.name)
    );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "FinePrint Hall of Fame",
    description:
      "Companies that earned a B- or higher for fair terms of service and transparent privacy policies.",
    numberOfItems: qualifying.length,
    itemListElement: qualifying.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `${siteConfig.url}/company/${c.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="flex items-center gap-3">
          <Trophy className="size-8 text-teal-500" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Hall of Fame
          </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">
          These companies are doing it right. Their Terms of Service and Privacy
          Policies respect user rights, maintain transparency, and set the
          standard for the industry.
        </p>

        <div className="mt-4 rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
          <p className="text-sm text-muted-foreground">
            Companies automatically qualify with a grade of{" "}
            <strong className="text-foreground">B-</strong> or higher.{" "}
            <Link
              href="/how-we-grade"
              className="text-accent hover:underline cursor-pointer"
            >
              How do we calculate grades? →
            </Link>
          </p>
        </div>

        <div className="mt-8">
          {qualifying.length > 0 ? (
            <CompanyGrid companies={qualifying} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-lg font-medium text-foreground">
                No companies have qualified yet.
              </p>
              <p className="mt-2 text-muted-foreground">
                We haven&apos;t found a company with a B- or higher grade yet.
                That says a lot about the industry.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Think a company deserves to be here?{" "}
            <Link
              href="/"
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              Analyze their TOS →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
