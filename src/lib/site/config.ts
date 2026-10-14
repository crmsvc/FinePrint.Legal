export const siteConfig = {
  name: "FinePrint",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://fineprint.legal",
  description:
    "Paste any URL or upload a Terms of Service. Get a plain-English breakdown with a letter grade in seconds.",
  tagline: "We read the fine print so you don't have to.",
  subtitle:
    "Paste a URL, drop in a privacy policy, or upload a TOS — get a plain-English breakdown with a letter grade in seconds.",

  meta: {
    title: "FinePrint — We Read the Fine Print So You Don't Have To",
    description:
      "Paste any URL or upload a Terms of Service. Get a plain-English breakdown with a letter grade in seconds. Free, no signup required.",
    openGraph: {
      type: "website" as const,
      locale: "en_US",
      siteName: "FinePrint",
    },
  },

  disclaimer: {
    global:
      "FinePrint provides educational information about Terms of Service and Privacy Policies. This is NOT legal advice. Always consult a qualified attorney before making legal decisions.",
    results:
      "This analysis is for educational purposes only. FinePrint is not a law firm. AI analysis may contain errors or miss important nuances. For legal decisions, consult a licensed attorney.",
    company:
      "This analysis is based on publicly available Terms of Service and Privacy Policy as of the analysis date. Terms may have changed since this analysis. Always check the current version.",
  },

  gradeColors: {
    A: { bg: "#10b981", text: "#ffffff", label: "Excellent" },
    "A-": { bg: "#10b981", text: "#ffffff", label: "Very Good" },
    "B+": { bg: "#14b8a6", text: "#ffffff", label: "Good" },
    B: { bg: "#14b8a6", text: "#ffffff", label: "Fair" },
    "B-": { bg: "#14b8a6", text: "#ffffff", label: "Fair" },
    "C+": { bg: "#f59e0b", text: "#000000", label: "Average" },
    C: { bg: "#f59e0b", text: "#000000", label: "Mediocre" },
    "C-": { bg: "#f59e0b", text: "#000000", label: "Below Average" },
    "D+": { bg: "#f97316", text: "#ffffff", label: "Poor" },
    D: { bg: "#f97316", text: "#ffffff", label: "Bad" },
    "D-": { bg: "#f97316", text: "#ffffff", label: "Very Bad" },
    F: { bg: "#ef4444", text: "#ffffff", label: "Fail" },
  } as Record<string, { bg: string; text: string; label: string }>,

  rateLimit: {
    maxRequests: 5,
    windowMs: 24 * 60 * 60 * 1000,
  },

  fileUpload: {
    maxSizeMB: 2,
    maxPages: 15,
    acceptedTypes: [".txt", ".pdf", ".docx"],
  },

  links: {
    about: "/about",
    privacy: "/privacy",
    terms: "/terms",
    disclaimer: "/disclaimer",
    companies: "/company",
    guides: "/guides",
  },
} as const;
