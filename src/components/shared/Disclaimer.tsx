import { siteConfig } from "@/lib/site/config";

export function Disclaimer({ variant = "results" }: { variant?: "results" | "company" }) {
  const text = variant === "company"
    ? siteConfig.disclaimer.company
    : siteConfig.disclaimer.results;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-xs leading-relaxed text-muted-foreground">
      {text}
    </div>
  );
}
