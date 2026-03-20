"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PendingQueue } from "@/components/admin/PendingQueue";
import { PublishedList } from "@/components/admin/PublishedList";
import { WallOfShameModeration } from "@/components/admin/WallOfShameModeration";
import { ErrorLogs } from "@/components/admin/ErrorLogs";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "pending", label: "Pending Queue" },
  { id: "published", label: "Published Companies" },
  { id: "wall-of-shame", label: "Wall of Shame" },
  { id: "error-logs", label: "Error Logs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("pending");

  // Check if already authenticated via server-side cookie check
  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setAuthenticated(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-8"
        >
          <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            autoFocus
          />
          {error && <p className="text-sm text-risk-high">{error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">
        FinePrint Admin
      </h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "pending" && <PendingQueue />}
        {activeTab === "published" && <PublishedList />}
        {activeTab === "wall-of-shame" && <WallOfShameModeration />}
        {activeTab === "error-logs" && <ErrorLogs />}
      </div>
    </div>
  );
}
