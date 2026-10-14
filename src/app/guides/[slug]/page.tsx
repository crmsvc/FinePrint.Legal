import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/lib/site/config";
import { getGuideData, getGuideSlugs } from "@/lib/site/guides";
import { getCompanyData } from "@/lib/site/companies";
import { GradeBadge } from "@/components/site/GradeBadge";
import { Disclaimer } from "@/components/shared/Disclaimer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getGuideData(slug);
  if (!data) return {};

  return {
    title: `${data.title} | ${siteConfig.name}`,
    description: data.description,
    alternates: { canonical: `${siteConfig.url}/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const data = getGuideData(slug);
  if (!data) notFound();

  const relatedCompanies = data.relatedCompanies
    .map((s) => getCompanyData(s))
    .filter(Boolean);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Link
          href="/guides"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All guides
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {data.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated:{" "}
          {new Date(data.lastUpdated).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {/* Content rendered from markdown-ish JSON content */}
        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          {data.content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={i}>{paragraph.replace("## ", "")}</h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={i}>{paragraph.replace("### ", "")}</h3>
              );
            }
            if (paragraph.startsWith("1. ") || paragraph.startsWith("- ")) {
              const items = paragraph.split("\n").filter(Boolean);
              const isOrdered = paragraph.startsWith("1. ");
              const Tag = isOrdered ? "ol" : "ul";
              return (
                <Tag key={i}>
                  {items.map((item, j) => (
                    <li key={j}>
                      {item.replace(/^(\d+\.\s|-\s)/, "")}
                    </li>
                  ))}
                </Tag>
              );
            }
            return <p key={i}>{paragraph}</p>;
          })}
        </div>

        {/* Related Companies */}
        {relatedCompanies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Related Company Analyses
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedCompanies.map((company) =>
                company ? (
                  <Link
                    key={company.slug}
                    href={`/company/${company.slug}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent/30"
                  >
                    <GradeBadge grade={company.grade} size="md" />
                    <div>
                      <p className="text-sm font-medium group-hover:text-accent transition-colors">
                        {company.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {company.verdict}
                      </p>
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        {data.faq.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {data.faq.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-medium text-sm text-foreground">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Check if your favorite app respects your privacy.{" "}
            <Link href="/" className="font-medium text-accent hover:underline">
              Analyze any TOS →
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <Disclaimer variant="results" />
        </div>
      </div>
    </>
  );
}
