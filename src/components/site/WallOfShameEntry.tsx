"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, Share2, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { SharePopup } from "@/components/shared/SharePopup";
import { siteConfig } from "@/lib/site/config";
import type { RiskLevel } from "@/lib/shared/gemini";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface Submission {
  id: string;
  slug: string;
  company_name: string;
  company_slug: string | null;
  source_url: string | null;
  clause_text: string;
  ai_headline: string | null;
  ai_explanation: string | null;
  ai_industry_context: string | null;
  risk_level: string;
  upvotes: number;
  created_at: string;
  categories: Category | null;
}

interface RelatedSubmission {
  id: string;
  slug: string;
  company_name: string;
  clause_text: string;
  upvotes: number;
  categories: { name: string; icon: string | null } | null;
}

interface WallOfShameEntryProps {
  submission: Submission;
  companyPageExists: boolean;
  related: RelatedSubmission[];
}

export function WallOfShameEntry({
  submission,
  companyPageExists,
  related,
}: WallOfShameEntryProps) {
  const [upvotes, setUpvotes] = useState(submission.upvotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleVote = async () => {
    if (hasVoted) {
      toast.info("You've already voted on this one");
      return;
    }

    try {
      const res = await fetch("/api/wall-of-shame/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await res.json();

      if (data.alreadyVoted) {
        toast.info("You've already voted on this one");
        setHasVoted(true);
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Vote failed");
        return;
      }

      setUpvotes((prev) => prev + 1);
      setHasVoted(true);
    } catch {
      toast.error("Failed to vote");
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {submission.company_name}
          </h1>
          {submission.ai_headline && (
            <p className="mt-1 text-lg font-medium text-risk-high">
              {submission.ai_headline}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {submission.categories && (
              <span className="inline-block rounded-full bg-risk-high/10 px-3 py-1 text-sm font-medium text-risk-high">
                {submission.categories.icon} {submission.categories.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Users className="size-3" />
              Community submission
            </span>
          </div>
        </div>

        {/* The Clause */}
        <div className="rounded-lg border-l-4 border-risk-high bg-risk-high-bg/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            The Clause
          </p>
          <blockquote className="text-sm text-foreground leading-relaxed italic">
            &ldquo;{submission.clause_text}&rdquo;
          </blockquote>
        </div>

        {/* AI Analysis */}
        {(submission.ai_explanation || submission.ai_industry_context) && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            {submission.ai_explanation && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  What This Means
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {submission.ai_explanation}
                </p>
              </div>
            )}
            {submission.ai_industry_context && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Industry Context
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {submission.ai_industry_context}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Risk + Meta */}
        <div className="flex flex-wrap items-center gap-4">
          <RiskBadge level={submission.risk_level as RiskLevel} />
          <span className="text-xs text-muted-foreground">
            Submitted{" "}
            {new Date(submission.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleVote}
            className={cn(
              "cursor-pointer flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              hasVoted
                ? "bg-accent/10 text-accent"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <ChevronUp className="size-4" />
            {upvotes}
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>

        {/* Links */}
        <div className="space-y-2">
          {submission.source_url && (
            <a
              href={submission.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Read the full TOS →
            </a>
          )}
          {companyPageExists && submission.company_slug && (
            <Link
              href={`/company/${submission.company_slug}`}
              className="block text-sm text-accent hover:underline"
            >
              See full analysis of {submission.company_name} →
            </Link>
          )}
        </div>

        {/* Related Submissions */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Related Submissions
            </h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/wall-of-shame/${r.slug}`}
                  className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {r.company_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ChevronUp className="size-3" />
                      {r.upvotes}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                    &ldquo;{r.clause_text}&rdquo;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <SharePopup
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${siteConfig.url}/wall-of-shame/${submission.slug}`}
        title={`${submission.company_name} — Wall of Shame | FinePrint`}
        pageType="wall-of-shame"
        pageSlug={submission.slug}
      />
    </>
  );
}
