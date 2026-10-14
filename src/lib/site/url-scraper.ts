import * as cheerio from "cheerio";

const JINA_BASE = "https://r.jina.ai/";
const FETCH_TIMEOUT = 15_000;
const MAX_REDIRECTS = 3;

interface ScrapeResult {
  text: string;
  wordCount: number;
  sourceUrl: string;
}

/** Validate URL: must be HTTPS, not localhost/internal */
export function validateUrl(raw: string): { valid: boolean; url?: URL; error?: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  if (url.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are supported." };
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.endsWith(".local")
  ) {
    return { valid: false, error: "Internal/private URLs are not allowed." };
  }

  return { valid: true, url };
}

/** Primary: Jina Reader API */
async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "text/markdown",
    };
    if (process.env.JINA_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const response = await fetch(`${JINA_BASE}${encodeURIComponent(url)}`, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!response.ok) return null;

    const text = await response.text();
    return text.trim().length > 100 ? text.trim() : null;
  } catch {
    return null;
  }
}

/** Fallback: Direct fetch + cheerio HTML parsing */
async function fetchViaCheerio(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FinePrint/1.0; +https://fineprint.legal)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $(
      "script, style, nav, header, footer, iframe, noscript, svg, " +
        "form, [role='navigation'], [role='banner'], [role='contentinfo'], " +
        ".cookie-banner, .cookie-consent, #cookie-consent, .popup, .modal"
    ).remove();

    // Try to find main content area first
    const mainSelectors = [
      "main",
      "[role='main']",
      "article",
      ".content",
      "#content",
      ".post-content",
      ".entry-content",
      ".page-content",
    ];

    let text = "";
    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length) {
        text = el.text();
        break;
      }
    }

    // Fallback to body
    if (!text.trim()) {
      text = $("body").text();
    }

    // Collapse whitespace
    text = text.replace(/\s+/g, " ").trim();

    return text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/* ---------- Companion Document Discovery ---------- */

const PP_PATTERNS = [
  /privacy[-_]?policy/i,
  /privacy[-_]?notice/i,
  /data[-_]?policy/i,
  /data[-_]?protection/i,
  /\/privacy\/?$/i,
  /\/privacy\//i,
  /\/legal\/.*privacy/i,
  /\/legal\/.*data[-_]?policy/i,
];

const TOS_PATTERNS = [
  /terms[-_]?of[-_]?service/i,
  /terms[-_]?of[-_]?use/i,
  /terms[-_]?and[-_]?conditions/i,
  /user[-_]?agreement/i,
  /\/terms\/?$/i,
  /\/terms\//i,
  /\/tos\/?$/i,
  /\/legal\/terms/i,
  /\/legal\/.*terms/i,
  /\/legal\/.*user[-_]?agreement/i,
];

export interface CompanionResult {
  found: boolean;
  url: string | null;
  text: string | null;
  type: "tos" | "pp" | null;
}

// In-memory cache: domain + docType → companion URL (or null for miss). TTL: 24 hours.
const companionCache = new Map<
  string,
  { url: string | null; scannedAt: number }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function getCachedCompanion(
  domain: string,
  docType: "tos" | "pp"
): Promise<CompanionResult | null> {
  const key = `${domain}:${docType}`;
  const cached = companionCache.get(key);
  if (cached && Date.now() - cached.scannedAt < CACHE_TTL) {
    if (!cached.url)
      return { found: false, url: null, text: null, type: null };
    const text = await fetchViaJina(cached.url);
    const companionType = docType === "tos" ? "pp" : "tos";
    return { found: true, url: cached.url, text, type: companionType };
  }
  return null;
}

function cacheCompanionResult(
  domain: string,
  docType: "tos" | "pp",
  url: string | null
) {
  companionCache.set(`${domain}:${docType}`, { url, scannedAt: Date.now() });
}

/** Find a URL matching patterns from the same domain */
function findMatchingUrl(
  urls: string[],
  patterns: RegExp[],
  submittedUrl: string,
  submittedDomain: string
): string | null {
  return (
    urls.find((u) => {
      try {
        const urlDomain = new URL(u).hostname.replace("www.", "");
        if (
          urlDomain !== submittedDomain &&
          !urlDomain.endsWith("." + submittedDomain)
        )
          return false;
        if (u === submittedUrl) return false;
        return patterns.some((pattern) => pattern.test(u));
      } catch {
        return false;
      }
    }) || null
  );
}

export async function findCompanionDocument(
  submittedUrl: string,
  submittedDocType: "tos" | "pp",
  submittedText: string
): Promise<CompanionResult> {
  try {
    const origin = new URL(submittedUrl).origin;
    const submittedDomain = new URL(submittedUrl).hostname.replace("www.", "");
    const patterns = submittedDocType === "tos" ? PP_PATTERNS : TOS_PATTERNS;
    const companionType = submittedDocType === "tos" ? "pp" : "tos";

    // Check cache first
    const cached = await getCachedCompanion(origin, submittedDocType);
    if (cached) return cached;

    const urlRegex = /https?:\/\/[^\s)"'<>]+/g;

    // === STEP 1: Scan the submitted page for companion links ===
    const submittedPageUrls = submittedText.match(urlRegex) || [];
    let companionUrl = findMatchingUrl(
      submittedPageUrls,
      patterns,
      submittedUrl,
      submittedDomain
    );

    if (companionUrl) {
      const companionText = await fetchViaJina(companionUrl);
      if (companionText && companionText.length >= 200) {
        cacheCompanionResult(origin, submittedDocType, companionUrl);
        return { found: true, url: companionUrl, text: companionText, type: companionType };
      }
    }

    // === STEP 2: Fall back to homepage scan ===
    try {
      const homepageText = await fetchViaJina(origin);
      if (homepageText) {
        const homepageUrls = homepageText.match(urlRegex) || [];
        companionUrl = findMatchingUrl(
          homepageUrls,
          patterns,
          submittedUrl,
          submittedDomain
        );

        if (companionUrl) {
          const companionText = await fetchViaJina(companionUrl);
          if (companionText && companionText.length >= 200) {
            cacheCompanionResult(origin, submittedDocType, companionUrl);
            return { found: true, url: companionUrl, text: companionText, type: companionType };
          }
        }
      }
    } catch {
      // Homepage fetch failed (wall, error, etc.) — continue to Step 3
    }

    // === STEP 3: Try common legal URL patterns ===
    const commonPaths =
      submittedDocType === "tos"
        ? ["/privacy", "/privacy-policy", "/legal/privacy", "/legal/page/us/privacy-policy/en"]
        : ["/terms", "/terms-of-service", "/legal/terms", "/legal/page/us/terms-of-service/en"];

    for (const path of commonPaths) {
      try {
        const guessUrl = origin + path;
        const guessText = await fetchViaJina(guessUrl);
        if (guessText && guessText.length >= 200) {
          const guessDocType = detectDocumentType(guessText);
          if (guessDocType === companionType || guessDocType === "combined") {
            cacheCompanionResult(origin, submittedDocType, guessUrl);
            return { found: true, url: guessUrl, text: guessText, type: companionType };
          }
        }
      } catch {
        continue;
      }
    }

    // Nothing found
    cacheCompanionResult(origin, submittedDocType, null);
    return { found: false, url: null, text: null, type: null };
  } catch {
    return { found: false, url: null, text: null, type: null };
  }
}

export function detectDocumentType(
  text: string
): "tos" | "pp" | "combined" {
  const lowerText = text.toLowerCase();

  const tosIndicators = [
    "terms of service",
    "terms of use",
    "user agreement",
    "you agree to",
    "we reserve the right",
    "termination",
    "intellectual property",
    "limitation of liability",
    "governing law",
    "dispute resolution",
    "indemnif",
  ];

  const ppIndicators = [
    "privacy policy",
    "data we collect",
    "personal information",
    "cookies",
    "data retention",
    "third-party sharing",
    "opt-out",
    "data protection",
    "gdpr",
    "ccpa",
    "data subject",
    "right to deletion",
    "data processor",
  ];

  const tosScore = tosIndicators.filter((t) => lowerText.includes(t)).length;
  const ppScore = ppIndicators.filter((t) => lowerText.includes(t)).length;

  if (tosScore >= 4 && ppScore >= 4) return "combined";
  if (tosScore > ppScore) return "tos";
  if (ppScore > tosScore) return "pp";
  return "tos";
}

/** Scrape URL with Jina primary, cheerio fallback */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // Try Jina first
  const jinaText = await fetchViaJina(url);
  if (jinaText) {
    return {
      text: jinaText,
      wordCount: countWords(jinaText),
      sourceUrl: url,
    };
  }

  // Fallback to cheerio
  const cheerioText = await fetchViaCheerio(url);
  if (cheerioText) {
    return {
      text: cheerioText,
      wordCount: countWords(cheerioText),
      sourceUrl: url,
    };
  }

  throw new Error("Could not extract text from this page.");
}
