"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubmissionFormProps {
  categories: { id: string; slug: string; name: string }[];
}

export function SubmissionForm({ categories }: SubmissionFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [clauseText, setClauseText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    try {
      const res = await fetch("/api/wall-of-shame/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          clauseText: clauseText.trim(),
          categoryId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          Thanks for your submission!
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your submission is under review. If approved, it&apos;ll appear on the
          Wall of Shame.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setCompanyName("");
            setSourceUrl("");
            setClauseText("");
            setCategoryId("");
          }}
          className="mt-4 cursor-pointer text-sm text-accent hover:underline"
        >
          Submit another →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Company Name */}
      <div>
        <label
          htmlFor="company-name"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Company Name
        </label>
        <input
          id="company-name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Instagram"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          required
        />
      </div>

      {/* Source URL */}
      <div>
        <label
          htmlFor="source-url"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Source URL{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="source-url"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://example.com/terms"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* Clause Text */}
      <div>
        <label
          htmlFor="clause-text"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          The Clause{" "}
          <span className="text-muted-foreground font-normal">
            (min 50 characters)
          </span>
        </label>
        <textarea
          id="clause-text"
          value={clauseText}
          onChange={(e) => setClauseText(e.target.value)}
          placeholder="Paste the outrageous TOS clause here..."
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          required
          minLength={50}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {clauseText.length}/50 characters minimum
        </p>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
          required
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
        type="submit"
        disabled={submitting}
        className="w-full cursor-pointer rounded-lg bg-risk-high px-4 py-2.5 text-sm font-medium text-white hover:bg-risk-high/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit for Review"
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        All submissions are reviewed by our team before being published. You can
        submit up to 2 per day.
      </p>
    </form>
  );
}
