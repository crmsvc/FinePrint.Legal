"use client";

import { useState } from "react";
import { Globe, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface URLInputProps {
  onFetch: (result: {
    text: string;
    wordCount: number;
    sourceUrl: string;
    documentType?: string | null;
    isCombined?: boolean;
    companion?: { found: boolean; url: string | null; text: string | null; type: string | null } | null;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function URLInput({ onFetch, onError, disabled }: URLInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState("");

  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Auto-prepend https:// if missing
    const fullUrl = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;

    try {
      setDomain(new URL(fullUrl).hostname);
    } catch {
      onError("Invalid URL format.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch URL.");
      }

      onFetch({
        text: data.text,
        wordCount: data.wordCount,
        sourceUrl: data.sourceUrl,
        documentType: data.documentType,
        isCombined: data.isCombined,
        companion: data.companion,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch URL.";
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://instagram.com/terms"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleFetch()}
            disabled={disabled || loading}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleFetch}
          disabled={disabled || loading || !url.trim()}
          size="lg"
          className="cursor-pointer gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              Fetch
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
      {loading && domain && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Fetching terms from {domain}...
        </p>
      )}
    </div>
  );
}
