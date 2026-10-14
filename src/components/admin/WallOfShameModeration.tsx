"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Check,
  X,
  Trash2,
  Pencil,
  EyeOff,
  Save,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  slug: string;
  company_name: string;
  clause_text: string;
  ai_explanation: string | null;
  category_id: string | null;
  status: string;
  upvotes: number;
  created_at: string;
  categories: { id: string; name: string; icon: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

type SubTab = "pending" | "approved" | "rejected";

export function WallOfShameModeration() {
  const [subTab, setSubTab] = useState<SubTab>("pending");
  const [pending, setPending] = useState<Submission[]>([]);
  const [approved, setApproved] = useState<Submission[]>([]);
  const [rejected, setRejected] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [loadingRejected, setLoadingRejected] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    company_name: string;
    clause_text: string;
    ai_explanation: string;
    category_id: string;
  }>({ company_name: "", clause_text: "", ai_explanation: "", category_id: "" });

  const fetchPending = useCallback(() => {
    setLoadingPending(true);
    fetch("/api/admin/wall-of-shame?status=pending")
      .then((res) => res.json())
      .then(({ data }) => setPending(data || []))
      .finally(() => setLoadingPending(false));
  }, []);

  const fetchApproved = useCallback(() => {
    setLoadingApproved(true);
    fetch("/api/admin/wall-of-shame?status=approved")
      .then((res) => res.json())
      .then(({ data }) => setApproved(data || []))
      .finally(() => setLoadingApproved(false));
  }, []);

  const fetchRejected = useCallback(() => {
    setLoadingRejected(true);
    fetch("/api/admin/wall-of-shame?status=rejected")
      .then((res) => res.json())
      .then(({ data }) => setRejected(data || []))
      .finally(() => setLoadingRejected(false));
  }, []);

  useEffect(() => {
    fetchPending();
    fetchApproved();
    fetchRejected();
    // Fetch categories for the edit dropdown
    fetch("/api/admin/wall-of-shame/categories")
      .then((res) => res.json())
      .then(({ data }) => setCategories(data || []))
      .catch(() => {});
  }, [fetchPending, fetchApproved, fetchRejected]);

  // === Pending actions ===

  const handleApprove = async (id: string) => {
    setActing(id);
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: id }),
    });

    if (res.ok) {
      toast.success("Approved — now live on Wall of Shame");
      setPending((prev) => prev.filter((i) => i.id !== id));
      setRejected((prev) => prev.filter((i) => i.id !== id));
      fetchApproved();
    } else {
      toast.error("Failed to approve");
    }
    setActing(null);
  };

  const handleReject = async (id: string) => {
    setActing(id);
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "submission" }),
    });

    if (res.ok) {
      toast.success("Rejected — moved to WOS Rejections");
      setPending((prev) => prev.filter((i) => i.id !== id));
      fetchRejected();
    } else {
      toast.error("Failed to reject");
    }
    setActing(null);
  };

  const handleSpam = async (id: string, fromTab: SubTab) => {
    if (!confirm("Permanently delete this submission?")) return;

    setActing(id);
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "submission", reason: "spam" }),
    });

    if (res.ok) {
      toast.success("Permanently deleted");
      if (fromTab === "pending") {
        setPending((prev) => prev.filter((i) => i.id !== id));
      } else if (fromTab === "rejected") {
        setRejected((prev) => prev.filter((i) => i.id !== id));
      } else {
        setApproved((prev) => prev.filter((i) => i.id !== id));
      }
    }
    setActing(null);
  };

  // === Approved actions ===

  const startEdit = (item: Submission) => {
    setEditingId(item.id);
    setExpandedId(item.id);
    setEditForm({
      company_name: item.company_name,
      clause_text: item.clause_text,
      ai_explanation: item.ai_explanation || "",
      category_id: item.category_id || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setActing(id);
    const res = await fetch("/api/admin/wall-of-shame/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });

    if (res.ok) {
      toast.success("Updated successfully");
      setEditingId(null);
      fetchApproved();
    } else {
      toast.error("Failed to update");
    }
    setActing(null);
  };

  const handleUnpublish = async (id: string) => {
    if (!confirm("Remove this from the public Wall of Shame?")) return;

    setActing(id);
    const res = await fetch("/api/admin/wall-of-shame/unpublish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      toast.success("Unpublished — moved to WOS Rejections");
      setApproved((prev) => prev.filter((i) => i.id !== id));
      fetchRejected();
    } else {
      toast.error("Failed to unpublish");
    }
    setActing(null);
  };

  const handleDeleteApproved = async (id: string) => {
    if (!confirm("Permanently delete this entry? This cannot be undone."))
      return;

    setActing(id);
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "submission", reason: "spam" }),
    });

    if (res.ok) {
      toast.success("Permanently deleted");
      setApproved((prev) => prev.filter((i) => i.id !== id));
    }
    setActing(null);
  };

  // === Rejected actions ===

  const handleReapprove = async (id: string) => {
    setActing(id);
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: id }),
    });

    if (res.ok) {
      toast.success("Re-approved — now live on Wall of Shame");
      setRejected((prev) => prev.filter((i) => i.id !== id));
      fetchApproved();
    } else {
      toast.error("Failed to re-approve");
    }
    setActing(null);
  };

  // === Rendering ===

  const items =
    subTab === "pending"
      ? pending
      : subTab === "approved"
        ? approved
        : rejected;
  const loading =
    subTab === "pending"
      ? loadingPending
      : subTab === "approved"
        ? loadingApproved
        : loadingRejected;

  const emptyMessage =
    subTab === "pending"
      ? "No pending submissions to review."
      : subTab === "approved"
        ? "No approved entries yet."
        : "No rejected submissions.";

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSubTab("pending")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "pending"
              ? "bg-accent text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Pending{" "}
          {!loadingPending && pending.length > 0 && (
            <span className="ml-1 rounded-full bg-risk-high/20 px-1.5 py-0.5 text-xs text-risk-high">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab("approved")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "approved"
              ? "bg-accent text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Approved{" "}
          {!loadingApproved && approved.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({approved.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab("rejected")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            subTab === "rejected"
              ? "bg-accent text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          WOS Rejections{" "}
          {!loadingRejected && rejected.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({rejected.length})
            </span>
          )}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading {subTab} submissions...
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {emptyMessage}
        </p>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {items.length} {subTab}{" "}
            {items.length === 1 ? "submission" : "submissions"}
          </p>

          {items.map((item) => {
            const isEditing = editingId === item.id;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card"
              >
                {/* Summary row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => {
                    if (!isEditing) {
                      setExpandedId(isExpanded ? null : item.id);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">
                        {item.company_name}
                      </p>
                      {item.categories && (
                        <span className="text-xs text-muted-foreground">
                          {item.categories.icon} {item.categories.name}
                        </span>
                      )}
                      {subTab === "approved" && (
                        <span className="text-xs text-grade-a">
                          ↑ {item.upvotes}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.clause_text.slice(0, 100)}...
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Edit mode (approved tab only) */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={editForm.company_name}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                company_name: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Category
                          </label>
                          <select
                            value={editForm.category_id}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                category_id: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                          >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Clause Text
                          </label>
                          <textarea
                            value={editForm.clause_text}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                clause_text: e.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            AI Explanation
                          </label>
                          <textarea
                            value={editForm.ai_explanation}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                ai_explanation: e.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={acting === item.id}
                            className="cursor-pointer flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                          >
                            {acting === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Save className="size-3.5" />
                            )}
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="size-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Read-only view */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            The Clause
                          </p>
                          <blockquote className="border-l-2 border-risk-high/40 pl-3 text-sm text-foreground italic">
                            &ldquo;{item.clause_text}&rdquo;
                          </blockquote>
                        </div>

                        {item.ai_explanation && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              AI Explanation
                            </p>
                            <p className="text-sm text-foreground">
                              {item.ai_explanation}
                            </p>
                          </div>
                        )}

                        {/* Action buttons — vary by tab */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {subTab === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-grade-a px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {acting === item.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Check className="size-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-risk-high hover:bg-risk-high/10 disabled:opacity-50"
                              >
                                <X className="size-3.5" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleSpam(item.id, "pending")}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-risk-high disabled:opacity-50"
                              >
                                <Trash2 className="size-3.5" />
                                Spam
                              </button>
                            </>
                          )}

                          {subTab === "approved" && (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleUnpublish(item.id)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-500/10 disabled:opacity-50"
                              >
                                <EyeOff className="size-3.5" />
                                Unpublish
                              </button>
                              <button
                                onClick={() => handleDeleteApproved(item.id)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-risk-high disabled:opacity-50"
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </button>
                            </>
                          )}

                          {subTab === "rejected" && (
                            <>
                              <button
                                onClick={() => handleReapprove(item.id)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-grade-a px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {acting === item.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Undo2 className="size-3.5" />
                                )}
                                Re-approve
                              </button>
                              <button
                                onClick={() => startEdit(item)}
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleSpam(item.id, "rejected")
                                }
                                disabled={acting === item.id}
                                className="cursor-pointer flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-risk-high disabled:opacity-50"
                              >
                                <Trash2 className="size-3.5" />
                                Delete Permanently
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
