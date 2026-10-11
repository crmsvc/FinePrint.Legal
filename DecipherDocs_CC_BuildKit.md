# DecipherDocs — Claude Code Build Kit

## READ THIS FIRST

This is the complete build kit for DecipherDocs.com, an AI-powered legal document analysis tool. Every architectural decision has been made. Every design choice is locked. Your job is execution — follow this document sequentially, check off each task, and do not deviate from the architecture without explicit approval.

**Reference Documents:**
- `DecipherDocs_Architecture_v1.md` — Master architecture (pages, URLs, UX, prompts, tech stack, SEO)
- This file — Step-by-step build checklist with implementation details

**Design Standards (Non-Negotiable):**
- Framework: Next.js 14+ App Router with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui + Radix UI
- Animation: Framer Motion (minimal — subtle transitions only)
- Hosting: Vercel
- Performance: Lighthouse 90+, LCP < 2.5s, FCP < 1.8s, CLS < 0.1, bundle < 150KB gzipped, page weight < 1MB, load < 3s on 3G

**Modular Architecture Note:**
This codebase will be reused for fineprint.legal (a sister site). Structure the code with clear separation between:
- `/components/shared/` — Reusable across all utility sites (layout shell, ad zones, rate limiter, file upload, print/copy, footer, disclaimer)
- `/components/site/` — Site-specific (branding, hero text, system prompt, color tokens, content)
- `/lib/shared/` — Reusable logic (API client, file parsers, rate limiting, analytics)
- `/lib/site/` — Site-specific config (prompt, branding, SEO meta)

This ensures the next site build is a brand swap + prompt swap, not a rebuild.

---

## BUILD CHECKLIST

### Phase 1: Project Setup (Days 1-2)

- [ ] **1.1** Initialize Next.js 14+ project with TypeScript and App Router
  ```bash
  npx create-next-app@latest decipherdocs --typescript --tailwind --eslint --app --src-dir
  ```

- [ ] **1.2** Install core dependencies
  ```bash
  npm install @radix-ui/react-slot @radix-ui/react-tabs class-variance-authority clsx tailwind-merge
  npm install framer-motion
  npm install @google/generative-ai
  npm install pdf-parse mammoth
  npm install @upstash/redis @upstash/ratelimit
  npm install lucide-react
  npm install -D @types/pdf-parse
  ```

- [ ] **1.3** Initialize shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
  Add components: button, card, badge, tabs, textarea, dialog, separator, toast

- [ ] **1.4** Set up project structure per architecture doc file tree
  Create all directories:
  ```
  src/app/ (pages)
  src/components/shared/
  src/components/site/
  src/components/ui/ (shadcn)
  src/lib/shared/
  src/lib/site/
  src/content/guides/
  ```

- [ ] **1.5** Configure environment variables (.env.local)
  ```
  GEMINI_API_KEY=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  NEXT_PUBLIC_SITE_URL=https://decipherdocs.com
  NEXT_PUBLIC_SITE_NAME=DecipherDocs
  ```

- [ ] **1.6** Deploy to Vercel (connect repo, configure domain)
  - Connect GitHub repo to Vercel
  - Add custom domain: decipherdocs.com
  - Configure Cloudflare DNS to point to Vercel
  - Set environment variables in Vercel dashboard

- [ ] **1.7** Configure Tailwind theme with site-specific design tokens
  ```
  Colors:
  - primary: slate-800 (#1e293b) — authority
  - accent: teal-600 (#0d9488) — trust/clarity
  - background: slate-50 (#f8fafc) — clean
  - risk-low: emerald/green
  - risk-medium: amber/yellow
  - risk-high: red
  - surface: white with subtle border
  ```

- [ ] **1.8** Create base layout (src/app/layout.tsx)
  - HTML lang="en"
  - System font stack (no web fonts — zero overhead)
  - Meta viewport
  - Favicon placeholder
  - Analytics script placeholders (lazy loaded)
  - Global disclaimer in footer

---

### Phase 2: Core Tool Build (Days 3-5)

- [ ] **2.1** Build Header component (src/components/shared/Header.tsx)
  - Logo (text-based for v1 — "DecipherDocs" in primary weight)
  - Navigation: About, Guides
  - Mobile responsive (hamburger menu)
  - Sticky on scroll with subtle shadow

- [ ] **2.2** Build Footer component (src/components/shared/Footer.tsx)
  - Links: About, Privacy, Terms, Disclaimer, Guides
  - Copyright line
  - Global disclaimer text
  - Rate limit counter display area

- [ ] **2.3** Build InputArea component (src/components/site/InputArea.tsx)
  - Tab interface: "Paste Text" | "Upload PDF" | "Upload DOCX"
  - Textarea with placeholder: "Paste your contract clause, lease section, or legal document here..."
  - Character/word count display
  - Analysis mode toggle: "Single Clause" | "Full Document"
  - Submit button: "✦ Decipher This Document"
  - Loading state with animated indicator
  - Clear/reset button

- [ ] **2.4** Build file upload functionality (src/components/shared/FileUpload.tsx)
  - Drag-and-drop zone
  - Click to browse
  - File type validation (.txt, .pdf, .docx only)
  - File size validation (2MB max)
  - File name display after upload
  - Remove file button
  - Progress indicator during parsing

- [ ] **2.5** Create PDF parser (src/lib/shared/parsers/pdf.ts)
  - Use pdf-parse library
  - Extract text from text-based PDFs
  - Detect scanned/image PDFs (no extractable text = scanned)
  - Return extracted text + page count
  - Enforce 15-page limit
  - Return clear error messages for:
    - Scanned PDF detected
    - File too large
    - Corrupted/unreadable file
    - Over page limit

- [ ] **2.6** Create DOCX parser (src/lib/shared/parsers/docx.ts)
  - Use mammoth.js library
  - Extract raw text (strip formatting)
  - Return extracted text + approximate word count
  - Enforce same limits as PDF
  - Error handling for corrupted files

- [ ] **2.7** Create Gemini API client (src/lib/shared/gemini.ts)
  - Initialize GoogleGenerativeAI client
  - System prompt loaded from site config (src/lib/site/prompt.ts)
  - Two functions:
    - `analyzeSingleClause(text: string)` — for single clause mode
    - `analyzeFullDocument(text: string)` — for full document mode
  - Token counting for cost monitoring
  - Error handling: API timeout, rate limit, invalid response
  - Response parsing: extract risk level, sections, formatting

- [ ] **2.8** Create system prompt (src/lib/site/prompt.ts)
  - Full system prompt as defined in Architecture doc Section 3
  - Exported as const for easy editing
  - Separate prompt templates for single clause vs full document mode

- [ ] **2.9** Build API route (src/app/api/analyze/route.ts)
  - POST endpoint
  - Accept: { text: string, mode: "single" | "full" }
  - Validate input (not empty, within token limits)
  - Check rate limit before processing
  - Call Gemini API
  - Return structured response
  - Error responses with appropriate HTTP codes

- [ ] **2.10** Build ResultsDisplay component (src/components/site/ResultsDisplay.tsx)
  - Overall risk assessment card with color-coded badge
    - LOW = green background, green badge
    - MEDIUM = amber background, amber badge  
    - HIGH = red background, red badge
  - Plain English summary section
  - Clause-by-clause breakdown cards:
    - Each clause in its own card
    - Original text in a quote block (gray background)
    - "This means:" plain English translation
    - Risk badge per clause
    - "What to watch for" section (red callout for HIGH risk)
    - Guidance text in muted color
  - Questions to ask section (numbered list)
  - Disclaimer footer on every result
  - Smooth scroll-into-view animation when results load

- [ ] **2.11** Build RiskBadge component (src/components/shared/RiskBadge.tsx)
  - Three variants: low, medium, high
  - Consistent sizing and styling
  - Color tokens from Tailwind config

- [ ] **2.12** Build Print/Copy functionality
  - "Print results" button → triggers window.print() with print-specific stylesheet
  - Print stylesheet: hide header, footer, ads, input area. Show only results + disclaimer + URL
  - "Copy to clipboard" button → formats results as clean text, copies to clipboard
  - Toast notification on successful copy

- [ ] **2.13** Build homepage (src/app/page.tsx)
  - Hero section with tagline: "Decipher your documents. Understand them in plain English."
  - Subtitle text
  - InputArea component
  - ResultsDisplay component (hidden until analysis complete)
  - Ad zone placeholders (hidden until AdSense approved)
  - Affiliate CTA zone (hidden until post-launch activation)
  - Trust signals / how it works section below tool

---

### Phase 3: File Upload Integration (Days 6-7)

- [ ] **3.1** Build upload API route (src/app/api/upload/route.ts)
  - POST endpoint accepting multipart form data
  - File type validation server-side
  - File size validation server-side
  - Route to appropriate parser (PDF or DOCX)
  - Return extracted text
  - Error handling for all edge cases

- [ ] **3.2** Connect file upload to analysis flow
  - After file parsed → text populates the analysis input
  - User can review extracted text before analyzing
  - "Analyze" button triggers the same API route as text paste
  - File upload tab shows extracted text preview

- [ ] **3.3** Scanned PDF detection
  - If pdf-parse returns empty or near-empty text from a multi-page PDF → likely scanned
  - Show user message: "This PDF appears to be a scanned image. We can only process text-based PDFs right now. Try copying and pasting the text instead."
  - Don't charge a rate limit use for failed scanned PDF attempts

---

### Phase 4: Rate Limiting (Days 8-9)

- [ ] **4.1** Set up Upstash Redis
  - Create Upstash account and Redis database
  - Add credentials to .env.local and Vercel env vars

- [ ] **4.2** Build rate limiter (src/lib/shared/rate-limit.ts)
  - Use @upstash/ratelimit with sliding window
  - 5 requests per 24-hour window
  - Key: combination of IP address + request fingerprint
  - Return: { success: boolean, remaining: number, reset: Date }

- [ ] **4.3** Integrate rate limiting into analyze API route
  - Check rate limit BEFORE calling Gemini API
  - If limited: return 429 with friendly message and reset time
  - If allowed: proceed and decrement counter

- [ ] **4.4** Build RateCounter component (src/components/shared/RateCounter.tsx)
  - Subtle display: "4 of 5 free analyses remaining today"
  - Shows below results after each analysis
  - At limit: "You've used all 5 free analyses for today. Bookmark us — your limit resets tomorrow!"
  - No login prompts, no email capture, no paywall

- [ ] **4.5** IP detection
  - Use x-forwarded-for header (Vercel provides this)
  - Fallback to request IP
  - Hash the IP (don't store raw IPs)

---

### Phase 5: Legal & Static Pages (Day 10)

- [ ] **5.1** Build About page (src/app/about/page.tsx)
  - What DecipherDocs does
  - How it works (AI analyzes text, explains in plain English)
  - Who it's for (renters, freelancers, employees, small business owners)
  - Trust signals: "We don't store your documents" / "No account required"
  - Link to disclaimer

- [ ] **5.2** Build Privacy Policy page (src/app/privacy/page.tsx)
  - GDPR/CCPA compliant
  - Key points:
    - No user accounts collected
    - Documents processed in memory only, never stored
    - IP addresses hashed and stored 24hrs for rate limiting only
    - Analytics cookies (Plausible — cookieless option)
    - Ad network cookies (when active)
  - Cookie consent banner for EU visitors

- [ ] **5.3** Build Terms of Service page (src/app/terms/page.tsx)
  - Service provided "as-is"
  - Not a substitute for legal advice
  - User responsible for how they use information
  - Right to rate-limit or restrict abusive usage
  - No liability for AI accuracy

- [ ] **5.4** Build Disclaimer page (src/app/disclaimer/page.tsx)
  - Prominent, standalone page
  - "DecipherDocs is NOT a law firm"
  - "This tool does NOT provide legal advice"
  - "Always consult a qualified attorney"
  - "AI analysis may contain errors"
  - Link to this page from every results display

---

### Phase 6: SEO Setup (Days 11-12)

- [ ] **6.1** Configure meta tags for all pages
  - Homepage: title, description, OG tags per architecture doc
  - Each static page: unique title and description
  - OG image placeholder (can be generated later)

- [ ] **6.2** Create robots.txt (public/robots.txt)
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  
  Sitemap: https://decipherdocs.com/sitemap.xml
  ```

- [ ] **6.3** Create sitemap.xml (public/sitemap.xml or dynamic generation)
  - Include all static pages
  - Include placeholder URLs for future guide pages
  - lastmod dates

- [ ] **6.4** Create llms.txt (public/llms.txt)
  ```
  # DecipherDocs
  
  ## About
  DecipherDocs is a free AI-powered tool that explains legal documents in plain English. Users paste contract clauses, upload PDFs or DOCX files, and receive clause-by-clause analysis with risk assessments.
  
  ## Features
  - Single clause analysis with plain-English translation
  - Full document breakdown with risk badges (LOW/MEDIUM/HIGH)
  - PDF and DOCX upload support
  - AI-generated questions to ask before signing
  - Free to use, no account required
  
  ## URL
  https://decipherdocs.com
  ```

- [ ] **6.5** Add structured data (JSON-LD)
  - WebApplication schema on homepage
  - Organization schema site-wide
  - FAQ schema placeholder (for guide pages)

- [ ] **6.6** Configure canonical URLs on all pages

- [ ] **6.7** Set up Google Search Console
  - Verify domain ownership
  - Submit sitemap
  - Monitor indexing

---

### Phase 7: Ad Integration (Days 13-14)

- [ ] **7.1** Build AdZone component (src/components/shared/AdZone.tsx)
  - Lazy-loaded container
  - Accepts placement prop: "banner-top" | "in-content" | "banner-bottom"
  - Renders placeholder div with correct dimensions until ad network is active
  - Reserved height to prevent CLS
  - Easy toggle: enabled/disabled via environment variable

- [ ] **7.2** Place ad zones per architecture doc layout
  - Zone 1: Between input area and results
  - Zone 2: After summary, before clause breakdown
  - Zone 3: Between clause groups (full document mode only)
  - Zone 4: Below all results

- [ ] **7.3** Apply for Google AdSense
  - Need live site with content first
  - Application after launch with traffic

- [ ] **7.4** Build affiliate CTA zone (src/components/site/AffiliateCTA.tsx)
  - "Need professional eyes on this document?"
  - "Get matched with an attorney in your area →"
  - Hidden by default (activated post-launch via env variable)
  - Subtle, non-aggressive design
  - Clearly labeled as partner/referral link

---

### Phase 8: Performance & QA (Day 15)

- [ ] **8.1** Run Lighthouse audit
  - Performance: must be 90+
  - Accessibility: must be 90+
  - Best Practices: must be 90+
  - SEO: must be 90+
  - Fix any violations

- [ ] **8.2** Bundle size audit
  - Total JS bundle under 150KB gzipped
  - Identify and remove any unused dependencies
  - Dynamic imports for non-critical components (file parsers, results display)

- [ ] **8.3** Core Web Vitals verification
  - LCP < 2.5s
  - FCP < 1.8s
  - CLS < 0.1
  - INP < 200ms

- [ ] **8.4** Mobile responsiveness testing
  - Test on iPhone SE (smallest common viewport)
  - Test on standard iPhone/Android
  - Test on iPad
  - All interactive elements touch-friendly (min 44x44px tap targets)

- [ ] **8.5** Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - File upload functionality in each browser
  - Print stylesheet in each browser

- [ ] **8.6** Edge case testing
  - Empty input submission
  - Extremely long input (at token limit)
  - Non-legal text input (should get polite redirect message)
  - Rapid repeated submissions
  - File upload with wrong file type
  - File upload over size limit
  - Rate limit reached behavior
  - API timeout handling
  - Network error handling

- [ ] **8.7** Print functionality testing
  - Print preview shows only results
  - No ads in print output
  - DecipherDocs URL appears in print footer
  - Disclaimer appears in print output
  - Readable formatting on printed page

---

### Phase 9: Launch (Day 16)

- [ ] **9.1** Final environment variable check on Vercel
- [ ] **9.2** DNS propagation confirmed (decipherdocs.com → Vercel)
- [ ] **9.3** SSL certificate active
- [ ] **9.4** All pages loading correctly on production URL
- [ ] **9.5** Analytics tracking confirmed
- [ ] **9.6** Rate limiting working on production
- [ ] **9.7** AI analysis working on production (test with real lease clause)
- [ ] **9.8** File upload working on production (test PDF + DOCX)
- [ ] **9.9** Print/copy working on production
- [ ] **9.10** Submit sitemap to Google Search Console
- [ ] **9.11** Set up UptimeRobot monitoring (free tier, 5-minute checks)
  - Monitor: https://decipherdocs.com
  - Alert via email on downtime

### 🚀 LAUNCH

---

## Post-Launch Sprint (Weeks 4-8)

- [ ] Write and publish 2 SEO guide pages per week
- [ ] Monitor Google Search Console for indexing status
- [ ] Monitor analytics for traffic patterns and user behavior
- [ ] Refine system prompt based on real user queries
- [ ] Apply for AdSense once content meets requirements
- [ ] Track rate limit hit rate (informs future paid tier decision)
- [ ] Begin FinePrint.legal planning once DecipherDocs is stable

---

## REUSABLE COMPONENTS MAP (for FinePrint.legal and future sites)

These components are designed to be copied directly to the next project with zero modification:

| Component | Path | Reusable? |
|-----------|------|-----------|
| Header | /components/shared/Header.tsx | Shell reusable, branding swapped |
| Footer | /components/shared/Footer.tsx | Shell reusable, links swapped |
| FileUpload | /components/shared/FileUpload.tsx | 100% reusable |
| AdZone | /components/shared/AdZone.tsx | 100% reusable |
| RiskBadge | /components/shared/RiskBadge.tsx | 100% reusable |
| RateCounter | /components/shared/RateCounter.tsx | 100% reusable |
| Print/Copy | /components/shared/PrintCopy.tsx | 100% reusable |
| Disclaimer | /components/shared/Disclaimer.tsx | Text swapped per site |
| PDF Parser | /lib/shared/parsers/pdf.ts | 100% reusable |
| DOCX Parser | /lib/shared/parsers/docx.ts | 100% reusable |
| Rate Limiter | /lib/shared/rate-limit.ts | 100% reusable |
| Gemini Client | /lib/shared/gemini.ts | 100% reusable (prompt loaded from site config) |
| System Prompt | /lib/site/prompt.ts | SITE-SPECIFIC — new per site |
| Site Config | /lib/site/config.ts | SITE-SPECIFIC — branding, meta, colors |
| InputArea | /components/site/InputArea.tsx | Shell reusable, labels/copy swapped |
| ResultsDisplay | /components/site/ResultsDisplay.tsx | Mostly reusable, formatting may vary |
| AffiliateCTA | /components/site/AffiliateCTA.tsx | Template reusable, links/copy swapped |

**Estimated time to launch next site using this framework: 3-5 days (vs 16 days for first build)**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Feb 20, 2026 | **Build kit created** | Full build checklist drafted covering all 9 phases: project setup, core tool, file upload, rate limiting, legal pages, SEO, ads, QA, launch |
| ~Feb 20–Mar 2, 2026 | **All phases executed** | Checklist worked through top to bottom. All shared components built with modular architecture for reuse. FinePrint confirmed as first reuse target — estimated 3-5 day build using this framework |
| ~Mar 2, 2026 | **Reusable components validated** | 12 components confirmed 100% reusable (FileUpload, AdZone, RiskBadge, RateCounter, PrintCopy, PDF/DOCX parsers, Rate Limiter, Gemini Client). Header/Footer/Disclaimer confirmed as adapt-and-swap. This kit served as the execution reference for FinePrint's Day 1 framework clone |
