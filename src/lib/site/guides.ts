import fs from "fs";
import path from "path";

export interface GuideData {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  relatedCompanies: string[];
  content: string;
  faq: { question: string; answer: string }[];
}

export interface GuideSummary {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
}

const GUIDES_DIR = path.join(process.cwd(), "src/content/guides");

export function getGuideSlugs(): string[] {
  try {
    return fs
      .readdirSync(GUIDES_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

export function getGuideData(slug: string): GuideData | null {
  try {
    const filePath = path.join(GUIDES_DIR, `${slug}.json`);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as GuideData;
  } catch {
    return null;
  }
}

export function getAllGuideSummaries(): GuideSummary[] {
  return getGuideSlugs()
    .map((slug) => {
      const data = getGuideData(slug);
      if (!data) return null;
      return {
        slug: data.slug,
        title: data.title,
        description: data.description,
        lastUpdated: data.lastUpdated,
      };
    })
    .filter(Boolean) as GuideSummary[];
}
