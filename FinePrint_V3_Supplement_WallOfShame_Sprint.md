# FinePrint.legal — V3 Supplement: Supabase + Wall of Shame Sprint

**Date:** March 13, 2026  
**Status:** Additive features — build ON TOP of existing site + V2 additions  
**Context:** The core FinePrint site is live (homepage, tool, 12+ company pages, 5+ guides, share system, Hall of Fame, How We Grade). This document adds the Supabase backend, Wall of Shame community feature, hybrid company page pipeline (admin panel), and share count tracking. Nothing here replaces existing functionality.

**Reference:**
- `FinePrint_Architecture_v1.md` — Original architecture (Section 10 has the Supabase schema foundation)
- `FinePrint_CC_BuildKit.md` — Original build kit (Post-Launch section has admin panel tasks)
- `FinePrint_V2_Supplement.md` — Share system, How We Grade, Hall of Fame (already built)
- This file — Supabase sprint with Wall of Shame, hybrid pipeline, and share tracking

---

## Sprint Overview

This is a 3-day sprint that builds three interconnected features sharing one Supabase backend:

| Day | Feature | What Ships |
|-----|---------|------------|
| **Day 1** | Supabase setup + schema + share count tracking | All database tables created, share counts live on existing share buttons |
| **Day 2** | Wall of Shame (submission flow + display + moderation) | Users can submit clauses, admin can review/approve, published entries have their own pages |
| **Day 3** | Hybrid company pipeline (admin panel + auto-save queue) | User analyses auto-save to pending queue, admin panel to review and publish as company pages |

---

## Day 1: Supabase Setup + Share Count Tracking

### 1.1 Create Supabase Project

- Create a new Supabase project (free tier)
- Note the project URL and keys
- Add to `.env.local` and Vercel environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 1.2 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 1.3 Create Supabase Client

**File:** `src/lib/site/supabase.ts` — NEW

```typescript
import { createClient } from '@supabase/supabase-js';

// Server-side client (service role — full access, use in API routes only)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client-side client (anon key — limited access, safe for browser)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 1.4 Run Database Schema

Execute this SQL in the Supabase SQL Editor. This creates ALL tables for Wall of Shame, hybrid pipeline, AND share tracking in one shot:

```sql
-- ============================================
-- COMPANIES TABLE
-- Used by: company pages, Hall of Fame, Wall of Shame references
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,              -- "instagram", "spotify", "orchids"
  name TEXT NOT NULL,                     -- "Instagram"
  domain TEXT,                            -- "instagram.com" (for matching user analyses)
  tos_url TEXT,
  privacy_url TEXT,
  overall_grade CHAR(2),                  -- "C-", "B+", "F"
  verdict TEXT,                           -- One-sentence verdict
  source TEXT NOT NULL DEFAULT 'manual',  -- "manual" (Tier 1) or "user_submitted" (Tier 2)
  status TEXT NOT NULL DEFAULT 'draft',   -- "draft", "published", "archived"
  last_analyzed_at TIMESTAMPTZ,
  tos_content_hash TEXT,                  -- For TOS change detection
  analysis_json JSONB,                    -- Full AI analysis stored as structured JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PENDING ANALYSES QUEUE
-- Fed by user tool usage (hybrid pipeline)
-- Every user analysis where no published company page exists gets saved here
-- ============================================
CREATE TABLE pending_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,                   -- Extracted from source URL (e.g., "orchids.app")
  company_name TEXT,                      -- Best-guess company name from domain
  source_url TEXT NOT NULL,               -- The URL the user analyzed
  overall_grade CHAR(2),                  -- Grade from this analysis
  verdict TEXT,                           -- One-sentence verdict
  analysis_json JSONB NOT NULL,           -- Full AI output
  submission_count INTEGER DEFAULT 1,     -- Incremented when another user analyzes same domain
  status TEXT DEFAULT 'pending',          -- "pending", "published", "rejected"
  published_company_id UUID REFERENCES companies(id),  -- Set when published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WALL OF SHAME CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT                               -- Optional emoji or icon identifier
);

-- Seed initial categories
INSERT INTO categories (slug, name, description, icon) VALUES
  ('invasive-data', 'Most Invasive Data Collection', 'Companies that collect far more data than necessary for their service', '🔍'),
  ('sneaky-renewal', 'Sneakiest Auto-Renewal', 'Auto-renewal terms designed to trap users into continued payments', '🔄'),
  ('ip-grab', 'Worst Content Licensing', 'Aggressive intellectual property claims over user content and feedback', '©️'),
  ('termination', 'Most Aggressive Termination', 'Companies that can delete your account and data without warning or reason', '🚫'),
  ('data-retention', 'Worst Data Retention', 'Keeping your data long after you leave, with no clear deletion process', '🗄️'),
  ('ai-clauses', 'Most Restrictive AI/ML Clauses', 'Either training AI on your data without consent, or blocking all AI interaction with their content', '🤖'),
  ('arbitration', 'Broadest Arbitration Waiver', 'Stripping your right to sue or join class actions', '⚖️');

-- ============================================
-- WALL OF SHAME SUBMISSIONS
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,             -- Company name (may not match a company page)
  company_slug TEXT,                      -- If matched to existing company page
  company_id UUID REFERENCES companies(id), -- If matched to existing company
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly: "orchids-ip-assignment"
  source_url TEXT,                        -- URL of the original TOS/PP
  clause_text TEXT NOT NULL,              -- The actual TOS clause being flagged
  ai_explanation TEXT,                    -- AI plain-English breakdown of the clause
  category_id UUID REFERENCES categories(id),
  risk_level TEXT DEFAULT 'HIGH',         -- "MEDIUM" or "HIGH" (only concerning clauses get submitted)
  submitted_by_ip_hash TEXT NOT NULL,     -- Hashed IP, never raw
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',          -- "pending", "approved", "rejected"
  rejection_reason TEXT,                  -- Optional: why it was rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WALL OF SHAME VOTES
-- Upvote only, one per IP per submission
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, voter_ip_hash)
);

-- ============================================
-- SHARE EVENTS
-- Tracks share button clicks for analytics + display counts
-- ============================================
CREATE TABLE share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,                -- "company", "wall-of-shame", "hall-of-fame", "live-result"
  page_slug TEXT NOT NULL,                -- "instagram", "orchids-ip-assignment", etc.
  platform TEXT NOT NULL,                 -- "facebook", "x", "linkedin", "reddit", "email", "copy-link"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_grade ON companies(overall_grade);
CREATE INDEX idx_pending_domain ON pending_analyses(domain);
CREATE INDEX idx_pending_status ON pending_analyses(status);
CREATE INDEX idx_pending_count ON pending_analyses(submission_count DESC);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_company ON submissions(company_slug);
CREATE INDEX idx_submissions_category ON submissions(category_id);
CREATE INDEX idx_submissions_upvotes ON submissions(upvotes DESC);
CREATE INDEX idx_votes_submission ON votes(submission_id);
CREATE INDEX idx_share_page ON share_events(page_type, page_slug);
CREATE INDEX idx_share_platform ON share_events(platform);
CREATE INDEX idx_share_created ON share_events(created_at);
```

### 1.5 Share Count Tracking API Route

**File:** `src/app/api/share/track/route.ts` — NEW

Fire-and-forget endpoint called when a user clicks any share button. Does NOT block the share action.

```typescript
import { supabaseAdmin } from '@/lib/site/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pageType, pageSlug, platform } = await request.json();
    
    // Validate inputs
    const validPageTypes = ['company', 'wall-of-shame', 'hall-of-fame', 'live-result'];
    const validPlatforms = ['facebook', 'x', 'linkedin', 'reddit', 'email', 'copy-link'];
    
    if (!validPageTypes.includes(pageType) || !validPlatforms.includes(platform) || !pageSlug) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Insert share event (no IP tracking — just the event)
    await supabaseAdmin.from('share_events').insert({
      page_type: pageType,
      page_slug: pageSlug,
      platform: platform,
    });
    
    return NextResponse.json({ success: true });
  } catch {
    // Silently fail — share tracking should never break the user experience
    return NextResponse.json({ success: true });
  }
}
```

### 1.6 Share Count Fetch API Route

**File:** `src/app/api/share/count/route.ts` — NEW

Returns the total share count for a given page. Called on page load to display the count.

```typescript
import { supabaseAdmin } from '@/lib/site/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSlug = searchParams.get('slug');
  
  if (!pageSlug) {
    return NextResponse.json({ count: 0 });
  }
  
  const { count } = await supabaseAdmin
    .from('share_events')
    .select('*', { count: 'exact', head: true })
    .eq('page_slug', pageSlug);
  
  return NextResponse.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 'public, max-age=300' } } // 5-minute cache
  );
}
```

### 1.7 Integrate Share Tracking into SharePopup

**File:** `src/components/shared/SharePopup.tsx` — MODIFY

Before opening the platform's share window, fire off a tracking call:

```typescript
const trackShare = async (platform: string) => {
  // Fire and forget — don't await, don't block
  fetch('/api/share/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageType: pageType,   // New prop: "company" | "wall-of-shame" | "hall-of-fame" | "live-result"
      pageSlug: pageSlug,   // New prop: "instagram", etc.
      platform: platform,
    }),
  }).catch(() => {}); // Silently fail
};

// In each platform button's onClick:
const handleShare = (platform: string, shareUrl: string) => {
  trackShare(platform);
  window.open(shareUrl, '_blank', 'width=600,height=400');
  onClose();
};
```

**New props added to SharePopup:**
```typescript
interface SharePopupProps {
  url: string;
  title: string;
  pageType: 'company' | 'wall-of-shame' | 'hall-of-fame' | 'live-result';
  pageSlug: string;
  isOpen: boolean;
  onClose: () => void;
}
```

Update all existing SharePopup usages (GradeCard on company pages, Hall of Fame, live results) to pass these new props.

### 1.8 Display Share Count on GradeCard

**File:** `src/components/site/GradeCard.tsx` — MODIFY

Fetch and display the share count next to the share icon:

```typescript
const [shareCount, setShareCount] = useState<number>(0);

useEffect(() => {
  if (pageSlug) {
    fetch(`/api/share/count?slug=${pageSlug}`)
      .then(res => res.json())
      .then(data => setShareCount(data.count))
      .catch(() => {}); // Silently fail
  }
}, [pageSlug]);

// In the JSX, next to the share icon:
<button onClick={() => setShareOpen(true)} className="...">
  <Share2 className="w-5 h-5" />
  {shareCount > 0 && (
    <span className="text-sm text-zinc-500 ml-1">{shareCount}</span>
  )}
</button>
```

**Also display share counts on:**
- Company cards in CompanyGrid (subtle count below verdict)
- Wall of Shame submission cards (next to upvote count)

---

## Day 2: Wall of Shame

### 2.1 Wall of Shame Submission from Live Results (Path A)

**File:** `src/components/site/ResultsDisplay.tsx` — MODIFY

Add a "Submit to Wall of Shame" button that appears next to any clause flagged as HIGH RISK in the Red Flags section.

```typescript
// Inside each Red Flag card, add a submit button:
<button
  onClick={() => openSubmissionModal(clauseText, aiExplanation, companyName)}
  className="text-sm text-red-600 hover:text-red-700 mt-2"
>
  🚩 Submit to Wall of Shame
</button>
```

When clicked, opens a SubmissionModal pre-populated with:
- `clause_text` — the actual TOS clause from the red flag
- `ai_explanation` — the "This means:" text from the analysis
- `company_name` — extracted from the analysis or URL domain
- `source_url` — the URL that was analyzed
- User picks a category from a dropdown (the 7 seeded categories)
- User clicks "Submit for Review"

### 2.2 Submission Modal Component

**File:** `src/components/site/SubmissionModal.tsx` — NEW

Modal that appears when user clicks "Submit to Wall of Shame" from results OR navigates to the standalone form.

```typescript
interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pre-populated from live results (Path A), empty for standalone form (Path B)
  prefill?: {
    clauseText: string;
    aiExplanation: string;
    companyName: string;
    sourceUrl: string;
  };
}
```

**Fields:**
- **Company Name** — text input (pre-populated from analysis or user types it)
- **Source URL** — text input (pre-populated or user pastes TOS URL)
- **The Clause** — textarea, minimum 50 characters (pre-populated from red flag or user pastes)
- **Category** — dropdown of the 7 categories from the `categories` table
- **Submit button** — "Submit for Review"

**Validation:**
- Company name required
- Clause text minimum 50 characters
- Category required
- Rate limit: 2 submissions per IP per 24 hours (checked server-side)

**After submission:** "Thanks! Your submission is under review. If approved, it'll appear on the Wall of Shame." Close modal.

### 2.3 Standalone Submission Page (Path B)

**File:** `src/app/wall-of-shame/submit/page.tsx` — NEW  
**URL:** `/wall-of-shame/submit`

A dedicated page with the SubmissionModal content rendered inline (not as a modal, but as a full page form). For users who want to submit directly without running an analysis first.

**Layout:**
- H1: "Submit to the Wall of Shame"
- Brief explanation: "Found an outrageous clause in a Terms of Service? Submit it here. Our team reviews every submission before it goes live."
- The submission form (same fields as SubmissionModal but laid out as a page)
- Link to Wall of Shame index: "Browse existing submissions →"

### 2.4 Submission API Route

**File:** `src/app/api/wall-of-shame/submit/route.ts` — NEW

```typescript
import { supabaseAdmin } from '@/lib/site/supabase';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  
  // Rate limit: 2 submissions per IP per 24 hours
  const { count } = await supabaseAdmin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('submitted_by_ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if ((count || 0) >= 2) {
    return NextResponse.json(
      { error: 'You can submit up to 2 entries per day. Try again tomorrow!' },
      { status: 429 }
    );
  }
  
  const body = await request.json();
  const { companyName, sourceUrl, clauseText, aiExplanation, categoryId } = body;
  
  // Validate
  if (!companyName || !clauseText || clauseText.length < 50 || !categoryId) {
    return NextResponse.json(
      { error: 'Missing required fields or clause text too short (minimum 50 characters)' },
      { status: 400 }
    );
  }
  
  // Generate slug
  const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  
  // Check if company exists in companies table
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { data: existingCompany } = await supabaseAdmin
    .from('companies')
    .select('id, slug')
    .eq('slug', companySlug)
    .single();
  
  // Insert submission
  const { data, error } = await supabaseAdmin.from('submissions').insert({
    company_name: companyName,
    company_slug: companySlug,
    company_id: existingCompany?.id || null,
    slug: slug,
    source_url: sourceUrl || null,
    clause_text: clauseText,
    ai_explanation: aiExplanation || null,
    category_id: categoryId,
    risk_level: 'HIGH',
    submitted_by_ip_hash: ipHash,
    status: 'pending',
  }).select().single();
  
  if (error) {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, slug: data.slug });
}
```

### 2.5 Wall of Shame Index Page

**File:** `src/app/wall-of-shame/page.tsx` — NEW  
**URL:** `/wall-of-shame/`

The main Wall of Shame page showing approved submissions ranked by upvotes.

**Layout:**
- H1: "Wall of Shame"
- Subtitle: "The most outrageous clauses hiding in Terms of Service and Privacy Policies, submitted and voted on by the community."
- **Category filter** — horizontal pill bar with the 7 categories + "All" (default)
- **Sort toggle** — "Most Upvoted" (default) | "Newest"
- **Submission cards** in a vertical list, each showing:
  - Company name + category badge
  - The clause text (truncated to 2-3 lines with "Read more →")
  - AI explanation preview
  - Upvote button with count
  - Share button with count
  - Link to full submission page
- **Submit CTA** at bottom: "Found something worse? Submit it →" linking to `/wall-of-shame/submit`
- Pagination (20 per page)

**SEO:**
- Title: `Wall of Shame — The Worst Terms of Service Clauses | FinePrint`
- Meta: `Community-submitted outrageous TOS clauses, voted on and explained in plain English. See what companies are hiding in their fine print.`
- Structured data: ItemList schema

### 2.6 Individual Submission Page

**File:** `src/app/wall-of-shame/[slug]/page.tsx` — NEW  
**URL:** `/wall-of-shame/[slug]`

Full page for a single submission. This is the shareable URL.

**Layout:**
- Company name as H1
- Category badge
- **The clause** — full text in a blockquote with red left border
- **AI explanation** — "This means:" plain English breakdown
- **Industry context** — how this compares to normal practices
- Risk level badge (HIGH)
- **Upvote button** with count
- **Share button** (triggers SharePopup) with share count
- Source URL link: "Read the full TOS →"
- If a company page exists: "See full analysis of [Company] →" linking to `/company/[slug]`
- Related submissions from the same company or category
- Disclaimer

**Dynamic OG tags** for social sharing:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const submission = await getSubmissionBySlug(params.slug);
  return {
    openGraph: {
      title: `${submission.company_name} — ${submission.category.name} | FinePrint Wall of Shame`,
      description: submission.ai_explanation?.slice(0, 200) || submission.clause_text.slice(0, 200),
      images: [`/api/og/wall/${params.slug}`],
    },
  };
}
```

### 2.7 OG Image Route for Wall of Shame

**File:** `src/app/api/og/wall/[slug]/route.tsx` — NEW

Same pattern as the company OG image but with Wall of Shame branding:
- Dark background
- Red-tinted grade badge (or 🚩 icon instead of a letter grade)
- Company name + truncated clause text
- Bottom bar: "FinePrint | We read the fine print" (left) + "Wall of Shame — FinePrint" (right)
- NO domain name on the card

### 2.8 Upvote API Route

**File:** `src/app/api/wall-of-shame/vote/route.ts` — NEW

```typescript
import { supabaseAdmin } from '@/lib/site/supabase';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  
  const { submissionId } = await request.json();
  
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
  }
  
  // Check for existing vote (unique constraint will also catch this)
  const { data: existingVote } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('voter_ip_hash', ipHash)
    .single();
  
  if (existingVote) {
    return NextResponse.json({ error: 'Already voted', alreadyVoted: true }, { status: 409 });
  }
  
  // Insert vote
  await supabaseAdmin.from('votes').insert({
    submission_id: submissionId,
    voter_ip_hash: ipHash,
  });
  
  // Increment upvote count on submission
  await supabaseAdmin.rpc('increment_upvotes', { submission_id_param: submissionId });
  
  return NextResponse.json({ success: true });
}
```

**Supabase RPC function** (add to SQL editor):
```sql
CREATE OR REPLACE FUNCTION increment_upvotes(submission_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE submissions
  SET upvotes = upvotes + 1, updated_at = NOW()
  WHERE id = submission_id_param;
END;
$$ LANGUAGE plpgsql;
```

### 2.9 Wall of Shame Admin Moderation

This can be a new tab in the admin panel (built on Day 3) OR a quick standalone moderation page.

**File:** `src/app/admin/wall-of-shame/page.tsx` — NEW  
**URL:** `/admin/wall-of-shame` (protected by same ADMIN_PASSWORD)

**Layout:**
- Table of pending submissions sorted by newest first
- Columns: Company, Category, Clause (truncated), Submitted, Actions
- Click to expand full clause + AI explanation
- Three action buttons per submission:
  - **Approve** → sets status to 'approved', submission goes live on Wall of Shame
  - **Reject** → sets status to 'rejected', optionally with reason
  - **Spam** → deletes the submission entirely

**Anti-spam checks the admin should eyeball:**
- Is the clause text actually from a TOS? (not random text or gibberish)
- Does the company name match a real company?
- Is the AI explanation reasonable? (not hallucinated)
- Is this a duplicate of an existing approved submission?

---

## Day 3: Hybrid Company Pipeline (Admin Panel)

### 3.1 Auto-Save User Analyses to Pending Queue

**File:** `src/app/api/analyze/route.ts` — MODIFY

After a successful analysis (where the input came from a URL), auto-save to the `pending_analyses` table. This runs AFTER returning results to the user — it does not block the response.

```typescript
// After sending the response to the user:
if (process.env.AUTO_SAVE_ANALYSES === 'true' && sourceUrl) {
  // Fire and forget — don't block the user's response
  saveToPendingQueue(sourceUrl, analysisResult).catch(() => {});
}

async function saveToPendingQueue(sourceUrl: string, analysis: AnalysisResult) {
  const domain = new URL(sourceUrl).hostname.replace('www.', '');
  
  // Skip if a published company page already exists for this domain
  const { data: existingCompany } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('domain', domain)
    .eq('status', 'published')
    .single();
  
  if (existingCompany) return; // Company page exists, skip
  
  // Check if a pending analysis already exists for this domain
  const { data: existingPending } = await supabaseAdmin
    .from('pending_analyses')
    .select('id, submission_count')
    .eq('domain', domain)
    .eq('status', 'pending')
    .single();
  
  if (existingPending) {
    // Increment count, update analysis if this one is newer
    await supabaseAdmin
      .from('pending_analyses')
      .update({
        submission_count: existingPending.submission_count + 1,
        analysis_json: analysis.json,
        overall_grade: analysis.grade,
        verdict: analysis.verdict,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPending.id);
  } else {
    // New pending analysis
    await supabaseAdmin.from('pending_analyses').insert({
      domain: domain,
      company_name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1), // Best guess
      source_url: sourceUrl,
      overall_grade: analysis.grade,
      verdict: analysis.verdict,
      analysis_json: analysis.json,
    });
  }
}
```

**Set `AUTO_SAVE_ANALYSES=true` in Vercel env vars after this deploys.**

### 3.2 Admin Dashboard

**File:** `src/app/admin/page.tsx` — NEW (or MODIFY if basic admin already exists)  
**URL:** `/admin`

Protected by `ADMIN_PASSWORD` env variable. Simple password entry on first visit, cookie-based session after that.

**Three tabs:**
1. **Pending Queue** — User-sourced analyses awaiting review
2. **Published Companies** — All live company pages
3. **Wall of Shame** — Submission moderation (built on Day 2)

### 3.3 Pending Queue Tab

**File:** `src/components/admin/PendingQueue.tsx` — NEW

Table showing pending analyses sorted by `submission_count` descending (most-analyzed companies surface first).

**Columns:** Domain | Company Name | Grade | Analyses Count | Share Count | Source URL | Date

**The Share Count column is key:** If a live result for a company has already been shared 30+ times on social media, that's a strong signal to publish it as a company page — people clearly care about this company's TOS.

**Row click** → opens AnalysisPreview (full analysis as the user saw it).

**Actions per row:**
- **Publish** → Creates a record in the `companies` table, sets slug and status to 'published'. Page goes live via ISR.
- **Edit + Publish** → Opens editable fields (company name, slug, grade, verdict) then publishes.
- **Re-Analyze** → Triggers a fresh analysis of the source URL (optionally with Gemini Pro). Replaces the pending analysis.
- **Reject** → Marks as rejected, removes from queue view.

### 3.4 Published Companies Tab

**File:** `src/components/admin/PublishedList.tsx` — NEW

Table of all live company pages.

**Columns:** Company | Grade | Source (Manual/User) | Last Analyzed | Share Count | Page URL

**Actions:** Edit | Archive | Re-Analyze

### 3.5 Admin API Routes

**File:** `src/app/api/admin/publish/route.ts` — NEW

Publishes a pending analysis as a company page:
1. Creates or updates record in `companies` table
2. Sets status to 'published'
3. Updates `pending_analyses` record with `published_company_id`
4. Triggers ISR revalidation for the new company page URL

**File:** `src/app/api/admin/reject/route.ts` — NEW

Marks a pending analysis as rejected.

**File:** `src/app/api/admin/reanalyze/route.ts` — NEW

Re-runs the analysis:
1. Fetches the source URL via Jina Reader
2. Runs through Gemini (optionally Pro model)
3. Replaces the pending analysis JSON, grade, and verdict

All admin routes check `ADMIN_PASSWORD` in request headers or session cookie.

### 3.6 Update Company Page Template for ISR

**File:** `src/app/company/[slug]/page.tsx` — MODIFY

Currently company pages are SSG from local content files. Update to ALSO check Supabase for published companies. This allows both Tier 1 (manual/local content files) and Tier 2 (published via admin) to render from the same template.

```typescript
async function getCompanyData(slug: string) {
  // First check local content files (Tier 1 manual pages)
  const localData = getLocalCompanyContent(slug);
  if (localData) return localData;
  
  // Then check Supabase (Tier 2 user-sourced pages published via admin)
  const { data } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  
  return data || null;
}
```

Add ISR revalidation:
```typescript
export const revalidate = 3600; // Regenerate every hour if requested
```

### 3.7 Test the Full Pipeline End-to-End

- [ ] Analyze a URL for a company with no existing page → verify row appears in `pending_analyses`
- [ ] Analyze same domain again → verify `submission_count` increments
- [ ] Analyze a domain that has a published company page → verify NO pending row created
- [ ] Open admin panel → see pending analysis sorted by count
- [ ] Click Publish → company page goes live at `/company/[slug]`
- [ ] Visit the new company page → full analysis renders correctly
- [ ] Company appears in CompanyGrid on company index page
- [ ] New URL appears in dynamic sitemap
- [ ] Share button works on new company page → share count tracks
- [ ] Submit a Wall of Shame entry from live results → appears in admin moderation queue
- [ ] Approve the submission → appears on `/wall-of-shame/` index
- [ ] Visit individual submission page → full clause + explanation renders
- [ ] Upvote → count increments, second vote from same IP blocked
- [ ] Share Wall of Shame entry → OG card renders correctly with red/shame branding

---

## Updated Environment Variables

Add these to Vercel after Day 1:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Feature Flags (update existing)
AUTO_SAVE_ANALYSES=true                 # Enable after Day 3 deploys
WALL_OF_SHAME_ENABLED=true             # Enable after Day 2 deploys
```

---

## New Files Summary

| File | Day | Description |
|------|-----|-------------|
| `src/lib/site/supabase.ts` | 1 | Supabase client (admin + public) |
| `src/app/api/share/track/route.ts` | 1 | Share event tracking (fire-and-forget) |
| `src/app/api/share/count/route.ts` | 1 | Share count fetching |
| `src/components/site/SubmissionModal.tsx` | 2 | Wall of Shame submission form modal |
| `src/app/wall-of-shame/page.tsx` | 2 | Wall of Shame index (ranked submissions) |
| `src/app/wall-of-shame/[slug]/page.tsx` | 2 | Individual submission page |
| `src/app/wall-of-shame/submit/page.tsx` | 2 | Standalone submission form page |
| `src/app/api/wall-of-shame/submit/route.ts` | 2 | Submission API with rate limiting |
| `src/app/api/wall-of-shame/vote/route.ts` | 2 | Upvote API (IP-limited) |
| `src/app/api/og/wall/[slug]/route.tsx` | 2 | Wall of Shame OG image generation |
| `src/app/admin/page.tsx` | 3 | Admin dashboard (3 tabs) |
| `src/app/admin/wall-of-shame/page.tsx` | 3 | Wall of Shame moderation queue |
| `src/components/admin/PendingQueue.tsx` | 3 | Pending analyses table |
| `src/components/admin/AnalysisPreview.tsx` | 3 | Full analysis preview for review |
| `src/components/admin/PublishedList.tsx` | 3 | Published companies table |
| `src/app/api/admin/publish/route.ts` | 3 | Publish pending → company page |
| `src/app/api/admin/reject/route.ts` | 3 | Reject pending analysis |
| `src/app/api/admin/reanalyze/route.ts` | 3 | Re-run analysis with specified model |

## Modified Files Summary

| File | Day | Modification |
|------|-----|-------------|
| `src/components/shared/SharePopup.tsx` | 1 | Add share tracking + new props (pageType, pageSlug) |
| `src/components/site/GradeCard.tsx` | 1 | Display share count next to share icon |
| `src/app/api/analyze/route.ts` | 3 | Add auto-save to pending queue logic |
| `src/app/company/[slug]/page.tsx` | 3 | Add Supabase fallback data source + ISR |
| `src/components/site/ResultsDisplay.tsx` | 2 | Add "Submit to Wall of Shame" button on red flags |
| `package.json` | 1 | Add `@supabase/supabase-js` |

---

**This document is additive. Everything in the original architecture, build kit, and V2 supplement remains unchanged. Build these features on top of the existing working site.**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Mar 11, 2026 | **V3 supplement drafted** | Document created covering 3-day sprint: Supabase setup + share tracking, Wall of Shame, Hybrid company pipeline |
| Mar 13, 2026 | **Supabase project created** | New Supabase project provisioned (free tier). Project URL and API keys (new `sb_publishable_` / `sb_secret_` format) added to `.env.local` and Vercel environment variables |
| Mar 13, 2026 | **Database schema executed** | Full schema run in Supabase SQL Editor: `companies`, `pending_analyses`, `categories` (with 7 seeded categories), `submissions`, `votes`, `share_events` tables created. All indexes created. `increment_upvotes` RPC function created |
| Mar 13, 2026 | **Supabase client created** | `src/lib/site/supabase.ts` built with admin (service role) and public (anon key) clients |
| Mar 13, 2026 | **Wall of Shame core built** | Submission flow (modal + standalone page), submission API with IP-hashed rate limiting (2/day), Wall of Shame index page with category filter and sort, individual submission pages with OG images, upvote API with IP deduplication |
| Mar 13, 2026 | **Admin panel built** | `/admin` dashboard with 3 tabs: Pending Queue, Published Companies, Wall of Shame moderation. Protected by `ADMIN_PASSWORD` env var with cookie-based session |
| Mar 13, 2026 | **Admin cookie extended to 7 days** | Changed `src/app/api/admin/auth/route.ts` cookie maxAge from `60 * 60 * 24` (24h) to `60 * 60 * 24 * 7` (7 days) |
| Mar 13, 2026 | **WOS post-approval management** | Added admin capabilities for approved submissions: Edit (inline form with company name, category dropdown, clause text, AI explanation), Unpublish (soft revert to rejected), Delete (hard remove from DB). New API routes: `/api/admin/wall-of-shame/edit`, `/api/admin/wall-of-shame/unpublish` |
| Mar 13, 2026 | **WOS Rejections tab added** | Third sub-tab in WOS moderation: "WOS Rejections" showing soft-deleted submissions. Actions: Re-approve, Edit, Delete Permanently. Categories API route created (`/api/admin/wall-of-shame/categories`) for edit dropdown |
| Mar 13, 2026 | **Reject vs Spam clarified and implemented** | Reject = soft status change (recoverable, appears in WOS Rejections tab). Spam = hard delete from DB (permanent, for gibberish/abuse). Updated `/api/admin/reject/route.ts` with `revalidatePath("/wall-of-shame")` for submission type |
| Mar 13, 2026 | **Share tracking integrated** | `/api/share/track` (fire-and-forget) and `/api/share/count` routes built. SharePopup modified with `pageType`/`pageSlug` props. Share counts displayed on GradeCard |
| Mar 13, 2026 | **Auto-save pipeline activated** | Analyze API route modified to auto-save user URL analyses to `pending_analyses` table. `AUTO_SAVE_ANALYSES=true` set in Vercel env vars. Domain deduplication with submission count incrementing |
| Mar 13, 2026 | **Company page template updated for ISR** | `/company/[slug]/page.tsx` now checks local content files first, then falls back to Supabase for published Tier 2 pages. `revalidate = 3600` added for ISR |
| Mar 13, 2026 | **Vercel env vars configured** | All Supabase credentials, admin password, and feature flags pushed to Vercel production environment via CLI |
| Mar 13, 2026 | **Production deployment** | Full deployment to Vercel production with all V3 features live. Wall of Shame, admin panel, share tracking, auto-save pipeline all confirmed working |
