import fs from "fs";
import path from "path";
import type { AnalysisResult } from "@/lib/shared/gemini";

export interface CompanyData {
  slug: string;
  name: string;
  grade: string;
  verdict: string;
  lastAnalyzed: string;
  sourceUrl: string;
  analysis: AnalysisResult;
}

export interface CompanySummary {
  slug: string;
  name: string;
  grade: string;
  verdict: string;
  lastAnalyzed: string;
}

const COMPANIES_DIR = path.join(process.cwd(), "src/content/companies");

export function getCompanySlugs(): string[] {
  try {
    return fs
      .readdirSync(COMPANIES_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

export function getCompanyData(slug: string): CompanyData | null {
  try {
    const filePath = path.join(COMPANIES_DIR, `${slug}.json`);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CompanyData;
  } catch {
    return null;
  }
}

export function getAllCompanySummaries(): CompanySummary[] {
  return getCompanySlugs()
    .map((slug) => {
      const data = getCompanyData(slug);
      if (!data) return null;
      return {
        slug: data.slug,
        name: data.name,
        grade: data.grade,
        verdict: data.verdict,
        lastAnalyzed: data.lastAnalyzed,
      };
    })
    .filter(Boolean) as CompanySummary[];
}
