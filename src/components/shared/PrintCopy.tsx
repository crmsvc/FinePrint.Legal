"use client";

import { Printer, Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrintCopyProps {
  targetId: string;
}

export function PrintCopy({ targetId }: PrintCopyProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
      const html = target.innerHTML;
      const plainText = target.innerText;

      // Try rich text (HTML) copy first, with plain text fallback
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);

      setCopied(true);
      toast.success("Results copied to clipboard (formatted)");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to plain text if ClipboardItem not supported
      try {
        const target = document.getElementById(targetId);
        if (!target) return;
        await navigator.clipboard.writeText(target.innerText);
        setCopied(true);
        toast.success("Results copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="cursor-pointer gap-1.5"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="cursor-pointer gap-1.5"
      >
        <Printer className="size-3.5" />
        Print
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="cursor-pointer gap-1.5"
      >
        <Download className="size-3.5" />
        Save PDF
      </Button>
    </div>
  );
}
