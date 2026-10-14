"use client";

import { useState } from "react";
import Link from "next/link";
import { GradeBadge } from "@/components/site/GradeBadge";
import type { CompanySummary } from "@/lib/site/companies";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { isHallOfFame, gradeValue } from "@/lib/site/grades";

interface HallOfFameSectionProps {
  companies: CompanySummary[];
}

export function HallOfFameSection({ companies }: HallOfFameSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const qualifying = companies
    .filter((c) => isHallOfFame(c.grade))
    .sort((a, b) => gradeValue(b.grade) - gradeValue(a.grade) || a.name.localeCompare(b.name));

  if (qualifying.length === 0) return null;

  const visibleCount = expanded ? Math.min(qualifying.length, 10) : Math.min(qualifying.length, 4);
  const visible = qualifying.slice(0, visibleCount);
  const canExpand = qualifying.length > 4;

  return (
    <section className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-teal-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Companies Doing It Right
          </h2>
        </div>
        <Link
          href="/hall-of-fame"
          className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors cursor-pointer"
        >
          Hall of Fame →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {visible.map((company) => (
          <Link
            key={company.slug}
            href={`/company/${company.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-teal-500/30 transition-colors cursor-pointer"
          >
            <GradeBadge grade={company.grade} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {company.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {company.verdict.slice(0, 60)}…
              </p>
            </div>
          </Link>
        ))}
      </div>

      {canExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-teal-600 hover:text-teal-500 transition-colors cursor-pointer"
        >
          {expanded ? (
            <>Show less <ChevronUp className="size-4" /></>
          ) : (
            <>Show more <ChevronDown className="size-4" /></>
          )}
        </button>
      )}
    </section>
  );
}
