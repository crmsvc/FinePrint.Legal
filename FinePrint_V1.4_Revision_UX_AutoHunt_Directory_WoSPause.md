# FinePrint.legal — V1.4 Revision: UX Choice, Auto-Hunt Fix, Directory Submissions, WoS Pause

**Date:** March 19, 2026  
**Status:** Revision — multiple fixes and UX improvements in one deployment  
**Supersedes:** Addresses bugs and gaps found after V1.3 (Auto-Hunt + Grade Integrity) deployment

---

## Summary of Changes

| # | Type | Description |
|---|------|-------------|
| 1 | **UX** | Two-button choice after fetch — user picks "Analyze [doc type] Only" or "Analyze Both & Get Grade" |
| 2 | **Bug** | "Add & Get Grade" companion banner resets page instead of re-analyzing |
| 3 | **Bug** | Auto-hunt should scan submitted page FIRST, then homepage fallback |
| 4 | **Bug** | Content validation — detect login pages, agreement walls, error pages |
| 5 | **Prompt** | Jurisdiction context awareness — local vs global business differentiation |
| 6 | **Feature** | "Add Company to Directory" — user-submitted companies go to admin queue |
| 7 | **Feature** | Wall of Shame disabled for users (keep all admin/backend functionality) |

---

## 1. Two-Button Choice After Fetch

### Problem
Currently, when the auto-hunt finds a companion document, the system assumes the user wants both analyzed. There's no option to just analyze the single document they submitted. Some users don't care about a letter grade — they just want the plain-English breakdown of what they're agreeing to.

### Solution
After fetch completes, show two buttons when a companion is found. The left button adapts based on what document was detected. The right button is always the same.

### Button Logic

**Companion found, user submitted TOS:**
```
Found 6,796 words from www.tiktok.com
✓ Also found their Privacy Policy

[Analyze TOS Only]          [Analyze Both & Get Grade]
```

**Companion found, user submitted PP:**
```
Found 8,200 words from www.spotify.com
✓ Also found their Terms of Service

[Analyze Privacy Policy Only]    [Analyze Both & Get Grade]
```

**Companion NOT found:**
```
Found 4,200 words from orchids.app

[Analyze This Document]
```
Single button only. No mention of grades or companion docs. Clean and simple.

**Already combined (single page has both TOS + PP):**
```
Found 12,000 words from example.com
This document contains both TOS and Privacy Policy

[Analyze & Get Grade]
```
Single button. The combined doc qualifies for a grade automatically.

**User entered a bare domain (e.g., crmsvc.com) and auto-hunt found BOTH:**
```
Found 4,926 words from crmsvc.com
✓ Auto-detected both TOS and Privacy Policy

[Analyze & Get Grade]
```
Since the system found both docs from the domain, this is a combined analysis. Single button.

### Implementation

**File:** `src/components/site/HomeTool.tsx` (or wherever the fetch → analyze flow lives) — MODIFY

The fetch API response already returns `documentType`, `isCombined`, and `companionUrl`. Use these to determine which buttons to show:

```typescript
// After fetch completes:
const showTwoButtons = !isCombined && companionUrl !== null;
const showSingleGradeButton = isCombined;
const showSingleAnalyzeButton = !isCombined && companionUrl === null;

// Dynamic label for the "analyze only" button:
const analyzeOnlyLabel = documentType === 'tos' 
  ? 'Analyze TOS Only' 
  : documentType === 'pp' 
    ? 'Analyze Privacy Policy Only' 
    : 'Analyze This Document';
```

**Behavior of each button:**

"Analyze [doc type] Only":
- Sends ONLY the submitted document text to the analyze API
- `canGrade: false`
- Full 7-section analysis, risk badges, red flags, The Bottom Line
- No letter grade
- No companion URL banner after results (the user already chose not to include it)

"Analyze Both & Get Grade":
- Sends the combined text (submitted + companion) to the analyze API
- `canGrade: true`
- Full combined analysis with letter grade
- Both sources listed in results header

### What About the Existing "Analyze This Policy" Button?

Replace it entirely with the two-button layout described above. The current single "Analyze This Policy" button disappears. The button(s) that appear are determined by the fetch result.

**BEFORE fetch:** Show the Fetch button only. No analyze buttons visible.

**AFTER fetch:** Show the appropriate button(s) based on what was found.

### Post-Analysis Companion Banner

When a user clicks "Analyze [doc type] Only" and gets results, do NOT show the "Add companion URL for a verified grade" banner. They made their choice. Respect it.

However, at the BOTTOM of the results (below The Bottom Line, above the disclaimer), show a subtle note:

```
Want the full picture? Analyze both the TOS and Privacy Policy together for a verified letter grade.
[Re-analyze with both documents →]
```

This is a soft upsell, not a nag. Clicking it re-runs the analysis as combined using the companion URL the system already found. No extra input needed from the user.

---

## 2. Fix "Add & Get Grade" Button Reset Bug

### Problem
When the auto-hunt fails and the user manually adds a companion URL via the banner, clicking "Add & Get Grade" resets the page state entirely instead of re-analyzing.

### Root Cause
The button likely triggers a page navigation or form submission instead of an in-place state update.

### Fix

**File:** `src/components/site/ResultsDisplay.tsx` — MODIFY

The "Add & Get Grade" handler must:
1. Validate the companion URL domain matches the original URL domain
2. Keep the already-fetched primary document text in component state
3. Call the fetch API for ONLY the companion URL
4. Combine the primary text + companion text with the `=== TERMS OF SERVICE ===` / `=== PRIVACY POLICY ===` separators
5. Call the analyze API with the combined text and `canGrade: true`
6. Update the results in-place — no page navigation, no state reset

```typescript
async function handleAddCompanion() {
  // Validate domain match
  const originalDomain = new URL(sourceUrl).hostname.replace('www.', '');
  const companionDomain = new URL(companionInput).hostname.replace('www.', '');
  
  if (originalDomain !== companionDomain) {
    setCompanionError('The URL must be from the same website.');
    return;
  }
  
  setIsReanalyzing(true);
  
  // Fetch companion only
  const companionResponse = await fetch('/api/fetch', {
    method: 'POST',
    body: JSON.stringify({ url: companionInput }),
  });
  const companionData = await companionResponse.json();
  
  // Combine with existing primary text (already in state)
  const combinedText = documentType === 'tos'
    ? `=== TERMS OF SERVICE ===\nSource: ${sourceUrl}\n\n${primaryText}\n\n=== PRIVACY POLICY ===\nSource: ${companionInput}\n\n${companionData.text}`
    : `=== PRIVACY POLICY ===\nSource: ${sourceUrl}\n\n${primaryText}\n\n=== TERMS OF SERVICE ===\nSource: ${companionInput}\n\n${companionData.text}`;
  
  // Re-analyze as combined
  const analysisResponse = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ 
      text: combinedText, 
      canGrade: true,
      documentType: 'combined',
      isCombined: true,
      sourceUrl,
      companionUrl: companionInput,
    }),
  });
  
  // Update results in-place
  const newResults = await analysisResponse.json();
  setAnalysis(newResults);
  setCanGrade(true);
  setIsCombined(true);
  setIsReanalyzing(false);
}
```

---

## 3. Auto-Hunt: Scan Submitted Page First

### Problem
The auto-hunt only searches the homepage for companion links. Sites with homepage walls (TikTok's "agree" gate, Facebook's login page) block Jina Reader from seeing footer links. But the submitted page (the actual TOS or PP URL) almost always cross-references its companion document and is NOT behind a wall.

### Fix
Change the search order: scan the submitted page first, then fall back to homepage.

**File:** `src/lib/site/url-scraper.ts` — MODIFY `findCompanionDocument()`

```typescript
export async function findCompanionDocument(
  submittedUrl: string,
  submittedDocType: 'tos' | 'pp',
  submittedText: string  // ← NEW: pass the already-fetched text
): Promise<CompanionResult> {
  const patterns = submittedDocType === 'tos' ? PP_PATTERNS : TOS_PATTERNS;
  const companionType = submittedDocType === 'tos' ? 'pp' : 'tos';
  const submittedDomain = new URL(submittedUrl).hostname.replace('www.', '');
  
  // Check cache first
  const cached = await getCachedCompanion(submittedDomain, submittedDocType);
  if (cached) return cached;
  
  // === STEP 1: Scan the submitted page for companion links ===
  // Legal pages almost always cross-reference each other
  const urlRegex = /https?:\/\/[^\s\)\"\'<>]+/g;
  const submittedPageUrls = submittedText.match(urlRegex) || [];
  
  let companionUrl = findMatchingUrl(submittedPageUrls, patterns, submittedUrl, submittedDomain);
  
  if (companionUrl) {
    const companionText = await fetchWithJina(companionUrl);
    if (companionText && companionText.length >= 200) {
      await cacheCompanionResult(submittedDomain, submittedDocType, companionUrl);
      return { found: true, url: companionUrl, text: companionText, type: companionType };
    }
  }
  
  // === STEP 2: Fall back to homepage scan ===
  try {
    const domain = new URL(submittedUrl).origin;
    const homepageText = await fetchWithJina(domain);
    
    if (homepageText) {
      const homepageUrls = homepageText.match(urlRegex) || [];
      companionUrl = findMatchingUrl(homepageUrls, patterns, submittedUrl, submittedDomain);
      
      if (companionUrl) {
        const companionText = await fetchWithJina(companionUrl);
        if (companionText && companionText.length >= 200) {
          await cacheCompanionResult(submittedDomain, submittedDocType, companionUrl);
          return { found: true, url: companionUrl, text: companionText, type: companionType };
        }
      }
    }
  } catch {
    // Homepage fetch failed (wall, error, etc.) — continue to Step 3
  }
  
  // === STEP 3: Try common legal URL patterns ===
  const baseDomain = new URL(submittedUrl).origin;
  const commonPaths = submittedDocType === 'tos'
    ? ['/privacy', '/privacy-policy', '/legal/privacy', '/legal/page/us/privacy-policy/en']
    : ['/terms', '/terms-of-service', '/legal/terms', '/legal/page/us/terms-of-service/en'];
  
  for (const path of commonPaths) {
    try {
      const guessUrl = baseDomain + path;
      const guessText = await fetchWithJina(guessUrl);
      if (guessText && guessText.length >= 200) {
        // Verify it's actually the right document type
        const guessDocType = detectDocumentType(guessText);
        if (guessDocType === companionType || guessDocType === 'combined') {
          await cacheCompanionResult(submittedDomain, submittedDocType, guessUrl);
          return { found: true, url: guessUrl, text: guessText, type: companionType };
        }
      }
    } catch {
      continue;
    }
  }
  
  // Nothing found
  await cacheCompanionResult(submittedDomain, submittedDocType, null);
  return { found: false, url: null, text: null, type: null };
}

// Helper: find a URL matching patterns from the same domain
function findMatchingUrl(
  urls: string[], 
  patterns: RegExp[], 
  submittedUrl: string, 
  submittedDomain: string
): string | null {
  return urls.find(url => {
    try {
      const urlDomain = new URL(url).hostname.replace('www.', '');
      if (urlDomain !== submittedDomain && !urlDomain.endsWith('.' + submittedDomain)) return false;
      if (url === submittedUrl) return false;
      return patterns.some(pattern => pattern.test(url));
    } catch { return false; }
  }) || null;
}
```

### Additional URL Patterns

Add these to the existing pattern arrays to catch deeper legal page structures:

```typescript
// Add to PP_PATTERNS:
/\/legal\/.*privacy/i,        // TikTok: /legal/page/us/privacy-policy/en
/\/legal\/.*data[-_]?policy/i,

// Add to TOS_PATTERNS:
/\/legal\/.*terms/i,          // TikTok: /legal/page/us/terms-of-service/en
/\/legal\/.*user[-_]?agreement/i,
```

### Pass Submitted Text to Auto-Hunt

**File:** `src/app/api/fetch/route.ts` — MODIFY

The `findCompanionDocument` function now takes the submitted text as a third argument:

```typescript
// Change from:
const companion = await findCompanionDocument(url, docType);

// Change to:
const companion = await findCompanionDocument(url, docType, primaryText);
```

---

## 4. Content Validation — Login Page Detection

### Problem
When a user enters a bare domain (e.g., `facebook.com`) or a URL that redirects to a login page, Jina Reader returns the login page content instead of actual legal documents. The system currently shows this as a successful fetch ("Found 92 words") and lets the user try to analyze it.

### Fix
After fetching any URL, validate the content before presenting it to the user.

**File:** `src/app/api/fetch/route.ts` — MODIFY (add validation after fetch)

```typescript
function validateFetchedContent(text: string, url: string): { valid: boolean; reason?: string } {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  // Too short to be a legal document
  if (wordCount < 150) {
    // Check if it's a login/wall page
    const loginSignals = [
      'log in', 'login', 'sign in', 'signin', 'create account',
      'create new account', 'sign up', 'signup', 'forgot password',
      'email or mobile', 'enter your password', 'email or phone',
    ];
    
    const loginScore = loginSignals.filter(s => lowerText.includes(s)).length;
    
    if (loginScore >= 2) {
      return {
        valid: false,
        reason: 'This URL returned a login page, not a legal document. Try pasting the direct URL to the company\'s Terms of Service or Privacy Policy page.'
      };
    }
    
    // Check for agreement/cookie walls
    const wallSignals = [
      'i agree', 'accept all', 'accept cookies', 'consent',
      'before you continue', 'agree to continue',
    ];
    
    const wallScore = wallSignals.filter(s => lowerText.includes(s)).length;
    
    if (wallScore >= 2) {
      return {
        valid: false,
        reason: 'This URL is behind an agreement or cookie wall. Try pasting the direct URL to the Terms of Service or Privacy Policy page instead.'
      };
    }
    
    // Generic too-short warning
    return {
      valid: false,
      reason: 'This page doesn\'t contain enough content to analyze. Make sure you\'re pasting a direct link to a Terms of Service or Privacy Policy page.'
    };
  }
  
  return { valid: true };
}
```

Use in the fetch route:

```typescript
const primaryText = await fetchWithJina(url);

if (!primaryText) {
  return NextResponse.json({ error: 'Could not fetch content from this URL.' }, { status: 422 });
}

const validation = validateFetchedContent(primaryText, url);

if (!validation.valid) {
  return NextResponse.json({ 
    error: validation.reason,
    fetchedButInvalid: true,  // Frontend can distinguish from network errors
    wordCount: primaryText.split(/\s+/).length,
  }, { status: 422 });
}
```

**Frontend handling:**

When `fetchedButInvalid` is true, show a warning card instead of the text preview:

```typescript
{fetchError && fetchError.fetchedButInvalid && (
  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
      ⚠️ Not a Terms of Service or Privacy Policy
    </p>
    <p className="text-sm text-amber-700 mt-1">
      {fetchError.reason}
    </p>
  </div>
)}
```

---

## 5. Prompt Addition — Jurisdiction Context Awareness

### Problem
Local businesses are penalized for specifying their local jurisdiction in dispute resolution clauses (e.g., "Clark County, Washington"). This is standard for local service businesses but problematic for global platforms. The AI treats both the same.

### Fix
Add this section to the system prompt AFTER the Document Type Awareness section:

```
## Jurisdiction Context Awareness

When evaluating dispute resolution and jurisdiction clauses, consider the nature of the business:

**Local/regional service businesses** (contractors, agencies, consultants, healthcare, 
real estate, home services, law firms, restaurants — businesses with a defined geographic 
service area): Specifying local jurisdiction (e.g., "disputes resolved in [local county/state]") 
is standard practice and should be rated LOW RISK. The jurisdiction typically matches where 
both the business and its customers operate.

**National/global digital services** (social media, SaaS, streaming, e-commerce platforms 
serving users across states or countries): Specifying a single narrow jurisdiction is a 
strategic advantage for the company and a barrier for users. Rate based on how restrictive 
it is relative to the user base:
- State-level jurisdiction for a US-only service = MEDIUM RISK
- Single US jurisdiction for a global service = HIGH RISK
- Foreign jurisdiction for US users = HIGH RISK

**How to detect business type from the document:**
Signals a business is local/regional: physical address listed, service area mentioned, 
industry is inherently local (construction, legal, real estate, healthcare, home services), 
small team or single-location indicators.

Signals a business is national/global: no physical address, digital-only product, users 
from multiple states/countries, app store distribution, "worldwide" or "global" language.
```

**File:** `src/lib/site/prompt.ts` — ADD to system prompt after Document Type Awareness section

---

## 6. Add Company to Directory — User Submissions

### What It Does
After a user completes a graded analysis (combined TOS + PP), show an option to submit that company to the public directory. The submission goes to the admin queue for review. Approved submissions appear on the `/companies` page with a community badge.

### User Flow

After a combined analysis with a letter grade, show below the results:

```
┌─────────────────────────────────────────────────────────┐
│  📋 Add this company to the FinePrint Directory         │
│                                                         │
│  Help others by adding this analysis to our public      │
│  company directory. Submissions are reviewed before     │
│  publishing.                                            │
│                                                         │
│  [Add to Directory →]                                   │
└─────────────────────────────────────────────────────────┘
```

This button ONLY appears when:
- The analysis is a combined analysis (`canGrade: true`)
- The analysis has a letter grade
- The company is NOT already in the directory (check by domain)

### What Gets Submitted

When the user clicks "Add to Directory," the system sends:

```typescript
{
  companyName: string,        // Extracted from analysis or entered by user
  domain: string,             // Root domain from the URL
  tosUrl: string,             // The TOS URL used
  ppUrl: string,              // The PP URL used
  grade: string,              // The letter grade (A+ through F)
  verdict: string,            // The one-line verdict
  analysisJson: object,       // The full analysis output
  submittedAt: timestamp,
  submitterIp: hashedIp,      // Hashed, not stored raw
}
```

### API Route

**File:** `src/app/api/directory/submit/route.ts` — NEW

```typescript
export async function POST(request: Request) {
  // Rate limit: 3 directory submissions per IP per 24 hours
  
  const body = await request.json();
  
  // Validate required fields
  if (!body.domain || !body.grade || !body.analysisJson) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Check if domain already exists in companies table
  const { data: existing } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('domain', body.domain)
    .single();
  
  if (existing) {
    return NextResponse.json({ 
      error: 'This company is already in our directory.' 
    }, { status: 409 });
  }
  
  // Check if domain already has a pending submission
  const { data: pendingExisting } = await supabaseAdmin
    .from('pending_analyses')
    .select('id')
    .eq('domain', body.domain)
    .eq('status', 'pending')
    .single();
  
  if (pendingExisting) {
    return NextResponse.json({ 
      error: 'A submission for this company is already under review.' 
    }, { status: 409 });
  }
  
  // Insert into pending_analyses table
  const { error } = await supabaseAdmin
    .from('pending_analyses')
    .insert({
      company_name: body.companyName,
      domain: body.domain,
      tos_url: body.tosUrl,
      pp_url: body.ppUrl,
      overall_grade: body.grade,
      verdict: body.verdict,
      analysis_json: body.analysisJson,
      source: 'community',         // Distinguish from editorial submissions
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
  
  if (error) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

### Admin Queue

The existing admin panel already has a pending analyses queue (from V3). Community submissions appear in this same queue with a visual indicator:

```
[Editorial]  Netflix — submitted via hybrid pipeline
[Community]  CRM Services LLC — submitted by user
[Community]  Orchids.app — submitted by user
```

Admin actions remain the same: Approve, Reject, Trash.

On **Approve**, the company is created on the `/companies` page from the stored analysis JSON. Community-submitted companies display a small badge:

```
[Community badge icon] Community-submitted analysis
```

This distinguishes them from Tier 1 editorial analyses while still treating them as full entries. The badge is a trust signal, not a quality downgrade — it means "a real user analyzed this and we verified it."

### Supabase Schema

The existing `pending_analyses` table should already have the needed columns. If not, add:

```sql
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'editorial';
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS tos_url TEXT;
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS pp_url TEXT;
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS verdict TEXT;
```

---

## 7. Wall of Shame — Disable for Users

### What Changes

**Remove from user-facing UI:**
- Remove "Submit to Wall of Shame" links from red flag cards in analysis results
- Remove the Wall of Shame nav link from the header
- Remove the Wall of Shame page from being publicly accessible (return 404 or redirect to homepage)
- Remove the standalone submission form at `/wall-of-shame/submit`
- Remove the "Found something worse?" CTA from any page

**Keep intact (admin/backend):**
- All Supabase tables (submissions, votes, categories) — do NOT drop or alter
- Admin moderation queue and panel — keep functional
- All WoS API routes — keep but disable public access (admin-only)
- The WoS Option C restructure doc — keep as the design spec for when it's re-enabled
- All WoS components — keep in codebase, just don't render them

### Implementation

**File:** `src/components/site/ResultsDisplay.tsx` — MODIFY
Remove or conditionally hide the "Submit to Wall of Shame" button on red flag cards:

```typescript
// Remove this from red flag cards:
// <button onClick={() => openSubmissionModal(...)}>Submit to Wall of Shame</button>

// Or use a feature flag:
const WALL_OF_SHAME_ENABLED = false;

{WALL_OF_SHAME_ENABLED && (
  <button onClick={() => openSubmissionModal(...)}>
    Submit to Wall of Shame
  </button>
)}
```

**File:** `src/app/wall-of-shame/page.tsx` — MODIFY
Redirect to homepage or show a "Coming Soon" page:

```typescript
import { redirect } from 'next/navigation';

export default function WallOfShamePage() {
  redirect('/');
  // Or show a teaser:
  // return <ComingSoonPage feature="Wall of Shame" />;
}
```

**File:** `src/components/site/Header.tsx` (or nav component) — MODIFY
Remove Wall of Shame from navigation:

```typescript
const WALL_OF_SHAME_ENABLED = false;

// In the nav links array, conditionally include:
...(WALL_OF_SHAME_ENABLED ? [{ label: 'Wall of Shame', href: '/wall-of-shame' }] : []),
```

**Feature flag approach:** Use a single constant `WALL_OF_SHAME_ENABLED = false` that can be flipped to `true` when you're ready to re-enable. This is cleaner than deleting code and having to recreate it later.

---

## Modified Files Summary

| File | Change | Related To |
|------|--------|-----------|
| `src/components/site/HomeTool.tsx` | Two-button layout after fetch | #1 UX Choice |
| `src/components/site/ResultsDisplay.tsx` | Fix companion re-analyze, remove WoS buttons, add directory submit | #2 Bug, #6 Directory, #7 WoS |
| `src/lib/site/url-scraper.ts` | Scan submitted page first, add URL patterns, pass submitted text | #3 Auto-Hunt |
| `src/app/api/fetch/route.ts` | Content validation, pass text to auto-hunt | #3 Auto-Hunt, #4 Validation |
| `src/lib/site/prompt.ts` | Jurisdiction context awareness | #5 Prompt |
| `src/app/api/directory/submit/route.ts` | NEW — directory submission endpoint | #6 Directory |
| `src/app/wall-of-shame/page.tsx` | Redirect to homepage | #7 WoS Pause |
| `src/components/site/Header.tsx` | Remove WoS nav link | #7 WoS Pause |

### SQL (if needed):
```sql
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'editorial';
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS tos_url TEXT;
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS pp_url TEXT;
ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS verdict TEXT;
```

---

## Test Plan

| # | Test | Expected |
|---|------|----------|
| 1 | Paste TikTok TOS URL | Auto-hunt finds PP from submitted page links → two buttons shown |
| 2 | Click "Analyze TOS Only" on TikTok | Full analysis, no grade, no companion nag banner |
| 3 | Click "Analyze Both & Get Grade" on any site | Combined analysis with letter grade |
| 4 | Paste `facebook.com` (bare domain, login page) | Content validation catches it: "This URL returned a login page" |
| 5 | Paste `crmsvc.com` (bare domain, no wall) | Finds both TOS + PP, shows single "Analyze & Get Grade" button |
| 6 | Companion banner "Add & Get Grade" button | Re-analyzes in-place, does NOT reset page |
| 7 | Companion URL from different domain | Rejected: "Must be from the same website" |
| 8 | Local business TOS with jurisdiction clause | Jurisdiction rated LOW RISK with local business context |
| 9 | Global platform with single jurisdiction | Jurisdiction rated HIGH RISK |
| 10 | Complete graded analysis → "Add to Directory" | Submission goes to admin pending queue |
| 11 | Submit company already in directory | Error: "Already in our directory" |
| 12 | Visit `/wall-of-shame` | Redirected to homepage |
| 13 | Red flag cards in results | No "Submit to Wall of Shame" link visible |
| 14 | Admin panel | WoS moderation queue still functional |

---

## Build Log Entry

```
### [DATE]
- **Two-button UX** — after fetch, user chooses "Analyze [doc] Only" or "Analyze Both & Get Grade." Button labels dynamic based on detected document type.
- **Companion re-analyze fix** — "Add & Get Grade" now re-analyzes in-place instead of resetting page
- **Auto-hunt improvement** — scans submitted page for companion links FIRST, then homepage fallback, then common URL patterns. Fixes TikTok and sites with homepage walls.
- **Content validation** — detects login pages, agreement walls, and insufficient content after fetch. Shows warning instead of letting user analyze garbage content.
- **Jurisdiction context** — prompt now differentiates local businesses (LOW RISK for local jurisdiction) from global platforms (HIGH RISK for restrictive jurisdiction)
- **Add to Directory** — users can submit graded companies to the admin queue for review. Community badge on approved submissions.
- **Wall of Shame paused** — feature flag disabled. All backend/admin functionality preserved. Nav link, submission buttons, and public pages hidden.
- **Deviation from V1.3:** V1.3 assumed users always want the combined analysis. V1.4 gives users the choice.
```

---

**Hand to CC with: "V1.4 revision doc — seven changes in one deployment. Priority order: #2 (button reset bug), #1 (two-button UX), #3 (auto-hunt scan order), #4 (content validation), #7 (disable WoS), #6 (directory submissions), #5 (jurisdiction prompt). Test TikTok's TOS URL after #3 is done — it should find the PP from the submitted page."**
