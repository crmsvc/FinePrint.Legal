import { NextRequest, NextResponse } from "next/server";
import {
  validateUrl,
  scrapeUrl,
  detectDocumentType,
  findCompanionDocument,
} from "@/lib/site/url-scraper";
import { checkRateLimit } from "@/lib/shared/rate-limit";
import { getKnownCompanyUrls } from "@/lib/site/known-companies";

function validateFetchedContent(text: string): {
  valid: boolean;
  reason?: string;
} {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  if (wordCount < 150) {
    const loginSignals = [
      "log in",
      "login",
      "sign in",
      "signin",
      "create account",
      "create new account",
      "sign up",
      "signup",
      "forgot password",
      "email or mobile",
      "enter your password",
      "email or phone",
    ];

    const loginScore = loginSignals.filter((s) => lowerText.includes(s)).length;

    if (loginScore >= 2) {
      return {
        valid: false,
        reason:
          "This URL returned a login page, not a legal document. Try pasting the direct URL to the company's Terms of Service or Privacy Policy page.",
      };
    }

    const wallSignals = [
      "i agree",
      "accept all",
      "accept cookies",
      "consent",
      "before you continue",
      "agree to continue",
    ];

    const wallScore = wallSignals.filter((s) => lowerText.includes(s)).length;

    if (wallScore >= 2) {
      return {
        valid: false,
        reason:
          "This URL is behind an agreement or cookie wall. Try pasting the direct URL to the Terms of Service or Privacy Policy page instead.",
      };
    }

    return {
      valid: false,
      reason:
        "This page doesn't contain enough content to analyze. Make sure you're pasting a direct link to a Terms of Service or Privacy Policy page.",
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateUrl(url.trim());
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Rate limit check (skip in dev)
    if (process.env.RATE_LIMIT_DISABLED !== "true") {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const { success, remaining, limit } = await checkRateLimit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again tomorrow.", remaining: 0, limit },
          { status: 429 }
        );
      }
    }

    // Check Tier 1 mapping for known problem domains (login walls, etc.)
    const knownUrls = getKnownCompanyUrls(validation.url!.href);
    if (knownUrls) {
      try {
        const tosText = await scrapeUrl(knownUrls.tosUrl);
        const ppText = await scrapeUrl(knownUrls.ppUrl);

        if (tosText.text.length >= 200 && ppText.text.length >= 200) {
          const combinedText = `=== TERMS OF SERVICE ===\nSource: ${knownUrls.tosUrl}\n\n${tosText.text}\n\n=== PRIVACY POLICY ===\nSource: ${knownUrls.ppUrl}\n\n${ppText.text}`;

          return NextResponse.json({
            text: combinedText,
            wordCount: combinedText.split(/\s+/).length,
            sourceUrl: knownUrls.tosUrl,
            documentType: "combined",
            isCombined: true,
            canGrade: true,
            companyName: knownUrls.name,
            tier1Match: true,
            companion: {
              found: true,
              url: knownUrls.ppUrl,
              text: ppText.text,
              type: "pp" as const,
            },
          });
        }
      } catch {
        // Tier 1 URLs failed — fall through to normal fetch flow
      }
    }

    // Scrape the primary URL
    const result = await scrapeUrl(validation.url!.href);

    // Bare domain detection: if user entered just a domain (path is "/" or empty),
    // skip content validation and scan the homepage for TOS/PP links instead
    const urlPath = validation.url!.pathname;
    const isBareHomepage = urlPath === "/" || urlPath === "";

    if (isBareHomepage) {
      // Scan homepage text for legal document links
      const urlRegex = /https?:\/\/[^\s)"'<>]+/g;
      const homepageUrls = result.text.match(urlRegex) || [];
      const origin = validation.url!.origin;
      const domain = validation.url!.hostname.replace("www.", "");

      // Look for both TOS and PP links
      const tosPatterns = [/terms[-_]?of[-_]?service/i, /terms[-_]?of[-_]?use/i, /terms[-_]?and[-_]?conditions/i, /user[-_]?agreement/i, /\/terms\/?$/i, /\/tos\/?$/i, /\/legal\/terms/i];
      const ppPatterns = [/privacy[-_]?policy/i, /privacy[-_]?notice/i, /data[-_]?policy/i, /\/privacy\/?$/i, /\/legal\/.*privacy/i];

      const findUrl = (patterns: RegExp[]) =>
        homepageUrls.find((u) => {
          try {
            const h = new URL(u).hostname.replace("www.", "");
            if (h !== domain && !h.endsWith("." + domain)) return false;
            return patterns.some((p) => p.test(u));
          } catch { return false; }
        }) || null;

      let tosUrl = findUrl(tosPatterns);
      let ppUrl = findUrl(ppPatterns);

      // Also try common paths if not found in links
      if (!tosUrl) {
        for (const path of ["/terms", "/terms-of-service", "/tos", "/legal/terms"]) {
          try {
            const guess = await scrapeUrl(origin + path);
            if (guess.text.length >= 200 && detectDocumentType(guess.text) === "tos") {
              tosUrl = origin + path;
              break;
            }
          } catch { continue; }
        }
      }
      if (!ppUrl) {
        for (const path of ["/privacy", "/privacy-policy", "/legal/privacy"]) {
          try {
            const guess = await scrapeUrl(origin + path);
            if (guess.text.length >= 200 && detectDocumentType(guess.text) === "pp") {
              ppUrl = origin + path;
              break;
            }
          } catch { continue; }
        }
      }

      if (tosUrl && ppUrl) {
        // Found both — fetch and return combined
        const tosResult = await scrapeUrl(tosUrl);
        const ppResult = await scrapeUrl(ppUrl);
        if (tosResult.text.length >= 200 && ppResult.text.length >= 200) {
          const combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosResult.text}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppResult.text}`;
          return NextResponse.json({
            text: combinedText,
            wordCount: combinedText.split(/\s+/).length,
            sourceUrl: tosUrl,
            documentType: "combined",
            isCombined: true,
            canGrade: true,
            companion: { found: true, url: ppUrl, text: ppResult.text, type: "pp" as const },
          });
        }
      }

      if (tosUrl || ppUrl) {
        // Found one — fetch it and return as single doc
        const foundUrl = (tosUrl || ppUrl)!;
        const foundResult = await scrapeUrl(foundUrl);
        const foundType = tosUrl ? "tos" : "pp";
        if (foundResult.text.length >= 200) {
          // Try to find companion from this document
          const companion = await findCompanionDocument(foundUrl, foundType as "tos" | "pp", foundResult.text);
          return NextResponse.json({
            text: foundResult.text,
            wordCount: foundResult.wordCount,
            sourceUrl: foundUrl,
            documentType: foundType,
            isCombined: false,
            companion: companion.found
              ? { found: true, url: companion.url, text: companion.text, type: companion.type }
              : { found: false, url: null, text: null, type: null },
          });
        }
      }

      // Couldn't find any legal pages
      return NextResponse.json(
        {
          error: "We couldn't find a Terms of Service or Privacy Policy on this website. Try pasting a direct link to the TOS or Privacy Policy page.",
          fetchedButInvalid: true,
        },
        { status: 422 }
      );
    }

    // Not a bare domain — run content validation as normal
    const contentCheck = validateFetchedContent(result.text);
    if (!contentCheck.valid) {
      return NextResponse.json(
        {
          error: contentCheck.reason,
          fetchedButInvalid: true,
          wordCount: result.wordCount,
        },
        { status: 422 }
      );
    }

    const docType = detectDocumentType(result.text);

    // If already combined, no hunt needed
    if (docType === "combined") {
      return NextResponse.json({
        text: result.text,
        wordCount: result.wordCount,
        sourceUrl: result.sourceUrl,
        documentType: "combined",
        isCombined: true,
        companion: null,
      });
    }

    // Hunt for companion document — pass submitted text for Step 1 scanning
    const companion = await findCompanionDocument(
      validation.url!.href,
      docType,
      result.text
    );

    // Return primary text separately — frontend decides whether to combine
    return NextResponse.json({
      text: result.text,
      wordCount: result.wordCount,
      sourceUrl: result.sourceUrl,
      documentType: docType,
      isCombined: false,
      companion: companion.found
        ? {
            found: true,
            url: companion.url,
            text: companion.text,
            type: companion.type,
          }
        : { found: false, url: null, text: null, type: null },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch URL.";

    if (message.includes("Could not extract")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json(
      { error: "All scraping methods failed. Try pasting the text directly." },
      { status: 502 }
    );
  }
}
