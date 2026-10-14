# FinePrint.legal — V3 Update: Wall of Shame Option C Restructure

**Date:** March 14, 2026  
**Status:** Restructure of existing WOS — changes display and content sourcing, keeps Supabase tables and submission flow  
**Context:** The Wall of Shame is currently built as a flat list of individual user submissions (per V3 Supplement). This update restructures it into a company-ranked leaderboard with two layers of content: editorial red flags (from existing company analyses) + community submissions (AI-verified). The submission flow, Supabase tables, moderation queue, and admin panel from V3 remain unchanged.

**What stays the same:**
- Supabase schema (submissions, votes, categories tables)
- Submission API route and rate limiting
- Admin moderation queue (pending/approve/reject)
- SubmissionModal component
- Standalone submission form at `/wall-of-shame/submit`
- Upvote API
- Share tracking

**What changes:**
- `/wall-of-shame/` index page layout (flat list → company-ranked leaderboard)
- Individual submission pages get full AI explanation display
- Red flags from company pages get pulled into WOS automatically
- Community submissions nest under their company
- AI analysis is applied to every community submission automatically
- "Submit to Wall of Shame" button on live results pre-populates from red flags

---

## The Option C Model

The Wall of Shame has two layers of content under each company:

**Layer 1: Editorial red flags (automatic)**
Pulled directly from published company pages' Red Flags section. These already have AI analysis (headline, explanation, industry context, risk badge) because they were generated during the full company analysis. No user action needed — any company with a D+/D/D-/F grade automatically appears on the WOS with its red flags.

**Layer 2: Community submissions (user-submitted, AI-verified)**
Submitted by users via the existing submission flow (button on results OR standalone form). Each submission gets AI analysis applied before it hits the moderation queue. After approval, it appears nested under its company alongside the editorial red flags.

Both layers look identical in format. The only visual distinction is a small source badge:
- AI circle badge = from FinePrint's editorial analysis
- Community badge = user-submitted, AI-verified and admin-approved

---

## 1. Restructure WOS Index Page

**File:** `src/app/wall-of-shame/page.tsx` — REWRITE

The page changes from a flat list of submissions to a company-ranked leaderboard.

### Data Sources

The page pulls from TWO sources and merges them:

**Source 1: Company pages with grades D+ or worse**
```typescript
// Fetch companies with poor grades, sorted worst-first
const { data: companies } = await supabaseAdmin
  .from('companies')
  .select('*')
  .eq('status', 'published')
  .in('overall_grade', ['D-', 'D', 'D+', 'F'])
  .order('overall_grade', { ascending: true });

// For each company, extract red flags from analysis_json
// These are the editorial Layer 1 entries
```

For companies stored as local content files (Tier 1), read their analysis JSON and extract the Red Flags section.

**Source 2: Approved community submissions**
```typescript
// Fetch approved submissions, grouped by company
const { data: submissions } = await supabaseAdmin
  .from('submissions')
  .select('*, categories(*)')
  .eq('status', 'approved')
  .order('upvotes', { ascending: false });
```

### Merge Logic

```typescript
// Build a unified list of companies for the WOS
// Each company has: name, grade, verdict, flags[]
// flags[] contains BOTH editorial red flags AND community submissions

interface WOSCompany {
  rank: number;
  name: string;
  slug: string;
  grade: string | null;          // null if no company page exists
  verdict: string | null;
  companyPageUrl: string | null;  // Link to /company/[slug] if exists
  flags: WOSFlag[];
  totalFlags: number;
  totalShares: number;
}

interface WOSFlag {
  source: 'editorial' | 'community';
  headline: string;
  explanation: string;
  industryContext?: string;
  riskLevel: 'HIGH' | 'MEDIUM';
  category: string;
  upvotes?: number;          // Community only
  submissionSlug?: string;   // Community only — links to individual page
}
```

**Ranking logic:** Companies sorted by grade (F first, then D-, D, D+). Within the same grade, sorted by total flag count (editorial + community). Companies with community submissions but no company page appear AFTER all graded companies.

### Page Layout

```
Wall of shame
The worst offenders in Terms of Service and Privacy Policies — 
ranked by grade, with the most outrageous clauses highlighted.

[Category filter pills]
[Sort: Most Flagged | Worst Grade | Newest]

┌─────────────────────────────────────────────┐
│ #1  [D] Facebook (Meta)                     │
│     One of the most invasive data...        │
│     5 flags · 124 shares                    │
├─────────────────────────────────────────────┤
│  [AI] Tracks you across the internet...     │
│       This means: Facebook places tracking  │
│       pixels on millions of websites...     │
│       HIGH RISK · Data collection           │
│                                             │
│  [AI] Trains AI on content, no US opt-out   │
│       This means: Meta uses your posts...   │
│       HIGH RISK · AI clauses                │
│                                             │
│  [Community] Shadow profiles of non-users   │
│       This means: When users upload their   │
│       contacts, Facebook creates profiles...│
│       HIGH RISK · Data collection · 23 ↑    │
├─────────────────────────────────────────────┤
│  See full Facebook analysis →               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ #2  [D+] TikTok                             │
│     ...                                     │
└─────────────────────────────────────────────┘

[... more graded companies ...]

┌─────────────────────────────────────────────┐
│     CRM Services (no grade yet)             │
│     1 community flag                        │
├─────────────────────────────────────────────┤
│  [Community] Dispute resolution clause...   │
│       This means: ...                       │
│       MEDIUM RISK · Arbitration · 1 ↑       │
├─────────────────────────────────────────────┤
│  No full analysis yet — Analyze their TOS → │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Found something outrageous?                │
│  [Submit to the Wall of Shame →]            │
└─────────────────────────────────────────────┘

Legend:
[AI] = From FinePrint's editorial analysis
[Community] = User-submitted, AI-verified
```

### Key Visual Elements

Each company card is collapsible — shows the company header (rank, grade, name, verdict, flag count) with flags nested underneath. Flags expand to show full explanation on click/tap. This keeps the page scannable for users who want to browse the leaderboard without reading every clause.

Editorial flags (Layer 1) appear FIRST under each company, then community flags sorted by upvotes. This puts FinePrint's quality content at the top while community additions add depth below.

---

## 2. AI Analysis on Community Submissions

Every community submission must have AI analysis applied automatically. This ensures consistency with editorial content and acts as a spam filter.

### Update Submission API

**File:** `src/app/api/wall-of-shame/submit/route.ts` — MODIFY

After receiving a submission, before saving to the database, run the clause through a focused AI prompt:

```typescript
// After validating the submission but BEFORE inserting into DB:
const aiAnalysis = await analyzeClause(clauseText, companyName);

// If AI says it's not a real clause, reject
if (aiAnalysis.error === 'not_a_clause') {
  return NextResponse.json(
    { error: 'This doesn\'t appear to be a Terms of Service clause. Please paste the actual text from a TOS or Privacy Policy.' },
    { status: 422 }
  );
}

// Insert with AI-generated fields:
await supabaseAdmin.from('submissions').insert({
  company_name: companyName,
  clause_text: clauseText,
  ai_headline: aiAnalysis.headline,
  ai_explanation: aiAnalysis.explanation,
  ai_industry_context: aiAnalysis.industryContext,
  risk_level: aiAnalysis.riskLevel,
  category_id: categoryId,
  // ... rest of fields unchanged
});
```

### Clause Analysis Prompt

**File:** `src/lib/site/prompt.ts` — ADD new export

```typescript
export const CLAUSE_ANALYSIS_PROMPT = `
You are FinePrint, analyzing a single clause from a Terms of Service or Privacy Policy.

Given the clause text and the company name, produce:

1. **Headline** (max 10 words): A punchy, plain-English summary of what this clause does.
   Example: "Can delete your account without warning or reason"

2. **Explanation** (2-3 sentences): What this clause means for the average user, in plain English.
   Start with "This means:" 

3. **Industry context** (1-2 sentences): How this compares to industry norms.
   Start with "Industry context:"
   Be specific: is this standard, worse than normal, or unusually aggressive?

4. **Risk level**: Either "HIGH" or "MEDIUM"
   HIGH = aggressive, unusual, or potentially harmful to users
   MEDIUM = concerning but within the range of common practices

Respond in this exact JSON format only, no other text:
{
  "headline": "...",
  "explanation": "This means: ...",
  "industryContext": "Industry context: ...",
  "riskLevel": "HIGH" or "MEDIUM"
}

If the text is NOT a TOS/PP clause (gibberish, spam, unrelated text), respond with:
{
  "error": "not_a_clause",
  "reason": "This does not appear to be a Terms of Service or Privacy Policy clause."
}
`;
```

This prompt serves double duty:
1. Generates the AI analysis for display
2. Acts as a spam filter — if the AI can't identify it as a TOS clause, the submission is rejected before it even hits the moderation queue

### Update SubmissionModal

**File:** `src/components/site/SubmissionModal.tsx` — MODIFY

After the user clicks "Submit for Review":
1. Show loading state: "Analyzing clause..."
2. Call the updated submission API (which runs AI analysis server-side)
3. If AI rejects as not a clause: show error message
4. If AI accepts: show success "Submitted! Our team will review it shortly."

The user never sees the AI analysis preview — that's for the WOS display after approval. They just need to know it was accepted.

### Pre-fill from Live Results

**File:** `src/components/site/ResultsDisplay.tsx` — MODIFY

When user clicks "Submit to Wall of Shame" on a red flag in their analysis results, the submission is pre-populated with data that already exists:

```typescript
openSubmissionModal({
  clauseText: redFlag.originalClauseText,
  companyName: analysisResult.companyName,
  sourceUrl: analysisResult.sourceUrl,
  // Pre-fill AI analysis from the existing red flag:
  prefillHeadline: redFlag.headline,
  prefillExplanation: redFlag.explanation,
  prefillIndustryContext: redFlag.industryContext,
  prefillRiskLevel: redFlag.riskLevel,
  suggestedCategory: redFlag.suggestedCategory || null,
});
```

When the modal has prefilled AI data from an existing analysis, the API can skip the AI clause analysis step — it's already done. The submission goes straight to the moderation queue with editorial-quality content.

---

## 3. Update Supabase Schema

Add columns to the existing `submissions` table:

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_headline TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_industry_context TEXT;
```

The existing `ai_explanation` column stays. It just needs to be populated by AI now instead of being optional user input.

---

## 4. Individual Submission Pages

**File:** `src/app/wall-of-shame/[slug]/page.tsx` — MODIFY

Update to display the full AI analysis matching the format of editorial red flags:

### Layout:
```
[Company Name]  ·  [Category badge]  ·  [Community badge]

┌─────────────────────────────────────────┐
│  "[Original clause text]"               │  ← blockquote with red left border
└─────────────────────────────────────────┘

[AI Headline in bold]

This means: [AI explanation paragraph]

Industry context: [AI industry comparison in italics]

[Risk badge: HIGH RISK]

↑ [upvote count]  ·  🔗 Share [share count]

────────────────────────────────────────

[If company page exists:]
See full [Company] analysis → /company/[slug]

[If no company page:]
No full analysis yet. Analyze [Company]'s full TOS → [link to homepage]

[Related submissions from same company]

[Disclaimer]
```

---

## 5. Category Filtering

When a user clicks a category pill on the WOS index:
- Filter to show only companies that have flags in that category
- Show only the matching flags under each company
- Both editorial and community flags have categories — filtering works across both
- If filtering hides all flags for a company, hide that company

---

## 6. Edge Cases

**Company has community submissions but no company page:**
- Appears on WOS without a grade badge or rank number
- Sorted AFTER all graded companies
- Shows only community submissions
- CTA: "No full analysis yet — Analyze their TOS →"
- Demand signal: if a company accumulates 3+ submissions without a company page, surface it in the admin panel as a suggested company to analyze

**Company page exists with B- or higher grade:**
- Does NOT appear on the Wall of Shame (these are on the Hall of Fame)
- Community submissions for these companies still go through moderation
- If approved, they appear in a special "Even the good ones..." section at the bottom, OR the admin reconsiders the company's grade

**Submission references a company with a different name:**
- Admin moderation: moderator can map to correct company slug
- Admin panel shows suggested matches from existing companies
- Example: User submits for "Meta" → admin maps to "Facebook (Meta)" company slug

**Duplicate submissions:**
- AI analysis during submission can detect near-duplicates by comparing clause text to existing approved submissions for the same company
- Admin moderation is the final check

---

## Modified Files Summary

| File | Change Type | Description |
|------|------------|-------------|
| `src/app/wall-of-shame/page.tsx` | REWRITE | Flat list → company-ranked leaderboard with nested flags |
| `src/app/wall-of-shame/[slug]/page.tsx` | MODIFY | Add full AI analysis display |
| `src/app/api/wall-of-shame/submit/route.ts` | MODIFY | Add AI clause analysis, reject non-clauses |
| `src/components/site/SubmissionModal.tsx` | MODIFY | Loading state during AI analysis, pre-fill support |
| `src/components/site/ResultsDisplay.tsx` | MODIFY | Pre-populate submission from existing red flag data |
| `src/lib/site/prompt.ts` | ADD | CLAUSE_ANALYSIS_PROMPT for individual clause analysis |

### SQL to run:
```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_headline TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_industry_context TEXT;
```

---

## Build Log Entry

After implementing, add to V3 Build Log:

```
### [DATE]
- **WOS restructured to Option C** — flat list → company-ranked leaderboard with nested editorial + community flags
- **AI clause analysis** — every community submission gets automatic headline, explanation, industry context, risk level via CLAUSE_ANALYSIS_PROMPT
- **Spam filtering** — non-clause submissions rejected by AI before hitting moderation queue
- **Pre-fill from results** — "Submit to WOS" on red flags passes existing AI data, skips re-analysis
- **Schema** — added ai_headline and ai_industry_context columns to submissions table
- **Deviation from V3:** V3 built flat submission list; restructured to company-ranked leaderboard per Option C architecture decision
```

---

**This document restructures the Wall of Shame display layer. The Supabase tables, submission APIs, moderation queue, and admin panel from V3 remain the foundation. Hand this to CC with: "Restructure the Wall of Shame from the current flat list to the Option C model described here."**
