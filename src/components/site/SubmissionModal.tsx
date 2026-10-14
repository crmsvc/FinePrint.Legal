"use client";

import { useEffect, useRef, useState } from "react";
import { X, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: {
    clauseText: string;
    aiExplanation: string;
    companyName: string;
    sourceUrl: string;
    prefillHeadline?: string;
    prefillIndustryContext?: string;
    prefillRiskLevel?: string;
    suggestedCategory?: string;
  };
  categories: { id: string; slug: string; name: string }[];
}

export function SubmissionModal({
  isOpen,
  onClose,
  prefill,
  categories,
}: SubmissionModalProps) {
  const [companyName, setCompanyName] = useState(prefill?.companyName || "");
  const [sourceUrl, setSourceUrl] = useState(prefill?.sourceUrl || "");
  const [clauseText, setClauseText] = useState(prefill?.clauseText || "");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const hasPrefill = !!(prefill?.prefillHeadline);

  useEffect(() => {
    if (prefill) {
      setCompanyName(prefill.companyName || "");
      setSourceUrl(prefill.sourceUrl || "");
      setClauseText(prefill.clauseText || "");
      // Auto-select category if suggested
      if (prefill.suggestedCategory) {
        const match = categories.find(
          (c) => c.slug === prefill.suggestedCategory || c.name === prefill.suggestedCategory
        );
        if (match) setCategoryId(match.id);
      }
    }
  }, [prefill, categories]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (clauseText.trim().length < 50) {
      toast.error("Clause text must be at least 50 characters");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setSubmitting(true);
    if (!hasPrefill) setAnalyzing(true);
    try {
      const res = await fetch("/api/wall-of-shame/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          clauseText: clauseText.trim(),
          categoryId,
          // Pass prefilled AI data if available (skips server-side AI analysis)
          ...(hasPrefill && {
            prefillHeadline: prefill?.prefillHeadline,
            prefillExplanation: prefill?.aiExplanation,
            prefillIndustryContext: prefill?.prefillIndustryContext,
            prefillRiskLevel: prefill?.prefillRiskLevel,
          }),
        }),
      });

      const data = await res.json();

      if (res.status === 422) {
        toast.error(
          "This doesn't look like a TOS clause. Please paste the actual text from a Terms of Service or Privacy Policy."
        );
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }

      toast.success(
        "Thanks! Your submission is under review. If approved, it'll appear on the Wall of Shame."
      );
      onClose();
      // Reset form
      setCompanyName("");
      setSourceUrl("");
      setClauseText("");
      setCategoryId("");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl mx-4"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Flag className="size-4 text-risk-high" />
            Submit to Wall of Shame
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label
              htmlFor="wos-company"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Company Name
            </label>
            <input
              id="wos-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Instagram"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Source URL */}
          <div>
            <label
              htmlFor="wos-url"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Source URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="wos-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/terms"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Clause Text */}
          <div>
            <label
              htmlFor="wos-clause"
              className="block text-sm font-medium text-foreground mb-1"
            >
              The Clause{" "}
              <span className="text-muted-foreground font-normal">
                (min 50 characters)
              </span>
            </label>
            <textarea
              id="wos-clause"
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              placeholder="Paste the outrageous TOS clause here..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {clauseText.length}/50 characters minimum
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="wos-category"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Category
            </label>
            <select
              id="wos-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full cursor-pointer rounded-lg bg-risk-high px-4 py-2.5 text-sm font-medium text-white hover:bg-risk-high/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {analyzing ? "Analyzing clause..." : "Submitting..."}
              </>
            ) : (
              "Submit for Review"
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {hasPrefill
              ? "Pre-analyzed from FinePrint results. All submissions are reviewed before being published."
              : "Your clause will be AI-analyzed for verification. All submissions are reviewed before being published."}
          </p>
        </div>
      </div>
    </div>
  );
}
