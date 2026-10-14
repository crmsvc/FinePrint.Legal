import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site/config";
import { getAllGuideSummaries } from "@/lib/site/guides";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: `Guides — ${siteConfig.name}`,
  description:
    "Plain-English explanations of common Terms of Service clauses and legal concepts. Learn what you're really agreeing to.",
  alternates: { canonical: `${siteConfig.url}/guides` },
};

export default function GuidesIndexPage() {
  const guides = getAllGuideSummaries();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Guides
      </h1>
      <p className="mt-2 text-muted-foreground">
        Plain-English explanations of common TOS clauses and legal concepts.
      </p>

      <div className="mt-8 grid gap-4">
        {guides.length > 0 ? (
          guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 hover:bg-accent/5"
            >
              <BookOpen className="mt-0.5 size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {guide.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {guide.description}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Guides coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
