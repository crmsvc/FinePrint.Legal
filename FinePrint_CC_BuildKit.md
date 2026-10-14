# FinePrint.legal — Claude Code Build Kit

## READ THIS FIRST

This is the complete build kit for FinePrint.legal, an AI-powered Terms of Service and Privacy Policy analyzer. Every architectural decision has been made. Every design choice is locked. Your job is execution — follow this document sequentially, check off each task, and do not deviate from the architecture without explicit approval.

**Reference Documents:**
- `FinePrint_Architecture_v1.md` — Master architecture (pages, URLs, UX, prompts, scoring, tech stack, SEO, Wall of Shame schema)
- `FinePrint_Keyword_Research.md` — Competitive analysis, keyword targets, URL structure, content calendar
- `DecipherDocs_Architecture_v1.md` — Reference for shared patterns inherited from sister site
- `DecipherDocs_CC_BuildKit.md` — Reference for reusable component specifications
- This file — Step-by-step build checklist with implementation details

**Design Standards (Non-Negotiable — inherited from DecipherDocs):**
- Framework: Next.js 14+ App Router with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui + Radix UI
- Animation: Framer Motion (minimal — subtle transitions only)
- Hosting: Vercel
- Performance: Lighthouse 90+, LCP < 2.5s, FCP < 1.8s, CLS < 0.1, bundle < 150KB gzipped, page weight < 1MB, load < 3s on 3G

**Build Approach:**
This site is built ON TOP of the DecipherDocs framework. The modular architecture means most shared components copy over with zero modification. The build focuses on:
1. Copying and configuring the reusable framework (Day 1)
2. Building the three NEW features: URL fetch, letter grades, 7-section results (Days 2-3)
3. Content pages and company page template (Day 4)
4. SEO, polish, and launch (Day 5)

**Component Sources:**
- `COPY` = Copy directly from DecipherDocs, zero modification
- `ADAPT` = Copy from DecipherDocs, swap branding/text/config
- `NEW` = Build from scratch for FinePrint

---

## BUILD CHECKLIST

### Phase 1: Project Setup & Framework Clone (Day 1)

#### 1A: Project Initialization

- [ ] **1.1** Initialize Next.js 14+ project with TypeScript and App Router
  ```bash
  npx create-next-app@latest fineprint --typescript --tailwind --eslint --app --src-dir
  ```

- [ ] **1.2** Install core dependencies
  ```bash
  # Same as DecipherDocs
  npm install @radix-ui/react-slot @radix-ui/react-tabs class-variance-authority clsx tailwind-merge
  npm install framer-motion
  npm install @google/generative-ai
  npm install pdf-parse mammoth
  npm install @upstash/redis @upstash/ratelimit
  npm install lucide-react
  npm install -D @types/pdf-parse

  # NEW for FinePrint — URL scraping fallback
  npm install cheerio
  npm install -D @types/cheerio
  ```

- [ ] **1.3** Initialize shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
  Add components: button, card, badge, tabs, textarea, dialog, separator, toast, input

- [ ] **1.4** Set up project structure
  ```
  src/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── about/page.tsx
  │   ├── privacy/page.tsx
  │   ├── terms/page.tsx
  │   ├── disclaimer/page.tsx
  │   ├── company/
  │   │   ├── page.tsx                  ← Company index
  │   │   └── [slug]/page.tsx           ← Individual company (SSG)
  │   ├── guides/
  │   │   └── [slug]/page.tsx           ← Guide pages (SSG)
  │   └── api/
  │       ├── analyze/route.ts
  │       ├── fetch/route.ts            ← NEW: URL scraping
  │       ├── upload/route.ts
  │       └── rate-limit/route.ts
  ├── components/
  │   ├── ui/                           ← shadcn
  │   ├── shared/                       ← COPIED from DecipherDocs
  │   └── site/                         ← NEW for FinePrint
  ├── lib/
  │   ├── shared/                       ← COPIED from DecipherDocs
  │   └── site/                         ← NEW for FinePrint
  └── content/
      ├── companies/                    ← Company page data
      └── guides/                       ← Guide page content
  ```

- [ ] **1.5** Configure environment variables (.env.local)
  ```
  # AI
  GEMINI_API_KEY=                         # Same key as DecipherDocs

  # URL Scraping
  JINA_API_KEY=                           # Optional for free tier

  # Rate Limiting (SEPARATE DB from DecipherDocs)
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=

  # Site
  NEXT_PUBLIC_SITE_URL=https://fineprint.legal
  NEXT_PUBLIC_SITE_NAME=FinePrint

  # Feature Flags
  RATE_LIMIT_DISABLED=true               # true during dev
  ADS_ENABLED=false
  AFFILIATE_CTA_ENABLED=false
  WALL_OF_SHAME_ENABLED=false
  ```

- [ ] **1.6** Deploy to Vercel
  - Create NEW Vercel project (same org as DecipherDocs)
  - Connect GitHub repo
  - Add custom domain: fineprint.legal
  - Configure Cloudflare DNS to point to Vercel
  - Set environment variables in Vercel dashboard

#### 1B: Copy Reusable Components from DecipherDocs

- [ ] **1.7** `COPY` — File upload component → `src/components/shared/FileUpload.tsx`
  - Drag-and-drop, click-to-browse, type/size validation
  - Zero modification needed

- [ ] **1.8** `COPY` — Ad zone component → `src/components/shared/AdZone.tsx`
  - Lazy-loaded, CLS-safe, env toggle
  - Zero modification needed

- [ ] **1.9** `COPY` — Risk badge component → `src/components/shared/RiskBadge.tsx`
  - LOW/MEDIUM/HIGH color-coded badges
  - Zero modification needed (used for per-clause risk within results)

- [ ] **1.10** `COPY` — Rate counter component → `src/components/shared/RateCounter.tsx`
  - "X of 5 remaining" display
  - Zero modification needed

- [ ] **1.11** `COPY` — Print/Copy component → `src/components/shared/PrintCopy.tsx`
  - Rich text clipboard + print stylesheet
  - Zero modification needed

- [ ] **1.12** `COPY` — PDF parser → `src/lib/shared/parsers/pdf.ts`
  - pdf-parse text extraction, scanned detection, page limit
  - Zero modification needed

- [ ] **1.13** `COPY` — DOCX parser → `src/lib/shared/parsers/docx.ts`
  - mammoth.js text extraction
  - Zero modification needed

- [ ] **1.14** `COPY` — Rate limiter → `src/lib/shared/rate-limit.ts`
  - Upstash sliding window, 5/24hr, IP hash
  - Zero modification needed (connects to NEW Redis DB via env vars)

- [ ] **1.15** `COPY` — Gemini API client → `src/lib/shared/gemini.ts`
  - Client initialization, response parsing, error handling
  - Zero modification needed (loads prompt from site config)

- [ ] **1.16** `COPY` — Upload API route → `src/app/api/upload/route.ts`
  - Multipart form handling, file validation, parser routing
  - Zero modification needed

#### 1C: Configure Site-Specific Branding

- [ ] **1.17** Configure Tailwind theme with FinePrint design tokens
  ```
  Colors (per Architecture doc Section 2):
  - primary: zinc-900 (#18181b) — editorial weight
  - accent: indigo-500 (#6366f1) — modern trust
  - secondary-accent: amber-500 (#f59e0b) — warnings
  - background: zinc-50 (#fafafa) — clean
  - surface: white with subtle border

  Grade colors:
  - grade-a: emerald-500 (#10b981)
  - grade-b: teal-500 (#14b8a6)
  - grade-c: amber-500 (#f59e0b)
  - grade-d: orange-500 (#f97316)
  - grade-f: red-500 (#ef4444)

  Risk badges (same as DecipherDocs):
  - risk-low: emerald/green
  - risk-medium: amber/yellow
  - risk-high: red
  ```

- [ ] **1.18** Create site config → `src/lib/site/config.ts`
  ```typescript
  export const siteConfig = {
    name: "FinePrint",
    tagline: "We read the fine print so you don't have to.",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    description: "Paste any URL or upload a Terms of Service. Get a plain-English breakdown with a letter grade in seconds.",
    // Grade color mapping
    gradeColors: {
      A: { bg: '#10b981', text: '#ffffff' },
      B: { bg: '#14b8a6', text: '#ffffff' },
      C: { bg: '#f59e0b', text: '#000000' },
      D: { bg: '#f97316', text: '#ffffff' },
      F: { bg: '#ef4444', text: '#ffffff' },
    }
  };
  ```

- [ ] **1.19** `ADAPT` — Header component → `src/components/shared/Header.tsx`
  - Swap logo text: "FinePrint" in primary weight
  - Swap nav links: About, Companies, Guides
  - Apply new color tokens (zinc-900 primary, indigo-500 accent)
  - Keep: mobile hamburger, sticky on scroll, subtle shadow

- [ ] **1.20** `ADAPT` — Footer component → `src/components/shared/Footer.tsx`
  - Swap links: About, Privacy, Terms, Disclaimer, Companies, Guides
  - Swap copyright: "© 2026 FinePrint"
  - Apply new color tokens
  - Keep: global disclaimer text area, rate counter display area

- [ ] **1.21** `ADAPT` — Disclaimer component → `src/components/shared/Disclaimer.tsx`
  - Swap text: "FinePrint provides educational information about Terms of Service and Privacy Policies. This is NOT legal advice."

- [ ] **1.22** Create base layout → `src/app/layout.tsx`
  - HTML lang="en"
  - System font stack (zero web fonts)
  - Meta viewport
  - Favicon (FinePrint-specific)
  - Analytics script placeholders (lazy loaded)
  - Header + Footer wrapping children
  - Global disclaimer

---

### Phase 2: Core Tool — URL Fetch + Analysis Engine (Day 2)

This is the biggest delta from DecipherDocs. Three new capabilities: URL fetching, letter grade scoring, and the 7-section output format.

#### 2A: URL Scraping

- [ ] **2.1** `NEW` — Build URL scraper utility → `src/lib/site/url-scraper.ts`
  - Primary: Jina Reader API
    ```
    Endpoint: https://r.jina.ai/{encoded_url}
    Method: GET
    Headers: { Accept: "text/markdown" }
    Returns: Clean markdown text
    ```
  - Fallback: Direct fetch + cheerio parsing
    - fetch URL server-side with 15s timeout
    - Max 3 redirects
    - Parse HTML with cheerio
    - Extract main content (strip nav, header, footer, scripts, styles)
    - Return plain text
  - URL validation:
    - Must be HTTPS
    - Valid URL format
    - Not localhost, internal IP, or file:// protocol
  - Error handling:
    - Jina timeout → try fallback
    - Jina empty response → try fallback
    - Both fail → return clear error message
    - Blocked by robots.txt → inform user

- [ ] **2.2** `NEW` — Build fetch API route → `src/app/api/fetch/route.ts`
  ```
  POST /api/fetch
  Body: { url: string }
  
  Validation:
  - URL is present and valid HTTPS
  - URL is not on blocklist
  
  Flow:
  1. Validate URL
  2. Call url-scraper (Jina primary, fetch+cheerio fallback)
  3. Validate extracted text (not empty, > 100 words)
  4. Return { text, wordCount, sourceUrl }
  
  Errors:
  - 400: Invalid or blocked URL
  - 422: Could not extract text
  - 429: Rate limited (check BEFORE fetch)
  - 502: Both Jina and fallback failed
  - 504: Timeout
  ```

- [ ] **2.3** `NEW` — Build URLInput component → `src/components/site/URLInput.tsx`
  - Single URL input field with placeholder: "https://instagram.com/terms"
  - "Fetch" button triggers /api/fetch
  - Loading state: "Fetching terms from [domain]..."
  - Success: Show text preview with word count
    - "We found 8,200 words from instagram.com. Ready to analyze?"
    - Scrollable preview area (max-height, overflow)
    - "Analyze This Policy" button
  - Error states:
    - Invalid URL: inline validation message
    - Fetch failed: "We couldn't read that page. Try pasting the text directly instead."
    - Empty content: "That page didn't contain readable text. Try the text paste tab."

#### 2B: System Prompt & Analysis

- [ ] **2.4** `NEW` — Create system prompt → `src/lib/site/prompt.ts`
  - Full system prompt as defined in Architecture doc Section 3
  - Exported as const
  - Single function: `analyzeTOS(text: string)` — no mode toggle (always full analysis)
  - Prompt instructs AI to output structured sections:
    1. Overall Grade (A–F with +/- modifiers)
    2. What They Collect
    3. What They Do With Your Data
    4. What Rights You Give Up
    5. How to Leave
    6. Red Flags
    7. The Bottom Line

- [ ] **2.5** `ADAPT` — Build analyze API route → `src/app/api/analyze/route.ts`
  - POST endpoint
  - Accept: `{ text: string }` (no mode parameter — always full analysis)
  - Validate input (not empty, within token limits — 15,000 word max)
  - Check rate limit BEFORE calling Gemini
  - Call Gemini with FinePrint system prompt
  - Parse response: extract grade, sections, risk badges
  - Return structured response
  - Error responses with appropriate HTTP codes
  - **Prompt injection defense:** Instruction in system prompt to ignore text that appears to be AI instructions/system prompts embedded in the TOS

- [ ] **2.6** `NEW` — Build grade parser → `src/lib/site/grade.ts`
  - Parse AI output to extract letter grade
  - Map grade to color per config
  - Handle edge cases: grade not present, invalid format
  - Export: `parseGrade(text: string): { grade: string, modifier: string, color: string }`
  - Grade regex: matches A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F

#### 2C: Results Display

- [ ] **2.7** `NEW` — Build GradeBadge component → `src/components/site/GradeBadge.tsx`
  - Small inline badge showing letter grade
  - Color-coded per grade (A=emerald, B=teal, C=amber, D=orange, F=red)
  - Used in company cards and inline references

- [ ] **2.8** `NEW` — Build GradeCard component → `src/components/site/GradeCard.tsx`
  - Large display card (hero-level prominence at top of results)
  - Grade letter at 48px+ with color background
  - One-sentence verdict below grade
  - "Last analyzed: [date]" for company pages
  - Shareable feel — this is the screenshot users post on social media

- [ ] **2.9** `NEW` — Build ResultsDisplay component → `src/components/site/ResultsDisplay.tsx`
  - Renders ALL seven sections from the AI output in order:
  
  **Section 1: Overall Grade**
  - GradeCard component at top
  - Most prominent element in results
  
  **Section 2: What They Collect**
  - Data categories in card format
  - Each category has: description, optional/mandatory indicator, risk badge
  - Color-coded left border per risk level
  
  **Section 3: What They Do With Your Data**
  - Practices listed with risk badges
  - AI training, ad targeting, third-party sharing each called out
  - HIGH risk items get red callout box
  
  **Section 4: What Rights You Give Up**
  - Clause cards with original text in blockquote (gray bg)
  - "This means:" plain English translation
  - Risk badge per clause
  - Common items: content licensing, arbitration, class action waiver, TOS changes
  
  **Section 5: How to Leave**
  - Account deletion process
  - Data retention after deletion
  - Data portability options
  - Overall exit difficulty rating
  
  **Section 6: Red Flags**
  - Top 2-5 concerns in prominent red-bordered cards
  - Each: specific clause, why it matters, industry comparison
  - This section only appears if there are HIGH risk items
  
  **Section 7: The Bottom Line**
  - 2-3 sentence verdict in slightly larger text
  - Practical advice
  - Disclaimer appended
  
  **Below results:**
  - Print/Copy buttons
  - Rate counter
  - Related guides links (context-aware — if arbitration flagged, link to arbitration guide)
  - Affiliate CTA zone (hidden by default)
  - Ad zones per architecture layout

- [ ] **2.10** `NEW` — Build non-TOS input handling
  - If AI detects input is NOT a TOS/Privacy Policy:
  - Show friendly redirect message (no grade, no sections)
  - "This doesn't appear to be a Terms of Service or Privacy Policy. Try pasting a URL to any company's TOS page."
  - Do NOT render the grade card or section template for non-legal content
  - Do NOT count against rate limit

#### 2D: Input Area Assembly

- [ ] **2.11** `NEW` — Build InputArea component → `src/components/site/InputArea.tsx`
  - Three-tab interface: **"Paste URL"** (default) | "Paste Text" | "Upload File"
  
  **Tab 1: Paste URL** (default, primary)
  - URLInput component
  - This is the first thing users see
  
  **Tab 2: Paste Text**
  - Textarea with placeholder: "Paste any Terms of Service or Privacy Policy text here..."
  - Word count display
  - "Analyze This Policy" button
  
  **Tab 3: Upload File**
  - FileUpload component (copied from DecipherDocs)
  - Supports .txt, .pdf, .docx
  - After parsing → text populates preview, user reviews before analysis
  
  **Shared across tabs:**
  - "✦ Analyze This Policy" submit button (consistent label)
  - Loading state with animated indicator during fetch or analysis
  - Clear/reset button
  - All three tabs funnel to the same /api/analyze endpoint

---

### Phase 3: Homepage, Static Pages & Company Template (Day 3)

#### 3A: Homepage

- [ ] **3.1** Build homepage → `src/app/page.tsx`
  - Hero section:
    - H1: "We read the fine print so you don't have to."
    - Subtitle: "Paste a URL, drop in a privacy policy, or upload a TOS — get a plain-English breakdown with a letter grade in seconds."
  - InputArea component (URL tab default)
  - Ad Zone 1 placeholder (between input and results)
  - ResultsDisplay component (hidden until analysis complete)
  - Ad Zones 2-4 (within and below results)
  - Affiliate CTA zone (hidden by default)
  - "Popular Companies" section below tool:
    - Grid of 6-8 company cards with grades
    - Links to `/company/[slug]` pages
    - Only appears once company pages exist
  - Trust signals section:
    - "Free, no account required"
    - "We don't store your documents"
    - "AI-powered analysis in seconds"

#### 3B: Static Pages

- [ ] **3.2** Build About page → `src/app/about/page.tsx`
  - What FinePrint does
  - How it works (AI analyzes TOS, grades it, explains in plain English)
  - Who it's for (everyone who clicks "I agree" without reading)
  - Trust signals: "We don't store your documents" / "No account required" / "URLs are not logged"
  - Note about URL fetching: "We fetch the public text of the TOS page — the same content any visitor would see"
  - Link to disclaimer

- [ ] **3.3** Build Privacy Policy page → `src/app/privacy/page.tsx`
  - GDPR/CCPA compliant
  - Key points:
    - No user accounts collected
    - Documents and URLs processed in memory only, never stored
    - URLs submitted by users are not logged beyond the request lifecycle
    - IP addresses hashed and stored 24hrs for rate limiting only
    - Analytics cookies (Plausible — cookieless option)
    - Ad network cookies (when active)
  - Cookie consent banner for EU visitors

- [ ] **3.4** Build Terms of Service page → `src/app/terms/page.tsx`
  - Service provided "as-is"
  - Not a substitute for legal advice
  - User responsible for how they use information
  - Right to rate-limit or restrict abusive usage
  - No liability for AI accuracy
  - URL fetching: FinePrint accesses publicly available TOS pages on the user's behalf

- [ ] **3.5** Build Disclaimer page → `src/app/disclaimer/page.tsx`
  - "FinePrint is NOT a law firm"
  - "This tool does NOT provide legal advice"
  - "Always consult a qualified attorney"
  - "AI analysis may contain errors or miss important nuances"
  - "Letter grades are AI-generated assessments, not legal opinions"
  - "Company analyses are based on publicly available terms as of the analysis date"
  - Link to this page from every results display and every company page

#### 3C: Company Page Template

- [ ] **3.6** `NEW` — Build company page template → `src/app/company/[slug]/page.tsx`
  - SSG (Static Site Generation) — pages built at build time
  - Data source: `src/content/companies/[slug].json` or MDX
  - Layout per Architecture doc Section 2 (Company Page Layout):
    - Company name + "Terms of Service & Privacy Policy" as H1
    - GradeCard with "Last analyzed: [date]"
    - Full 7-section analysis (same ResultsDisplay component, pre-populated)
    - Related guides section (cross-links to `/guides/` pages)
    - CTA: "Analyze a different service →" with inline URL input
    - Ad zones
    - Disclaimer
  - Meta tags per Architecture doc Section 7:
    - Title: `[Company] Terms of Service & Privacy Policy Explained | FinePrint`
    - Description: `What does [Company]'s Terms of Service actually say? We break it down with a letter grade and risk assessment. Last updated [date].`
  - Structured data: Review + FAQ schema (JSON-LD)
  - Canonical URL: `https://fineprint.legal/company/[slug]`

- [ ] **3.7** `NEW` — Build company index page → `src/app/company/page.tsx`
  - Grid of all analyzed companies
  - Each card: company name, grade badge, one-line verdict, "Last analyzed" date
  - Sorted by: alphabetical or by grade (toggle)
  - Links to individual company pages
  - CTA at top: "Don't see your company? Analyze any TOS →" linking to homepage

- [ ] **3.8** `NEW` — Build CompanyGrid component → `src/components/site/CompanyGrid.tsx`
  - Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
  - Card per company: name, GradeBadge, one-line verdict
  - Click → navigates to `/company/[slug]`
  - Reused on homepage ("Popular Companies") and company index

- [ ] **3.9** Create first 3 company analyses as proof of concept
  - Run the FinePrint analysis on:
    1. Instagram TOS + Privacy Policy
    2. TikTok TOS + Privacy Policy
    3. Spotify TOS + Privacy Policy
  - Store results as JSON in `src/content/companies/`
  - Each file: `{ slug, name, grade, verdict, lastAnalyzed, analysis: { ...7 sections } }`
  - These validate the entire pipeline: URL fetch → analysis → company page rendering

#### 3D: Guide Page Template (Shell Only for Launch)

- [ ] **3.10** `NEW` — Build guide page template → `src/app/guides/[slug]/page.tsx`
  - SSG from MDX files in `src/content/guides/`
  - Layout: article format with:
    - H1 from frontmatter
    - Body content (MDX rendered)
    - FAQ section at bottom (schema markup)
    - Related company pages sidebar/section
    - CTA: "Check if your favorite app does this →" with inline URL input
    - Ad zones
  - Meta tags per Architecture doc
  - Structured data: FAQ + HowTo schema

- [ ] **3.11** Create 1 guide page as proof of concept
  - Topic: "What Does Non-Exclusive Worldwide License Mean?" (links well to Instagram company page)
  - 800-1,200 words
  - Demonstrates: MDX rendering, FAQ schema, cross-linking to company pages

---

### Phase 4: Rate Limiting, SEO & Polish (Day 4)

#### 4A: Rate Limiting

- [ ] **4.1** Set up NEW Upstash Redis database
  - Create new database (separate from DecipherDocs)
  - Add credentials to .env.local and Vercel env vars
  - Verify RATE_LIMIT_DISABLED=false for production

- [ ] **4.2** Integrate rate limiting into BOTH API routes
  - `/api/analyze` — check before Gemini call
  - `/api/fetch` — check before URL scraping (prevents abuse of the scraper)
  - Rate limit key: hashed IP address
  - Both endpoints share the same 5/24hr limit
  - A fetch + analyze counts as ONE use (track via session, not per-endpoint)

- [ ] **4.3** Handle rate limit edge cases
  - Failed URL fetch (Jina/cheerio error): do NOT count against limit
  - Non-TOS content detected by AI: do NOT count against limit
  - Scanned PDF detected: do NOT count against limit
  - Only successful analyses decrement the counter

#### 4B: SEO Setup

- [ ] **4.4** Configure meta tags for all page types
  - Homepage: per Architecture doc Section 7
  - Company pages: dynamic title/description from company data
  - Guide pages: dynamic title/description from MDX frontmatter
  - Static pages (About, Privacy, Terms, Disclaimer): unique per page
  - OG image: placeholder for v1, generate per-company later

- [ ] **4.5** Create robots.txt → `public/robots.txt`
  ```
  User-agent: *
  Allow: /
  Disallow: /api/

  Sitemap: https://fineprint.legal/sitemap.xml
  ```

- [ ] **4.6** Create dynamic sitemap → `src/app/sitemap.ts`
  - Include all static pages
  - Include all company pages (from content directory)
  - Include all guide pages (from content directory)
  - lastmod dates from content metadata
  - Priority: homepage 1.0, company pages 0.9, guides 0.8, static 0.5

- [ ] **4.7** Create llms.txt → `public/llms.txt`
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

- [ ] **4.8** Add structured data (JSON-LD) per page type
  - Homepage: WebApplication schema
  - Company pages: Review schema (grade as rating) + FAQ schema
  - Guide pages: FAQ schema + HowTo schema (where applicable)
  - All pages: Organization schema
  - Validate with Google's Rich Results Test

- [ ] **4.9** Configure canonical URLs on all pages

- [ ] **4.10** Set up Google Search Console
  - Verify domain ownership via Cloudflare DNS
  - Submit sitemap
  - Monitor indexing

#### 4C: Ad Integration

- [ ] **4.11** `ADAPT` — Place ad zones per architecture layout
  - Zone 1: Between input area and results
  - Zone 2: After "What They Do With Your Data" section
  - Zone 3: Before "The Bottom Line" section
  - Zone 4: Below all results
  - All using copied AdZone component
  - All controlled by ADS_ENABLED env variable
  - Reserved heights to prevent CLS

- [ ] **4.12** `NEW` — Build affiliate CTA zone → `src/components/site/AffiliateCTA.tsx`
  - "Want to take back control of your data?"
  - "Privacy tools and services that actually protect you →"
  - Hidden by default (AFFILIATE_CTA_ENABLED=false)
  - Appears below results when enabled
  - Subtle, editorial design — not aggressive
  - Clearly labeled as partner/referral links
  - Potential partners: NordVPN, ExpressVPN, ProtonMail, Signal, DeleteMe

---

### Phase 5: QA, Performance & Launch (Day 5)

#### 5A: Performance Audit

- [ ] **5.1** Run Lighthouse audit on homepage
  - Performance: must be 90+
  - Accessibility: must be 90+
  - Best Practices: must be 90+
  - SEO: must be 90+
  - Fix any violations before proceeding

- [ ] **5.2** Bundle size audit
  - Total JS bundle under 150KB gzipped
  - Verify cheerio is NOT in client bundle (server-only import)
  - Dynamic imports for: file parsers, results display, company grid
  - Remove any unused dependencies

- [ ] **5.3** Core Web Vitals verification
  - LCP < 2.5s
  - FCP < 1.8s
  - CLS < 0.1 (verify ad zone reserved heights)
  - INP < 200ms

- [ ] **5.4** Mobile responsiveness
  - iPhone SE (smallest common viewport)
  - Standard iPhone/Android
  - iPad
  - All tap targets min 44x44px
  - URL input field usable on mobile (no tiny text)
  - Grade card readable at mobile widths
  - Company grid: single column on mobile

#### 5B: Edge Case Testing

- [ ] **5.5** URL fetch edge cases
  - Invalid URL format → validation message
  - Non-HTTPS URL → prompt to use HTTPS
  - URL that 404s → "Page not found" error
  - URL that's not a TOS page (e.g., homepage) → AI redirects gracefully
  - URL behind login/paywall → "Couldn't access content" message
  - Extremely long TOS (>15,000 words) → truncation warning
  - URL with JavaScript-rendered content → Jina handles, fallback may not
  - URL pointing to PDF → detect and redirect to upload tab
  - Slow URL (>10s response) → timeout message with suggestion to paste text
  - Rapid repeated URL submissions → rate limit catches

- [ ] **5.6** Analysis edge cases
  - Empty input submission → validation prevents
  - Non-TOS text → AI returns redirect message, no grade rendered
  - Input in non-English language → AI should still analyze (tested with DecipherDocs)
  - Extremely short TOS (<100 words) → AI notes limited content
  - TOS with embedded instructions/prompt injection → system prompt defense
  - API timeout → error message, no rate limit charge
  - Malformed AI response (grade not parseable) → fallback to "Grade: N/A"

- [ ] **5.7** File upload edge cases (same as DecipherDocs)
  - Wrong file type → validation error
  - Over 2MB → size error
  - Scanned PDF → detection message
  - Corrupted file → error message
  - Over 15 pages → page limit error

- [ ] **5.8** Rate limiting edge cases
  - Rate limit reached → friendly message with reset time
  - Failed operations don't decrement counter
  - Counter displays correctly after each analysis

- [ ] **5.9** Company page testing
  - All 3 proof-of-concept pages render correctly
  - Grade colors display correctly
  - Cross-links to guides work
  - Meta tags and structured data validate
  - Pages load under 2s (SSG — should be fast)

- [ ] **5.10** Print/Copy testing
  - Print shows only results (no header, footer, ads, input)
  - FinePrint URL in print footer
  - Disclaimer in print output
  - Grade renders in print (color or text fallback)
  - Copy produces rich text that pastes well into Google Docs

- [ ] **5.11** Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - URL fetch works in all (server-side, so should be fine)
  - File upload in each browser
  - Grade colors render consistently

#### 5C: Launch Checklist

- [ ] **5.12** Final environment variable check on Vercel
  - GEMINI_API_KEY set
  - UPSTASH credentials set
  - RATE_LIMIT_DISABLED=false
  - ADS_ENABLED=false (enable after AdSense approval)
  - AFFILIATE_CTA_ENABLED=false (enable when ready)
  - WALL_OF_SHAME_ENABLED=false
  - NEXT_PUBLIC_SITE_URL=https://fineprint.legal

- [ ] **5.13** DNS propagation confirmed (fineprint.legal → Vercel)
- [ ] **5.14** SSL certificate active
- [ ] **5.15** All pages loading correctly on production URL:
  - Homepage with tool functional
  - 3 company pages rendering
  - 1 guide page rendering
  - About, Privacy, Terms, Disclaimer pages
  - Company index page
- [ ] **5.16** URL fetch working on production
  - Test with: https://www.instagram.com/legal/terms-of-use/
  - Test with: https://www.spotify.com/us/legal/privacy-policy/
- [ ] **5.17** AI analysis working on production
  - Full analysis from URL fetch
  - Full analysis from text paste
  - Full analysis from PDF upload
- [ ] **5.18** Rate limiting working on production
- [ ] **5.19** Print/Copy working on production
- [ ] **5.20** Submit sitemap to Google Search Console
- [ ] **5.21** Set up UptimeRobot monitoring (free tier)
  - Monitor: https://fineprint.legal
  - Alert via email on downtime
- [ ] **5.22** Plausible analytics tracking confirmed

### 🚀 LAUNCH

---

## Post-Launch Sprint (Weeks 2-8)

### Content Production

- [ ] Publish 3 company pages per week (see Keyword Research content calendar):
  - Week 1: Instagram, TikTok, Spotify (done at launch)
  - Week 2: Facebook/Meta, Google, Twitter/X
  - Week 3: Discord, ChatGPT/OpenAI, Snapchat
  - Week 4: Amazon, Netflix, Roblox
  - Week 5: Apple, Uber, Airbnb
  - Week 6: Zoom, LinkedIn, Twitch
  - Week 7: Venmo, DoorDash, YouTube
  - Week 8: WhatsApp, Telegram, Reddit

- [ ] Publish 2 guide pages per week (see content calendar):
  - Week 1: Binding arbitration, Class action waiver
  - Week 2: Non-exclusive worldwide license, Auto-renewal traps
  - Week 3: What apps collect, AI training and your data
  - Week 4: Can companies change TOS, Opt out of data selling
  - Week 5: GDPR rights, Right to be forgotten
  - Week 6: Data retention, Data after deletion
  - Week 7: CCPA rights, EULA explained
  - Week 8: Worst hidden TOS terms, How to read a privacy policy

### Monitoring & Optimization

- [ ] Monitor Google Search Console for indexing status
- [ ] Monitor analytics for traffic patterns and user behavior
- [ ] Track which company pages get the most organic traffic
- [ ] Refine system prompt based on real user queries and edge cases
- [ ] Apply for AdSense once content volume meets requirements (~15-20 content pages)
- [ ] Track rate limit hit rate (informs future pricing decisions)
- [ ] Monitor Jina Reader free tier usage (upgrade if approaching limit)

### Wall of Shame Preparation (Design Only)

- [ ] Set up Supabase project
- [ ] Create database tables per Architecture doc Section 10 schema
- [ ] Build basic admin route for content review (protected, not public)
- [ ] Do NOT launch publicly until organic traffic exceeds 5K monthly visits

---

## Lessons Carried Forward from DecipherDocs Build

These are hard-won optimizations from building the first site. Apply them from day one:

1. **RATE_LIMIT_DISABLED env variable** — Essential for dev/testing. Skip Redis when true.
2. **Rich text copy** — Use Clipboard API with `text/html` + plain text fallback. Users paste into Google Docs.
3. **Print stylesheet** — Must hide ENTIRE input area, not just the textarea. Hide ads too.
4. **Non-legal input handling** — AI returns a simple redirect message, NOT the standard results template. No grade badge for non-TOS content.
5. **Prompt injection defense** — System prompt includes instruction to ignore embedded AI instructions/system prompts within the TOS text.
6. **International documents** — AI correctly handles TOS in different languages and jurisdictions. Tested with UK, Mexican, German docs on DecipherDocs.
7. **System font stack** — Zero web font overhead. Critical for performance budget.
8. **Auto-detect don't ask** — DecipherDocs learned that auto-detecting analysis mode by word count is better than making users choose. FinePrint takes this further: no mode toggle at all, always full analysis.

---

## Component Source Map

Quick reference for what comes from where:

| Component | Source | Action | Path |
|-----------|--------|--------|------|
| FileUpload | DecipherDocs | `COPY` | /components/shared/FileUpload.tsx |
| AdZone | DecipherDocs | `COPY` | /components/shared/AdZone.tsx |
| RiskBadge | DecipherDocs | `COPY` | /components/shared/RiskBadge.tsx |
| RateCounter | DecipherDocs | `COPY` | /components/shared/RateCounter.tsx |
| PrintCopy | DecipherDocs | `COPY` | /components/shared/PrintCopy.tsx |
| Disclaimer | DecipherDocs | `ADAPT` text | /components/shared/Disclaimer.tsx |
| Header | DecipherDocs | `ADAPT` branding | /components/shared/Header.tsx |
| Footer | DecipherDocs | `ADAPT` links | /components/shared/Footer.tsx |
| PDF Parser | DecipherDocs | `COPY` | /lib/shared/parsers/pdf.ts |
| DOCX Parser | DecipherDocs | `COPY` | /lib/shared/parsers/docx.ts |
| Rate Limiter | DecipherDocs | `COPY` | /lib/shared/rate-limit.ts |
| Gemini Client | DecipherDocs | `COPY` | /lib/shared/gemini.ts |
| Upload API | DecipherDocs | `COPY` | /app/api/upload/route.ts |
| Analyze API | DecipherDocs | `ADAPT` prompt | /app/api/analyze/route.ts |
| URLInput | New | `NEW` | /components/site/URLInput.tsx |
| GradeBadge | New | `NEW` | /components/site/GradeBadge.tsx |
| GradeCard | New | `NEW` | /components/site/GradeCard.tsx |
| ResultsDisplay | New | `NEW` | /components/site/ResultsDisplay.tsx |
| InputArea | New | `NEW` | /components/site/InputArea.tsx |
| CompanyGrid | New | `NEW` | /components/site/CompanyGrid.tsx |
| AffiliateCTA | New | `NEW` | /components/site/AffiliateCTA.tsx |
| URL Scraper | New | `NEW` | /lib/site/url-scraper.ts |
| Grade Parser | New | `NEW` | /lib/site/grade.ts |
| System Prompt | New | `NEW` | /lib/site/prompt.ts |
| Site Config | New | `NEW` | /lib/site/config.ts |
| Fetch API | New | `NEW` | /app/api/fetch/route.ts |
| Company template | New | `NEW` | /app/company/[slug]/page.tsx |
| Guide template | New | `NEW` | /app/guides/[slug]/page.tsx |

**Summary: 14 components copied/adapted from DecipherDocs. 14 components built new. Total estimated effort: 5 days.**

---

**This document is the execution plan. Work through it top to bottom. Every checkbox is a deliverable. When all boxes are checked, FinePrint.legal is live.**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Mar 3, 2026 | **Build kit created** | Full build checklist drafted: 5 phases across 5 days. Component source map finalized (14 COPY/ADAPT from DecipherDocs, 14 NEW for FinePrint) |
| ~Mar 3, 2026 | **Phase 1 executed** | Project initialized, dependencies installed, shadcn/ui configured. All 12 reusable components copied from DecipherDocs. Site config created with FinePrint branding (indigo accent, zinc primary). Header/Footer/Disclaimer adapted. Base layout built. Deployed to Vercel with Cloudflare DNS |
| ~Mar 4, 2026 | **Phase 2 executed** | URL scraper built (Jina Reader primary + cheerio fallback). URLInput component built. System prompt created (TOS/PP-specific). Analyze API route adapted. Grade parser built. GradeBadge, GradeCard, ResultsDisplay (7-section) components built. InputArea assembled with 3-tab interface (URL/Text/Upload) |
| ~Mar 5, 2026 | **Phase 3 executed** | Homepage built with tool + popular companies section. All static pages created (About, Privacy, Terms, Disclaimer). Company page template built (SSG from local JSON). Company index page with CompanyGrid. Guide page template (SSG from MDX). First 3 company pages + 1 guide page as proof of concept |
| ~Mar 6, 2026 | **Phase 4 executed** | Upstash Redis configured (separate DB). Rate limiting integrated into both /api/analyze and /api/fetch. Meta tags configured per page type. robots.txt, sitemap, llms.txt created. Structured data (JSON-LD) added. Ad zones placed (hidden behind feature flag). AffiliateCTA built (hidden behind feature flag) |
| ~Mar 7, 2026 | **Phase 5 executed — LAUNCHED** | Lighthouse audit passed (90+). Bundle size verified. Mobile responsiveness tested. Edge cases tested (URL fetch, analysis, file upload, rate limiting). All company pages and guide pages verified. Production deployment confirmed. Google Search Console submitted |
| ~Mar 7–13, 2026 | **Post-launch content production** | Company pages expanded to 12+, guide pages expanded to 5+. Prompt refined based on real user queries |
