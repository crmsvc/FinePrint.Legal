import { parseGrade, type ParsedGrade } from "@/lib/site/grade";
import { getGradeCSSClass } from "@/lib/site/grade";
import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
};

export function GradeBadge({ grade, size = "md", className }: GradeBadgeProps) {
  const parsed: ParsedGrade = parseGrade(grade);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold",
        getGradeCSSClass(parsed.letter),
        sizeClasses[size],
        className
      )}
      title={`${parsed.grade} — ${parsed.label}`}
    >
      {parsed.grade}
    </span>
  );
}
