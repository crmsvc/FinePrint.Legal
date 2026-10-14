# FinePrint.legal — V1 Prompt Patch: Auto-Hunt + Grade Integrity

**Date:** March 14, 2026  
**Status:** Bug fix + feature — deploy together

---

## What This Solves

1. **BUG:** AI penalizes TOS-only documents for "missing" Privacy Policy, tanking grades unfairly
2. **UX:** Users shouldn't need to find two URLs manually
3. **INTEGRITY:** One grading system, one set of weights, applied only when both documents are verified from the same source

## Core Principle

**The letter grade requires both documents fetched from a verified source. Everything else gets a full analysis without a grade.**

The grade is not the product. The plain-English analysis is the product. The grade is the shareable viral hook that drives traffic. It must mean something definitive — "we read BOTH the Terms of Service and the Privacy Policy from this company and here's our assessment." No partial grades. No adjusted weights. No asterisks.

---

## How Each Input Method Works

| Input Method | What Happens | Full Analysis? | Letter Grade? |
|---|---|---|---|
| **Paste URL** → auto-hunt finds companion | Both docs fetched from same domain, combined | Yes | **Yes** |
| **Paste URL** → auto-hunt fails → user adds companion URL (same domain) | Both docs fetched from same domain, combined | Yes | **Yes** |
| **Paste URL** → auto-hunt fails → user doesn't add companion | Single doc analyzed | Yes | **No** |
| **Paste Text** | Text analyzed as-is | Yes | **No** |
| **Upload File** | File parsed and analyzed | Yes | **No** |

**Every input method gets the full 7-section analysis with risk badges.** The analysis is always useful. The grade is the bonus you earn when both documents are verified.

---

## Part 1: Auto-Hunt Companion Document

### Flow

```
User pastes: https://instagram.com/legal/terms-of-use/

Step 1: Fetch submitted URL via Jina Reader

Step 2: Detect document type from content
        → TOS, PP, or Combined

Step 3: If Combined → skip hunt, proceed to analysis with grade

Step 4: If TOS or PP → extract root domain → fetch homepage via Jina

Step 5: Scan homepage links for companion document
        → TOS submitted? Look for PP links
        → PP submitted? Look for TOS links

Step 6a: Found → fetch companion, combine both, analyze with grade

Step 6b: Not found → analyze single doc without grade,
         show banner to add companion URL manually
```

### Loading States (user-facing)

```
"Fetching terms from instagram.com..."
"Found Privacy Policy — analyzing both documents..."   ← companion found
"Analyzing..."                                          ← companion not found
```

### Results Header

**When both documents found:**
```
Sources analyzed:
✓ Terms of Service: instagram.com/legal/terms-of-use
✓ Privacy Policy: instagram.com/legal/privacy (auto-detected)
```

**When single document only:**
```
┌──────────────────────────────────────────────────────┐
│  This analysis covers the Terms of Service only.     │
│  Add the Privacy Policy URL for a verified grade:    │
│                                                      │
│  [URL input field]  [Add & Get Grade]                │
└──────────────────────────────────────────────────────┘
```

**When paste text or upload file:**
```
┌──────────────────────────────────────────────────────┐
│  For a verified letter grade, use the Paste URL tab  │
│  so we can fetch both documents from the source.     │
└──────────────────────────────────────────────────────┘
```

### Domain Verification for Manual Companion Entry

When a user manually adds a companion URL via the banner, verify the domain matches:

```typescript
const originalDomain = new URL(sourceUrl).hostname.replace('www.', '');
const companionDomain = new URL(companionUrl).hostname.replace('www.', '');

if (originalDomain !== companionDomain) {
  // Reject — show error
  "The Privacy Policy URL must be from the same website as the Terms of Service."
}
```

This prevents mismatched documents (Company A's TOS + Company C's PP).

### Implementation: URL Scraper Update

**File:** `src/lib/site/url-scraper.ts` — MODIFY

```typescript
const PP_PATTERNS = [
  /privacy[-_]?policy/i,
  /privacy[-_]?notice/i,
  /data[-_]?policy/i,
  /data[-_]?protection/i,
  /\/privacy\/?$/i,
  /\/privacy\//i,
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
];

interface CompanionResult {
  found: boolean;
  url: string | null;
  text: string | null;
  type: 'tos' | 'pp' | null;
}

export async function findCompanionDocument(
  submittedUrl: string,
  submittedDocType: 'tos' | 'pp'
): Promise<CompanionResult> {
  try {
    const domain = new URL(submittedUrl).origin;
    
    // Check cache first
    const cached = await getCachedCompanion(domain, submittedDocType);
    if (cached) return cached;
    
    // Fetch homepage
    const homepageText = await fetchWithJina(domain);
    if (!homepageText) return { found: false, url: null, text: null, type: null };
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s\)\"\'<>]+/g;
    const allUrls = homepageText.match(urlRegex) || [];
    
    const patterns = submittedDocType === 'tos' ? PP_PATTERNS : TOS_PATTERNS;
    const companionType = submittedDocType === 'tos' ? 'pp' : 'tos';
    
    // Find matching URL from same domain
    const companionUrl = allUrls.find(url => {
      try {
        const urlDomain = new URL(url).hostname.replace('www.', '');
        const submittedDomain = new URL(submittedUrl).hostname.replace('www.', '');
        if (urlDomain !== submittedDomain && !urlDomain.endsWith('.' + submittedDomain)) return false;
        if (url === submittedUrl) return false;
        return patterns.some(pattern => pattern.test(url));
      } catch { return false; }
    });
    
    if (!companionUrl) {
      // Cache the miss too (so we don't re-scan the homepage for this domain)
      await cacheCompanionResult(domain, submittedDocType, null);
      return { found: false, url: null, text: null, type: null };
    }
    
    const companionText = await fetchWithJina(companionUrl);
    if (!companionText || companionText.length < 200) {
      return { found: false, url: null, text: null, type: null };
    }
    
    // Cache the hit
    await cacheCompanionResult(domain, submittedDocType, companionUrl);
    
    return { found: true, url: companionUrl, text: companionText, type: companionType };
  } catch {
    return { found: false, url: null, text: null, type: null };
  }
}

export function detectDocumentType(text: string): 'tos' | 'pp' | 'combined' {
  const lowerText = text.toLowerCase();
  
  const tosIndicators = [
    'terms of service', 'terms of use', 'user agreement',
    'you agree to', 'we reserve the right', 'termination',
    'intellectual property', 'limitation of liability',
    'governing law', 'dispute resolution', 'indemnif',
  ];
  
  const ppIndicators = [
    'privacy policy', 'data we collect', 'personal information',
    'cookies', 'data retention', 'third-party sharing',
    'opt-out', 'data protection', 'gdpr', 'ccpa',
    'data subject', 'right to deletion', 'data processor',
  ];
  
  const tosScore = tosIndicators.filter(t => lowerText.includes(t)).length;
  const ppScore = ppIndicators.filter(t => lowerText.includes(t)).length;
  
  if (tosScore >= 4 && ppScore >= 4) return 'combined';
  if (tosScore > ppScore) return 'tos';
  if (ppScore > tosScore) return 'pp';
  return 'tos';
}
```

### Companion URL Cache

```typescript
// Cache: domain + docType → companion URL (or null for miss)
// TTL: 24 hours
// First user to analyze instagram.com triggers homepage scan
// Every subsequent Instagram analysis uses cached result

const companionCache = new Map<string, { url: string | null; scannedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function getCachedCompanion(domain: string, docType: 'tos' | 'pp'): Promise<CompanionResult | null> {
  const key = `${domain}:${docType}`;
  const cached = companionCache.get(key);
  if (cached && Date.now() - cached.scannedAt < CACHE_TTL) {
    if (!cached.url) return { found: false, url: null, text: null, type: null };
    const text = await fetchWithJina(cached.url);
    const companionType = docType === 'tos' ? 'pp' : 'tos';
    return { found: true, url: cached.url, text, type: companionType };
  }
  return null;
}

async function cacheCompanionResult(domain: string, docType: 'tos' | 'pp', url: string | null) {
  companionCache.set(`${domain}:${docType}`, { url, scannedAt: Date.now() });
}
```

### Implementation: Fetch API Route

**File:** `src/app/api/fetch/route.ts` — MODIFY

```typescript
export async function POST(request: Request) {
  const { url } = await request.json();
  
  const primaryText = await fetchWithJina(url);
  if (!primaryText) {
    return NextResponse.json({ error: 'Could not fetch content' }, { status: 422 });
  }
  
  const docType = detectDocumentType(primaryText);
  
  // If already combined, no hunt needed
  if (docType === 'combined') {
    return NextResponse.json({
      text: primaryText,
      wordCount: primaryText.split(/\s+/).length,
      sourceUrl: url,
      companionUrl: null,
      documentType: 'combined',
      isCombined: true,
      canGrade: true,
    });
  }
  
  // Hunt for companion
  const companion = await findCompanionDocument(url, docType);
  
  if (companion.found && companion.text) {
    const tosText = docType === 'tos' ? primaryText : companion.text;
    const ppText = docType === 'pp' ? primaryText : companion.text;
    const tosUrl = docType === 'tos' ? url : companion.url;
    const ppUrl = docType === 'pp' ? url : companion.url;
    
    const combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppText}`;
    
    return NextResponse.json({
      text: combinedText,
      wordCount: combinedText.split(/\s+/).length,
      sourceUrl: url,
      companionUrl: companion.url,
      documentType: 'combined',
      isCombined: true,
      canGrade: true,
    });
  }
  
  // Single doc fallback
  return NextResponse.json({
    text: primaryText,
    wordCount: primaryText.split(/\s+/).length,
    sourceUrl: url,
    companionUrl: null,
    documentType: docType,
    isCombined: false,
    canGrade: false,
  });
}
```

### Implementation: Analyze API Route

**File:** `src/app/api/analyze/route.ts` — MODIFY

Pass `canGrade` through to the response so the frontend knows whether to show a letter grade:

```typescript
// The analyze route receives text + metadata from fetch
// Pass canGrade flag through to the response

return NextResponse.json({
  analysis: geminiResponse,
  canGrade: requestBody.canGrade,      // true only for verified combined analyses
  documentType: requestBody.documentType,
  sourceUrl: requestBody.sourceUrl,
  companionUrl: requestBody.companionUrl,
  isCombined: requestBody.isCombined,
  inputMethod: requestBody.inputMethod, // 'url' | 'text' | 'upload'
});
```

For paste text and upload file, `canGrade` is always `false` and `inputMethod` indicates why.

---

## Part 2: Prompt Update

### Document Type Awareness

Insert AFTER `## Your Personality` and BEFORE `## Analysis Output Structure`:

```
## Document Type Awareness

Before analyzing, identify what type of document(s) you're looking at:

**Combined Documents (TOS + PP):**
If you see both "=== TERMS OF SERVICE ===" and "=== PRIVACY POLICY ===" sections with source URLs, you have both documents. Analyze everything comprehensively and assign a letter grade using the standard grading criteria.

**Single Document (TOS only or PP only):**
If only one document type is present, provide a full analysis of everything in that document — all 7 sections, risk badges, red flags, and The Bottom Line verdict. However, do NOT assign a letter grade. Instead, where the Overall Grade section would go, write:

"A verified letter grade requires analysis of both the Terms of Service and Privacy Policy together. This analysis covers the [Terms of Service / Privacy Policy] only."

For sections that would normally cover content from the missing document:
- If analyzing a TOS without privacy details: In "What They Collect" and "What They Do With Your Data," cover only what the TOS explicitly states. Add: "Detailed data collection practices are typically covered in this company's separate Privacy Policy."
- If analyzing a PP without terms details: In "What Rights You Give Up," cover only what the PP explicitly states. Add: "Content licensing, dispute resolution, and termination terms are typically covered in this company's separate Terms of Service."

CRITICAL RULES for single-document analysis:
- NEVER flag "absence of a privacy policy" as a red flag when analyzing a TOS
- NEVER flag "absence of terms of service" as a red flag when analyzing a PP
- NEVER say "complete absence of a privacy policy" — say "covered in a separate document"
- If the document references the other document by name or link, mention this as a positive transparency signal
- Only flag a truly missing companion document if the text explicitly states one does not exist

**Detection:**
- "=== TERMS OF SERVICE ===" and "=== PRIVACY POLICY ===" markers → Combined
- Content about user obligations, content rights, liability, termination → TOS
- Content about data collection, cookies, sharing, retention → PP
```

### Grading Criteria — No Changes to Weights

The existing grading criteria section stays EXACTLY as it is. One set of weights. Applied only to combined analyses. The AI handles this naturally because for single-doc analyses, it's instructed not to produce a grade at all.

```
## Grading Criteria
When assigning the overall grade, weigh these factors:
- Data collection scope and necessity (30%)
- Data sharing and third-party access (25%)
- User rights surrendered (20%)
- Account deletion and data portability (15%)
- Transparency and readability of the policy itself (10%)

These weights are applied ONLY to combined analyses (both TOS and PP present).
Single-document analyses do not receive a letter grade.
```

### Rules Addition

Add to `## Rules`:

```
- Letter grades are assigned ONLY when both a Terms of Service and Privacy Policy are analyzed together. Single-document analyses provide full risk analysis without a grade.
- Always identify the document type in the verdict: "This Terms of Service..." or "This Privacy Policy..." or "Based on a complete review of both the Terms of Service and Privacy Policy..."
- For combined analyses, start the verdict with: "Based on a complete review of both the Terms of Service and Privacy Policy..."
```

---

## Part 3: Frontend — Grade Display Logic

### GradeCard Component

**File:** `src/components/site/GradeCard.tsx` — MODIFY

```typescript
// If canGrade is true → show the full grade card (letter grade, color, verdict)
// If canGrade is false → show the analysis header WITHOUT a letter grade

if (!canGrade) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 mb-6">
      <p className="text-lg font-medium text-zinc-700 mb-2">
        {documentType === 'tos' ? 'Terms of Service' : 'Privacy Policy'} Analysis
      </p>
      <p className="text-sm text-zinc-500">
        A verified letter grade requires both the TOS and Privacy Policy.
        {inputMethod === 'url' 
          ? ' Add the companion URL below for a complete grade.'
          : ' Use the Paste URL tab to fetch both documents from the source.'}
      </p>
    </div>
  );
}

// Otherwise render the normal grade card with letter grade, color, share button
```

### ResultsDisplay — Companion Banner

**File:** `src/components/site/ResultsDisplay.tsx` — MODIFY

Show the appropriate banner based on input method and grade status:

```typescript
// URL input, companion not found
{inputMethod === 'url' && !canGrade && (
  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <p className="text-sm text-amber-800 mb-2">
      Add the {documentType === 'tos' ? 'Privacy Policy' : 'Terms of Service'} URL for a verified grade:
    </p>
    <div className="flex gap-2">
      <input 
        type="url" 
        placeholder={`Paste ${documentType === 'tos' ? 'Privacy Policy' : 'TOS'} URL from the same website`}
        className="flex-1 text-sm px-3 py-2 border rounded"
        value={companionInput}
        onChange={(e) => setCompanionInput(e.target.value)}
      />
      <button onClick={handleAddCompanion} className="text-sm px-4 py-2 bg-indigo-500 text-white rounded">
        Add & Get Grade
      </button>
    </div>
  </div>
)}

// Paste text or upload file
{(inputMethod === 'text' || inputMethod === 'upload') && (
  <div className="mb-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
    <p className="text-sm text-zinc-600">
      For a verified letter grade, use the <strong>Paste URL</strong> tab so we can fetch 
      both documents directly from the source.
    </p>
  </div>
)}

// Combined analysis — show both sources
{canGrade && isCombined && (
  <div className="mb-4 text-sm text-zinc-500 space-y-1">
    <p>Sources analyzed:</p>
    <p className="text-emerald-600">✓ Terms of Service: {tosHostname}</p>
    <p className="text-emerald-600">✓ Privacy Policy: {ppHostname} {wasAutoDetected ? '(auto-detected)' : ''}</p>
  </div>
)}
```

### Share Button Logic

Share buttons appear on ALL analyses (graded or not). But the OG card content differs:

**Graded result (combined):** OG card shows company name + letter grade + verdict (the full card we designed)

**Ungraded result (single doc):** OG card shows company name + "TOS Analysis" or "Privacy Policy Analysis" + the bottom line text. No letter grade on the card. Still shareable, still useful — just no grade stamp.

---

## Test Plan

| # | Test | Expected Result |
|---|---|---|
| 1 | Instagram TOS URL | Auto-finds PP → combined → full grade |
| 2 | Spotify PP URL | Auto-finds TOS → combined → full grade |
| 3 | FinePrint TOS URL | Auto-hunt may fail → single doc → no grade, no "missing PP" red flag, banner to add |
| 4 | Orchids.app TOS URL | Auto-finds PP → combined → full grade |
| 5 | WaPo TOS URL | Auto-finds PP → combined → full grade |
| 6 | Paste TOS text (no URL) | Full analysis → no grade → "Use Paste URL tab" message |
| 7 | Upload TOS PDF | Full analysis → no grade → "Use Paste URL tab" message |
| 8 | URL + manual companion from SAME domain | Combined → full grade |
| 9 | URL + manual companion from DIFFERENT domain | Rejected: "Must be from the same website" |
| 10 | URL to a page that has TOS+PP combined | Detected as combined → full grade, no hunt |
| 11 | URL to company homepage (not a legal doc) | "This doesn't appear to be a TOS or Privacy Policy" |

---

## Modified Files Summary

| File | Change | Description |
|------|--------|-------------|
| `src/lib/site/url-scraper.ts` | MODIFY | Add `findCompanionDocument()`, `detectDocumentType()`, companion caching |
| `src/app/api/fetch/route.ts` | MODIFY | Auto-hunt flow: detect type → hunt → combine or fallback. Returns `canGrade` flag |
| `src/app/api/analyze/route.ts` | MODIFY | Pass `canGrade`, `inputMethod`, `documentType` through to response |
| `src/components/site/URLInput.tsx` | MODIFY | Loading messages for auto-hunt states |
| `src/components/site/ResultsDisplay.tsx` | MODIFY | Companion banner (URL vs text/upload), dual source display, domain verification |
| `src/components/site/GradeCard.tsx` | MODIFY | Conditional: show grade card (combined) or analysis header (single doc) |
| `src/lib/site/prompt.ts` | MODIFY | Document Type Awareness section, grade-only-for-combined rule, prohibited language |

No new files. No new dependencies. No schema changes. No adjusted grading weights.

---

## Build Log Entry

```
### [DATE]
- **Auto-hunt companion doc** — system scrapes homepage footer to find TOS/PP companion when user submits single URL
- **Grade integrity** — letter grades assigned ONLY for verified combined analyses (both TOS + PP from same domain). One grading system, one set of weights, no exceptions.
- **No-grade analyses** — paste text and upload file get full 7-section analysis with risk badges but no letter grade. Clear messaging directs users to URL tab for verified grades.
- **Domain verification** — manual companion URL must match original domain. Prevents mismatched document analysis.
- **Companion caching** — 24hr TTL cache reduces Jina Reader usage for repeat domains
- **Prompt patch** — Document Type Awareness for single-doc analysis. AI never penalizes for "missing" companion document. Never says "absence of privacy policy."
- **Deviation from V1:** V1 assigned grades to all analyses regardless of document completeness. V1.1 requires verified combined analysis for grade assignment.
```

---

**Hand to CC with: "This is the auto-hunt + grade integrity patch. The system automatically finds the companion document from the homepage. Letter grades are ONLY assigned when both TOS and PP are verified from the same domain. All other analyses get the full 7-section treatment without a grade. One grading system, no adjusted weights, no partial grades. Test with Instagram's TOS URL first."**
