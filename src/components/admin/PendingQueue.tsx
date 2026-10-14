"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { GradeBadge } from "@/components/site/GradeBadge";

interface PendingAnalysis {
  id: string;
  domain: string;
  company_name: string;
  source_url: string;
  overall_grade: string;
  verdict: string;
  submission_count: number;
  analysis_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function PendingQueue() {
  const [items, setItems] = useState<PendingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pending");
    const { data } = await res.json();
    setItems(data || []);
    setLoading(false);
  };

  const handlePublish = async (item: PendingAnalysis) => {
    const slug = editSlug || item.domain.replace(/\./g, "-").replace("www-", "");
    const name = editName || item.company_name;

    setPublishing(item.id);
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pendingId: item.id,
        companyName: name,
        slug,
        grade: item.overall_grade,
        verdict: item.verdict,
      }),
    });

    if (res.ok) {
      toast.success(`Published /company/${slug}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      toast.error("Failed to publish");
    }
    setPublishing(null);
    setExpandedId(null);
  };

  const handleReject = async (id: string) => {
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "pending" }),
    });

    if (res.ok) {
      toast.success("Rejected");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      toast.error("Failed to reject");
    }
  };

  const handleReanalyze = async (id: string) => {
    setPublishing(id);
    const res = await fetch("/api/admin/reanalyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingId: id }),
    });

    if (res.ok) {
      toast.success("Re-analysis complete");
      fetchPending();
    } else {
      const { error } = await res.json();
      toast.error(error || "Re-analysis failed");
    }
    setPublishing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading pending queue...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No pending analyses in the queue.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {items.length} pending {items.length === 1 ? "analysis" : "analyses"} —
        sorted by submission count
      </p>

      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border bg-card"
        >
          {/* Summary row */}
          <div
            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => {
              setExpandedId(expandedId === item.id ? null : item.id);
              setEditSlug(item.domain.replace(/\./g, "-").replace("www-", ""));
              setEditName(item.company_name);
            }}
          >
            <GradeBadge grade={item.overall_grade} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground">
                {item.company_name || item.domain}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.domain} · {item.submission_count} analysis
                {item.submission_count !== 1 ? "es" : ""}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Expanded details */}
          {expandedId === item.id && (
            <div className="border-t border-border p-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{item.verdict}</p>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {item.source_url}
                </a>
              </div>

              {/* Edit fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Company Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    URL Slug
                  </label>
                  <input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePublish(item)}
                  disabled={publishing === item.id}
                  className="cursor-pointer flex items-center gap-1.5 rounded-md bg-grade-a px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {publishing === item.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Publish
                </button>
                <button
                  onClick={() => handleReanalyze(item.id)}
                  disabled={publishing === item.id}
                  className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" />
                  Re-Analyze
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-risk-high hover:bg-risk-high/10 transition-colors"
                >
                  <X className="size-3.5" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
