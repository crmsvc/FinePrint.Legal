"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, RotateCcw, Link, FileText, Upload, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { URLInput } from "@/components/site/URLInput";
import { FileUpload } from "@/components/shared/FileUpload";
import { toast } from "sonner";

interface AnalyzeMeta {
  sourceUrl?: string;
  fileName?: string;
  inputMethod?: string;
  canGrade?: boolean;
  documentType?: string | null;
  companionUrl?: string | null;
  isCombined?: boolean;
  primaryText?: string;
}

interface InputAreaProps {
  onAnalyze: (text: string, meta?: AnalyzeMeta) => void;
  loading?: boolean;
  disabled?: boolean;
}

interface FetchResult {
  text: string;
  wordCount: number;
  sourceUrl: string;
  documentType?: string | null;
  isCombined?: boolean;
  companion?: {
    found: boolean;
    url: string | null;
    text: string | null;
    type: string | null;
  } | null;
}

export function InputArea({ onAnalyze, loading, disabled }: InputAreaProps) {
  const [tab, setTab] = useState("url");
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<AnalyzeMeta>({});
  const [fetchedPreview, setFetchedPreview] = useState<FetchResult | null>(null);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const handleFetch = useCallback(
    (result: FetchResult) => {
      setFetchedPreview(result);
      setText(result.text);
      setMeta({
        sourceUrl: result.sourceUrl,
        inputMethod: "url",
        documentType: result.documentType,
        primaryText: result.text,
      });
    },
    []
  );

  const handleFileExtracted = useCallback((extractedText: string, fileName: string) => {
    setText(extractedText);
    setMeta({ fileName, inputMethod: "upload" });
    toast.success(`Parsed ${fileName} — ${extractedText.split(/\s+/).filter(Boolean).length.toLocaleString()} words`);
  }, []);

  const handleError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  /** Analyze single document only (no grade) */
  const handleAnalyzeOnly = () => {
    if (!fetchedPreview || loading) return;
    onAnalyze(fetchedPreview.text, {
      sourceUrl: fetchedPreview.sourceUrl,
      inputMethod: "url",
      canGrade: false,
      documentType: fetchedPreview.documentType,
      companionUrl: null,
      isCombined: false,
      primaryText: fetchedPreview.text,
    });
  };

  /** Analyze both documents combined (with grade) */
  const handleAnalyzeBoth = () => {
    if (!fetchedPreview || loading) return;

    let combinedText: string;
    let companionUrl: string | null = null;

    if (fetchedPreview.isCombined) {
      // Already combined document
      combinedText = fetchedPreview.text;
    } else if (fetchedPreview.companion?.found && fetchedPreview.companion.text) {
      // Construct combined text with markers
      companionUrl = fetchedPreview.companion.url;
      const docType = fetchedPreview.documentType;
      const tosText = docType === "tos" ? fetchedPreview.text : fetchedPreview.companion.text;
      const ppText = docType === "pp" ? fetchedPreview.text : fetchedPreview.companion.text;
      const tosUrl = docType === "tos" ? fetchedPreview.sourceUrl : fetchedPreview.companion.url;
      const ppUrl = docType === "pp" ? fetchedPreview.sourceUrl : fetchedPreview.companion.url;

      combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppText}`;
    } else {
      return;
    }

    onAnalyze(combinedText, {
      sourceUrl: fetchedPreview.sourceUrl,
      inputMethod: "url",
      canGrade: true,
      documentType: "combined",
      companionUrl,
      isCombined: true,
      primaryText: fetchedPreview.text,
    });
  };

  /** Submit for paste text or file upload */
  const handleSubmit = () => {
    if (!text.trim() || loading) return;
    onAnalyze(text.trim(), meta);
  };

  const handleReset = () => {
    setText("");
    setMeta({});
    setFetchedPreview(null);
  };

  const isReady = text.trim().length >= 50;

  // Determine button layout for URL tab
  const hasCompanion = fetchedPreview?.companion?.found === true;
  const isAlreadyCombined = fetchedPreview?.isCombined === true;
  const docType = fetchedPreview?.documentType;

  const analyzeOnlyLabel =
    docType === "tos"
      ? "Analyze TOS Only"
      : docType === "pp"
        ? "Analyze Privacy Policy Only"
        : "Analyze This Document";

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="url" className="cursor-pointer flex-1 gap-1.5">
            <Link className="size-3.5" />
            Paste URL
          </TabsTrigger>
          <TabsTrigger value="text" className="cursor-pointer flex-1 gap-1.5">
            <FileText className="size-3.5" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" className="cursor-pointer flex-1 gap-1.5">
            <Upload className="size-3.5" />
            Upload File
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: URL */}
        <TabsContent value="url">
          <div className="space-y-4 pt-2">
            <URLInput
              onFetch={handleFetch}
              onError={handleError}
              disabled={disabled || loading}
            />

            {fetchedPreview && (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    Found {fetchedPreview.wordCount.toLocaleString()} words from{" "}
                    <span className="text-accent">
                      {new URL(fetchedPreview.sourceUrl).hostname}
                    </span>
                  </p>
                  {isAlreadyCombined && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      This document contains both TOS and Privacy Policy
                    </p>
                  )}
                  {hasCompanion && !isAlreadyCombined && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      ✓ Also found their{" "}
                      {docType === "tos" ? "Privacy Policy" : "Terms of Service"}
                    </p>
                  )}
                  <div className="mt-2 max-h-32 overflow-y-auto rounded border border-border bg-background p-2 text-xs text-muted-foreground">
                    {fetchedPreview.text.slice(0, 800)}
                    {fetchedPreview.text.length > 800 && "..."}
                  </div>
                </div>

                {/* Dynamic buttons based on fetch result */}
                <div className="flex items-center gap-3">
                  {hasCompanion && !isAlreadyCombined ? (
                    <>
                      {/* Two buttons: Analyze Only + Analyze Both */}
                      <Button
                        onClick={handleAnalyzeOnly}
                        disabled={loading || disabled}
                        size="lg"
                        variant="outline"
                        className="cursor-pointer flex-1 gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />
                            {analyzeOnlyLabel}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleAnalyzeBoth}
                        disabled={loading || disabled}
                        size="lg"
                        className="cursor-pointer flex-1 gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-4" />
                            Analyze Both &amp; Get Grade
                          </>
                        )}
                      </Button>
                    </>
                  ) : isAlreadyCombined ? (
                    /* Single button: combined doc */
                    <Button
                      onClick={handleAnalyzeBoth}
                      disabled={loading || disabled}
                      size="lg"
                      className="cursor-pointer flex-1 gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-4" />
                          Analyze &amp; Get Grade
                        </>
                      )}
                    </Button>
                  ) : (
                    /* Single button: no companion found */
                    <Button
                      onClick={handleAnalyzeOnly}
                      disabled={loading || disabled}
                      size="lg"
                      className="cursor-pointer flex-1 gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Analyze This Document
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleReset}
                    disabled={loading}
                    className="cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="size-4" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Paste Text */}
        <TabsContent value="text">
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Paste any Terms of Service or Privacy Policy text here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMeta({ inputMethod: "text" });
                setFetchedPreview(null);
              }}
              disabled={disabled || loading}
              rows={8}
              className="resize-y"
            />
            {text.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {wordCount.toLocaleString()} words
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Upload */}
        <TabsContent value="upload">
          <div className="pt-2">
            <FileUpload
              onTextExtracted={handleFileExtracted}
              onError={handleError}
            />
            {text && meta.fileName && (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  Parsed {meta.fileName} — {wordCount.toLocaleString()} words
                </p>
                <div className="mt-2 max-h-32 overflow-y-auto rounded border border-border bg-background p-2 text-xs text-muted-foreground">
                  {text.slice(0, 800)}
                  {text.length > 800 && "..."}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions for text/upload tabs only (URL tab has its own buttons) */}
      {tab !== "url" && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!isReady || loading || disabled}
            size="lg"
            className="cursor-pointer flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analyze This Policy
              </>
            )}
          </Button>

          {text && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              disabled={loading}
              className="cursor-pointer gap-1.5"
            >
              <RotateCcw className="size-4" />
              Clear
            </Button>
          )}
        </div>
      )}

      {tab !== "url" && !isReady && text.length > 0 && text.length < 50 && (
        <p className="text-xs text-muted-foreground">
          Need at least 50 characters to analyze.
        </p>
      )}
    </div>
  );
}
