import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/shared/gemini";

const riskConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  LOW: {
    label: "LOW RISK",
    className: "bg-risk-low-bg text-risk-low border-risk-low/20",
  },
  MEDIUM: {
    label: "MEDIUM RISK",
    className: "bg-risk-medium-bg text-risk-medium border-risk-medium/20",
  },
  HIGH: {
    label: "HIGH RISK",
    className: "bg-risk-high-bg text-risk-high border-risk-high/20",
  },
};

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  const config = riskConfig[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
