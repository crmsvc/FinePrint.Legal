"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ExternalLink, RefreshCw, AlertTriangle, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { GradeBadge } from "@/components/site/GradeBadge";
import { cn } from "@/lib/utils";

interface PublishedCompany {
  id: string;
  slug: string;
  name: string;
  domain: string;
  overall_grade: string;
  source: string;
  last_analyzed_at: string;
  tos_url: string;
  pp_url: string;
}

interface ReanalyzeResult {
  companyId: string;
  name: string;
  previousGrade: string;
  newGrade: string;
  gradeChanged: boolean;
  error?: string;
}

type SortBy = "name" | "grade" | "due";

function getDaysStatus(lastAnalyzed: string) {
  const days = Math.floor(
    (Date.now() - new Date(lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = days >= 365;
  const isDueSoon = days >= 335;
  return { days, isOverdue, isDueSoon };
}

export function PublishedList() {
  const [companies, setCompanies] = useState<PublishedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [reanalyzeResults, setReanalyzeResults] = useState<ReanalyzeResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((res) => res.json())
      .then(({ data }) => setCompanies(data || []))
      .finally(() => setLoading(false));
  }, []);

  const sortedCompanies = [...companies].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "grade") return a.overall_grade.localeCompare(b.overall_grade);
    if (sortBy === "due") {
      const aDays = a.last_analyzed_at
        ? getDaysStatus(a.last_analyzed_at).days
        : 999;
      const bDays = b.last_analyzed_at
        ? getDaysStatus(b.last_analyzed_at).days
        : 999;
      return bDays - aDays; // Most overdue first
    }
    return 0;
  });

  const handleReanalyze = useCallback(async (company: PublishedCompany) => {
    setReanalyzingId(company.id);
    try {
      const res = await fetch("/api/admin/reanalyze-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state with new grade
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === company.id
              ? {
                  ...c,
                  overall_grade: data.newGrade || c.overall_grade,
                  last_analyzed_at: new Date().toISOString(),
                }
              : c
          )
        );
        setReanalyzeResults((prev) => [
          ...prev,
          {
            companyId: company.id,
            name: company.name,
            previousGrade: data.previousGrade,
            newGrade: data.newGrade,
            gradeChanged: data.gradeChanged,
          },
        ]);
      } else {
        setReanalyzeResults((prev) => [
          ...prev,
          {
            companyId: company.id,
            name: company.name,
            previousGrade: company.overall_grade,
            newGrade: company.overall_grade,
            gradeChanged: false,
            error: data.error || "Failed",
          },
        ]);
      }
    } catch {
      setReanalyzeResults((prev) => [
        ...prev,
        {
          companyId: company.id,
          name: company.name,
          previousGrade: company.overall_grade,
          newGrade: company.overall_grade,
          gradeChanged: false,
          error: "Network error",
        },
      ]);
    } finally {
      setReanalyzingId(null);
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === companies.length
        ? new Set()
        : new Set(companies.map((c) => c.id))
    );
  }, [companies]);

  const handleReanalyzeSelected = useCallback(async () => {
    const targets = selectedIds.size > 0
      ? companies.filter((c) => selectedIds.has(c.id))
      : companies;

    setBulkRunning(true);
    setBulkProgress(0);
    setReanalyzeResults([]);

    for (let i = 0; i < targets.length; i++) {
      setBulkProgress(i + 1);
      await handleReanalyze(targets[i]);
      // Rate limit: wait 5s between analyses
      if (i < targets.length - 1) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    setBulkRunning(false);
  }, [companies, selectedIds, handleReanalyze]);

  const handleDelete = useCallback(async (company: PublishedCompany) => {
    if (!confirm(`Delete "${company.name}" from the directory? This cannot be undone.`)) {
      return;
    }

    setDeletingId(company.id);
    try {
      const res = await fetch("/api/admin/delete-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== company.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(company.id);
          return next;
        });
      } else {
        const data = await res.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch {
      alert("Network error — could not delete.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading published companies...
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No companies published via Supabase yet. Companies from local JSON files
        are managed separately.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sort + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {companies.length} published{" "}
          {companies.length === 1 ? "company" : "companies"} (Supabase-managed)
        </p>

        <div className="flex items-center gap-2">
          {/* Sort buttons */}
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {(["name", "grade", "due"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  sortBy === s
                    ? "bg-accent text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "due" ? "Due for Re-Analysis" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk re-analyze */}
          <button
            onClick={handleReanalyzeSelected}
            disabled={bulkRunning || !!reanalyzingId}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3", bulkRunning && "animate-spin")} />
            {bulkRunning
              ? `Re-Analyzing ${bulkProgress}/${selectedIds.size || companies.length}...`
              : selectedIds.size > 0
                ? `Re-Analyze Selected (${selectedIds.size})`
                : `Re-Analyze All (${companies.length})`}
          </button>
        </div>
      </div>

      {/* Re-analyze results log */}
      {reanalyzeResults.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Re-Analysis Results
          </p>
          {reanalyzeResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {r.error ? (
                <AlertTriangle className="size-3 text-red-500 shrink-0" />
              ) : r.gradeChanged ? (
                <AlertTriangle className="size-3 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
              )}
              <span className="text-foreground font-medium">{r.name}:</span>
              {r.error ? (
                <span className="text-red-500">{r.error}</span>
              ) : (
                <span className={r.gradeChanged ? "text-amber-500" : "text-muted-foreground"}>
                  {r.previousGrade} → {r.newGrade}
                  {r.gradeChanged ? " (changed!)" : " (no change)"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Companies table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === companies.length && companies.length > 0}
                  onChange={toggleSelectAll}
                  className="cursor-pointer size-3.5 rounded border-border"
                />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Company
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Grade
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                Source
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                Last Analyzed
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCompanies.map((company) => {
              const status = company.last_analyzed_at
                ? getDaysStatus(company.last_analyzed_at)
                : null;

              return (
                <tr
                  key={company.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(company.id)}
                      onChange={() => toggleSelect(company.id)}
                      className="cursor-pointer size-3.5 rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {company.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <GradeBadge grade={company.overall_grade} size="sm" />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                    {company.source === "manual" ? "Manual" : "User-submitted"}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        {company.last_analyzed_at
                          ? new Date(company.last_analyzed_at).toLocaleDateString()
                          : "—"}
                      </span>
                      {status?.isOverdue && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-500">
                          <Clock className="size-3" />
                          OVERDUE
                        </span>
                      )}
                      {status?.isDueSoon && !status.isOverdue && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                          <Clock className="size-3" />
                          DUE SOON
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/company/${company.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        View
                      </a>
                      <button
                        onClick={() => handleReanalyze(company)}
                        disabled={reanalyzingId === company.id || bulkRunning}
                        className="cursor-pointer inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw
                          className={cn(
                            "size-3",
                            reanalyzingId === company.id && "animate-spin"
                          )}
                        />
                        {reanalyzingId === company.id
                          ? "Analyzing..."
                          : "Re-Analyze"}
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        disabled={deletingId === company.id || bulkRunning}
                        className="cursor-pointer inline-flex items-center gap-1 text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="size-3" />
                        {deletingId === company.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
