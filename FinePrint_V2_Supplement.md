# FinePrint.legal — V2 Supplement: New Features

**Date:** March 13, 2026  
**Status:** Additive features — build ON TOP of existing site  
**Context:** The core FinePrint site is already built and working (homepage, tool, company pages, guides, rate limiting, SEO). This document adds NEW features that were not in the original architecture or build kit. Nothing here replaces or modifies existing functionality.

**Reference:** This supplements `FinePrint_Architecture_v1.md` and `FinePrint_CC_BuildKit.md`. Those docs remain the source of truth for everything already built.

---

## What's New in V2

1. **Share System** — WaPo-style share popup + dynamic OG image generation
2. **How We Grade** — Dedicated methodology page at `/how-we-grade`
3. **Hall of Fame** — Page at `/hall-of-fame` + featured section on `/company` index
4. **Branding Rule** — No domain name on shared content (use "FinePrint" brand only)
5. **New dependency** — `@vercel/og` for server-side OG image rendering

---

## Install New Dependency

```bash
npm install @vercel/og
```

---

## Feature 1: Share System

### Overview

Every page with a grade gets a share button. Clicking it opens a WaPo-style popup with platform icons. The user picks a platform, that platform's native compose window opens with the FinePrint URL pre-attached, and the user writes whatever they want. FinePrint controls the **link preview card** (OG image + meta tags), not the user's share text.

This is the Washington Post model — we don't pre-populate share text, we don't offer an editable compose window. We just provide a clean URL and a great-looking OG card that the platform renders as a preview.

### 1A: SharePopup Component

**File:** `src/components/shared/SharePopup.tsx`  
**Type:** NEW shared component (reusable on DecipherDocs later)

A modal/dropdown triggered by a share icon button. Six platform options in a clean 3x2 grid:

| Icon | Platform | Action |
|------|----------|--------|
| 🔗 | Copy Link | Copy current page URL to clipboard, show toast "Link copied!" |
| ✉️ | Email | Open `mailto:?subject={encodedTitle}&body={encodedUrl}` |
| f | Facebook | Open `https://www.facebook.com/sharer/sharer.php?u={encodedUrl}` |
| X | X (Twitter) | Open `https://twitter.com/intent/tweet?url={encodedUrl}` |
| in | LinkedIn | Open `https://www.linkedin.com/sharing/share-offsite/?url={encodedUrl}` |
| ↗ | Reddit | Open `https://www.reddit.com/submit?url={encodedUrl}&title={encodedTitle}` |

**Props:**
```typescript
interface SharePopupProps {
  url: string;      // Full page URL to share
  title: string;    // Page title (used for email subject and Reddit title)
  isOpen: boolean;
  onClose: () => void;
}
```

**Behavior:**
- Opens as a centered modal with backdrop overlay (or dropdown from share icon)
- Closes on: click outside, Escape key, X button, or after clicking any platform
- Each platform opens in a new window/tab via `window.open()`
- Copy Link uses `navigator.clipboard.writeText()` with toast confirmation
- Clean circular icon buttons, similar to the WaPo screenshot the user provided
- No pre-populated share text — platforms fetch OG tags from the URL

### 1B: Dynamic OG Image Generation

**File:** `src/app/api/og/[slug]/route.tsx`  
**Type:** NEW API route

Uses `@vercel/og` (Vercel's `ImageResponse`) to render a 1200x630 PNG on the fly for each company/page.

```typescript
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Fetch company data (from content JSON or Supabase)
  const company = await getCompanyBySlug(slug);
  
  if (!company) {
    // Return generic FinePrint branded card
    return new ImageResponse(/* generic card JSX */);
  }
  
  // Grade color mapping
  const gradeColors: Record<string, string> = {
    'A': '#10b981', 'A-': '#10b981',
    'B+': '#14b8a6', 'B': '#14b8a6', 'B-': '#14b8a6',
    'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#f59e0b',
    'D+': '#f97316', 'D': '#f97316', 'D-': '#f97316',
    'F': '#ef4444',
  };
  
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#18181b',
        padding: '40px',
      }}>
        {/* Main content area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
          {/* Grade badge */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            backgroundColor: gradeColors[company.grade] || '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '40px', fontWeight: 600, color: 'white' }}>
              {company.grade}
            </span>
          </div>
          
          {/* Company name + verdict */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: 'white' }}>
              {company.name}
            </span>
            <span style={{ fontSize: '16px', color: '#a1a1aa', marginTop: '8px', lineHeight: 1.5 }}>
              {company.verdict}
            </span>
          </div>
        </div>
        
        {/* Bottom bar — NO DOMAIN NAME */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #27272a',
          paddingTop: '16px',
          marginTop: '16px',
        }}>
          <span style={{ fontSize: '14px', color: '#52525b' }}>
            FinePrint | We read the fine print
          </span>
          <span style={{ fontSize: '14px', color: '#52525b' }}>
            Analyzed by FinePrint
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400', // 24hr cache
      },
    }
  );
}
```

**CRITICAL BRANDING RULE:** The OG card shows "FinePrint | We read the fine print" — NEVER "fineprint.legal". The `.legal` TLD implies legal authority and should not appear on shared content. The domain is for browser address bars. The brand name is for everything public-facing.

**Variants for different page types:**
- Company pages: bottom right says "Analyzed by FinePrint"
- Hall of Fame pages: bottom right says "Hall of Fame — FinePrint"
- Wall of Shame entries (Phase 2): bottom right says "Wall of Shame — FinePrint"

### 1C: Integrate Share Button into GradeCard

**File:** `src/components/site/GradeCard.tsx` (MODIFY existing component)

Add a share icon (lucide-react `Share2`) positioned next to the grade badge. On click, it opens the SharePopup with the current page URL and title.

```typescript
import { Share2 } from 'lucide-react';

// Inside the GradeCard component, next to the grade badge:
<button 
  onClick={() => setShareOpen(true)} 
  className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
  aria-label="Share this analysis"
>
  <Share2 className="w-5 h-5 text-zinc-500" />
</button>

<SharePopup 
  isOpen={shareOpen} 
  onClose={() => setShareOpen(false)}
  url={typeof window !== 'undefined' ? window.location.href : ''}
  title={`${companyName} — Grade: ${grade} | FinePrint`}
/>
```

**Where share buttons appear:**
- Company pages — next to GradeCard (above the fold)
- Live tool results — next to GradeCard after analysis completes
- Hall of Fame page — on each company card
- Wall of Shame entries — on each submission (Phase 2)

### 1D: Dynamic OG Meta Tags

**File:** Update `<head>` / metadata in each shareable page template

Every page that has a share button needs unique OG tags so the link preview card renders correctly on social platforms.

**Company pages** (`src/app/company/[slug]/page.tsx`):
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);
  return {
    openGraph: {
      title: `${company.name} — Grade: ${company.grade} | FinePrint`,
      description: company.verdict,
      images: [`/api/og/${params.slug}`],
      url: `https://fineprint.legal/company/${params.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${company.name} — Grade: ${company.grade} | FinePrint`,
      description: company.verdict,
      images: [`/api/og/${params.slug}`],
    },
  };
}
```

**Hall of Fame page** (`src/app/hall-of-fame/page.tsx`):
```typescript
export const metadata: Metadata = {
  openGraph: {
    title: 'Hall of Fame — Companies That Respect Your Privacy | FinePrint',
    description: 'These companies are doing it right. See which services earned a B- or higher for respecting user rights.',
    images: ['/api/og/hall-of-fame'], // Generic Hall of Fame card
  },
};
```

**How We Grade page** (`src/app/how-we-grade/page.tsx`):
```typescript
export const metadata: Metadata = {
  openGraph: {
    title: 'How We Grade Terms of Service & Privacy Policies | FinePrint',
    description: 'Our scoring methodology: data collection (30%), data sharing (25%), user rights (20%), exit difficulty (15%), transparency (10%).',
  },
};
```

---

## Feature 2: How We Grade Page

**File:** `src/app/how-we-grade/page.tsx`  
**Type:** NEW page  
**URL:** `/how-we-grade`

A dedicated methodology page explaining how FinePrint assigns letter grades. This is required for credibility — without it, users (and companies) will assume grades are arbitrary.

### Content Structure

**Section 1: The Grading Scale**
- Table showing all grades A through F with definitions and color swatches
- Same table as Architecture doc Section 5 (already defined)

**Section 2: Scoring Criteria**
Five weighted factors:
| Criteria | Weight | What It Measures |
|----------|--------|-----------------|
| Data collection scope | 30% | How much data they collect and whether it's necessary for the service |
| Data sharing & third parties | 25% | Who gets your data, for what purpose, and whether you can opt out |
| User rights surrendered | 20% | Content licensing, arbitration clauses, class action waivers, IP assignment |
| Account deletion & portability | 15% | How easy it is to leave, what data they keep, whether you can export |
| Transparency & readability | 10% | Is the policy clear, accessible, and honest about what they're doing |

**Section 3: What Each Grade Means**
With real examples from published company pages:
- A/B range: "These companies respect your data and your rights. Examples: Spotify (B-)"
- C range: "Industry standard — which is mediocre. Examples: Google (C), Reddit (C), Uber (C-)"
- D/F range: "Aggressive terms that heavily favor the company. Examples: Facebook (D), TikTok (D+), X/Twitter (D+)"

**Section 4: FAQ**
- "Why are so many companies getting C's?" — Because the industry standard genuinely IS mediocre. Most companies collect more data than necessary, share it broadly, and make it hard to leave. A C doesn't mean we're being generous — it means the bar is that low.
- "Is FinePrint a legal authority?" — No. FinePrint provides educational analysis using AI. Grades are AI-generated assessments based on our scoring criteria, not legal opinions. Always consult a qualified attorney.
- "How often are grades updated?" — Company pages are re-analyzed when a company changes their TOS. The "Last analyzed" date tells you when we last reviewed the document.
- "Can companies request a review?" — We welcome corrections. If a company believes their grade doesn't reflect their actual practices, they can contact us. But the grade is based on what's in the published TOS, not what a company says they do.

**SEO:**
- Title: `How We Grade Terms of Service & Privacy Policies | FinePrint`
- Meta: `Our scoring methodology breaks down five key areas: data collection, data sharing, user rights, exit difficulty, and transparency. Here's how we calculate letter grades.`
- Structured data: FAQ schema for featured snippet targeting
- Target keywords: "how to evaluate a privacy policy", "what makes a good terms of service", "terms of service grading"

**Cross-linking:**
- Link TO this page from: every GradeCard ("How do we calculate grades? →"), company index page (blurb above grid), About page
- Link FROM this page to: company index, specific company pages as examples

---

## Feature 3: Hall of Fame

### 3A: Hall of Fame Page

**File:** `src/app/hall-of-fame/page.tsx`  
**Type:** NEW page  
**URL:** `/hall-of-fame`

A dedicated page listing all companies with a published grade of B- or higher.

**Layout:**
- H1: "Hall of Fame"
- Intro text: "These companies are doing it right. Their Terms of Service and Privacy Policies respect user rights, maintain transparency, and set the standard for the industry."
- Grid of qualifying company cards (same CompanyGrid component, filtered to B-/A grades)
- Each card includes: company name, GradeBadge, verdict, share button
- Sorted by grade (highest first, then alphabetical within same grade)
- CTA at bottom: "Analyze a service to see if it qualifies →" linking to homepage

**Qualification:** Automatic — any company in the `companies` table/content with a grade of B-, B, B+, A-, or A appears here. No separate submission or curation process. If a company's grade drops below B- on re-analysis, it's automatically removed.

**SEO:**
- Title: `Hall of Fame — Companies That Respect Your Privacy | FinePrint`
- Meta: `These companies earned a B- or higher from FinePrint for fair terms of service and transparent privacy policies. See who's doing it right.`
- Structured data: ItemList schema

### 3B: HallOfFameSection Component

**File:** `src/components/site/HallOfFameSection.tsx`  
**Type:** NEW component

A featured section that appears at the TOP of the `/company` index page, above the full company grid.

**Design:**
- Section header: "Companies Doing It Right"
- Horizontal row of company cards with green/teal accent styling
- Hall of Fame badge (small shield or star icon) on each qualifying card
- "See all →" link to `/hall-of-fame`
- Only renders if there are qualifying companies (B- or higher)

### 3C: Update Company Index Page

**File:** `src/app/company/page.tsx` (MODIFY existing)

Add two new elements above the existing company grid:

1. **HallOfFameSection** — "Companies Doing It Right" featured row at top
2. **Grading methodology blurb** — Short paragraph: "FinePrint grades Terms of Service and Privacy Policies on a scale from A (excellent) to F (avoid). We evaluate data collection, data sharing, user rights, exit difficulty, and transparency." With a link: "How do we calculate grades? →" pointing to `/how-we-grade`

The existing full company grid remains below these two new sections.

---

## Feature 4: Branding Rule

**This applies to ALL shared/public-facing content going forward:**

| Context | Show | Don't Show |
|---------|------|------------|
| OG cards (social previews) | "FinePrint \| We read the fine print" | ~~fineprint.legal~~ |
| Print output footer | "Generated by FinePrint" | ~~fineprint.legal~~ |
| Share email subjects | "FinePrint" | ~~fineprint.legal~~ |
| Site header | "FinePrint" (already correct) | ~~fineprint.legal~~ |
| Browser address bar | fineprint.legal (unavoidable, fine) | — |
| SEO meta tags | fineprint.legal (needed for SEO) | — |

**Reasoning:** The `.legal` TLD implies legal authority. On shared content that circulates on social media, this could be misinterpreted as an official legal assessment. The brand name "FinePrint" carries no such implication. The domain is for getting people to the site. The brand name is for everything that represents us publicly.

**Action:** Check the existing print stylesheet footer — if it currently shows "fineprint.legal", change it to "Generated by FinePrint" or "FinePrint — We read the fine print."

---

## Updated Sitemap

These pages are NEW additions to the existing sitemap:

```
fineprint.legal/
├── ... (all existing pages unchanged)
├── /how-we-grade                      ← NEW: Grading methodology + FAQ
├── /hall-of-fame                      ← NEW: Companies with B- or higher
└── /api/og/[slug]                     ← NEW: Dynamic OG image generation (not user-facing)
```

---

## New Files Summary

| File | Type | Description |
|------|------|-------------|
| `src/components/shared/SharePopup.tsx` | NEW component | WaPo-style share modal with 6 platforms |
| `src/app/api/og/[slug]/route.tsx` | NEW API route | Dynamic OG image generation via @vercel/og |
| `src/app/how-we-grade/page.tsx` | NEW page | Grading methodology, criteria, FAQ |
| `src/app/hall-of-fame/page.tsx` | NEW page | Companies with B- or higher |
| `src/components/site/HallOfFameSection.tsx` | NEW component | Featured section for company index top |

## Modified Files Summary

| File | Modification |
|------|-------------|
| `src/components/site/GradeCard.tsx` | Add share icon + SharePopup integration |
| `src/app/company/page.tsx` | Add HallOfFameSection at top + grading blurb |
| `src/app/company/[slug]/page.tsx` | Add dynamic OG meta tags pointing to `/api/og/[slug]` |
| `package.json` | Add `@vercel/og` dependency |
| Print stylesheet | Change footer from "fineprint.legal" to "Generated by FinePrint" |
| Dynamic sitemap | Add `/how-we-grade` and `/hall-of-fame` to sitemap generation |

---

**This document is additive only. Everything in the original architecture and build kit remains unchanged. Build these features on top of the existing working site.**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Mar 8, 2026 | **V2 supplement drafted** | Document created covering 4 new features: Share System, How We Grade, Hall of Fame, Branding Rule |
| ~Mar 8, 2026 | **Share system built** | SharePopup component created (6 platforms: Copy Link, Email, Facebook, X, LinkedIn, Reddit). WaPo-style modal with platform icons. Share icon integrated into GradeCard. All share links open in new window with URL pre-attached, no pre-populated text |
| ~Mar 9, 2026 | **Dynamic OG image generation built** | `/api/og/[slug]/route.tsx` created using `@vercel/og` (later migrated to `next/og`). Dynamic 1200x630 PNG cards with company name, grade badge, verdict, FinePrint branding. 24hr cache. Branding rule enforced: "FinePrint" only, never "fineprint.legal" on shared content |
| ~Mar 9, 2026 | **How We Grade page built** | `/how-we-grade` page created with grading scale table, 5 weighted scoring criteria, grade range examples from real company pages, FAQ section with schema markup |
| ~Mar 10, 2026 | **Hall of Fame built** | `/hall-of-fame` page created listing companies with B- or higher. HallOfFameSection component added to top of `/company` index page. Automatic qualification based on grade — no manual curation |
| ~Mar 10, 2026 | **OG meta tags integrated** | Dynamic OG tags added to company pages with structured image objects (url, width: 1200, height: 630, alt). Twitter card meta tags added. Default OG image route created |
| Mar 13, 2026 | **OG image import fix** | Changed `import { ImageResponse } from '@vercel/og'` to `import { ImageResponse } from 'next/og'` in both `/api/og/[slug]` and `/api/og/wall/[slug]` routes — `@vercel/og` breaks on Next.js 16+. Also removed `export const runtime = "edge"` from both routes because `getCompanyData` uses Node.js `fs` module (unavailable in edge runtime). Verified fix: `curl` returned 200 image/png on production |
| Mar 13, 2026 | **OG metadata enhanced** | Updated company page metadata to use structured OG image objects with width/height/alt instead of simple string arrays. Added `siteName: "FinePrint"` to openGraph config. Added default OG image to global layout metadata |
