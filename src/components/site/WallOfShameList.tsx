"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SharePopup } from "@/components/shared/SharePopup";
import { siteConfig } from "@/lib/site/config";

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
  clause_text: string;
  ai_explanation: string | null;
  risk_level: string;
  upvotes: number;
  created_at: string;
  categories: Category | null;
}

interface WallOfShameListProps {
  initialSubmissions: Submission[];
  categories: Category[];
}

export function WallOfShameList({
  initialSubmissions,
  categories,
}: WallOfShameListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"upvotes" | "newest">("upvotes");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [shareTarget, setShareTarget] = useState<Submission | null>(null);

  const filtered = submissions
    .filter(
      (s) =>
        activeCategory === "all" || s.categories?.id === activeCategory
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.upvotes - a.upvotes;
    });

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
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, upvotes: s.upvotes + 1 } : s
        )
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
        <button
          onClick={() => setSortBy("upvotes")}
          className={cn(
            "cursor-pointer text-xs font-medium transition-colors",
            sortBy === "upvotes"
              ? "text-foreground underline underline-offset-4"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Most Upvoted
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={() => setSortBy("newest")}
          className={cn(
            "cursor-pointer text-xs font-medium transition-colors",
            sortBy === "newest"
              ? "text-foreground underline underline-offset-4"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Newest
        </button>
      </div>

      {/* Submissions list */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No submissions yet in this category. Be the first to{" "}
            <Link
              href="/wall-of-shame/submit"
              className="text-accent hover:underline"
            >
              submit one
            </Link>
            .
          </p>
        ) : (
          filtered.map((submission) => (
            <div
              key={submission.id}
              className="rounded-lg border border-border bg-card p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/wall-of-shame/${submission.slug}`}
                    className="font-semibold text-foreground hover:text-accent transition-colors"
                  >
                    {submission.company_name}
                  </Link>
                  {submission.categories && (
                    <span className="ml-2 inline-block rounded-full bg-risk-high/10 px-2 py-0.5 text-xs font-medium text-risk-high">
                      {submission.categories.icon}{" "}
                      {submission.categories.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Clause preview */}
              <blockquote className="border-l-2 border-risk-high/40 pl-3 text-sm text-muted-foreground italic line-clamp-3">
                &ldquo;{submission.clause_text}&rdquo;
              </blockquote>

              {/* AI explanation preview */}
              {submission.ai_explanation && (
                <p className="text-sm text-foreground line-clamp-2">
                  <span className="font-medium text-accent">
                    This means:{" "}
                  </span>
                  {submission.ai_explanation}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={() => handleVote(submission.id)}
                  className={cn(
                    "cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    votedIds.has(submission.id)
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ChevronUp className="size-4" />
                  {submission.upvotes}
                </button>

                <button
                  onClick={() => setShareTarget(submission)}
                  className="cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Share2 className="size-4" />
                  Share
                </button>

                <Link
                  href={`/wall-of-shame/${submission.slug}`}
                  className="ml-auto text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  Read more →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share popup */}
      {shareTarget && (
        <SharePopup
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          url={`${siteConfig.url}/wall-of-shame/${shareTarget.slug}`}
          title={`${shareTarget.company_name} — Wall of Shame | FinePrint`}
          pageType="wall-of-shame"
          pageSlug={shareTarget.slug}
        />
      )}
    </div>
  );
}
