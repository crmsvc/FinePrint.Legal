"use client";

import { useState, useEffect } from "react";
import { Share2, FileSearch } from "lucide-react";
import { parseGrade, getGradeCSSClass } from "@/lib/site/grade";
import { cn } from "@/lib/utils";
import { SharePopup } from "@/components/shared/SharePopup";

interface GradeCardProps {
  grade: string;
  verdict: string;
  companyName?: string;
  lastAnalyzed?: string;
  pageType?: "company" | "wall-of-shame" | "hall-of-fame" | "live-result";
  pageSlug?: string;
  className?: string;
  canGrade?: boolean;
  documentType?: string | null;
  inputMethod?: string | null;
}

export function GradeCard({
  grade,
  verdict,
  companyName,
  lastAnalyzed,
  pageType,
  pageSlug,
  className,
  canGrade = true,
  documentType,
  inputMethod,
}: GradeCardProps) {
  const parsed = parseGrade(grade);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCount, setShareCount] = useState<number>(0);

  useEffect(() => {
    if (pageSlug) {
      fetch(`/api/share/count?slug=${pageSlug}`)
        .then((res) => res.json())
        .then((data) => setShareCount(data.count))
        .catch(() => {});
    }
  }, [pageSlug]);

  // Ungraded analysis header for single-document or paste/upload inputs
  if (!canGrade || grade === "N/A") {
    const docLabel =
      documentType === "tos"
        ? "Terms of Service"
        : documentType === "pp"
          ? "Privacy Policy"
          : "Policy";

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center sm:flex-row sm:text-left",
          className
        )}
      >
        <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileSearch className="size-8" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {docLabel} Analysis
          </p>
          <p className="text-base font-medium text-foreground leading-relaxed">
            {verdict}
          </p>
          <p className="text-xs text-muted-foreground">
            A verified letter grade requires both the TOS and Privacy Policy.
            {inputMethod === "url"
              ? " Add the companion URL below for a complete grade."
              : " Use the Paste URL tab to fetch both documents from the source."}
          </p>
        </div>
      </div>
    );
  }

  const shareTitle = companyName
    ? `${companyName} — Grade: ${parsed.grade} | FinePrint`
    : `Grade: ${parsed.grade} | FinePrint`;

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center sm:flex-row sm:text-left",
          className
        )}
      >
        {/* Grade circle */}
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold shadow-sm",
            getGradeCSSClass(parsed.letter)
          )}
        >
          {parsed.grade}
        </div>

        {/* Verdict */}
        <div className="min-w-0 flex-1 space-y-1">
          {companyName && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {companyName}
            </h2>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {parsed.label}
          </p>
          <p className="text-base font-medium text-foreground leading-relaxed">
            {verdict}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {lastAnalyzed && (
              <p className="text-xs text-muted-foreground">
                Last analyzed:{" "}
                {new Date(lastAnalyzed).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            <a
              href="/how-we-grade"
              className="text-xs text-muted-foreground hover:text-accent transition-colors cursor-pointer"
            >
              How do we grade? →
            </a>
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="cursor-pointer shrink-0 flex items-center gap-1 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Share this analysis"
        >
          <Share2 className="size-5" />
          {shareCount > 0 && (
            <span className="text-sm">{shareCount}</span>
          )}
        </button>
      </div>

      <SharePopup
        isOpen={shareOpen}
        onClose={() => {
          setShareOpen(false);
          // Refresh share count after sharing
          if (pageSlug) {
            fetch(`/api/share/count?slug=${pageSlug}`)
              .then((res) => res.json())
              .then((data) => setShareCount(data.count))
              .catch(() => {});
          }
        }}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={shareTitle}
        pageType={pageType}
        pageSlug={pageSlug}
      />
    </>
  );
}
