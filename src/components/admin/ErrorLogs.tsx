"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2, AlertTriangle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorLog {
  id: string;
  company_id: string | null;
  company_name: string;
  action: string;
  error_message: string;
  context: Record<string, unknown>;
  created_at: string;
}

export function ErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/error-logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClear = useCallback(async () => {
    if (!confirm("Clear all error logs? This cannot be undone.")) return;

    setClearing(true);
    try {
      const res = await fetch("/api/admin/error-logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
      }
    } catch {
      alert("Failed to clear logs.");
    } finally {
      setClearing(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading error logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="size-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">No error logs yet.</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Errors from re-analysis, publishing, and other admin actions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </p>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-3" />
          {clearing ? "Clearing..." : "Clear All Logs"}
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {logs.map((log) => {
          const isExpanded = expandedId === log.id;
          const isWarning = log.action.includes("warning");
          const time = new Date(log.created_at);
          const contextEntries = Object.entries(log.context || {}).filter(
            ([, v]) => v !== null && v !== undefined && v !== ""
          );

          return (
            <div key={log.id} className="bg-card">
              <button
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="cursor-pointer w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                {isWarning ? (
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {log.company_name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                        isWarning
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {time.toLocaleDateString()} {time.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {log.error_message}
                  </p>
                </div>

                {contextEntries.length > 0 && (
                  isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  )
                )}
              </button>

              {isExpanded && contextEntries.length > 0 && (
                <div className="px-4 pb-3 ml-7">
                  <div className="rounded-md bg-muted/50 border border-border p-3 text-xs font-mono space-y-1">
                    {contextEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{key}:</span>
                        <span className="text-foreground break-all">
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
