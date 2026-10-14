import { siteConfig } from "@/lib/site/config";

export interface ParsedGrade {
  grade: string;
  letter: string;
  modifier: string;
  color: { bg: string; text: string };
  label: string;
}

const GRADE_REGEX = /^([A-F])([+-]?)$/;

export function parseGrade(gradeStr: string): ParsedGrade {
  const trimmed = gradeStr.trim().toUpperCase();
  const match = trimmed.match(GRADE_REGEX);

  if (!match) {
    return {
      grade: "N/A",
      letter: "N",
      modifier: "/A",
      color: { bg: "#71717a", text: "#ffffff" },
      label: "Unable to Grade",
    };
  }

  const letter = match[1];
  const modifier = match[2] || "";
  const grade = `${letter}${modifier}`;

  const config = siteConfig.gradeColors[grade] ??
    siteConfig.gradeColors[letter] ?? {
      bg: "#71717a",
      text: "#ffffff",
      label: "Unknown",
    };

  return {
    grade,
    letter,
    modifier,
    color: { bg: config.bg, text: config.text },
    label: config.label,
  };
}

export function getGradeCSSClass(letter: string): string {
  const map: Record<string, string> = {
    A: "bg-grade-a text-white",
    B: "bg-grade-b text-white",
    C: "bg-grade-c text-black",
    D: "bg-grade-d text-white",
    F: "bg-grade-f text-white",
  };
  return map[letter] ?? "bg-muted text-foreground";
}
