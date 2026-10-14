import Link from "next/link";
import { GradeBadge } from "@/components/site/GradeBadge";
import type { CompanySummary } from "@/lib/site/companies";

interface CompanyGridProps {
  companies: CompanySummary[];
  maxItems?: number;
  showViewAll?: boolean;
}

export function CompanyGrid({
  companies,
  maxItems,
  showViewAll,
}: CompanyGridProps) {
  const items = maxItems ? companies.slice(0, maxItems) : companies;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((company) => (
          <Link
            key={company.slug}
            href={`/company/${company.slug}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 hover:bg-accent/5"
          >
            <GradeBadge grade={company.grade} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                {company.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {company.verdict}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Analyzed{" "}
                {new Date(company.lastAnalyzed).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {showViewAll && companies.length > (maxItems ?? 0) && (
        <div className="text-center">
          <Link
            href="/company"
            className="text-sm font-medium text-accent hover:underline"
          >
            See all {companies.length} companies →
          </Link>
        </div>
      )}
    </div>
  );
}
