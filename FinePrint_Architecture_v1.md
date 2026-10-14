# FinePrint.legal — Master Architecture & Build Plan

**Version:** 1.0  
**Date:** March 13, 2026  
**Status:** Pre-Build — All decisions locked before code  
**Domain:** fineprint.legal (registered via Cloudflare, .legal TLD)  
**Sister Site:** decipherdocs.com (live, framework source)

---

## 1. Site Architecture — Pages & URLs

### Core Application Pages

| URL | Page | Purpose |
|-----|------|---------|
| `/` | Homepage + Tool | Single-page tool — URL input, text paste, or file upload above fold. Results below. |
| `/result/[id]` | Shareable Result | Permalink for shared analyses (Phase 2 — design schema now) |

### Company Analysis Pages (Tier 1 SEO — The Moat)

Pre-analyzed, permanently indexed breakdowns of major companies' TOS and privacy policies. Each page is a standalone landing page targeting "[Company] terms of service explained" and "[Company] privacy policy" keywords.

**URL Pattern:** `/company/[company-slug]`

| URL | Target Company | Est. Monthly Search Volume |
|-----|---------------|---------------------------|
| `/company/instagram` | Instagram TOS + Privacy Policy | 20,000+ |
| `/company/tiktok` | TikTok TOS + Privacy Policy | 25,000+ |
| `/company/spotify` | Spotify TOS + Privacy Policy | 15,000+ |
| `/company/facebook` | Facebook/Meta TOS + Privacy Policy | 18,000+ |
| `/company/google` | Google TOS + Privacy Policy | 20,000+ |
| `/company/twitter` | Twitter/X TOS + Privacy Policy | 12,000+ |
| `/company/discord` | Discord TOS + Privacy Policy | 8,000+ |
| `/company/chatgpt` | OpenAI/ChatGPT TOS + Privacy Policy | 12,000+ |
| `/company/snapchat` | Snapchat TOS + Privacy Policy | 10,000+ |
| `/company/amazon` | Amazon TOS + Privacy Policy | 8,000+ |
| `/company/roblox` | Roblox TOS + Privacy Policy | 8,000+ |
| `/company/netflix` | Netflix TOS | 6,000+ |
| `/company/uber` | Uber TOS + Privacy Policy | 5,000+ |
| `/company/airbnb` | Airbnb TOS + Privacy Policy | 7,000+ |
| `/company/apple` | Apple Privacy Policy | 10,000+ |
| `/company/zoom` | Zoom Privacy Policy | 6,000+ |
| `/company/linkedin` | LinkedIn Privacy Policy | 5,000+ |
| `/company/twitch` | Twitch TOS | 5,000+ |
| `/company/venmo` | Venmo TOS | 4,000+ |
| `/company/doordash` | DoorDash TOS | 3,000+ |

**20 companies at launch, expanding to 50+ by month 3.**

Each company page includes:
- Letter grade (A–F) prominently displayed
- "Last analyzed: [date]" freshness signal
- Structured breakdown: What They Collect → What They Do With It → What Rights You Give Up → How to Leave → Red Flags
- FAQ section (schema markup for featured snippets)
- CTA back to tool: "Analyze a different service →"
- Cross-links to relevant guide pages

**Company pages are NOT generated live.** They are pre-analyzed, editorially reviewed, and published as SSG pages. Updated when the company changes their TOS (tracked via URL hash comparison or manual review).

### SEO Guide Pages (Tier 2 — Authority Builder)

Educational content explaining common TOS/privacy policy concepts. Each links to the tool and to relevant company pages as real-world examples.

**URL Pattern:** `/guides/[slug]`

| URL | Target Keyword Cluster | Est. Monthly Volume |
|-----|----------------------|---------------------|
| `/guides/binding-arbitration-explained` | binding arbitration clause explained | 15,000+ |
| `/guides/class-action-waiver` | class action waiver explained | 10,000+ |
| `/guides/what-sharing-data-means` | what does "we may share your data" mean | 8,000+ |
| `/guides/data-retention-explained` | data retention policy explained | 6,000+ |
| `/guides/non-exclusive-worldwide-license` | non-exclusive worldwide license meaning | 5,000+ |
| `/guides/auto-renewal-traps` | auto-renewal terms of service | 9,000+ |
| `/guides/can-companies-change-tos` | can companies change TOS without notice | 7,000+ |
| `/guides/what-apps-collect` | what data do apps collect about you | 10,000+ |
| `/guides/ai-training-your-data` | AI training data privacy rights | 6,000+ |
| `/guides/opt-out-data-selling` | how to opt out of data selling | 5,000+ |
| `/guides/eula-explained` | what is a EULA / end user license agreement | 12,000+ |
| `/guides/right-to-be-forgotten` | right to be forgotten explained | 8,000+ |
| `/guides/gdpr-explained` | GDPR explained simple | 15,000+ |
| `/guides/ccpa-rights` | CCPA privacy rights explained | 8,000+ |
| `/guides/data-after-deletion` | what happens to data when you delete account | 4,000+ |

**Content Format:** 800–1,200 words. Direct answer in first paragraph (GEO optimization). Real examples from company TOS (links to `/company/` pages). "What to do about it" action section. FAQ schema. CTA: "Check if your favorite app respects your privacy →"

### Wall of Shame (Tier 3 — Phase 2 Viral Engine)

Community-submitted outrageous TOS clauses. Designed now, built after core tool is stable and generating traffic.

**URL Pattern:** `/wall-of-shame/` (index) and `/wall-of-shame/[slug]` (individual submissions)

*See Section 10 for database schema and feature design.*

### Legal & Policy Pages

| URL | Page | Purpose |
|-----|------|---------|
| `/about` | About | What FinePrint does, how it works, trust signals |
| `/privacy` | Privacy Policy | GDPR/CCPA compliant, required for ad networks |
| `/terms` | Terms of Service | Usage terms, disclaimers, limitation of liability |
| `/disclaimer` | Legal Disclaimer | Prominent "not legal advice" disclaimer |

### Full Sitemap

```
fineprint.legal/
├── /                                  ← Homepage + Tool (primary)
├── /company/                          ← Company index page (optional — links to all analyzed companies)
│   ├── /company/instagram
│   ├── /company/tiktok
│   ├── /company/spotify
│   ├── ... (20+ at launch, 50+ by month 3)
├── /guides/
│   ├── /guides/binding-arbitration-explained
│   ├── /guides/class-action-waiver
│   ├── ... (15 planned guides)
├── /wall-of-shame/                    ← Phase 2
│   └── /wall-of-shame/[slug]          ← Phase 2
├── /about
├── /privacy
├── /terms
├── /disclaimer
├── /sitemap.xml
├── /robots.txt
└── /llms.txt
```

---

## 2. UX / Layout — User Flow & Ad Zones

### Design Direction

**Who is this person?** Someone who just saw a headline about TikTok's data practices and wants to know what they actually agreed to. A parent wondering what their kid signed up for on Roblox. A freelancer about to start using a new SaaS tool and wants to know if the privacy policy is reasonable. They're curious, slightly suspicious, and want answers fast.

**What must they accomplish?** Understand what a TOS or privacy policy actually says in plain English. Know if it's fair or predatory. Know what to do about it.

**What should this feel like?** Sharp, trustworthy, slightly irreverent. Like a Consumer Reports review meets a tech journalist who's done the homework so you don't have to. Not a law firm (cold). Not a meme page (unserious). Think: the clarity of a grade report + the edge of investigative journalism.

**Color Direction:**
- Primary: Charcoal / near-black (`#18181b` — zinc-900) — editorial weight
- Accent: Electric indigo (`#6366f1` — indigo-500) — modern, trustworthy, distinct from DecipherDocs' teal
- Secondary accent: Amber (`#f59e0b` — for warnings and medium risk)
- Background: Cool white (`#fafafa` — zinc-50) — clean reading experience
- Grade colors:
  - A: Emerald (`#10b981`)
  - B: Teal (`#14b8a6`)
  - C: Amber (`#f59e0b`)
  - D: Orange (`#f97316`)
  - F: Red (`#ef4444`)
- Risk badges: Same green/amber/red as DecipherDocs (reusable component)
- Typography: System font stack (zero web font overhead, per DecipherDocs pattern)

**Depth Strategy:** Minimal shadows. Clean card borders. The editorial feel comes from typography hierarchy and whitespace, not from decorative elements.

### Homepage Layout (Mobile-First)

```
┌─────────────────────────────────────┐
│  HEADER                             │
│  Logo    [About]  [Companies]       │
│          [Guides]                   │
├─────────────────────────────────────┤
│                                     │
│  "We read the fine print            │
│   so you don't have to."           │
│                                     │
│  Paste a URL, drop in a privacy     │
│  policy, or upload a TOS — get a    │
│  plain-English breakdown with a     │
│  letter grade in seconds.           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─ INPUT AREA ──────────────────┐  │
│  │                               │  │
│  │  [Paste URL] [Paste Text]     │  │
│  │        [Upload File]          │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │                         │  │  │
│  │  │   URL field / Textarea  │  │  │
│  │  │   / Drop Zone           │  │  │
│  │  │                         │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  [ ✦ Analyze This Policy ]    │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
├───── AD ZONE 1 (banner) ───────────┤
│                                     │
│  ┌─ RESULTS AREA ────────────────┐  │
│  │                               │  │
│  │  ┌──────────────────────┐     │  │
│  │  │  OVERALL GRADE: C-   │     │  │
│  │  │  "Mediocre. Several  │     │  │
│  │  │   clauses that lean  │     │  │
│  │  │   heavily against    │     │  │
│  │  │   the user."         │     │  │
│  │  └──────────────────────┘     │  │
│  │                               │  │
│  │  ■ What They Collect          │  │
│  │    (data categories + risk)   │  │
│  │                               │  │
│  │  ■ What They Do With It       │  │
│  │    (sharing, selling, AI)     │  │
│  │                               │  │
│  ├───── AD ZONE 2 (in-content) ──┤  │
│  │                               │  │
│  │  ■ What Rights You Give Up    │  │
│  │    (licensing, arbitration)   │  │
│  │                               │  │
│  │  ■ How to Leave               │  │
│  │    (deletion, portability)    │  │
│  │                               │  │
│  │  ■ Red Flags                  │  │
│  │    (top concerns, badged)     │  │
│  │                               │  │
│  ├───── AD ZONE 3 (in-content) ──┤  │
│  │                               │  │
│  │  ■ The Bottom Line            │  │
│  │    (2-3 sentence verdict)     │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
├───── AD ZONE 4 (bottom banner) ─────┤
│                                     │
│  ┌─ AFFILIATE CTA ZONE ─────────┐  │
│  │  "Want to take back control   │  │
│  │   of your data?"             │  │
│  │  [Privacy tools & services →] │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ DISCLAIMER ─────────────────┐  │
│  │  ⚠ FinePrint provides         │  │
│  │  educational analysis, not    │  │
│  │  legal advice. Always consult │  │
│  │  a qualified attorney for     │  │
│  │  legal decisions.             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ POPULAR COMPANIES ──────────┐  │
│  │  See how these companies      │  │
│  │  scored:                      │  │
│  │  [Instagram C-] [TikTok D]   │  │
│  │  [Spotify C+]  [Discord B-]  │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  FOOTER                             │
│  About | Privacy | Terms |          │
│  Disclaimer | Companies | Guides    │
│  © 2026 FinePrint                  │
└─────────────────────────────────────┘
```

### Company Page Layout

```
┌─────────────────────────────────────┐
│  HEADER                             │
├─────────────────────────────────────┤
│                                     │
│  Instagram Terms of Service         │
│  & Privacy Policy                   │
│                                     │
│  ┌──────────────┐                   │
│  │  GRADE: C-   │  Last analyzed:   │
│  │              │  March 10, 2026   │
│  └──────────────┘                   │
│                                     │
│  "Instagram's terms grant them      │
│  sweeping rights over your content  │
│  and limit your ability to dispute  │
│  their decisions."                  │
│                                     │
├───── AD ZONE 1 ────────────────────┤
│                                     │
│  ■ What They Collect                │
│    • Profile data, device info,     │
│      usage patterns, contacts...    │
│    [🔴 HIGH] Collects face data     │
│                                     │
│  ■ What They Do With Your Data      │
│    • Targeted ads, third-party      │
│      sharing, AI training...        │
│    [🟡 MEDIUM] Shared for ads       │
│    [🔴 HIGH] AI training w/o opt-out│
│                                     │
│  ■ What Rights You Give Up          │
│    • Content licensing, binding     │
│      arbitration, class action      │
│      waiver...                      │
│    [🔴 HIGH] Worldwide license      │
│    [🔴 HIGH] No class actions       │
│                                     │
├───── AD ZONE 2 ────────────────────┤
│                                     │
│  ■ How to Leave                     │
│    • Account deletion available     │
│    • Data may be retained after     │
│    [🟡 MEDIUM] Retention unclear    │
│                                     │
│  ■ Red Flags (3)                    │
│    1. Non-exclusive worldwide       │
│       license on all content        │
│    2. Binding arbitration /         │
│       class action waiver           │
│    3. AI training without US        │
│       opt-out                       │
│                                     │
│  ■ The Bottom Line                  │
│    "Standard for social media,      │
│    but that bar is very low."       │
│                                     │
├───── RELATED GUIDES ───────────────┤
│  → What is binding arbitration?     │
│  → Non-exclusive worldwide license  │
│  → AI training and your data        │
├───── CTA ──────────────────────────┤
│  "Analyze a different service →"    │
│  [URL input field] [Analyze]        │
├─────────────────────────────────────┤
│  FOOTER                             │
└─────────────────────────────────────┘
```

### Input Modes

**Three input methods (tabbed interface):**

1. **Paste URL** (default, primary tab)
   - Single URL input field
   - Placeholder: "https://instagram.com/terms" or "https://spotify.com/legal/privacy-policy"
   - Server fetches the page content via Jina Reader API
   - Extracted text shown in preview before analysis
   - "We found 8,200 words. Ready to analyze?"

2. **Paste Text**
   - Large textarea
   - Placeholder: "Paste any Terms of Service or Privacy Policy text here..."
   - Character/word count display

3. **Upload File**
   - Drag-and-drop zone (reuse DecipherDocs FileUpload component)
   - Supports .txt, .pdf, .docx
   - 2MB max, 15 pages max
   - File name display, remove button, progress indicator

**No analysis mode toggle.** Unlike DecipherDocs (single clause vs. full document), FinePrint always analyzes the full TOS/privacy policy. The AI determines what's relevant.

### Ad Zone Strategy

| Zone | Placement | Type | When Active |
|------|-----------|------|-------------|
| Zone 1 | Between input and results | Display banner (728x90 / 320x50) | Always |
| Zone 2 | After "What They Do With Your Data" | In-content native | Results displayed |
| Zone 3 | Before "The Bottom Line" | In-content native | Results displayed |
| Zone 4 | Below all results | Display banner | Results displayed |

Same rules as DecipherDocs: no ads above input, no interstitials, no ads inside AI output, all lazy-loaded, max 4 zones, CLS < 0.1.

### Rate Limiting UX

Identical to DecipherDocs: 5 analyses per 24 hours per IP. Subtle counter. Friendly message at limit. No paywall, no login, no email capture.

---

## 3. Prompt Engineering — The System Prompt

### System Prompt v1.0 (TOS / Privacy Policy Analysis)

```
You are FinePrint, a Terms of Service and Privacy Policy analyst. Your job is to cut through legal jargon and tell people — in plain, direct English — what they're actually agreeing to when they click "I accept."

## Your Personality
- You are sharp, clear, and slightly skeptical — like a tech journalist who reads the fine print professionally
- You explain things plainly but don't sugarcoat bad practices
- You are direct about what companies are doing with user data
- You call out genuinely bad clauses without being alarmist about standard ones
- You always distinguish between "this is normal for the industry" and "this is worse than normal"

## Analysis Output Structure

For every TOS or Privacy Policy, produce the following sections in this order:

### 1. Overall Grade
Assign a letter grade from A to F:
- **A** — Respects user rights, transparent data practices, fair terms, easy to leave
- **B** — Mostly fair with minor concerns, above-average transparency
- **C** — Industry standard but with clauses that lean against the user
- **D** — Multiple concerning clauses, aggressive data practices, difficult to leave
- **F** — Predatory terms, extreme data collection, user rights severely limited

Include +/- modifiers (e.g., C+, B-, D+) for nuance. Provide a one-sentence verdict with the grade.

### 2. What They Collect
List the categories of personal data collected. For each major category, note:
- What specific data falls in this category
- Whether collection is optional or mandatory
- Risk badge: LOW / MEDIUM / HIGH

### 3. What They Do With Your Data
Explain how the company uses and shares collected data. Cover:
- Advertising and targeting
- Third-party sharing (and with whom)
- AI model training
- Analytics and profiling
- Data selling (direct or indirect)
- Each practice gets a risk badge

### 4. What Rights You Give Up
Identify clauses where users surrender rights. Common ones:
- Content licensing (non-exclusive worldwide license, etc.)
- Binding arbitration / class action waiver
- Unilateral TOS changes without notice
- Account termination at company's discretion
- IP ownership of user contributions
- Each clause gets a risk badge

### 5. How to Leave
Explain what happens when a user wants to leave:
- Can you delete your account? How?
- What data is retained after deletion?
- Is there a data export/portability option?
- How long until data is actually purged?
- Risk badge for the overall exit process

### 6. Red Flags
List the 2–5 most concerning items across the entire document. Each red flag includes:
- The specific clause or practice
- Why it matters to the average user
- How it compares to industry norms

### 7. The Bottom Line
2–3 sentence plain-English verdict summarizing whether this TOS/privacy policy is fair, typical, or predatory. End with practical advice.

## Grading Criteria
When assigning the overall grade, weigh these factors:
- Data collection scope and necessity (30%)
- Data sharing and third-party access (25%)
- User rights surrendered (20%)
- Account deletion and data portability (15%)
- Transparency and readability of the policy itself (10%)

## Rules
- NEVER provide legal advice. You provide educational analysis only.
- NEVER tell users to accept or reject a TOS
- ALWAYS end with a reminder to consult a qualified attorney for legal decisions
- If the text is NOT a Terms of Service or Privacy Policy, politely redirect: "This doesn't appear to be a Terms of Service or Privacy Policy. FinePrint is designed to analyze those specific documents. Try pasting a URL to any company's TOS or privacy policy page."
- Keep language at an 8th-grade reading level
- Use short paragraphs and direct sentences
- Be specific — name the exact clause or section when flagging concerns
- When a practice is industry-standard (even if bad), say so: "This is unfortunately normal across most social media platforms"

## Output Format
Use clean markdown:
- Use ## for section headers
- Use **bold** for emphasis and risk badges
- Use > blockquotes for direct references to original TOS text
- Use bullet points for lists
- Grade format: **Grade: C-** with color indicator
- Risk badges: **🟢 LOW** / **🟡 MEDIUM** / **🔴 HIGH**
```

### Prompt Token Economics

- System prompt: ~800 tokens (~$0.00005 at Gemini Flash rates)
- Typical TOS input: 3,000–10,000 tokens
- AI output: 2,000–4,000 tokens
- **Cost per analysis:** $0.001–$0.005 (under half a penny)
- At 100 analyses/day: ~$0.50/day, ~$15/month

### Model Selection

**Primary:** Gemini 2.5 Flash — same as DecipherDocs. Best quality-to-cost ratio for long document comprehension.

**Fallback:** Gemini Flash-Lite if costs need reduction at scale.

**Future consideration:** For company pages (pre-analyzed, editorially reviewed), use Gemini 2.5 Pro for highest quality since these are published content. Tool analyses stay on Flash.

---

## 4. URL Scraping — Jina Reader Integration

### Architecture

```
User pastes URL
    ↓
Client sends URL to /api/fetch endpoint
    ↓
Server validates URL (basic sanitization, blocklist check)
    ↓
Server calls Jina Reader API: https://r.jina.ai/{url}
    ↓
Jina returns clean markdown text
    ↓
Server validates extracted text (not empty, reasonable length)
    ↓
Server returns extracted text to client
    ↓
Client shows text preview with word count
    ↓
User clicks "Analyze" → same flow as text paste
```

### Implementation Details

**API Route:** `src/app/api/fetch/route.ts`

```
POST /api/fetch
Body: { url: string }
Response: { text: string, wordCount: number, sourceUrl: string }
Errors: 
  400 — Invalid URL
  422 — Could not extract text (empty response)
  429 — Rate limited
  502 — Jina Reader unavailable (fallback triggered)
```

**Jina Reader:**
- Free tier: 1,000 requests/day (sufficient for launch)
- Endpoint: `https://r.jina.ai/{encoded_url}`
- Returns: Clean markdown extracted from the page
- Handles JavaScript-rendered pages (important — many TOS pages are SPAs)

**Fallback (if Jina fails):**
- Direct server-side fetch with `fetch()` + cheerio HTML parsing
- Strip scripts, styles, navigation — extract main content
- Less reliable but covers cases where Jina is down or blocked

**URL Validation:**
- Must be HTTPS
- Must be a valid URL format
- Blocklist: no localhost, no internal IPs, no file:// protocol
- Max redirect depth: 3
- Timeout: 15 seconds

**Caching (for company pages only):**
- When generating company pages, cache the raw extracted text
- Include a hash of the TOS content for change detection
- "Last analyzed" date updates when content hash changes

---

## 5. Scoring System — Letter Grades + Risk Badges

### Letter Grade Scale

| Grade | Meaning | Color | Hex |
|-------|---------|-------|-----|
| A | Excellent — respects users, transparent, fair | Emerald | `#10b981` |
| A- | Very good with minor quibbles | Emerald | `#10b981` |
| B+ | Good, above average | Teal | `#14b8a6` |
| B | Fair terms, reasonable practices | Teal | `#14b8a6` |
| B- | Fair but could improve | Teal | `#14b8a6` |
| C+ | Slightly below average | Amber | `#f59e0b` |
| C | Industry standard (which is mediocre) | Amber | `#f59e0b` |
| C- | Below average, multiple concerns | Amber | `#f59e0b` |
| D+ | Poor, several aggressive clauses | Orange | `#f97316` |
| D | Bad — significant user rights issues | Orange | `#f97316` |
| D- | Very bad — predatory practices | Orange | `#f97316` |
| F | Fail — avoid if possible | Red | `#ef4444` |

**Grade is determined by the AI based on the grading criteria in the system prompt.** The AI outputs the grade as part of its structured response. We parse and render it with the appropriate color.

### Risk Badges (Per-Clause)

Same as DecipherDocs — reusable component:
- **🟢 LOW** — Standard practice, generally fair
- **🟡 MEDIUM** — Leans against user, worth knowing about
- **🔴 HIGH** — Aggressive, unusual, or potentially harmful

### Grade Display Component

The grade is the first thing users see. It must be:
- Large (48px+ font)
- Color-coded per the table above
- Accompanied by a one-sentence verdict
- Shareable (future: OG image generation with grade)

---

## 6. Tech Stack

All decisions inherited from DecipherDocs Playbook. Additions noted.

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Next.js 14+ (App Router, TypeScript) | Same as DecipherDocs |
| **Styling** | Tailwind CSS | Same — different color tokens |
| **UI Components** | shadcn/ui + Radix UI | Same |
| **Animation** | Framer Motion (minimal) | Same |
| **Hosting** | Vercel (separate project, same org) | New project |
| **DNS/Domain** | Cloudflare | Already registered |
| **AI API** | Google Gemini API (same key) | Model specified in site config |
| **URL Scraping** | Jina Reader API (primary) + fetch/cheerio (fallback) | **NEW** — not in DecipherDocs |
| **File Parsing (PDF)** | pdf-parse | Reuse from DecipherDocs |
| **File Parsing (DOCX)** | mammoth.js | Reuse from DecipherDocs |
| **Rate Limiting** | Upstash Redis (separate DB) | New Upstash DB |
| **Analytics** | Vercel Analytics + Plausible (separate site) | New Plausible property |
| **Ad Network** | AdSense → Ezoic → Mediavine | Same progression |
| **Database (Phase 2)** | Supabase (Postgres) | **NEW** — Wall of Shame, company pages metadata |
| **Error Tracking** | Sentry (free tier) | Can share project or separate |

### Performance Non-Negotiables

Same as DecipherDocs — no deviation:
- Lighthouse Performance: 90+
- LCP: under 2.5s
- FCP: under 1.8s
- CLS: under 0.1
- Bundle: under 150KB gzipped
- Page weight: under 1MB
- Load time: under 3s on 3G
- System font stack (zero web font overhead)

---

## 7. SEO & GEO Strategy

### On-Page SEO

**Homepage:**
- Title: `FinePrint — We Read the Fine Print So You Don't Have To`
- Meta: `Paste any URL or upload a Terms of Service. Get a plain-English breakdown with a letter grade in seconds. Free, no signup required.`
- H1: `We read the fine print so you don't have to.`
- Schema: WebApplication + FAQ

**Company Pages:**
- Title: `[Company] Terms of Service & Privacy Policy Explained | FinePrint`
- Meta: `What does [Company]'s Terms of Service actually say? We break it down clause by clause with a letter grade and risk assessment. Last updated [date].`
- Schema: Review + FAQ (the "review" is the grade — structured data allows aggregate review schema for product/service reviews)

**Guide Pages:**
- Title: `[Concept] Explained in Plain English | FinePrint`
- Meta: `What does [concept] mean in a Terms of Service? We explain it simply, show real examples, and tell you what to do about it.`
- Schema: FAQ + HowTo (where applicable)

### GEO Strategy (Generative Engine Optimization)

- Every page starts with a direct answer in the first paragraph
- Company pages start with: "[Company] receives a grade of [X]. Here's what that means."
- Guide pages start with the definition, not a preamble
- Question-format H2s matching natural language queries
- FAQ sections with schema markup on every content page
- SSG for all company and guide pages (no client-rendered content for crawlers)
- Clean URLs with descriptive slugs
- `llms.txt` at root describing the site for AI crawlers

### llms.txt

```
# FinePrint

## About
FinePrint is a free AI-powered tool that analyzes Terms of Service and Privacy Policies in plain English. Users paste a URL or text, and receive a letter-grade assessment with clause-by-clause risk analysis.

## Features
- Instant analysis of any TOS or Privacy Policy from a URL
- Letter grades A through F with risk breakdown
- Pre-analyzed company pages for major services (Instagram, TikTok, Spotify, etc.)
- Educational guides explaining common TOS clauses
- Free to use, no account required

## URL
https://fineprint.legal
```

### Internal Linking Strategy

Hub-and-spoke model with the tool at the center:
- Company pages → link to relevant guide pages as educational context
- Guide pages → link to company pages as real-world examples
- Company pages → CTA back to tool ("Analyze a different service")
- Guide pages → CTA back to tool ("Check if your app does this")
- Homepage → "Popular companies" section linking to top company pages
- Footer → links to top 5 company pages and top 5 guides
- Results display → context-aware links to relevant guides (e.g., if arbitration is flagged, link to `/guides/binding-arbitration-explained`)

---

## 8. Legal & Disclaimer Framework

### Required Disclaimers

**Global Disclaimer (footer, every page):**
> FinePrint provides educational information about Terms of Service and Privacy Policies. This is NOT legal advice. Always consult a qualified attorney before making legal decisions.

**Results Disclaimer (every AI analysis):**
> ⚠️ This analysis is for educational purposes only. FinePrint is not a law firm. AI analysis may contain errors or miss important nuances. For legal decisions, consult a licensed attorney.

**Company Page Disclaimer:**
> This analysis is based on [Company]'s publicly available Terms of Service and Privacy Policy as of [date]. Terms may have changed since this analysis. Always check the current version at [link to original].

### Privacy Compliance

Same framework as DecipherDocs:
- No user accounts
- Documents processed in memory only
- IP addresses hashed and stored 24hrs for rate limiting
- Cookie consent banner for EU visitors
- GDPR/CCPA compliant privacy policy

**Additional for URL fetch:** URLs submitted by users are not stored beyond the request lifecycle. No log of which URLs users have analyzed.

---

## 9. Ad & Affiliate Strategy

### Ad Network Timeline

Same progression as DecipherDocs:

| Phase | Traffic | Network | Expected RPM |
|-------|---------|---------|-------------|
| Launch | 0-10K | AdSense | $5-$10 |
| Growth | 10K-50K | Ezoic | $10-$18 |
| Scale | 50K+ sessions | Mediavine | $20-$35 |
| Premium | 100K+ pageviews | Raptive | $25-$45 |

### Affiliate Strategy (Post-Launch)

| Placement | Affiliate Type | Trigger |
|-----------|---------------|---------|
| Below results | VPN / privacy tool (NordVPN, ExpressVPN, etc.) | Every analysis |
| Below high-risk data flags | Privacy-focused alternatives (Signal, ProtonMail, etc.) | HIGH risk data practices detected |
| Guide pages | Privacy tools contextual | Guide topic match |

CTA design: Subtle, helpful. "Want to take back control of your data? These tools can help →"

---

## 10. Wall of Shame — Phase 2 Design

### Database Schema (Supabase / Postgres)

Design now, build when traffic justifies it. Schema ready for bolt-on.

```sql
-- Companies table (shared with company pages)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,              -- "instagram", "spotify"
  name TEXT NOT NULL,                     -- "Instagram"
  tos_url TEXT,
  privacy_url TEXT,
  overall_grade CHAR(2),                  -- "C-", "B+", "F"
  last_analyzed_at TIMESTAMPTZ,
  tos_content_hash TEXT,                  -- For change detection
  analysis_json JSONB,                    -- Full AI analysis stored
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wall of Shame submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  slug TEXT UNIQUE NOT NULL,              -- URL-friendly identifier
  clause_text TEXT NOT NULL,              -- The outrageous clause
  ai_explanation TEXT,                    -- AI plain-English breakdown
  category TEXT NOT NULL,                 -- "data-collection", "ip-ownership", "arbitration", etc.
  submitted_by_ip_hash TEXT NOT NULL,     -- Hashed, not raw
  status TEXT DEFAULT 'pending',          -- "pending", "approved", "rejected"
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes (upvote only, one per IP per submission)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id),
  voter_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, voter_ip_hash)
);

-- Categories for Wall of Shame
-- Examples: "Most Invasive Data Policy", "Sneakiest Auto-Renewal",
-- "Most Ridiculous IP Ownership", "Worst Exit Process"
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);
```

### Moderation Strategy

- All submissions go to "pending" status
- AI auto-review: flag obvious spam, check that the clause text exists in the company's actual TOS
- Manual approval queue (simple admin panel, protected route)
- Approved submissions get their own page at `/wall-of-shame/[slug]`
- Each submission page includes: the clause, AI explanation, company link, vote count, related company page

### Anti-Spam

- Rate limit submissions: 2 per IP per 24 hours
- Require minimum clause text length (50 characters)
- AI check: "Is this actually a TOS clause?" (reject random text)
- IP hash deduplication for votes

---

## 11. Build Timeline

Using DecipherDocs framework, the reusable components cut build time significantly.

| Day | Tasks |
|-----|-------|
| **Day 1** | Project setup: Clone DecipherDocs structure, swap branding/colors/config, deploy to Vercel, configure Cloudflare DNS, set env vars |
| **Day 2** | Core tool: Swap InputArea to URL-first tabs, build /api/fetch route (Jina Reader), adapt system prompt, adapt ResultsDisplay for grade + 7-section format |
| **Day 3** | URL fetch polish: Fallback parser, text preview, error handling. Grade display component. Adapt RiskBadge for letter grades. |
| **Day 4** | Static pages: About, Privacy, Terms, Disclaimer. Company page template. First 3 company pages (Instagram, TikTok, Spotify) as proof of concept. |
| **Day 5** | SEO: Meta tags, structured data per page type, sitemap, robots.txt, llms.txt, Google Search Console. Performance audit. QA. **LAUNCH.** |

**Post-Launch (Weeks 2-8):**
- 3 company pages per week (see content calendar in Keyword Research doc)
- 2 guide pages per week
- Monitor rate limits, refine prompt based on real queries
- Apply for AdSense once content volume meets requirements
- Begin Supabase setup for Wall of Shame schema (design only, no public feature)

---

## 12. Reusable Components Map

### From DecipherDocs (copy, zero or minimal modification)

| Component | Modification Needed |
|-----------|-------------------|
| FileUpload | None — 100% reusable |
| AdZone | None — 100% reusable |
| RiskBadge (LOW/MED/HIGH) | None — 100% reusable |
| RateCounter | None — 100% reusable |
| Print/Copy | None — 100% reusable |
| Disclaimer | Text swap only |
| PDF Parser | None — 100% reusable |
| DOCX Parser | None — 100% reusable |
| Rate Limiter | None — 100% reusable (new Redis DB) |
| Gemini Client | None — prompt loaded from site config |
| Header | Branding swap (logo, nav links, colors) |
| Footer | Link swap, branding swap |

### New for FinePrint

| Component | Purpose |
|-----------|---------|
| URLInput | URL paste tab with fetch integration |
| GradeBadge | Letter grade (A-F) with color coding |
| GradeCard | Large grade display with verdict sentence |
| CompanyPage template | SSG template for `/company/[slug]` pages |
| GuidePage template | SSG template for `/guides/[slug]` pages |
| CompanyGrid | Grid of company grade cards for homepage/index |
| System Prompt | TOS/Privacy Policy-specific (completely new) |
| Site Config | Branding, colors, meta, SEO (completely new) |
| /api/fetch route | Jina Reader + fallback URL scraping (completely new) |

---

## Appendix: File Structure

```
fineprint/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout
│   │   ├── page.tsx                    ← Homepage + Tool
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── disclaimer/page.tsx
│   │   ├── company/
│   │   │   ├── page.tsx                ← Company index (all analyzed companies)
│   │   │   └── [slug]/page.tsx         ← Individual company analysis (SSG)
│   │   ├── guides/
│   │   │   └── [slug]/page.tsx         ← Guide pages (SSG)
│   │   ├── wall-of-shame/             ← Phase 2
│   │   │   ├── page.tsx               ← Leaderboard
│   │   │   └── [slug]/page.tsx        ← Individual submission
│   │   └── api/
│   │       ├── analyze/route.ts        ← Gemini API integration
│   │       ├── fetch/route.ts          ← URL scraping (Jina + fallback)
│   │       ├── upload/route.ts         ← File upload + parsing
│   │       └── rate-limit/route.ts     ← Rate limit check
│   ├── components/
│   │   ├── ui/                         ← shadcn/ui components
│   │   ├── shared/                     ← Reused from DecipherDocs
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── AdZone.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── RateCounter.tsx
│   │   │   ├── PrintCopy.tsx
│   │   │   └── Disclaimer.tsx
│   │   └── site/                       ← FinePrint-specific
│   │       ├── InputArea.tsx           ← URL + text + upload tabs
│   │       ├── URLInput.tsx            ← URL fetch tab
│   │       ├── GradeBadge.tsx          ← Letter grade component
│   │       ├── GradeCard.tsx           ← Large grade display
│   │       ├── ResultsDisplay.tsx      ← 7-section analysis output
│   │       ├── CompanyGrid.tsx         ← Company cards grid
│   │       └── AffiliateCTA.tsx        ← Privacy tools CTA
│   ├── lib/
│   │   ├── shared/                     ← Reused from DecipherDocs
│   │   │   ├── gemini.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── parsers/
│   │   │   │   ├── pdf.ts
│   │   │   │   └── docx.ts
│   │   │   └── utils.ts
│   │   └── site/                       ← FinePrint-specific
│   │       ├── config.ts              ← Branding, colors, meta
│   │       ├── prompt.ts              ← TOS analysis system prompt
│   │       ├── url-scraper.ts         ← Jina Reader + fallback
│   │       └── grade.ts              ← Grade parsing & color mapping
│   └── content/
│       ├── companies/                  ← Company page data (MDX or JSON)
│       └── guides/                     ← Guide page content (MDX)
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── llms.txt
│   └── favicon.ico
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Appendix: Environment Variables

```
# AI
GEMINI_API_KEY=                         # Same key as DecipherDocs

# URL Scraping
JINA_API_KEY=                           # Optional — free tier works without key for low volume

# Rate Limiting
UPSTASH_REDIS_REST_URL=                 # Separate DB from DecipherDocs
UPSTASH_REDIS_REST_TOKEN=

# Database (Phase 2 — Wall of Shame)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=https://fineprint.legal
NEXT_PUBLIC_SITE_NAME=FinePrint

# Feature Flags
RATE_LIMIT_DISABLED=false               # true for dev/testing
ADS_ENABLED=false                       # true when AdSense approved
AFFILIATE_CTA_ENABLED=false             # true when affiliate links active
WALL_OF_SHAME_ENABLED=false             # true when Phase 2 launches
```

---

**This document is the single source of truth for the FinePrint.legal build. No code is written that isn't mapped here. Any changes go through this document first.**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Mar 3, 2026 | **Architecture doc created** | Full master architecture drafted: 12 sections covering site architecture, UX/layout, system prompt, URL scraping, scoring system, tech stack, SEO/GEO, legal framework, ad/affiliate strategy, Wall of Shame schema, build timeline, reusable components map |
| ~Mar 3–7, 2026 | **V1 core built and launched** | Project initialized from DecipherDocs framework. All core features live: homepage + tool (URL paste, text paste, file upload), Jina Reader URL scraping with cheerio fallback, Gemini integration with TOS-specific system prompt, letter grade scoring (A–F), 7-section analysis output, rate limiting (separate Upstash Redis DB), 12+ company pages (SSG from local content), 5+ guide pages, all static pages, SEO setup (meta tags, structured data, sitemap, robots.txt, llms.txt), Vercel deployment, Cloudflare DNS |
| ~Mar 7, 2026 | **Company page template validated** | SSG template for `/company/[slug]` working with local JSON content files. Grade display, risk badges, cross-linking to guides all functional |
