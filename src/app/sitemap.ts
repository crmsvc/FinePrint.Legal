import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site/config";
import { getCompanySlugs } from "@/lib/site/companies";
import { getGuideSlugs } from "@/lib/site/guides";
import { supabaseAdmin } from "@/lib/site/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/company`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/disclaimer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/how-we-grade`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/hall-of-fame`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/wall-of-shame`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const companyPages: MetadataRoute.Sitemap = getCompanySlugs().map((slug) => ({
    url: `${siteConfig.url}/company/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Supabase-published company pages (avoid duplicating local ones)
  let supabaseCompanyPages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabaseAdmin
      .from("companies")
      .select("slug, updated_at")
      .eq("status", "published");

    if (data) {
      const localSlugs = new Set(getCompanySlugs());
      supabaseCompanyPages = data
        .filter((c) => !localSlugs.has(c.slug))
        .map((c) => ({
          url: `${siteConfig.url}/company/${c.slug}`,
          lastModified: c.updated_at || now,
          changeFrequency: "monthly" as const,
          priority: 0.9,
        }));
    }
  } catch {
    // Supabase unavailable — continue with local pages only
  }

  // Wall of Shame submission pages
  let wallOfShamePages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabaseAdmin
      .from("submissions")
      .select("slug, updated_at")
      .eq("status", "approved");

    if (data) {
      wallOfShamePages = data.map((s) => ({
        url: `${siteConfig.url}/wall-of-shame/${s.slug}`,
        lastModified: s.updated_at || now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Supabase unavailable — skip
  }

  const guidePages: MetadataRoute.Sitemap = getGuideSlugs().map((slug) => ({
    url: `${siteConfig.url}/guides/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...companyPages, ...supabaseCompanyPages, ...guidePages, ...wallOfShamePages];
}
