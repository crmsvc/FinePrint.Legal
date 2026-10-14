"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { InputArea } from "@/components/site/InputArea";
import { ResultsDisplay } from "@/components/site/ResultsDisplay";
import { AnalysisSkeleton } from "@/components/site/AnalysisSkeleton";
import type { TOSAnalysisResult } from "@/lib/shared/gemini";

export function HomeTool() {
  const [result, setResult] = useState<TOSAnalysisResult | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [remaining, setRemaining] = useState<number | undefined>();
  const [limit, setLimit] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [canGrade, setCanGrade] = useState<boolean>(false);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<string | null>(null);
  const [companionUrl, setCompanionUrl] = useState<string | null>(null);
  const [isCombined, setIsCombined] = useState<boolean>(false);
  const [primaryText, setPrimaryText] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(
    async (
      text: string,
      meta?: {
        sourceUrl?: string;
        fileName?: string;
        inputMethod?: string;
        canGrade?: boolean;
        documentType?: string | null;
        companionUrl?: string | null;
        isCombined?: boolean;
        primaryText?: string;
      }
    ) => {
      setLoading(true);
      setResult(null);
      setSourceUrl(meta?.sourceUrl);

      const method = meta?.inputMethod || "text";
      setInputMethod(method);
      setPrimaryText(meta?.primaryText || text);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sourceUrl: meta?.sourceUrl,
            canGrade: meta?.canGrade ?? false,
            documentType: meta?.documentType ?? null,
            inputMethod: method,
            companionUrl: meta?.companionUrl ?? null,
            isCombined: meta?.isCombined ?? false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Analysis failed.");
        }

        setResult(data.result);
        setRemaining(data.remaining);
        setLimit(data.limit);
        setCanGrade(data.canGrade ?? false);
        setDocumentType(data.documentType ?? null);
        setCompanionUrl(data.companionUrl ?? null);
        setIsCombined(data.isCombined ?? false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Analysis failed. Please try again.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-analyze callback for companion URL additions
  const handleReanalyze = useCallback(
    (combinedText: string, meta: {
      sourceUrl: string;
      companionUrl: string;
      canGrade: boolean;
      documentType: string;
      isCombined: boolean;
      inputMethod: string;
      primaryText: string;
    }) => {
      handleAnalyze(combinedText, {
        sourceUrl: meta.sourceUrl,
        companionUrl: meta.companionUrl,
        canGrade: meta.canGrade,
        documentType: meta.documentType,
        isCombined: meta.isCombined,
        inputMethod: meta.inputMethod,
        primaryText: meta.primaryText,
      });
    },
    [handleAnalyze]
  );

  // Scroll to results when they appear
  useEffect(() => {
    if ((result || loading) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, loading]);

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <InputArea
          onAnalyze={handleAnalyze}
          loading={loading}
          disabled={loading}
        />
      </div>

      {loading && !result && (
        <div ref={resultsRef}>
          <AnalysisSkeleton />
        </div>
      )}

      {result && (
        <div ref={resultsRef}>
          <ResultsDisplay
            analysis={result}
            sourceUrl={sourceUrl}
            remaining={remaining}
            limit={limit}
            pageType="live-result"
            canGrade={canGrade}
            documentType={documentType}
            inputMethod={inputMethod}
            companionUrl={companionUrl}
            isCombined={isCombined}
            primaryText={primaryText || undefined}
            onReanalyze={handleReanalyze}
          />
        </div>
      )}
    </div>
  );
}
