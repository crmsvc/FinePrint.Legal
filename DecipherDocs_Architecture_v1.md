# DecipherDocs.com — Master Architecture & Build Plan

**Version:** 1.0  
**Date:** March 12, 2026  
**Status:** Pre-Build — All decisions locked before code  
**Domain:** decipherdocs.com (registered via Cloudflare)  
**Sister Domain:** fineprint.legal (parked for Phase 2)

---

## 1. Site Architecture — Pages & URLs

### Core Application Pages

| URL | Page | Purpose |
|-----|------|---------|
| `/` | Homepage + Tool | Single-page tool — input area above fold, results below. No separate "app" page. |
| `/result` | Shareable Result | Permalink for shared analyses (optional phase 2) |

### Legal & Policy Pages

| URL | Page | Purpose |
|-----|------|---------|
| `/about` | About | What the tool does, who built it, trust signals |
| `/privacy` | Privacy Policy | GDPR/CCPA compliant. Required for ad networks. |
| `/terms` | Terms of Service | Usage terms, disclaimers, limitation of liability |
| `/disclaimer` | Legal Disclaimer | Prominent "not legal advice" disclaimer (linked from every result) |

### SEO Content Pages (Planned Now, Built Post-Launch)

These pages target high-volume long-tail keywords. Each becomes an SEO landing page with a contextual CTA back to the main tool. URL structure is `/guides/[slug]`.

| URL | Target Keyword Cluster | Est. Monthly Search Volume |
|-----|----------------------|---------------------------|
| `/guides/what-does-indemnification-mean` | indemnification clause explained | 12,000+ |
| `/guides/early-termination-clause-lease` | early termination clause lease | 18,000+ |
| `/guides/non-compete-agreement-explained` | non compete clause explained | 25,000+ |
| `/guides/force-majeure-clause` | force majeure clause meaning | 8,000+ |
| `/guides/arbitration-clause-explained` | arbitration clause meaning | 10,000+ |
| `/guides/limitation-of-liability-clause` | limitation of liability explained | 6,000+ |
| `/guides/confidentiality-clause-nda` | NDA confidentiality clause | 15,000+ |
| `/guides/auto-renewal-clause` | auto renewal clause meaning | 9,000+ |
| `/guides/severability-clause` | severability clause explained | 5,000+ |
| `/guides/assignment-clause-contracts` | assignment clause meaning | 4,000+ |
| `/guides/most-common-lease-clauses` | common lease clauses to watch for | 20,000+ |
| `/guides/employment-contract-red-flags` | employment contract red flags | 15,000+ |
| `/guides/freelance-contract-checklist` | freelance contract must-haves | 10,000+ |

**Content Strategy:** Each guide is 800–1,200 words, explains the clause type in plain English, gives 2–3 real-world examples, flags common red flags, and ends with: *"Have a specific clause you need explained? Paste it into DecipherDocs and get a plain-English breakdown in seconds."*

### Sitemap

```
decipherdocs.com/
├── /                          ← Homepage + Tool (primary)
├── /about
├── /privacy
├── /terms
├── /disclaimer
├── /guides/
│   ├── /what-does-indemnification-mean
│   ├── /early-termination-clause-lease
│   ├── /non-compete-agreement-explained
│   ├── ... (13 planned guides)
└── /sitemap.xml
```

---

## 2. UX / Layout — User Flow & Ad Zones

### Design Direction

**Who is this person?** A renter at 10pm reading a lease they need to sign tomorrow. A freelancer reviewing an NDA before a client meeting. An employee who just got a non-compete and doesn't know what it means. They're stressed, they're not legal experts, and they need answers NOW.

**What must they accomplish?** Understand what a legal clause means in plain, non-threatening English. Know if something is risky. Know what questions to ask.

**What should this feel like?** Calm, authoritative, approachable. Like a smart friend who happens to be a lawyer explaining things over coffee. Not a law firm website (cold, intimidating). Not a SaaS tool (complex, login-gated). Think: the clarity of a dictionary + the warmth of a conversation.

**Color Direction:**
- Primary: Deep navy / slate (`#1e293b`) — authority without intimidation
- Accent: Teal/cyan (`#0d9488` range) — trust, clarity, approachability
- Background: Off-white / warm gray (`#f8fafc`) — clean, easy on eyes
- Risk indicators: Amber for warnings, red for high-risk flags, green for safe clauses
- Typography: Clean sans-serif per playbook standards (system font stack for performance)

**Depth Strategy:** Subtle shadows only — soft card elevation for the input area and results, clean borders everywhere else. Per the Blueprint non-negotiables.

### Homepage Layout (Mobile-First)

```
┌─────────────────────────────────────┐
│  HEADER                             │
│  Logo    [About]  [Guides]          │
├─────────────────────────────────────┤
│                                     │
│  "Decipher your documents.          │
│   Understand them in plain English."│
│                                     │
│  Brief subtitle: Paste any legal    │
│  clause, upload a contract, or drop │
│  in a full document — get a plain-  │
│  English breakdown in seconds.      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─ INPUT AREA ──────────────────┐  │
│  │                               │  │
│  │  [Paste Text] [Upload PDF]    │  │
│  │              [Upload DOCX]    │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │                         │  │  │
│  │  │   Textarea / Drop Zone  │  │  │
│  │  │                         │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  [▼ Analysis Mode]            │  │
│  │   ○ Single Clause             │  │
│  │   ○ Full Document Breakdown   │  │
│  │                               │  │
│  │  [ ✦ Decipher This Document ] │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
├───── AD ZONE 1 (banner) ───────────┤
│                                     │
│  ┌─ RESULTS AREA ────────────────┐  │
│  │                               │  │
│  │  ■ Overall Risk Assessment    │  │
│  │    [LOW / MEDIUM / HIGH]      │  │
│  │                               │  │
│  │  ■ Plain English Summary      │  │
│  │    (2-3 sentence overview)    │  │
│  │                               │  │
│  ├───── AD ZONE 2 (in-content) ──┤  │
│  │                               │  │
│  │  ■ Clause-by-Clause Breakdown │  │
│  │    Clause 1: [title]          │  │
│  │    → What it means            │  │
│  │    → Risk level [badge]       │  │
│  │    → What to watch for        │  │
│  │                               │  │
│  │    Clause 2: [title]          │  │
│  │    → What it means            │  │
│  │    → Risk level [badge]       │  │
│  │    → What to watch for        │  │
│  │                               │  │
│  ├───── AD ZONE 3 (in-content) ──┤  │
│  │                               │  │
│  │    Clause 3...                │  │
│  │    Clause 4...                │  │
│  │                               │  │
│  │  ■ Questions to Ask           │  │
│  │    (AI-generated follow-up    │  │
│  │     questions for the user)   │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
├───── AD ZONE 4 (bottom banner) ─────┤
│                                     │
│  ┌─ AFFILIATE CTA ZONE ─────────┐  │
│  │  "Need a lawyer to review     │  │
│  │   the full document?"         │  │
│  │  [Get matched with an         │  │
│  │   attorney → affiliate link]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ TRUST / DISCLAIMER ─────────┐  │
│  │  ⚠ This tool provides         │  │
│  │  educational information, not │  │
│  │  legal advice. Always consult │  │
│  │  a qualified attorney for     │  │
│  │  legal decisions.             │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  FOOTER                             │
│  About | Privacy | Terms |          │
│  Disclaimer | Guides                │
│  © 2026 DecipherDocs               │
└─────────────────────────────────────┘
```

### Ad Zone Strategy

| Zone | Placement | Type | When Active |
|------|-----------|------|-------------|
| Zone 1 | Between input and results | Display banner (728x90 desktop / 320x50 mobile) | Always |
| Zone 2 | After summary, before clause breakdown | In-content native ad | Results displayed |
| Zone 3 | Between clause groups (every 2-3 clauses) | In-content native ad | Full document mode only |
| Zone 4 | Below all results | Display banner | Results displayed |

**Ad Rules:**
- NO ads above the tool input (kills conversion)
- NO interstitials or popups (kills UX and SEO)
- NO ads inside the results text (confuses output)
- Ads always clearly separated from AI output
- Maximum 4 ad zones per page load
- All ad zones lazy-loaded (performance non-negotiable)

### File Upload UX

**Supported formats:** .txt, .pdf, .docx  
**Max file size:** 2MB  
**Max pages:** 15 (approximately 7,500 words)  
**Scanned PDFs:** Detect and show message: "This PDF appears to be a scanned image. Text-based PDFs only for now — copy and paste the text instead."  
**Upload flow:** Drag-and-drop zone OR click-to-browse. File name displayed after upload. "Remove" button to clear. Progress indicator during processing.

### Rate Limiting UX

**Limit:** 5 analyses per 24 hours per IP + browser fingerprint  
**Counter display:** Subtle "4 of 5 free analyses remaining today" below the results  
**At limit:** Friendly message: "You've used all 5 free analyses for today. Bookmark us — your limit resets tomorrow!" No login wall. No paywall. No email capture gate.

---

## 3. Prompt Engineering — The System Prompt

This is the product. The system prompt determines the quality of every analysis. It must be precise, consistent, and produce output that feels like a knowledgeable friend explaining legal language.

### System Prompt v1.0

```
You are DecipherDocs, a legal document analysis assistant. Your job is to explain legal language in plain, everyday English that anyone can understand — regardless of their legal knowledge.

## Your Personality
- You are calm, clear, and reassuring
- You explain things like a smart friend who happens to understand legal language
- You never use legal jargon without immediately explaining it
- You are direct about risks without being alarmist
- You always acknowledge when something is genuinely standard/normal vs. when something is unusual or concerning

## Analysis Mode: Single Clause
When the user provides a single clause or short passage:
1. **Plain English Translation** — Rewrite the clause in everyday language. Start with "This means..."
2. **Risk Assessment** — Rate as LOW / MEDIUM / HIGH risk with a one-sentence explanation
3. **What to Watch For** — 1-3 specific things the user should be aware of
4. **Questions to Ask** — 1-2 questions the user should ask the other party before signing

## Analysis Mode: Full Document
When the user provides a full document or multiple clauses:
1. **Document Overview** — 2-3 sentence summary of what this document is and what it does
2. **Overall Risk Assessment** — LOW / MEDIUM / HIGH with explanation
3. **Clause-by-Clause Breakdown** — For each significant clause:
   - **Clause Title** (give it a descriptive name)
   - **Plain English Translation** — What it actually means
   - **Risk Level** — LOW / MEDIUM / HIGH badge
   - **Key Concern** — The one thing to pay attention to (if any)
4. **Top Red Flags** — List the 2-5 most concerning items across the whole document (if any)
5. **Questions to Ask** — 3-5 questions the user should raise before signing

## Risk Level Definitions
- **LOW** — Standard clause, commonly found in this type of document, generally fair to both parties
- **MEDIUM** — Clause is legal but leans in favor of the other party, or contains terms worth negotiating
- **HIGH** — Clause is unusually aggressive, could have significant consequences, or contains terms that are outside normal practice

## Rules
- NEVER provide legal advice. You provide educational analysis only.
- NEVER recommend signing or not signing a document
- ALWAYS end with a reminder to consult a qualified attorney for legal decisions
- If the text is not a legal document or clause, politely explain that and suggest what the tool is designed for
- If the document appears to involve criminal matters, family law, or immigration, flag that these areas require specialized legal counsel
- Keep language at an 8th-grade reading level
- Use short paragraphs and clear formatting
- For full document mode, identify and label each clause even if the original document doesn't have clear headings

## Output Format
Use clean markdown formatting:
- Use ## for section headers
- Use **bold** for clause titles and risk badges
- Use > blockquotes for direct references to the original text
- Use bullet points for lists of concerns and questions
- Risk badges format: **🟢 LOW RISK** / **🟡 MEDIUM RISK** / **🔴 HIGH RISK**
```

### Prompt Optimization Notes

- System prompt token count: ~600 tokens (approximately $0.00004 at Gemini Flash-Lite rates)
- User input for single clause: ~200-500 tokens typical
- User input for full document: ~2,000-7,500 tokens
- AI output for single clause: ~400-800 tokens
- AI output for full document: ~2,000-5,000 tokens
- **Cost per single clause analysis:** $0.0001-$0.0003
- **Cost per full document analysis:** $0.0005-$0.003 (still under a penny)

### Model Selection

**Primary:** Gemini 3 Flash ($0.50/$3.00 per 1M tokens)
- Best balance of quality and cost for legal text comprehension
- Strong enough to catch nuance in legal language
- Fast response time for good UX

**Fallback:** Gemini Flash-Lite ($0.075/$0.30 per 1M tokens)
- If costs need to be reduced further at scale
- Adequate for single clause analysis
- May miss nuance on complex full documents

**Future consideration:** Route single clauses to Flash-Lite, full documents to Flash. Simple token-count router.

---

## 4. Tech Stack

All decisions per the UI/UX Modernization Playbook. No deviations.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO, API routes for backend, per playbook |
| **Styling** | Tailwind CSS | Per playbook standard |
| **UI Components** | shadcn/ui + Radix UI | Per playbook standard |
| **Animation** | Framer Motion (minimal) | Per playbook — subtle only, no performance impact |
| **Hosting** | Vercel | Free tier handles initial traffic, edge network, analytics built-in |
| **DNS/Domain** | Cloudflare | Already registered here, free DNS, DDoS protection |
| **AI API** | Google Gemini API (via direct SDK) | Free tier for dev, cheapest at scale |
| **File Parsing (PDF)** | pdf-parse (npm) | Lightweight, server-side text extraction |
| **File Parsing (DOCX)** | mammoth.js (npm) | Clean text extraction from Word docs |
| **Rate Limiting** | Upstash Redis | Serverless Redis, free tier covers launch traffic |
| **Analytics** | Vercel Analytics + Plausible | Privacy-friendly, lightweight, ad-compatible |
| **Ad Network** | Google AdSense (launch) → Mediavine (at 50K sessions) | Standard progression |
| **Error Tracking** | Sentry (free tier) | Catch API failures, parsing errors |

### Performance Non-Negotiables (per Blueprint)

- Lighthouse Performance: 90+ (never below 85)
- LCP: under 2.5s
- FCP: under 1.8s
- CLS: under 0.1
- Total bundle: under 150KB gzipped
- Total page weight: under 1MB
- Load time: under 3 seconds on 3G
- All ad scripts lazy-loaded
- All images optimized (WebP, lazy-loaded)
- Font loading: system font stack (zero web font overhead)

---

## 5. SEO & GEO Strategy

### Primary Target Keywords

| Keyword | Monthly Volume (US) | Competition | Priority |
|---------|-------------------|-------------|----------|
| explain legal clause | 8,000+ | Low-Medium | P1 |
| what does this clause mean | 5,000+ | Low | P1 |
| contract clause explainer | 3,000+ | Low | P1 |
| lease clause explained | 12,000+ | Medium | P1 |
| explain my contract | 6,000+ | Low | P1 |
| plain english legal | 4,000+ | Low | P1 |
| NDA explained simple | 8,000+ | Medium | P2 |
| non compete clause meaning | 15,000+ | Medium | P2 |
| understand legal documents | 3,000+ | Low | P2 |
| AI contract analyzer free | 2,000+ | Low | P1 |

### On-Page SEO

**Homepage:**
- Title: `DecipherDocs — Understand Any Legal Document in Plain English`
- Meta description: `Paste any contract clause, upload a lease, or drop in a legal document. Get a plain-English explanation with risk assessment in seconds. Free, no signup required.`
- H1: `Decipher your documents. Understand them in plain English.`
- Structured data: WebApplication schema + FAQ schema

**Guide Pages:**
- Title pattern: `[Clause Name] Explained in Plain English | DecipherDocs`
- Meta pattern: `What does [clause name] mean? We break down [clause type] in plain English — what it means, what to watch for, and when to be concerned.`
- Each guide includes FAQ schema for featured snippet targeting

### GEO Strategy (Generative Engine Optimization)

Optimizing for AI search engines (ChatGPT, Perplexity, Gemini, Claude) alongside traditional Google SEO.

**Structured Data Priority:**
- WebApplication schema on homepage
- FAQ schema on every guide page
- HowTo schema where applicable
- Organization schema site-wide

**Content Format for GEO:**
- Every guide page starts with a direct, concise answer in the first paragraph (AI engines pull this)
- Use question-format H2s that match natural language queries
- Include "People Also Ask" style FAQ sections at bottom of each guide
- Provide clear definitions that AI engines can cite
- Ensure all content is crawlable (no JavaScript-rendered content for guide pages — use SSG)

**Technical GEO:**
- Sitemap.xml with lastmod dates (updated when content changes)
- Clean URL structure with descriptive slugs
- Fast page load (AI crawlers favor fast sites)
- robots.txt allowing all major AI crawlers
- llms.txt file at root describing the site's purpose and content for AI crawlers

### Internal Linking Strategy

- Every guide page links back to the tool homepage
- Tool results page links to relevant guide pages (e.g., "Learn more about indemnification clauses")
- Guide pages cross-link to related guides
- Footer includes links to top 5 guides
- This creates a hub-and-spoke model with the tool at the center

---

## 6. Legal & Disclaimer Framework

### Required Disclaimers

**Global Disclaimer (visible on every page in footer):**
> DecipherDocs provides educational information about legal documents. This is NOT legal advice. Always consult a qualified attorney before making legal decisions.

**Results Disclaimer (appended to every AI analysis):**
> ⚠️ This analysis is for educational purposes only and does not constitute legal advice. DecipherDocs is not a law firm and does not provide legal services. For legal decisions, please consult a licensed attorney in your jurisdiction.

**About Page:**
- Clear statement that the tool uses AI (Gemini) to analyze text
- Statement that no user data is stored permanently
- Explanation that uploaded documents are processed and immediately discarded
- No user accounts, no tracking of analyses beyond rate limiting

### Privacy Compliance

- **No user accounts** = minimal personal data collected
- **IP addresses** stored temporarily (24hr) for rate limiting only, then purged
- **Documents** processed in memory, never saved to disk or database
- **Cookies** only for essential analytics and ad serving
- **GDPR/CCPA compliant** privacy policy
- Cookie consent banner for EU visitors (required for AdSense)

### Terms of Service Key Points

- Service provided "as-is" with no warranties
- Not a substitute for legal advice
- Users responsible for how they use the information
- Right to rate-limit or restrict abusive usage
- No liability for AI analysis accuracy

---

## 7. Ad & Affiliate Strategy

### Ad Network Timeline

| Phase | Traffic | Network | Expected RPM |
|-------|---------|---------|-------------|
| Launch | 0-10K monthly | Google AdSense | $5-$10 |
| Growth | 10K-50K monthly | Ezoic | $10-$18 |
| Scale | 50K+ sessions | Mediavine application | $20-$35 |
| Premium | 100K+ pageviews | Raptive consideration | $25-$45 |

### Ad Placement Rules

1. No ads above the tool input — ever
2. Maximum 4 ad zones per page load
3. All ads lazy-loaded (performance non-negotiable)
4. Clear visual separation between ads and AI output
5. No auto-playing video ads
6. No interstitials or full-page takeovers
7. Ads must not shift layout (CLS under 0.1)

### Affiliate Strategy (Post-Launch)

**Phase 2 integration — design the CTA zones now, activate later:**

| Placement | Affiliate Type | Trigger | Expected Revenue |
|-----------|---------------|---------|-----------------|
| Below results | Legal service matching (LegalZoom, Rocket Lawyer) | Every analysis | $15-$50/lead |
| Below high-risk clauses | Attorney matching service | HIGH risk detected | $25-$75/lead |
| Guide pages | Legal service contextual | Guide topic match | $10-$30/lead |

**Affiliate CTA Design:**
- Subtle, helpful tone: "Need professional eyes on this? Get matched with an attorney."
- Never aggressive, never misleading
- Clearly labeled as a referral/partner link
- Only appears AFTER the user has received their free analysis

---

## 8. Build Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Week 1 Days 1-2** | Project setup: Next.js scaffold, Tailwind + shadcn/ui config, Vercel deployment, Cloudflare DNS, environment variables, repo setup | 2 days |
| **Week 1 Days 3-5** | Core tool build: Text input component, analysis mode toggle, API route for Gemini, system prompt integration, results display with risk badges, loading states | 3 days |
| **Week 2 Days 1-2** | File upload: PDF parser integration, DOCX parser integration, upload UI (drag/drop + browse), file validation, size limits, scanned PDF detection | 2 days |
| **Week 2 Days 3-4** | Rate limiting: Upstash Redis integration, IP + fingerprint tracking, counter display, limit reached messaging | 2 days |
| **Week 2 Day 5** | Legal pages: About, Privacy, Terms, Disclaimer pages built and populated | 1 day |
| **Week 3 Days 1-2** | SEO setup: Meta tags, structured data, sitemap.xml, robots.txt, llms.txt, OpenGraph tags, analytics integration | 2 days |
| **Week 3 Days 3-4** | Ad integration: AdSense application, ad zone placeholders, lazy loading implementation, CLS testing | 2 days |
| **Week 3 Day 5** | Performance audit: Lighthouse testing, bundle optimization, load time testing on 3G, fix any non-negotiable violations | 1 day |
| **Week 4 Days 1-2** | QA + Polish: Cross-browser testing, mobile testing, error handling for edge cases, prompt refinement based on test analyses | 2 days |
| **Week 4 Day 3** | **LAUNCH** | 🚀 |

**Post-Launch (Weeks 5-8):**
- Monitor real usage patterns and rate limit data
- Begin writing SEO guide content (2 guides per week)
- Submit to Google Search Console
- Monitor AdSense approval
- Gather prompt refinement data from real analyses
- Plan guide page content calendar

---

## Appendix: File Structure

```
decipherdocs/
├── app/
│   ├── layout.tsx              ← Root layout (header, footer, analytics)
│   ├── page.tsx                ← Homepage + Tool
│   ├── about/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── disclaimer/page.tsx
│   ├── guides/
│   │   └── [slug]/page.tsx     ← Dynamic guide pages (SSG)
│   └── api/
│       ├── analyze/route.ts    ← Gemini API integration
│       ├── upload/route.ts     ← File upload + parsing
│       └── rate-limit/route.ts ← Rate limit check
├── components/
│   ├── ui/                     ← shadcn/ui components
│   ├── tool/
│   │   ├── InputArea.tsx       ← Text paste + file upload
│   │   ├── AnalysisToggle.tsx  ← Single clause vs full doc
│   │   ├── ResultsDisplay.tsx  ← Formatted AI output
│   │   ├── RiskBadge.tsx       ← LOW/MEDIUM/HIGH badges
│   │   └── RateCounter.tsx     ← "X of 5 remaining"
│   ├── ads/
│   │   └── AdZone.tsx          ← Lazy-loaded ad container
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Disclaimer.tsx
├── lib/
│   ├── gemini.ts               ← Gemini API client + system prompt
│   ├── parsers/
│   │   ├── pdf.ts              ← PDF text extraction
│   │   └── docx.ts             ← DOCX text extraction
│   ├── rate-limit.ts           ← Upstash Redis rate limiter
│   └── utils.ts
├── content/
│   └── guides/                 ← MDX files for guide pages
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── llms.txt
├── .env.local                  ← API keys (never committed)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

**This document is the single source of truth for the DecipherDocs build. No code is written that isn't mapped here. Any changes go through this document first.**

---

## Build Log

| Date (approx.) | Change | Details |
|---|---|---|
| ~Feb 20, 2026 | **Initial architecture drafted** | Full architecture doc created: pages, URLs, UX layout, system prompt, tech stack, SEO/GEO strategy, ad/affiliate strategy, legal framework, build timeline, file structure |
| ~Feb 20–Mar 2, 2026 | **DecipherDocs V1 built and launched** | Complete build per this architecture: homepage + tool, text paste + file upload (PDF/DOCX), Gemini integration with dual-mode analysis (single clause / full document), rate limiting (Upstash Redis), risk badges, print/copy, all static pages (About, Privacy, Terms, Disclaimer), SEO setup, Vercel deployment, Cloudflare DNS |
| ~Mar 2, 2026 | **Modular architecture validated** | Confirmed component separation (shared vs site-specific) works — FinePrint build began as framework clone with brand/prompt swap |
