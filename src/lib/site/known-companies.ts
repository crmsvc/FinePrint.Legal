interface KnownCompanyUrls {
  name: string;
  tosUrl: string;
  ppUrl: string;
}

/**
 * Tier 1 URL mapping for known problem domains.
 * These companies gate their legal pages behind login walls or agreement screens.
 * The auto-hunt can't reach the actual documents, so we use verified working URLs.
 */
export const KNOWN_COMPANY_URLS: Record<string, KnownCompanyUrls> = {
  "instagram.com": {
    name: "Instagram",
    tosUrl: "https://help.instagram.com/581066165581870",
    ppUrl: "https://privacycenter.instagram.com/policy",
  },
  "facebook.com": {
    name: "Facebook",
    tosUrl: "https://www.facebook.com/legal/terms",
    ppUrl: "https://www.facebook.com/privacy/policy",
  },
  "tiktok.com": {
    name: "TikTok",
    tosUrl: "https://www.tiktok.com/legal/page/us/terms-of-service/en",
    ppUrl: "https://www.tiktok.com/legal/page/us/privacy-policy/en",
  },
  "whatsapp.com": {
    name: "WhatsApp",
    tosUrl: "https://www.whatsapp.com/legal/terms-of-service",
    ppUrl: "https://www.whatsapp.com/legal/privacy-policy",
  },
  "x.com": {
    name: "X (Twitter)",
    tosUrl: "https://x.com/en/tos",
    ppUrl: "https://x.com/en/privacy",
  },
  "twitter.com": {
    name: "X (Twitter)",
    tosUrl: "https://x.com/en/tos",
    ppUrl: "https://x.com/en/privacy",
  },
};

/** Normalize domain: strip www, extract root domain */
export function normalizeDomain(url: string): string {
  try {
    const hostname = new URL(
      url.startsWith("http") ? url : `https://${url}`
    ).hostname;
    return hostname.replace("www.", "");
  } catch {
    return url.replace("www.", "");
  }
}

/** Look up known URLs for a domain */
export function getKnownCompanyUrls(
  url: string
): KnownCompanyUrls | null {
  const domain = normalizeDomain(url);
  return KNOWN_COMPANY_URLS[domain] || null;
}
