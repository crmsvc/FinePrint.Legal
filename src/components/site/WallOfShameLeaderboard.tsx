"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Share2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SharePopup } from "@/components/shared/SharePopup";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { siteConfig } from "@/lib/site/config";
import type { WOSCompany, WOSFlag } from "@/lib/site/wall-of-shame";
import type { RiskLevel } from "@/lib/shared/gemini";

interface CategoryFilter {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface WallOfShameLeaderboardProps {
  initialCompanies: WOSCompany[];
  categories: CategoryFilter[];
}

const VISIBLE_FLAGS = 3;

export function WallOfShameLeaderboard({
  initialCompanies,
  categories,
}: WallOfShameLeaderboardProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"flags" | "grade" | "newest">("grade");
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [shareTarget, setShareTarget] = useState<{
    url: string;
    title: string;
    slug: string;
  } | null>(null);

  // Filter companies by category
  const filtered = companies
    .map((company) => {
      if (activeCategory === "all") return company;
      const matchingFlags = company.flags.filter(
        (f) => f.category === categories.find((c) => c.id === activeCategory)?.name
      );
      if (matchingFlags.length === 0) return null;
      return { ...company, flags: matchingFlags, totalFlags: matchingFlags.length };
    })
    .filter(Boolean) as WOSCompany[];

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "flags") return b.totalFlags - a.totalFlags;
    if (sortBy === "newest") return 0; // keep default order
    // Default: grade order (already sorted by rank)
    return a.rank - b.rank || b.totalFlags - a.totalFlags;
  });

  const toggleExpand = (slug: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleVote = async (submissionId: string) => {
    if (votedIds.has(submissionId)) {
      toast.info("You've already voted on this one");
      return;
    }

    try {
      const res = await fetch("/api/wall-of-shame/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();

      if (data.alreadyVoted) {
        toast.info("You've already voted on this one");
        setVotedIds((prev) => new Set([...prev, submissionId]));
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Vote failed");
        return;
      }

      // Optimistic update
      setCompanies((prev) =>
        prev.map((company) => ({
          ...company,
          flags: company.flags.map((f) =>
            f.submissionId === submissionId
              ? { ...f, upvotes: (f.upvotes || 0) + 1 }
              : f
          ),
        }))
      );
      setVotedIds((prev) => new Set([...prev, submissionId]));
    } catch {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="mt-6">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeCategory === "all"
              ? "bg-accent text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-accent text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Sort toggle */}
      <div className="mt-4 flex gap-2">
        {(["grade", "flags", "newest"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={cn(
              "cursor-pointer text-xs font-medium transition-colors",
              sortBy === key
                ? "text-foreground underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "grade"
              ? "Worst Grade"
              : key === "flags"
                ? "Most Flagged"
                : "Newest"}
          </button>
        ))}
      </div>

      {/* Company leaderboard */}
      <div className="mt-6 space-y-4">
        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No entries yet.{" "}
            <Link
              href="/wall-of-shame/submit"
              className="text-accent hover:underline"
            >
              Submit the first one
            </Link>
            .
          </p>
        ) : (
          sorted.map((company) => (
            <CompanyCard
              key={company.slug}
              company={company}
              isExpanded={expandedCompanies.has(company.slug)}
              onToggleExpand={() => toggleExpand(company.slug)}
              votedIds={votedIds}
              onVote={handleVote}
              onShare={(slug) =>
                setShareTarget({
                  url: company.companyPageUrl
                    ? `${siteConfig.url}${company.companyPageUrl}`
                    : `${siteConfig.url}/wall-of-shame`,
                  title: `${company.name} — Wall of Shame | FinePrint`,
                  slug,
                })
              }
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent" />
          From FinePrint&apos;s editorial analysis
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" />
          User-submitted, AI-verified
        </span>
      </div>

      {/* Share popup */}
      {shareTarget && (
        <SharePopup
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          url={shareTarget.url}
          title={shareTarget.title}
          pageType="wall-of-shame"
          pageSlug={shareTarget.slug}
        />
      )}
    </div>
  );
}

/* ---------- Company Card ---------- */

function CompanyCard({
  company,
  isExpanded,
  onToggleExpand,
  votedIds,
  onVote,
  onShare,
}: {
  company: WOSCompany;
  isExpanded: boolean;
  onToggleExpand: () => void;
  votedIds: Set<string>;
  onVote: (id: string) => void;
  onShare: (slug: string) => void;
}) {
  const gradeColor = company.grade
    ? siteConfig.gradeColors[company.grade] || siteConfig.gradeColors["C"]
    : null;

  const visibleFlags = isExpanded
    ? company.flags
    : company.flags.slice(0, VISIBLE_FLAGS);
  const hiddenCount = company.flags.length - VISIBLE_FLAGS;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Company header */}
      <div className="p-4 flex items-start gap-3">
        {/* Rank */}
        {company.rank > 0 && (
          <span className="text-sm font-bold text-muted-foreground min-w-[2rem]">
            #{company.rank}
          </span>
        )}

        {/* Grade badge */}
        {company.grade && gradeColor && (
          <span
            className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-sm font-bold min-w-[2rem]"
            style={{
              backgroundColor: gradeColor.bg,
              color: gradeColor.text,
            }}
          >
            {company.grade}
          </span>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">{company.name}</h2>
          {company.verdict && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {company.verdict}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {company.totalFlags} flag{company.totalFlags !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Share */}
        <button
          onClick={() => onShare(company.slug)}
          className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Share"
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* Flags */}
      <div className="border-t border-border divide-y divide-border">
        {visibleFlags.map((flag, i) => (
          <FlagRow
            key={flag.submissionSlug || `editorial-${i}`}
            flag={flag}
            votedIds={votedIds}
            onVote={onVote}
          />
        ))}
      </div>

      {/* Show more / less */}
      {hiddenCount > 0 && (
        <button
          onClick={onToggleExpand}
          className="cursor-pointer w-full py-2.5 text-center text-xs font-medium text-accent hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t border-border"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              Show {hiddenCount} more flag{hiddenCount !== 1 ? "s" : ""}
            </>
          )}
        </button>
      )}

      {/* Company page link */}
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border text-sm">
        {company.companyPageUrl ? (
          <Link
            href={company.companyPageUrl}
            className="text-accent hover:underline"
          >
            See full {company.name} analysis →
          </Link>
        ) : (
          <Link href="/" className="text-muted-foreground hover:text-accent transition-colors">
            No full analysis yet — Analyze their TOS →
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------- Flag Row ---------- */

function FlagRow({
  flag,
  votedIds,
  onVote,
}: {
  flag: WOSFlag;
  votedIds: Set<string>;
  onVote: (id: string) => void;
}) {
  return (
    <div className="px-4 py-3 space-y-1.5">
      {/* Source badge + headline */}
      <div className="flex items-start gap-2">
        {flag.source === "editorial" ? (
          <Sparkles
            className="size-3.5 text-accent mt-0.5 shrink-0"
            aria-label="Editorial analysis"
          />
        ) : (
          <Users
            className="size-3.5 text-muted-foreground mt-0.5 shrink-0"
            aria-label="Community submission"
          />
        )}
        <div className="flex-1 min-w-0">
          {flag.submissionSlug ? (
            <Link
              href={`/wall-of-shame/${flag.submissionSlug}`}
              className="font-medium text-sm text-risk-high hover:underline"
            >
              {flag.headline}
            </Link>
          ) : (
            <p className="font-medium text-sm text-risk-high">
              {flag.headline}
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-foreground pl-5.5 ml-[1.375rem]">
        {flag.explanation}
      </p>

      {/* Industry context */}
      {flag.industryContext && (
        <p className="text-xs text-muted-foreground italic pl-5.5 ml-[1.375rem]">
          {flag.industryContext}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 pl-5.5 ml-[1.375rem]">
        <RiskBadge level={flag.riskLevel as RiskLevel} />
        <span className="text-xs text-muted-foreground">
          {flag.category}
        </span>

        {/* Upvote for community flags */}
        {flag.source === "community" && flag.submissionId && (
          <button
            onClick={() => onVote(flag.submissionId!)}
            className={cn(
              "cursor-pointer flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ml-auto",
              votedIds.has(flag.submissionId)
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronUp className="size-3" />
            {flag.upvotes || 0}
          </button>
        )}
      </div>
    </div>
  );
}
