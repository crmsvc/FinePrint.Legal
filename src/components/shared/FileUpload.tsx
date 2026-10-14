"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site/config";

const ACCEPTED = siteConfig.fileUpload.acceptedTypes.join(",");
const MAX_SIZE = siteConfig.fileUpload.maxSizeMB * 1024 * 1024;

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onError: (message: string) => void;
}

export function FileUpload({ onTextExtracted, onError }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (selectedFile: File) => {
      // Validate type
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!ext || !["txt", "pdf", "docx"].includes(ext)) {
        onError("Unsupported file type. Please upload a .txt, .pdf, or .docx file.");
        return;
      }

      // Validate size
      if (selectedFile.size > MAX_SIZE) {
        onError(
          `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${siteConfig.fileUpload.maxSizeMB}MB.`
        );
        return;
      }

      setFile(selectedFile);
      setParsing(true);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process file.");
        }

        onTextExtracted(data.text, data.fileName);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process file.";
        onError(message);
        setFile(null);
      } finally {
        setParsing(false);
      }
    },
    [onTextExtracted, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) processFile(droppedFile);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) processFile(selectedFile);
    },
    [processFile]
  );

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag and drop a file, or{" "}
            <span className="font-medium text-accent">browse</span>
          </p>
          <p className="text-xs text-muted-foreground/60">
            .txt, .pdf, .docx — up to {siteConfig.fileUpload.maxSizeMB}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <FileText className="size-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          {parsing ? (
            <Loader2 className="size-4 animate-spin text-accent" />
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={clearFile}
              className="cursor-pointer"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
