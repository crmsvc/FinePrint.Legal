import { supabaseAdmin } from "@/lib/site/supabase";
import {
  getCompanySlugs,
  getCompanyData,
  type CompanyData,
} from "@/lib/site/companies";

/* ---------- Shared Types ---------- */

export interface WOSFlag {
  source: "editorial" | "community";
  headline: string;
  explanation: string;
  industryContext?: string;
  riskLevel: "HIGH" | "MEDIUM";
  category: string;
  categoryIcon?: string;
  upvotes?: number;
  submissionSlug?: string;
  submissionId?: string;
}

export interface WOSCompany {
  rank: number;
  name: string;
  slug: string;
  grade: string | null;
  verdict: string | null;
  companyPageUrl: string | null;
  flags: WOSFlag[];
  totalFlags: number;
  totalShares: number;
}

/* ---------- Grade helpers ---------- */

const SHAME_GRADES = new Set(["F", "D-", "D", "D+"]);

const GRADE_ORDER: Record<string, number> = {
  F: 0,
  "D-": 1,
  D: 2,
  "D+": 3,
};

function isShameGrade(grade: string): boolean {
  return SHAME_GRADES.has(grade);
}

/* ---------- Category mapping for editorial flags ---------- */

/** Best-effort map from red flag content to a category slug */
function guessCategory(clause: string, explanation: string): string {
  const text = `${clause} ${explanation}`.toLowerCase();
  if (text.includes("data") && (text.includes("collect") || text.includes("track")))
    return "invasive-data";
  if (text.includes("ai") || text.includes("machine learning") || text.includes("train"))
    return "ai-clauses";
  if (text.includes("arbitrat") || text.includes("class action") || text.includes("waiver"))
    return "arbitration";
  if (text.includes("license") || text.includes("intellectual property") || text.includes("content"))
    return "ip-grab";
  if (text.includes("terminat") || text.includes("suspend") || text.includes("delete your account"))
    return "termination";
  if (text.includes("retain") || text.includes("retention") || text.includes("kept after"))
    return "data-retention";
  if (text.includes("renew") || text.includes("auto-renew") || text.includes("subscription"))
    return "sneaky-renewal";
  return "invasive-data"; // fallback
}

/* ---------- Data fetching ---------- */

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export async function getWOSData(): Promise<{
  companies: WOSCompany[];
  categories: CategoryRow[];
}> {
  // Fetch categories, approved community submissions, and share counts in parallel
  const [categoriesResult, submissionsResult] = await Promise.all([
    supabaseAdmin
      .from("categories")
      .select("id, slug, name, icon")
      .order("name"),
    supabaseAdmin
      .from("submissions")
      .select(
        `
        id,
        slug,
        company_name,
        company_slug,
        clause_text,
        ai_explanation,
        ai_headline,
        ai_industry_context,
        risk_level,
        upvotes,
        created_at,
        category_id,
        categories (
          id,
          slug,
          name,
          icon
        )
      `
      )
      .eq("status", "approved")
      .order("upvotes", { ascending: false }),
  ]);

  const categories = (categoriesResult.data || []) as CategoryRow[];
  const submissions = submissionsResult.data || [];

  // Build category lookup
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  // ---- Layer 1: Editorial red flags from Tier 1 local files ----
  const companyMap = new Map<string, WOSCompany>();
  const localSlugs = getCompanySlugs();

  for (const slug of localSlugs) {
    const data = getCompanyData(slug);
    if (!data || !isShameGrade(data.grade)) continue;

    const editorialFlags: WOSFlag[] = (data.analysis.redFlags || []).map(
      (rf) => {
        const catSlug = guessCategory(rf.clause, rf.whyItMatters);
        const cat = catBySlug.get(catSlug);
        return {
          source: "editorial" as const,
          headline: rf.clause,
          explanation: rf.whyItMatters,
          industryContext: rf.industryComparison,
          riskLevel: "HIGH" as const,
          category: cat?.name || "Data Collection",
          categoryIcon: cat?.icon || undefined,
        };
      }
    );

    companyMap.set(slug, {
      rank: 0,
      name: data.name,
      slug: data.slug,
      grade: data.grade,
      verdict: data.verdict,
      companyPageUrl: `/company/${data.slug}`,
      flags: editorialFlags,
      totalFlags: editorialFlags.length,
      totalShares: 0,
    });
  }

  // ---- Layer 1: Editorial red flags from Tier 2 Supabase companies ----
  const { data: supabaseCompanies } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("status", "published")
    .in("overall_grade", ["D-", "D", "D+", "F"]);

  for (const company of supabaseCompanies || []) {
    if (companyMap.has(company.slug)) continue; // Skip if already loaded from local

    const analysisJson = company.analysis_json as {
      redFlags?: Array<{
        clause: string;
        whyItMatters: string;
        industryComparison: string;
      }>;
    } | null;

    const editorialFlags: WOSFlag[] = (analysisJson?.redFlags || []).map(
      (rf) => {
        const catSlug = guessCategory(rf.clause, rf.whyItMatters);
        const cat = catBySlug.get(catSlug);
        return {
          source: "editorial" as const,
          headline: rf.clause,
          explanation: rf.whyItMatters,
          industryContext: rf.industryComparison,
          riskLevel: "HIGH" as const,
          category: cat?.name || "Data Collection",
          categoryIcon: cat?.icon || undefined,
        };
      }
    );

    companyMap.set(company.slug, {
      rank: 0,
      name: company.name,
      slug: company.slug,
      grade: company.overall_grade,
      verdict: company.verdict,
      companyPageUrl: `/company/${company.slug}`,
      flags: editorialFlags,
      totalFlags: editorialFlags.length,
      totalShares: 0,
    });
  }

  // ---- Layer 2: Community submissions grouped by company ----
  for (const sub of submissions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCat = Array.isArray(sub.categories) ? sub.categories[0] : sub.categories;
    const cat = rawCat as CategoryRow | null;

    const flag: WOSFlag = {
      source: "community",
      headline: sub.ai_headline || sub.clause_text.slice(0, 60) + "...",
      explanation:
        sub.ai_explanation || sub.clause_text,
      industryContext: sub.ai_industry_context || undefined,
      riskLevel: (sub.risk_level as "HIGH" | "MEDIUM") || "HIGH",
      category: cat?.name || "TOS Clause",
      categoryIcon: cat?.icon || undefined,
      upvotes: sub.upvotes,
      submissionSlug: sub.slug,
      submissionId: sub.id,
    };

    const companySlug =
      sub.company_slug ||
      sub.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const existing = companyMap.get(companySlug);
    if (existing) {
      existing.flags.push(flag);
      existing.totalFlags++;
    } else {
      // Company with community submissions but no company page
      companyMap.set(companySlug, {
        rank: 0,
        name: sub.company_name,
        slug: companySlug,
        grade: null,
        verdict: null,
        companyPageUrl: null,
        flags: [flag],
        totalFlags: 1,
        totalShares: 0,
      });
    }
  }

  // ---- Sort & rank ----
  const companiesList = Array.from(companyMap.values());

  // Graded companies first (F → D- → D → D+), then ungraded by flag count
  companiesList.sort((a, b) => {
    // Graded before ungraded
    if (a.grade && !b.grade) return -1;
    if (!a.grade && b.grade) return 1;

    // Both graded: sort by grade severity
    if (a.grade && b.grade) {
      const aOrder = GRADE_ORDER[a.grade] ?? 99;
      const bOrder = GRADE_ORDER[b.grade] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same grade: sort by flag count
      return b.totalFlags - a.totalFlags;
    }

    // Both ungraded: sort by flag count
    return b.totalFlags - a.totalFlags;
  });

  // Assign ranks (only graded companies get numbers)
  let rank = 1;
  for (const company of companiesList) {
    if (company.grade) {
      company.rank = rank++;
    }
    // Sort flags: editorial first, then community by upvotes
    company.flags.sort((a, b) => {
      if (a.source === "editorial" && b.source === "community") return -1;
      if (a.source === "community" && b.source === "editorial") return 1;
      return (b.upvotes || 0) - (a.upvotes || 0);
    });
  }

  return { companies: companiesList, categories };
}
