# FinePrint.legal — V1.5 Revision: Tier 1 Mapping, Content Rewrites, Admin Tools, OG Fix, Supabase Migration

**Date:** March 19, 2026  
**Status:** Revision — content updates + admin features + bug fix  
**Context:** Follow-up to V1.4 deployment. Covers remaining items from the running task list plus new admin tooling needs discovered during testing.

---

## Summary of Changes

| # | Type | Description |
|---|------|-------------|
| 1 | **Feature** | Tier 1 URL mapping for known problem domains (Instagram, Facebook, TikTok) |
| 2 | **Content** | How We Grade page — add combined analysis requirement, hold real examples |
| 3 | **Content** | FinePrint TOS rewrite — soften termination clause, add PP reference |
| 4 | **Content** | FinePrint Privacy Policy rewrite — reflect actual data practices |
| 5 | **Feature** | Admin: annual re-analysis queue (birthday reminders) |
| 6 | **Feature** | Admin: manual re-analyze button on published companies |
| 7 | **Bug** | OG card/share — company-specific card not rendering on social platforms |
| 8 | **Bug** | Bare domain content validation — skip homepage validation, go straight to auto-hunt |
| 9 | **Feature** | Migrate Tier 1 companies to Supabase — unified admin panel with checkbox bulk re-analyze |

---

## 1. Tier 1 URL Mapping for Known Problem Domains

### Problem
Major companies gate their legal pages behind login walls or agreement screens. When a user enters `instagram.com/terms`, Jina Reader gets a login page instead of the actual TOS. The content validation from V1.4 catches this, but the user is stuck — they can't get the content without a working URL.

### Solution
Maintain a lookup table of known domains mapped to their working TOS and PP URLs. When the system detects a known domain (either from a submitted URL or from the auto-hunt), it uses the mapped URLs instead of the user-provided ones.

### Implementation

**File:** `src/lib/site/known-companies.ts` — NEW

```typescript
interface KnownCompanyUrls {
  name: string;
  tosUrl: string;
  ppUrl: string;
}

// Domains mapped to their publicly accessible legal page URLs
// These bypass login walls and agreement gates
export const KNOWN_COMPANY_URLS: Record<string, KnownCompanyUrls> = {
  'instagram.com': {
    name: 'Instagram',
    tosUrl: 'https://help.instagram.com/581066165581870',
    ppUrl: 'https://privacycenter.instagram.com/policy',
  },
  'facebook.com': {
    name: 'Facebook',
    tosUrl: 'https://www.facebook.com/legal/terms',
    ppUrl: 'https://www.facebook.com/privacy/policy',
  },
  'tiktok.com': {
    name: 'TikTok',
    tosUrl: 'https://www.tiktok.com/legal/page/us/terms-of-service/en',
    ppUrl: 'https://www.tiktok.com/legal/page/us/privacy-policy/en',
  },
  'whatsapp.com': {
    name: 'WhatsApp',
    tosUrl: 'https://www.whatsapp.com/legal/terms-of-service',
    ppUrl: 'https://www.whatsapp.com/legal/privacy-policy',
  },
  'x.com': {
    name: 'X (Twitter)',
    tosUrl: 'https://x.com/en/tos',
    ppUrl: 'https://x.com/en/privacy',
  },
  'twitter.com': {
    name: 'X (Twitter)',
    tosUrl: 'https://x.com/en/tos',
    ppUrl: 'https://x.com/en/privacy',
  },
};

// Normalize domain: strip www, extract root domain
export function normalizeDomain(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url.replace('www.', '');
  }
}

// Look up known URLs for a domain
export function getKnownCompanyUrls(url: string): KnownCompanyUrls | null {
  const domain = normalizeDomain(url);
  return KNOWN_COMPANY_URLS[domain] || null;
}
```

### Integration into Fetch Route

**File:** `src/app/api/fetch/route.ts` — MODIFY

Before the normal fetch flow, check if the domain is in the Tier 1 map:

```typescript
import { getKnownCompanyUrls } from '@/lib/site/known-companies';

export async function POST(request: Request) {
  const { url } = await request.json();
  
  // Check Tier 1 mapping first
  const knownUrls = getKnownCompanyUrls(url);
  
  if (knownUrls) {
    // Fetch both known URLs directly — skip auto-hunt entirely
    const tosText = await fetchWithJina(knownUrls.tosUrl);
    const ppText = await fetchWithJina(knownUrls.ppUrl);
    
    if (tosText && ppText && tosText.length >= 200 && ppText.length >= 200) {
      const combinedText = `=== TERMS OF SERVICE ===\nSource: ${knownUrls.tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${knownUrls.ppUrl}\n\n${ppText}`;
      
      return NextResponse.json({
        text: combinedText,
        wordCount: combinedText.split(/\s+/).length,
        sourceUrl: knownUrls.tosUrl,
        companionUrl: knownUrls.ppUrl,
        documentType: 'combined',
        isCombined: true,
        canGrade: true,
        companyName: knownUrls.name,
        tier1Match: true,  // Frontend can show "Known company — verified URLs"
      });
    }
    
    // If known URLs fail, fall through to normal fetch flow
  }
  
  // ... rest of existing fetch logic (normal fetch → detect type → auto-hunt)
}
```

### Growing the Map

This map starts small (5-10 companies with known login wall issues) and grows as you discover more. Admin panel could have a section to add known company URLs, but for now a code file is fine — CC can add entries as they're discovered.

The auto-hunt (V1.4 #3 — scan submitted page → homepage → common paths) handles everything NOT in this map. The Tier 1 map is for the handful of companies where auto-hunt consistently fails because of walls.

---

## 2. How We Grade Page Update

### Changes Needed

**File:** `src/app/how-we-grade/page.tsx` — MODIFY content

**Add new section after the grading weights explanation:**

```markdown
## What Qualifies for a Grade

A FinePrint letter grade represents a complete review of both a company's 
Terms of Service AND Privacy Policy, analyzed together. We only assign 
letter grades when both documents have been verified from the same source.

This ensures every grade reflects the full picture — not just half the story. 
A Terms of Service alone can't tell you about data collection. A Privacy Policy 
alone can't tell you about content licensing. You need both for the complete 
assessment.

If you analyze a single document (just a TOS or just a PP), you'll still get 
our full plain-English breakdown with risk badges on every clause. The letter 
grade is the bonus you earn when both documents are verified.
```

**Add new FAQ entry:**

```markdown
### Why didn't my analysis get a letter grade?

Letter grades require both the Terms of Service and Privacy Policy analyzed 
together from a verified source URL. If you pasted text or uploaded a file, 
you'll get a full analysis with risk badges but no grade. Use the Paste URL 
tab — we'll automatically find the companion document and give you the 
complete grade.
```

**Real Examples section — TEMPORARY HOLD:**

The "Real Examples" section currently references specific company grades (Spotify B-, Discord C+, Google C, Reddit C, Amazon C-, Facebook D, TikTok D+, X/Twitter D+). These grades may change after re-analyzing all companies with the updated grading system.

For now, add a note in the code:

```typescript
// TODO: Update Real Examples after all companies are re-analyzed with V1.3+ grading system
// Current grades may change — hold off on hardcoded examples until re-analysis is complete
```

After re-analysis, update the examples to reflect the new grades. Some companies may shift categories.

---

## 3. FinePrint Terms of Service Rewrite

### Goal
Soften the aggressive clauses that got flagged while maintaining necessary legal protections. Target: A- or higher when run through our own tool.

**File:** `src/app/terms/page.tsx` — MODIFY content

### Full Revised TOS Content

```markdown
# FinePrint Terms of Service

**Last Updated:** March 19, 2026

Welcome to FinePrint. By using our service at fineprint.legal, you agree 
to these terms. They're short, clear, and written in the same plain language 
we use to analyze everyone else's terms.

## 1. What FinePrint Does

FinePrint is a free, AI-powered educational tool that analyzes Terms of Service 
and Privacy Policy documents. You paste a URL or text, and our AI provides a 
plain-English breakdown of what the document says. That's it.

## 2. Not Legal Advice

FinePrint does NOT provide legal advice. All analysis is educational and 
informational only. Our AI-generated grades and explanations are designed 
to help you understand legal documents, not replace professional legal counsel.

For legal decisions, always consult a qualified attorney.

## 3. How We Access Content

When you submit a URL, you authorize FinePrint to fetch that publicly available 
web page on your behalf to extract its text. We may also fetch related legal 
pages (such as the associated Privacy Policy) from the same website to provide 
a more complete analysis.

FinePrint only accesses publicly available content. We do not bypass login 
walls, paywalls, or access restrictions.

## 4. What We Store

- **Your submitted URLs:** Processed in real-time, not stored after analysis 
  is returned
- **Document text:** Processed in memory only, never saved to our servers
- **Your IP address:** Hashed immediately and used solely for rate limiting. 
  The hash is stored for a maximum of 24 hours, then deleted
- **No accounts:** We don't require or store user accounts, emails, or 
  personal information

For full details on data handling, see our [Privacy Policy](/privacy).

## 5. AI Accuracy

Our analysis is generated by AI (Google Gemini) and may contain errors, 
omissions, or inaccuracies. AI may miss important nuances, misinterpret 
legal language, or produce incorrect assessments. While we strive for 
accuracy, you should independently verify any findings that are important 
to you.

FinePrint is not liable for decisions made based on our analysis. We 
provide educational summaries — the source documents and qualified 
legal professionals are the authoritative references.

## 6. Rate Limits

To ensure fair access for all users, FinePrint limits analyses to 5 per 
24-hour period per user. This limit may be adjusted as the service grows.

## 7. Acceptable Use

You agree not to:
- Use automated tools to submit bulk analyses
- Attempt to circumvent rate limits
- Redistribute our analysis as your own without attribution
- Use the service for any unlawful purpose

## 8. Service Availability

FinePrint is a free service provided as-is. We may modify, suspend, or 
discontinue features as the service evolves. If we make significant changes 
that affect your use of the service, we will make reasonable efforts to 
provide notice through the website.

We reserve the right to restrict access for users who violate these terms 
or engage in abusive behavior.

## 9. Disputes

These terms are governed by the laws of the State of Washington, United 
States. If a dispute arises, we encourage you to contact us first at 
[contact method] to resolve it informally. If formal resolution is needed, 
disputes will be subject to the jurisdiction of Clark County, Washington.

## 10. Changes to These Terms

We may update these terms from time to time. When we do, we'll update the 
"Last Updated" date at the top. Significant changes will be noted on the 
website. Your continued use of FinePrint after changes are posted constitutes 
acceptance of the updated terms.

## 11. Contact

Questions about these terms? Reach us at [contact method].
```

### Key Changes from Current TOS

| Clause | Before | After | Impact on Grade |
|--------|--------|-------|-----------------|
| Termination | "any time, for any reason, without notice" | "restrict access for violations or abuse" + "reasonable efforts to provide notice" for service changes | HIGH RISK → LOW RISK |
| Liability | Bare "use at your own risk" | Added context: "we strive for accuracy" + "independently verify" + source docs are authoritative | MEDIUM RISK → LOW RISK |
| Changes to Terms | Not mentioned | Added update notice commitment + date tracking | Adds transparency |
| Data handling | Not mentioned | Added summary with link to PP | Positive signal |
| Dispute resolution | Not mentioned | Added informal resolution first + jurisdiction | LOW RISK (local business) |

---

## 4. FinePrint Privacy Policy Rewrite

### Goal
Accurately reflect what FinePrint actually collects and stores, including Supabase-era additions. Target: A- or higher.

**File:** `src/app/privacy/page.tsx` — MODIFY content

### Full Revised Privacy Policy Content

```markdown
# FinePrint Privacy Policy

**Last Updated:** March 19, 2026

FinePrint is a free, AI-powered educational tool. We believe in practicing 
what we preach — so here's exactly what we collect, what we do with it, 
and what we don't do.

## The Short Version

- We don't require accounts, emails, or personal information
- Documents you submit are processed in memory and never stored
- Your IP address is hashed (made irreversible) and used only for rate limiting
- We use cookieless analytics that don't track individual users
- We don't sell, share, or monetize your personal data
- We don't use your submitted documents to train AI models

## What We Collect

### Technical Data
**Your IP address** is hashed immediately upon receipt using a one-way 
hash function. The original IP address is never stored. The hash is used 
solely to enforce rate limits (5 analyses per 24-hour period) and is 
automatically deleted after 24 hours.

### Submitted Content
**URLs you submit** are used to fetch publicly available web pages for 
analysis. The fetched text is processed in real-time by our AI model 
(Google Gemini API) and is not stored on our servers after the analysis 
is returned to you.

**Text you paste or files you upload** are similarly processed in memory 
only. They are sent to the AI model for analysis and discarded immediately 
after results are generated.

### Website Analytics
We use **Plausible Analytics**, a privacy-focused, cookieless analytics 
service. Plausible does not use cookies, does not track individual users, 
and does not collect personal information. It provides us with aggregate 
data only — total page views, referral sources, and general geographic 
regions. No personal data is collected for analytics purposes.

### Company Directory Data
When users submit companies to our public directory, we store:
- The company name and domain
- The TOS and Privacy Policy URLs used for analysis
- The AI-generated analysis content and grade
- A hashed version of the submitter's IP (for abuse prevention)

This is information ABOUT the analyzed company, not about the user who 
submitted it. No personal user data is stored in directory submissions.

### Share Events
When you use the share button on an analysis, we record:
- Which page was shared (e.g., "Instagram company page")
- Which platform was selected (e.g., "Facebook," "Copy Link")
- A timestamp

We do NOT record your IP address, identity, or any personal information 
with share events. This data helps us understand which analyses are most 
useful to our users.

## What We Do With Your Data

| Data | Purpose | Retention |
|------|---------|-----------|
| IP hash | Rate limiting only | 24 hours, then deleted |
| Submitted URLs/text | AI analysis only | Not stored — processed in memory |
| Analytics (Plausible) | Understand site usage (aggregate) | Managed by Plausible |
| Directory submissions | Public company directory | Indefinite (public content) |
| Share events | Understand sharing patterns | Indefinite (no personal data) |

## What We Don't Do

- **We don't sell your data.** Period.
- **We don't share personal data with third parties.** The AI model 
  (Google Gemini) processes the document text you submit but does not 
  receive your IP address or any personal identifiers.
- **We don't use cookies for tracking.** Our analytics are cookieless. 
  When display ads are enabled, ad networks may use their own cookies — 
  we'll clearly disclose this when it applies.
- **We don't train AI on your submissions.** Documents you submit are 
  processed by Google Gemini's API for analysis only. We do not use your 
  submitted content to fine-tune, train, or improve any AI models. Google's 
  Gemini API data handling is governed by their own terms.
- **We don't build user profiles.** We don't have accounts, logins, or 
  any mechanism to track individual users across sessions.

## Third-Party Services

| Service | Purpose | Their Privacy Policy |
|---------|---------|---------------------|
| Google Gemini API | AI analysis of submitted documents | [Google AI Privacy](https://ai.google.dev/terms) |
| Vercel | Website hosting | [Vercel Privacy](https://vercel.com/legal/privacy-policy) |
| Supabase | Database for company directory | [Supabase Privacy](https://supabase.com/privacy) |
| Upstash Redis | Rate limiting | [Upstash Privacy](https://upstash.com/privacy) |
| Plausible Analytics | Website analytics | [Plausible Privacy](https://plausible.io/privacy) |
| Jina Reader | URL content fetching | [Jina Privacy](https://jina.ai/legal/) |

## Your Rights

Since we don't collect personal data beyond a temporary IP hash, there 
is minimal personal data to exercise rights over. However:

- **Access:** You can contact us to ask what data we hold about you 
  (the answer is likely "none" or "a temporary IP hash that expires 
  in 24 hours")
- **Deletion:** IP hashes auto-delete after 24 hours. Share events 
  contain no personal data. Directory submissions can be removed by 
  contacting us.
- **Opt-out of analytics:** Plausible respects "Do Not Track" browser 
  settings automatically

## Children's Privacy

FinePrint is not directed at children under 13. We do not knowingly 
collect information from children. If you believe a child has submitted 
information to us, please contact us.

## Changes to This Policy

When we update this policy, we'll change the "Last Updated" date at the 
top and note significant changes on the website. We encourage you to 
review this policy periodically.

## Contact

Questions about our privacy practices? Reach us at [contact method].
```

---

## 5. Admin: Annual Re-Analysis Queue

### Problem
Company analyses should be re-run annually to catch TOS/PP changes. Currently there's no way to know which companies are due for re-analysis without manually checking dates.

### Solution
Add a "Due for Re-Analysis" indicator in the admin Published Companies tab. Companies whose `last_analyzed` date is within 30 days of their anniversary (or past it) get flagged.

### Implementation

**File:** `src/app/admin/page.tsx` — MODIFY the Published Companies tab

Add a visual indicator to the companies table:

```typescript
// For each company in the published list:
const lastAnalyzed = new Date(company.last_analyzed);
const daysSinceAnalysis = Math.floor((Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24));
const isDueForReanalysis = daysSinceAnalysis >= 335; // 30 days before anniversary
const isOverdue = daysSinceAnalysis >= 365;

// In the table row:
<td>
  {formatDate(company.last_analyzed)}
  {isOverdue && <span className="ml-2 text-xs text-red-500 font-medium">OVERDUE</span>}
  {isDueForReanalysis && !isOverdue && <span className="ml-2 text-xs text-amber-500 font-medium">DUE SOON</span>}
</td>
```

Add a filter/sort option at the top of the Published Companies tab:

```typescript
<div className="flex gap-2 mb-4">
  <button onClick={() => setSortBy('due')}>Due for Re-Analysis</button>
  <button onClick={() => setSortBy('name')}>Name</button>
  <button onClick={() => setSortBy('grade')}>Grade</button>
</div>
```

When sorted by "Due for Re-Analysis," overdue companies appear first (red), then due-soon (amber), then all others sorted by days until next anniversary.

---

## 6. Admin: Manual Re-Analyze Button

### Problem
After grading system changes, all existing company analyses need to be re-run. There's no way to trigger a re-analysis from the admin panel.

### Solution
Add a "Re-Analyze" button on each published company row that fetches the stored TOS and PP URLs, runs a fresh analysis with the current prompt, and updates the company record.

### Implementation

**File:** `src/app/admin/page.tsx` — MODIFY Published Companies tab

Add a "Re-Analyze" button to each company row:

```typescript
<td>
  <a href={`/company/${company.slug}`} target="_blank">View</a>
  <button 
    onClick={() => handleReanalyze(company)}
    disabled={reanalyzingId === company.id}
    className="ml-2 text-sm text-indigo-500 hover:text-indigo-600"
  >
    {reanalyzingId === company.id ? 'Analyzing...' : 'Re-Analyze'}
  </button>
</td>
```

### Re-Analyze API Route

**File:** `src/app/api/admin/reanalyze/route.ts` — NEW

```typescript
export async function POST(request: Request) {
  // Verify admin auth
  
  const { companyId } = await request.json();
  
  // Fetch company record
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }
  
  // Fetch both URLs fresh
  const tosText = await fetchWithJina(company.tos_url);
  const ppText = await fetchWithJina(company.pp_url);
  
  if (!tosText || !ppText) {
    return NextResponse.json({ 
      error: 'Could not fetch one or both documents. URLs may need updating.',
      tosStatus: tosText ? 'ok' : 'failed',
      ppStatus: ppText ? 'ok' : 'failed',
    }, { status: 422 });
  }
  
  // Combine and run analysis
  const combinedText = `=== TERMS OF SERVICE ===\nSource: ${company.tos_url}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${company.pp_url}\n\n${ppText}`;
  
  const analysis = await runAnalysis(combinedText, { canGrade: true });
  
  // Update company record
  const { error } = await supabaseAdmin
    .from('companies')
    .update({
      overall_grade: analysis.grade,
      verdict: analysis.verdict,
      analysis_json: analysis,
      last_analyzed: new Date().toISOString(),
    })
    .eq('id', companyId);
  
  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
  
  // Revalidate the company page (ISR)
  revalidatePath(`/company/${company.slug}`);
  
  return NextResponse.json({ 
    success: true, 
    previousGrade: company.overall_grade,
    newGrade: analysis.grade,
  });
}
```

### UX After Re-Analysis

When the admin clicks "Re-Analyze" and it completes:

```
✓ Re-analyzed DecipherDocs.com
  Previous grade: A-  →  New grade: A-  (no change)

✓ Re-analyzed Instagram
  Previous grade: C-  →  New grade: F  (grade changed!)
```

Show the previous vs new grade so the admin can see what changed. If the grade changed, highlight it. The admin can then click "View" to see the full updated analysis.

### Bulk Re-Analysis

For the initial round of re-analyzing ALL companies, add a "Re-Analyze All" button at the top of the Published Companies tab:

```typescript
<button onClick={handleReanalyzeAll}>
  Re-Analyze All Companies ({companies.length})
</button>
```

This runs re-analysis sequentially (not in parallel — respect Jina/Gemini rate limits) and shows progress:

```
Re-analyzing... 3 of 14 complete
✓ Amazon: C- → C
✓ Discord: C+ → B-
✓ Facebook: D → F
⏳ Google: analyzing...
```

Rate limit the sequential processing to ~1 analysis per 5 seconds to avoid hitting Jina or Gemini limits.

---

## 7. OG Card / Share Fix

### Problem
When sharing a company page to Facebook (and likely other platforms), the OG card shows the generic FinePrint card (logo + tagline) instead of the company-specific card (grade badge + company name + verdict). See screenshot: Facebook share of FinePrint company page showing generic card.

### Diagnosis Checklist for CC

The OG image system was spec'd in V2 Supplement using `@vercel/og` (later changed to `next/og` by CC). The route should be at `/api/og/[slug]`. Check these things in order:

**1. Does the OG image route exist and return a PNG?**
Visit `https://fineprint.legal/api/og/fineprint-legal` directly in a browser. If it returns an image, the route works. If it 404s or errors, the route isn't deployed.

**2. Do company pages have the correct og:image meta tag?**
View source on `https://fineprint.legal/company/fineprint-legal` and search for `og:image`. It should point to `https://fineprint.legal/api/og/fineprint-legal`. If it's missing or points to a generic image, the meta tags aren't set.

**3. Is og:site_name set to "FinePrint"?**
Check global layout metadata for `og:site_name: "FinePrint"` (NOT "fineprint.legal").

**4. Has Facebook cached the old (wrong) card?**
Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to scrape the URL fresh. Facebook aggressively caches OG data — you may need to force a rescrape.

### What the OG Card Should Show

For company pages with a grade:
```
┌──────────────────────────────────────────────────┐
│  [Dark background #18181b]                        │
│                                                    │
│  [Grade badge: A-]  Fineprint                      │
│                     VERY GOOD                      │
│                     Based on a complete review...   │
│                                                    │
│  ────────────────────────────────────────────────  │
│  FinePrint | We read the fine print                │
└──────────────────────────────────────────────────┘
```

The grade badge color matches the grade (emerald for A, teal for B, amber for C, orange for D, red for F). Company name is prominent. Verdict text is the one-line summary. Bottom bar says "FinePrint | We read the fine print" — NEVER "fineprint.legal".

### For Ungraded Analyses (shared from live tool)

```
┌──────────────────────────────────────────────────┐
│  [Dark background]                                │
│                                                    │
│  Terms of Service Analysis                         │
│  [Company name if detected]                        │
│                                                    │
│  ────────────────────────────────────────────────  │
│  FinePrint | We read the fine print                │
└──────────────────────────────────────────────────┘
```

No grade badge. Still branded. Still shareable.

---

## 8. Bare Domain Content Validation Fix

### Problem
When a user enters a bare domain like `decipherdocs.com`, the system fetches the homepage and runs content validation. Sites that are primarily tools (minimal homepage text, mostly UI elements) fail validation with "This page doesn't contain enough content to analyze" — even though the TOS and PP links are clearly in the header and footer. The auto-hunt never gets a chance to run because validation kills the flow first.

This works fine for content-rich marketing sites (like `crmsvc.com` or `design.com`) but fails for utility/tool sites (like `decipherdocs.com` or `fineprint.legal`) where the homepage is an input form, not paragraphs of text.

### Root Cause
Content validation was designed to catch login pages and error pages when a user submits a specific legal page URL. But it's also running on bare domain homepages, which are NOT what we're analyzing — they're just where we look for links.

### Fix

**File:** `src/app/api/fetch/route.ts` — MODIFY

Detect whether the user entered a bare domain (no meaningful path) and skip content validation if so. Go straight to auto-hunt.

```typescript
function isBareDomain(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    // Bare domain: path is "/" or empty, no meaningful path segments
    return parsed.pathname === '/' || parsed.pathname === '';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const { url } = await request.json();
  
  // Check Tier 1 mapping first (existing logic)
  const knownUrls = getKnownCompanyUrls(url);
  if (knownUrls) { /* ... existing Tier 1 logic ... */ }
  
  // Fetch the URL
  const primaryText = await fetchWithJina(url);
  
  if (!primaryText) {
    return NextResponse.json({ error: 'Could not fetch content from this URL.' }, { status: 422 });
  }
  
  // If bare domain → skip content validation, go straight to auto-hunt
  if (isBareDomain(url)) {
    // Scan homepage for TOS + PP links
    const urlRegex = /https?:\/\/[^\s\)\"\'<>]+/g;
    const allUrls = primaryText.match(urlRegex) || [];
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    
    // Look for BOTH TOS and PP on the homepage
    const tosUrl = findMatchingUrl(allUrls, TOS_PATTERNS, url, domain);
    const ppUrl = findMatchingUrl(allUrls, PP_PATTERNS, url, domain);
    
    if (tosUrl && ppUrl) {
      // Found both — fetch and combine
      const tosText = await fetchWithJina(tosUrl);
      const ppText = await fetchWithJina(ppUrl);
      
      if (tosText && ppText && tosText.length >= 200 && ppText.length >= 200) {
        const combinedText = `=== TERMS OF SERVICE ===\nSource: ${tosUrl}\n\n${tosText}\n\n=== PRIVACY POLICY ===\nSource: ${ppUrl}\n\n${ppText}`;
        
        return NextResponse.json({
          text: combinedText,
          wordCount: combinedText.split(/\s+/).length,
          sourceUrl: tosUrl,
          companionUrl: ppUrl,
          documentType: 'combined',
          isCombined: true,
          canGrade: true,
        });
      }
    }
    
    if (tosUrl || ppUrl) {
      // Found one but not the other — fetch the one we found, treat as single doc
      const foundUrl = tosUrl || ppUrl;
      const foundText = await fetchWithJina(foundUrl!);
      const foundType = tosUrl ? 'tos' : 'pp';
      
      if (foundText && foundText.length >= 200) {
        return NextResponse.json({
          text: foundText,
          wordCount: foundText.split(/\s+/).length,
          sourceUrl: foundUrl,
          companionUrl: null,
          documentType: foundType,
          isCombined: false,
          canGrade: false,
        });
      }
    }
    
    // Found nothing on the homepage
    return NextResponse.json({
      error: 'We couldn\'t find a Terms of Service or Privacy Policy on this website. Try pasting a direct link to the TOS or Privacy Policy page.',
      fetchedButInvalid: true,
    }, { status: 422 });
  }
  
  // Not a bare domain — run content validation as normal (existing logic)
  const validation = validateFetchedContent(primaryText, url);
  if (!validation.valid) {
    return NextResponse.json({ 
      error: validation.reason,
      fetchedButInvalid: true,
    }, { status: 422 });
  }
  
  // ... rest of existing fetch logic (detect type → auto-hunt → etc.)
}
```

### Expected Results

| Input | Before Fix | After Fix |
|-------|-----------|-----------|
| `decipherdocs.com` | "Not enough content to analyze" | Finds TOS + PP in header/footer → combined analysis |
| `fineprint.legal` | "Not enough content to analyze" | Finds TOS + PP → combined analysis |
| `crmsvc.com` | Works (content-rich homepage) | Works (unchanged) |
| `design.com` | Works (content-rich homepage) | Works (unchanged) |
| `facebook.com` | Login page detected | Tier 1 mapping handles it (from #1) |
| `randomsite.com` (no legal links) | "Not enough content" | "Couldn't find TOS or PP on this website" |

---

## 9. Migrate Tier 1 Companies to Supabase

### Problem
The admin panel only shows Supabase-managed companies (currently 2: DecipherDocs and Fineprint). The original 12+ Tier 1 companies (Instagram, Facebook, TikTok, Spotify, etc.) are stored as local content files. They don't appear in the admin panel, can't be bulk re-analyzed, and are managed through a completely different system.

### Solution
Migrate ALL Tier 1 company data from local files into the Supabase `companies` table. Delete the local files. Update the company page template to pull exclusively from Supabase. The admin panel becomes the single source of truth for all companies.

This is the DATA-01 expansion trigger — executing it now because the admin re-analyze tooling requires all companies in one database.

### Migration Steps

**Step 1: Read each local company file and extract the data**

For each file in `src/content/companies/` (or wherever Tier 1 data lives):
- Company name
- Slug
- Domain
- TOS URL used
- PP URL used
- Overall grade
- Verdict
- Full analysis JSON
- Last analyzed date

**Step 2: Insert into Supabase `companies` table**

```typescript
// For each Tier 1 company:
await supabaseAdmin.from('companies').insert({
  company_name: 'Instagram',
  slug: 'instagram',
  domain: 'instagram.com',
  tos_url: 'https://help.instagram.com/581066165581870',  // Use Tier 1 known URLs
  pp_url: 'https://privacycenter.instagram.com/policy',
  overall_grade: 'F',  // Current grade — will be re-analyzed
  verdict: '...',
  analysis_json: { /* full analysis */ },
  source: 'editorial',  // Distinguishes from 'community' submissions
  status: 'published',
  last_analyzed: '2026-03-14T00:00:00Z',
  created_at: new Date().toISOString(),
});
```

Set `source: 'editorial'` for all migrated Tier 1 companies. Community-submitted companies keep `source: 'community'`.

**Step 3: Update company page template**

**File:** `src/app/company/[slug]/page.tsx` — MODIFY

Remove the local file fallback. All company data comes from Supabase:

```typescript
// BEFORE (dual source):
const company = getLocalCompany(slug) || await getSupabaseCompany(slug);

// AFTER (Supabase only):
const company = await getSupabaseCompany(slug);
```

**Step 4: Delete local company files**

Remove `src/content/companies/` directory (or whatever structure holds the local files) once migration is confirmed and all pages render correctly from Supabase.

**Step 5: Update admin panel with checkbox bulk re-analyze**

**File:** `src/app/admin/page.tsx` — MODIFY Published Companies tab

Now that all companies are in Supabase, the admin panel shows everything:

```typescript
// Published Companies tab now shows ALL companies
const { data: companies } = await supabaseAdmin
  .from('companies')
  .select('*')
  .eq('status', 'published')
  .order('company_name', { ascending: true });
```

Add checkboxes for selection:

```
[Select All]  [Re-Analyze Selected (0)]

☐  Amazon          C-    Editorial    3/14/2026    View  Re-Analyze
☐  ChatGPT         C     Editorial    3/14/2026    View  Re-Analyze
☐  DecipherDocs    A-    Community    3/19/2026    View  Re-Analyze
☐  Discord         C+    Editorial    3/14/2026    View  Re-Analyze
☐  Facebook        D     Editorial    3/14/2026    View  Re-Analyze
☐  Fineprint       A     Community    3/20/2026    View  Re-Analyze
☐  Google          C     Editorial    3/14/2026    View  Re-Analyze
☐  Instagram       F     Editorial    3/14/2026    View  Re-Analyze
☐  LinkedIn        C     Editorial    3/14/2026    View  Re-Analyze
☐  Reddit          C     Editorial    3/14/2026    View  Re-Analyze
☐  Spotify         B-    Editorial    3/14/2026    View  Re-Analyze
☐  TikTok          D+    Editorial    3/14/2026    View  Re-Analyze
☐  Uber            C-    Editorial    3/14/2026    View  Re-Analyze
☐  X (Twitter)     D+    Editorial    3/14/2026    View  Re-Analyze
```

"Re-Analyze Selected" runs them sequentially (one every 5 seconds to respect rate limits) with progress:

```
Re-analyzing selected... 3 of 14 complete
✓ Amazon: C- → C (changed!)
✓ ChatGPT: C → C (no change)
✓ Discord: C+ → B- (changed!)
⏳ Facebook: analyzing...
```

### Schema Addition

```sql
-- Add source column if not already present
ALTER TABLE companies ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'editorial';

-- Add tos_url and pp_url if not already present
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tos_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pp_url TEXT;
```

---

## Doc Maintenance (No CC Action — Reference Only)

### Expansion Triggers Updates

The following triggers need status updates. These are documentation changes only — no code needed. I will update the Expansion Triggers doc separately.

| Trigger | Update |
|---------|--------|
| **CONTENT-02** | Status change: PARTIALLY IMPLEMENTED. Auto-hunt handles combined analysis automatically. The manual two-URL input described in the trigger is no longer needed. The remaining gap: users can't manually provide two URLs from scratch (they must paste one and the system finds the other). This gap is acceptable for now. |
| **NEW: AFFILIATE-01** | Add trigger: WHEN monthly traffic exceeds 5K visits AND CJ Affiliate programs approved, THEN activate contextual AffiliateCTA — show VPN affiliates when data collection flagged, show data removal affiliates when data sharing flagged, show both when both flagged. |
| **NEW: REANALYSIS-01** | Add trigger: WHEN grading system or prompt changes significantly, THEN re-analyze all published companies using admin bulk re-analyze tool. Track which prompt version each analysis was generated with. |

### Architecture Doc Updates

The following sections of `FinePrint_Architecture_v1.md` are outdated. These are documentation changes only.

| Section | What's Outdated | Correct State |
|---------|----------------|---------------|
| Section 3 (System Prompt) | Shows V1.0 prompt with single grading weights | V1.3 prompt has Document Type Awareness + grade-only-for-combined rule |
| Grading Criteria | Single set of weights applied to all analyses | Same weights, but applied ONLY to combined TOS+PP analyses. Single-doc analyses don't get grades. |
| URL Scraping | Jina Reader as primary, cheerio fallback | Jina Reader with auto-hunt (scan submitted page → homepage → common paths → Tier 1 map) |
| Input Methods | Three tabs, all produce grades | URL tab can produce grades (via auto-hunt). Paste text and upload produce analysis without grades. |

---

## Modified Files Summary

| File | Change | Related To |
|------|--------|-----------|
| `src/lib/site/known-companies.ts` | NEW — Tier 1 URL mapping | #1 |
| `src/app/api/fetch/route.ts` | Check Tier 1 map before normal fetch | #1 |
| `src/app/how-we-grade/page.tsx` | Add combined analysis requirement text, FAQ entry | #2 |
| `src/app/terms/page.tsx` | Full TOS rewrite | #3 |
| `src/app/privacy/page.tsx` | Full PP rewrite | #4 |
| `src/app/admin/page.tsx` | Birthday indicators, re-analyze button, bulk re-analyze | #5, #6 |
| `src/app/api/admin/reanalyze/route.ts` | NEW — re-analysis endpoint | #6 |
| `src/app/api/og/[slug]/route.tsx` | Debug and fix OG image generation | #7 |
| Company page layouts | Verify og:image meta tag points to `/api/og/[slug]` | #7 |
| `src/app/api/fetch/route.ts` | Add bare domain detection, skip validation for homepages | #8 |
| `src/content/companies/` | DELETE after migration — local files replaced by Supabase | #9 |
| `src/app/company/[slug]/page.tsx` | Remove local file fallback, Supabase-only data source | #9 |
| `src/app/admin/page.tsx` | Checkbox selection, bulk re-analyze with progress | #9 |

---

## Test Plan

| # | Test | Expected |
|---|------|----------|
| 1 | Enter `instagram.com` or `instagram.com/terms` | Tier 1 map kicks in, fetches both docs from help.instagram.com, combined analysis |
| 2 | Enter `facebook.com` | Tier 1 map, fetches both from correct URLs, not login page |
| 3 | Enter `tiktok.com/legal/page/us/terms-of-service/en` | Tier 1 map, both docs fetched |
| 4 | Enter unknown small company URL | Normal auto-hunt flow (no Tier 1 match) |
| 5 | Visit `/terms` page | New TOS content displayed |
| 6 | Visit `/privacy` page | New PP content displayed |
| 7 | Run FinePrint's own TOS+PP through the tool | Should grade A- or higher |
| 8 | Visit `/how-we-grade` | New combined analysis section and FAQ visible |
| 9 | Admin panel: Published Companies tab | Birthday indicators show on companies approaching 1-year mark |
| 10 | Admin panel: click "Re-Analyze" on a company | Fresh analysis runs, grade updates in-place |
| 11 | Admin panel: click "Re-Analyze All" | Sequential re-analysis with progress indicator |
| 12 | Share company page to Facebook | OG card shows grade badge + company name + verdict |
| 13 | Share company page to LinkedIn | Same OG card renders correctly |
| 14 | Visit `/api/og/fineprint-legal` directly | Returns 1200x630 PNG with grade card |
| 15 | Enter `decipherdocs.com` (bare domain, tool site) | Skips homepage validation, finds TOS + PP in header/footer links, combined analysis |
| 16 | Enter `fineprint.legal` (bare domain, tool site) | Same — finds TOS + PP, combined analysis |
| 17 | Enter `randomsite.com` (bare domain, no legal links) | "Couldn't find TOS or PP on this website" |
| 18 | Admin panel: Published Companies shows ALL companies | Both editorial (Tier 1) and community companies visible |
| 19 | Admin panel: Select 3 companies → "Re-Analyze Selected" | Sequential re-analysis of selected companies with progress |
| 20 | Admin panel: "Select All" checkbox | All companies checked, count updates in button label |
| 21 | Company pages render from Supabase after migration | All existing company pages load correctly, no 404s |

---

## Priority Order for CC

1. **#9 Supabase migration** — migrate Tier 1 companies first so admin panel sees everything
2. **#7 OG card fix** — diagnose and fix (may be a quick meta tag issue)
3. **#8 Bare domain validation fix** — skip homepage validation, go straight to link scanning
4. **#1 Tier 1 URL mapping** — immediate impact on biggest companies
5. **#3 + #4 TOS/PP content rewrite** — deploy new content, then re-run through own tool
6. **#6 Admin re-analyze button + checkbox bulk** — needed before re-analyzing all companies
7. **#5 Admin birthday indicators** — nice to have, not urgent
8. **#2 How We Grade update** — content change, low risk

After #6 is done: use the checkbox bulk re-analyze to re-run ALL published companies with the current grading system. THEN update the How We Grade "Real Examples" section with current grades.

---

## Build Log Entry

```
### [DATE]
- **Supabase migration (DATA-01)** — all Tier 1 companies migrated from local files to Supabase. Admin panel is now single source of truth. Local content files deleted.
- **Tier 1 URL mapping** — known-companies.ts lookup for Instagram, Facebook, TikTok, WhatsApp, X/Twitter. Bypasses login walls by using verified working URLs.
- **Bare domain fix** — bare domain entries (e.g., decipherdocs.com) skip content validation and go straight to link scanning for TOS/PP URLs in header/footer
- **TOS rewrite** — softened termination clause, added PP reference, added data handling summary, added change notice commitment
- **PP rewrite** — comprehensive policy reflecting actual data practices (IP hashing, Plausible analytics, Supabase storage, share events, Gemini API usage)
- **Admin re-analyze** — button on each published company + checkbox selection + bulk "Re-Analyze Selected" with sequential processing and progress indicator
- **Admin birthday queue** — visual indicators (OVERDUE / DUE SOON) on companies approaching annual re-analysis date
- **OG card fix** — [describe what was wrong and how it was fixed]
- **How We Grade** — added combined analysis requirement explanation and FAQ entry
- **Deviation from original architecture:** DATA-01 expansion trigger executed. All company data now in Supabase, local file approach retired.
```

---

**Hand to CC with: "V1.5 revision — 9 changes. Start with #9 (Supabase migration) so the admin panel sees all companies. Then #7 (OG card), #8 (bare domain fix), #1 (Tier 1 mapping), content deploys (#3 + #4), and admin tooling (#6, #5). After migration and re-analyze tools are working, bulk re-analyze all companies. Test decipherdocs.com after #8 is done — it should find TOS + PP from the homepage links."**
