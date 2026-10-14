"use client";

interface AdZoneProps {
  placement: "banner-top" | "in-content" | "banner-bottom";
  className?: string;
}

export function AdZone({ placement, className }: AdZoneProps) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  if (!enabled) return null;

  const heights: Record<string, string> = {
    "banner-top": "h-[90px] md:h-[90px]",
    "in-content": "h-[250px]",
    "banner-bottom": "h-[90px] md:h-[90px]",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 print:hidden ${heights[placement]} ${className ?? ""}`}
      data-ad-placement={placement}
    >
      <span className="text-xs text-muted-foreground/40">Ad</span>
    </div>
  );
}
