"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Database,
  Share2,
  Scale,
  DoorOpen,
  AlertTriangle,
  MessageSquareText,
  FileWarning,
  FolderPlus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PrintCopy } from "@/components/shared/PrintCopy";
import { RateCounter } from "@/components/shared/RateCounter";
import { Disclaimer } from "@/components/shared/Disclaimer";
import { GradeCard } from "@/components/site/GradeCard";
import type {
  TOSAnalysisResult,
  AnalysisResult,
  RiskLevel,
} from "@/lib/shared/gemini";

const WALL_OF_SHAME_ENABLED = false;

interface ResultsDisplayProps {
  analysis: TOSAnalysisResult;
  sourceUrl?: string;
  remaining?: number;
  limit?: number;
  pageType?: "company" | "wall-of-shame" | "hall-of-fame" | "live-result";
  pageSlug?: string;
  companyName?: string;
  canGrade?: boolean;
  documentType?: string | null;
  inputMethod?: string | null;
  companionUrl?: string | null;
  isCombined?: boolean;
  primaryText?: string;
  onReanalyze?: (combinedText: string, meta: {
    sourceUrl: string;
    companionUrl: string;
    canGrade: boolean;
    documentType: string;
    isCombined: boolean;
    inputMethod: string;
    primaryText: string;
  }) => void;
}

export function ResultsDisplay({
  analysis,
  sourceUrl,
  remaining,
  limit,
  pageType,
  pageSlug,
  companyName,
  canGrade,
  documentType,
  inputMethod,
  companionUrl,
  isCombined,
  primaryText,
  onReanalyze,
}: ResultsDisplayProps) {
  if (analysis.mode === "not_tos") {
    return <NotTOSDisplay message={analysis.message} />;
  }

  return (
    <FullAnalysisDisplay
      analysis={analysis}
      sourceUrl={sourceUrl}
      remaining={remaining}
      limit={limit}
      pageType={pageType}
      pageSlug={pageSlug}
      companyName={companyName}
      canGrade={canGrade}
      documentType={documentType}
      inputMethod={inputMethod}
      companionUrl={companionUrl}
      isCombined={isCombined}
      primaryText={primaryText}
      onReanalyze={onReanalyze}
    />
  );
}

/* ---------- Not-TOS ---------- */

function NotTOSDisplay({ message }: { message: string }) {
  return (
    <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="flex items-start gap-4">
        <FileWarning className="mt-0.5 size-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <p className="font-medium text-foreground">
            Not a Terms of Service or Privacy Policy
          </p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Full Analysis ---------- */

function FullAnalysisDisplay({
  analysis,
  sourceUrl,
  remaining,
  limit,
  pageType,
  pageSlug,
  companyName,
  canGrade,
  documentType,
  inputMethod,
  companionUrl,
  isCombined,
  primaryText,
  onReanalyze,
}: {
  analysis: AnalysisResult;
  sourceUrl?: string;
  remaining?: number;
  limit?: number;
  pageType?: "company" | "wall-of-shame" | "hall-of-fame" | "live-result";
  pageSlug?: string;
  companyName?: string;
  canGrade?: boolean;
  documentType?: string | null;
  inputMethod?: string | null;
  companionUrl?: string | null;
  isCombined?: boolean;
  primaryText?: string;
  onReanalyze?: (combinedText: string, meta: {
    sourceUrl: string;
    companionUrl: string;
    canGrade: boolean;
    documentType: string;
    isCombined: boolean;
    inputMethod: string;
    primaryText: string;
  }) => void;
}) {
  const [companionInput, setCompanionInput] = useState("");
  const [companionError, setCompanionError] = useState<string | null>(null);
  const [companionLoading, setCompanionLoading] = useState(false);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);
  const [directorySubmitting, setDirectorySubmitting] = useState(false);
  const [directorySubmitted, setDirectorySubmitted] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Re-analyze with companion URL (manual entry)
  const handleAddCompanion = async () => {
    if (!companionInput.trim() || !sourceUrl || !primaryText || !onReanalyze) return;

    setCompanionError(null);
    setCompanionLoading(true);

    try {
      const originalDomain = new URL(sourceUrl).hostname.replace("www.", "");
      const inputDomain = new URL(companionInput.trim()).hostname.replace("www.", "");

      if (originalDomain !== inputDomain) {
        setCompanionError(
          `The URL must be from the same website (${originalDomain}).`
        );
        setCompanionLoading(false);
        return;
      }

      // Fetch companion document
      const companionResponse = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: companionInput.trim() }),
      });
      const companionData = await companionResponse.json();

      if (!companionResponse.ok) {
        setCompanionError(companionData.error || "Could not fetch that URL.");
        setCompanionLoading(false);
        return;
      }

      // Construct combined text
      const companionTextContent = companionData.text;
      const tosText = documentType === "tos" ? primaryText : companionTextContent;
      const ppText = documentType === "pp" ? primaryText : companionTextContent;
      const tosUrl = documentType === "tos" ? sourceUrl : companionInput.trim();
      const ppUrl = documentType === "pp" ? sourceUrl : companionInput.trim();

      const combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppText}`;

      onReanalyze(combinedText, {
        sourceUrl,
        companionUrl: companionInput.trim(),
        canGrade: true,
        documentType: "combined",
        isCombined: true,
        inputMethod: "url",
        primaryText,
      });
    } catch {
      setCompanionError("Invalid URL format.");
    } finally {
      setCompanionLoading(false);
    }
  };

  // Re-analyze with previously found companion (soft upsell button)
  const handleReanalyzeBoth = async () => {
    if (!sourceUrl || !primaryText || !companionUrl || !onReanalyze) return;

    setReanalyzeLoading(true);

    try {
      // Fetch companion document
      const companionResponse = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: companionUrl }),
      });
      const companionData = await companionResponse.json();

      if (!companionResponse.ok) {
        setReanalyzeLoading(false);
        return;
      }

      const companionTextContent = companionData.text;
      const tosText = documentType === "tos" ? primaryText : companionTextContent;
      const ppText = documentType === "pp" ? primaryText : companionTextContent;
      const tosUrl = documentType === "tos" ? sourceUrl : companionUrl;
      const ppUrl = documentType === "pp" ? sourceUrl : companionUrl;

      const combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppText}`;

      onReanalyze(combinedText, {
        sourceUrl,
        companionUrl,
        canGrade: true,
        documentType: "combined",
        isCombined: true,
        inputMethod: "url",
        primaryText,
      });
    } catch {
      // Silently fail
    } finally {
      setReanalyzeLoading(false);
    }
  };

  // Submit to directory
  const handleDirectorySubmit = async () => {
    if (!sourceUrl || !canGrade || directorySubmitted) return;

    setDirectorySubmitting(true);
    setDirectoryError(null);

    try {
      const domain = new URL(sourceUrl).hostname.replace("www.", "");
      const response = await fetch("/api/directory/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || domain,
          domain,
          tosUrl: sourceUrl,
          ppUrl: companionUrl || sourceUrl,
          grade: analysis.grade,
          verdict: analysis.verdict,
          analysisJson: analysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDirectoryError(data.error || "Failed to submit.");
        return;
      }

      setDirectorySubmitted(true);
    } catch {
      setDirectoryError("Something went wrong. Please try again.");
    } finally {
      setDirectorySubmitting(false);
    }
  };

  return (
    <div id="results-printable" className="mt-4 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-end print:hidden">
        <PrintCopy targetId="results-printable" />
      </div>

      {/* Combined analysis — show both sources */}
      {canGrade && isCombined && sourceUrl && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Sources analyzed:</p>
          <p className="text-emerald-600 dark:text-emerald-400">
            ✓ Terms of Service: {sourceUrl}
          </p>
          <p className="text-emerald-600 dark:text-emerald-400">
            ✓ Privacy Policy: {companionUrl || "included in document"}{" "}
            {companionUrl ? "(auto-detected)" : ""}
          </p>
        </div>
      )}

      {/* URL input, companion not found, user hasn't chosen "analyze only" — show add companion banner */}
      {inputMethod === "url" && !canGrade && !companionUrl && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            Add the{" "}
            {documentType === "tos" ? "Privacy Policy" : "Terms of Service"} URL
            for a verified grade:
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder={`Paste ${documentType === "tos" ? "Privacy Policy" : "TOS"} URL from the same website`}
              className="flex-1 text-sm px-3 py-2 border rounded bg-background"
              value={companionInput}
              onChange={(e) => {
                setCompanionInput(e.target.value);
                setCompanionError(null);
              }}
            />
            <button
              onClick={handleAddCompanion}
              disabled={companionLoading || !companionInput.trim()}
              className="cursor-pointer text-sm px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {companionLoading ? "Loading..." : "Add & Get Grade"}
            </button>
          </div>
          {companionError && (
            <p className="text-xs text-red-600 mt-1">{companionError}</p>
          )}
        </div>
      )}

      {/* Paste text or upload file — no grade available */}
      {(inputMethod === "text" || inputMethod === "upload") && (
        <div className="p-4 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            For a verified letter grade, use the{" "}
            <strong className="text-foreground">Paste URL</strong> tab so we can
            fetch both documents directly from the source.
          </p>
        </div>
      )}

      {/* 1. Grade */}
      <GradeCard
        grade={analysis.grade}
        verdict={analysis.verdict}
        companyName={companyName}
        pageType={pageType}
        pageSlug={pageSlug}
        canGrade={canGrade}
        documentType={documentType}
        inputMethod={inputMethod}
      />

      {sourceUrl && !isCombined && (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/30 hover:decoration-foreground/50"
          >
            {sourceUrl}
          </a>
        </p>
      )}

      {/* 2. What They Collect */}
      {analysis.whatTheyCollect.length > 0 && (
        <Section icon={Database} title="What They Collect">
          <div className="grid gap-3">
            {analysis.whatTheyCollect.map((item, i) => (
              <div
                key={i}
                className={`rounded-lg border-l-4 bg-muted/30 p-3 ${riskBorderColor(item.riskLevel)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{item.category}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.details}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!item.mandatory && (
                      <span className="text-xs text-muted-foreground italic">
                        optional
                      </span>
                    )}
                    <RiskBadge level={item.riskLevel} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 3. What They Do With Your Data */}
      {analysis.whatTheyDoWithData.length > 0 && (
        <Section icon={Share2} title="What They Do With Your Data">
          <div className="grid gap-3">
            {analysis.whatTheyDoWithData.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.practice}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.details}
                  </p>
                </div>
                <RiskBadge level={item.riskLevel} className="shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 4. What Rights You Give Up */}
      {analysis.rightsYouGiveUp.length > 0 && (
        <Section icon={Scale} title="What Rights You Give Up">
          <div className="grid gap-4">
            {analysis.rightsYouGiveUp.map((clause, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{clause.title}</p>
                  <RiskBadge level={clause.riskLevel} className="shrink-0" />
                </div>
                {clause.originalText && (
                  <blockquote className="border-l-2 border-border pl-3 text-xs text-muted-foreground italic">
                    &ldquo;{clause.originalText}&rdquo;
                  </blockquote>
                )}
                <p className="text-sm text-foreground">
                  <span className="font-medium text-accent">This means: </span>
                  {clause.translation}
                </p>
                {i < analysis.rightsYouGiveUp.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 5. How to Leave */}
      <Section icon={DoorOpen} title="How to Leave">
        <div className="space-y-3">
          <InfoRow label="Delete your account" value={analysis.howToLeave.canDelete} />
          <InfoRow label="Data retention" value={analysis.howToLeave.dataRetention} />
          <InfoRow label="Data portability" value={analysis.howToLeave.dataPortability} />
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              Overall exit difficulty:
            </span>
            <RiskBadge level={analysis.howToLeave.overallDifficulty} />
          </div>
        </div>
      </Section>

      {/* 6. Red Flags */}
      {analysis.redFlags.length > 0 && (
        <Section icon={AlertTriangle} title="Red Flags" variant="danger">
          <div className="grid gap-4">
            {analysis.redFlags.map((flag, i) => (
              <div
                key={i}
                className="rounded-lg border border-risk-high/20 bg-risk-high-bg/50 p-3 space-y-1.5"
              >
                <p className="font-medium text-sm text-risk-high">
                  {flag.clause}
                </p>
                <p className="text-sm text-foreground">{flag.whyItMatters}</p>
                <p className="text-xs text-muted-foreground italic">
                  Industry context: {flag.industryComparison}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 7. The Bottom Line */}
      <Section icon={MessageSquareText} title="The Bottom Line">
        <p className="text-base leading-relaxed text-foreground">
          {analysis.bottomLine}
        </p>
      </Section>

      {/* Soft upsell — only for "Analyze Only" results when companion was available */}
      {!canGrade && inputMethod === "url" && companionUrl && onReanalyze && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg print:hidden">
          <p className="text-sm text-muted-foreground">
            Want the full picture? Analyze both the TOS and Privacy Policy together for a verified letter grade.
          </p>
          <button
            onClick={handleReanalyzeBoth}
            disabled={reanalyzeLoading}
            className="cursor-pointer mt-2 flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            {reanalyzeLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Re-analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Re-analyze with both documents
              </>
            )}
          </button>
        </div>
      )}

      {/* Add to Directory — only for graded analyses on the homepage */}
      {canGrade && pageType === "live-result" && sourceUrl && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg print:hidden">
          {directorySubmitted ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Submitted! We&apos;ll review and add it to the directory.
            </p>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <FolderPlus className="size-5 shrink-0 text-accent mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Add this company to the FinePrint Directory
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help others by adding this analysis to our public company directory. Submissions are reviewed before publishing.
                  </p>
                </div>
              </div>
              {directoryError && (
                <p className="text-xs text-red-600 mt-2">{directoryError}</p>
              )}
              <button
                onClick={handleDirectorySubmit}
                disabled={directorySubmitting}
                className="cursor-pointer mt-3 flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
              >
                {directorySubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FolderPlus className="size-3.5" />
                    Add to Directory
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      <Separator />

      {/* Actions & Meta */}
      <div className="flex flex-wrap items-center gap-4">
        <PrintCopy targetId="results-printable" />
        {remaining !== undefined && limit !== undefined && (
          <RateCounter remaining={remaining} limit={limit} />
        )}
      </div>

      <Disclaimer variant="results" />
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({
  icon: Icon,
  title,
  variant,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  variant?: "danger";
  children: React.ReactNode;
}) {
  return (
    <Card
      className={
        variant === "danger"
          ? "border-risk-high/20"
          : undefined
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={`size-5 ${
              variant === "danger" ? "text-risk-high" : "text-accent"
            }`}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function riskBorderColor(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "border-l-risk-low";
    case "MEDIUM":
      return "border-l-risk-medium";
    case "HIGH":
      return "border-l-risk-high";
  }
}
