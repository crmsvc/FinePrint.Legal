import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/lib/site/config";
import { supabaseAdmin } from "@/lib/site/supabase";
import { ResultsDisplay } from "@/components/site/ResultsDisplay";
import { Disclaimer } from "@/components/shared/Disclaimer";
import type { AnalysisResult } from "@/lib/shared/gemini";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // ISR: regenerate every hour if requested

interface CompanyData {
  slug: string;
  name: string;
  grade: string;
  verdict: string;
  lastAnalyzed: string;
  sourceUrl: string;
  analysis: AnalysisResult;
}

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("companies")
    .select("slug")
    .eq("status", "published");
  return (data || []).map((c) => ({ slug: c.slug }));
}

async function resolveCompanyData(slug: string): Promise<CompanyData | null> {
  try {
    const { data } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!data) return null;

    return {
      slug: data.slug,
      name: data.name,
      grade: data.overall_grade,
      verdict: data.verdict,
      lastAnalyzed: data.last_analyzed_at,
      sourceUrl: data.tos_url || "",
      analysis: data.analysis_json as AnalysisResult,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolveCompanyData(slug);
  if (!data) return {};

  return {
    title: `${data.name} Terms of Service & Privacy Policy Explained | ${siteConfig.name}`,
    description: `What does ${data.name}'s Terms of Service actually say? We break it down clause by clause with a letter grade and risk assessment. Last updated ${new Date(data.lastAnalyzed).toLocaleDateString("en-US", { month: "long", year: "numeric" })}.`,
    alternates: { canonical: `${siteConfig.url}/company/${slug}` },
    openGraph: {
      title: `${data.name} — Grade: ${data.grade} | FinePrint`,
      description: data.verdict,
      siteName: "FinePrint",
      images: [
        {
          url: `${siteConfig.url}/api/og/${slug}`,
          width: 1200,
          height: 630,
          alt: `${data.name} Terms of Service Grade: ${data.grade}`,
        },
      ],
      url: `${siteConfig.url}/company/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.name} — Grade: ${data.grade} | FinePrint`,
      description: data.verdict,
      images: [`${siteConfig.url}/api/og/${slug}`],
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const data = await resolveCompanyData(slug);
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "WebPage",
      name: `${data.name} Terms of Service`,
      url: data.sourceUrl,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: gradeToNumber(data.grade),
      bestRating: 13,
      worstRating: 1,
    },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    datePublished: data.lastAnalyzed,
    reviewBody: data.verdict,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Link
          href="/company"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All companies
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {data.name} Terms of Service &amp; Privacy Policy
        </h1>

        <div className="mt-8">
          <ResultsDisplay
            analysis={data.analysis}
            sourceUrl={data.sourceUrl}
            pageType="company"
            pageSlug={slug}
            companyName={data.name}
          />
        </div>

        <div className="mt-8">
          <Disclaimer variant="company" />
        </div>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Want to analyze a different service?{" "}
            <Link href="/" className="font-medium text-accent hover:underline">
              Analyze any TOS →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function gradeToNumber(grade: string): number {
  const scale: Record<string, number> = {
    "A+": 13, A: 12, "A-": 11,
    "B+": 10, B: 9, "B-": 8,
    "C+": 7, C: 6, "C-": 5,
    "D+": 4, D: 3, "D-": 2,
    F: 1,
  };
  return scale[grade] ?? 6;
}
