# FinePrint.legal — Expansion Triggers

**Purpose:** This document tracks every "simple now, upgrade later" decision made during planning and building. Each entry has a specific trigger condition — when that condition is met, it's time to execute the upgrade. This is NOT a wishlist or TODO. Every item here has a clear WHEN.

**How to use:** Scan the WHEN conditions periodically (monthly, or when the business changes). If a condition matches your current situation, read the full entry and execute. If not, move on.

**Last reviewed:** March 13, 2026

---

## AUTH-01: Admin Panel Authentication

**WHEN:** You add a second person (editor, reviewer, VA) to the admin panel for Wall of Shame moderation or company page review.

**THEN:** Upgrade from `ADMIN_PASSWORD` env var to Supabase Auth with role-based access.

**BECAUSE:** The current approach is a single shared password stored in an env var with a cookie session. No session expiration management, no audit log, no way to revoke one person's access without changing the password for everyone. Fine for a solo admin, breaks immediately with two or more people.

**CURRENT STATE:** `ADMIN_PASSWORD` env var, cookie-based session after password entry at `/admin`. Works. Simple.

**UPGRADE PATH:**
1. Create admin users in Supabase Auth (email + password)
2. Add roles: `admin` (full access), `editor` (can review/publish, can't change settings), `moderator` (Wall of Shame only)
3. Replace password middleware with Supabase Auth session check
4. Add login page at `/admin/login`
5. Add audit log table: who published what, who approved which submissions
6. Supabase is already in the stack — this is a clean migration, not a replatform

**EFFORT:** Half a day to a full day.

---

## SHARE-01: Share Abuse Controls

**WHEN:** You observe coordinated sharing campaigns targeting a specific company (e.g., someone sharing the same company page 100+ times across platforms, or a company complaining about harassment using FinePrint links).

**THEN:** Add IP-based share rate limiting and/or disable share buttons on live tool results.

**BECAUSE:** Currently share buttons have no rate limiting — share events are tracked but not throttled. The WaPo share model (user writes their own text, we control the OG card) provides natural protection since our brand presentation is always professional. But if someone weaponizes shares at scale, we need a lever to pull.

**CURRENT STATE:** Share buttons on all page types (company, Hall of Fame, Wall of Shame, live results). Share events logged to `share_events` table. No throttling.

**UPGRADE PATH:**
1. First lever: Disable share on live tool results (highest risk) — flip a feature flag
2. Second lever: Add rate limiting to `/api/share/track` (e.g., max 10 share events per IP per hour)
3. Third lever: Add a review queue for Wall of Shame shares specifically (require admin approval before shares go live — heavy, only if truly needed)
4. Monitor the `share_events` table for anomalies: same IP sharing the same page repeatedly

**EFFORT:** Lever 1 is 5 minutes (feature flag). Lever 2 is 1-2 hours. Lever 3 is a full day.

---

## CONTENT-01: Company Page Pipeline — Full Automation

**WHEN:** The admin pending queue consistently has 50+ unreviewed analyses AND you're spending more than 2 hours/week just clicking "Publish" on obvious good-quality analyses.

**THEN:** Add auto-publish rules for high-confidence analyses (e.g., if 10+ users analyzed the same domain AND the AI output passes quality checks, auto-publish without manual review).

**BECAUSE:** The hybrid pipeline (semi-auto with manual review) is the right starting point — quality control matters when you're building domain authority. But at scale, manual review becomes a bottleneck. Auto-publishing with quality gates maintains quality without requiring your time.

**CURRENT STATE:** Every user analysis saves to pending queue. You manually review and publish via admin panel. No auto-publish.

**UPGRADE PATH:**
1. Define quality gates: minimum word count in analysis, all 7 sections present, grade parsed successfully, no AI error indicators
2. Define demand threshold: `submission_count >= 10` (at least 10 users analyzed this domain)
3. Add auto-publish logic: if quality gates pass AND demand threshold met → auto-create company page, send you a notification (email or Slack webhook) rather than requiring approval
4. Add a "revert" button in admin panel to unpublish auto-published pages if quality is off

**EFFORT:** Half a day for the auto-publish logic + quality gates.

---

## CONTENT-02: TOS + Privacy Policy Combined Analysis

**WHEN:** Users consistently analyze a TOS and then separately analyze the same company's Privacy Policy (you'll see this pattern in the pending queue — same domain, two different source URLs), OR you get repeated feedback asking "why doesn't it analyze both?"

**THEN:** Add a "Combined Analysis" mode that accepts two URLs (TOS + Privacy Policy) and produces a single unified report.

**BECAUSE:** Most companies have separate TOS and Privacy Policy documents. Analyzing them separately misses cross-references (TOS says "see our Privacy Policy" without details) and forces users to run two analyses. The Orchids.app test case proved this — the TOS analysis flagged "Missing Privacy Policy" as a red flag because it only saw the TOS document.

**CURRENT STATE:** Single URL input. Each document analyzed independently. Users can run two analyses but they're disconnected.

**UPGRADE PATH:**
1. Add a second URL field (optional): "Privacy Policy URL" below the main TOS URL input
2. If both provided: fetch both, concatenate with a clear separator, send to Gemini as one analysis
3. Update system prompt to handle combined TOS + PP input: "You are analyzing both a Terms of Service and a Privacy Policy for the same company..."
4. Results template stays the same (the 7 sections already cover both TOS and PP concerns)
5. Company pages can store both URLs and display "Sources: TOS | Privacy Policy"

**EFFORT:** 2-4 hours. Mostly prompt engineering + a second URL field.

---

## DATA-01: Supabase Migration for Company Pages

**WHEN:** You have 50+ company pages and managing them as local JSON/MDX files becomes unwieldy (slow builds, can't query/filter easily, manual file creation for each page).

**THEN:** Migrate ALL company page data to Supabase (not just Tier 2 user-sourced pages).

**BECAUSE:** Currently Tier 1 (manually curated) company pages live as local content files, and Tier 2 (user-sourced) pages live in Supabase. This dual-source approach works at small scale but creates friction: different update processes, can't easily query across all companies, build times increase with more static files.

**CURRENT STATE:** Tier 1 pages = local JSON/MDX files (SSG). Tier 2 pages = Supabase (ISR). Company page template checks both sources.

**UPGRADE PATH:**
1. Migrate existing Tier 1 company data from local files to Supabase `companies` table
2. Set `source = 'manual'` for migrated records
3. Remove the local file fallback from the company page template
4. All company pages now served via ISR from Supabase
5. Builds become faster (fewer static pages), admin panel becomes the single source of truth

**EFFORT:** 1-2 hours for migration + template cleanup.

---

## SCALE-01: Jina Reader API Upgrade

**WHEN:** You're approaching 1,000 URL fetches per day (Jina Reader free tier limit), OR Jina starts returning errors/rate limits during peak usage.

**THEN:** Either upgrade to Jina's paid tier OR replace with a custom scraping solution.

**BECAUSE:** Jina Reader's free tier (1,000 requests/day) is sufficient for launch and early growth. But if FinePrint gets significant traffic, every user analysis from a URL hits the Jina API. At 200+ analyses/day, you're at 20% of the free limit. At 1,000/day, you're at the wall.

**CURRENT STATE:** Jina Reader (free tier) as primary, fetch + cheerio as fallback.

**UPGRADE PATH:**
Option A: Jina paid tier (~$20/month for higher limits). Simple, no code change.
Option B: Replace Jina with a self-hosted solution — Playwright or Puppeteer running on a serverless function (Vercel doesn't support these well; may need a separate service on Railway or Fly.io).
Option C: Cache aggressively — if the same URL has been fetched in the last 24 hours, serve the cached text. This reduces API calls dramatically since many users analyze the same popular TOS pages.

**EFFORT:** Option A is 5 minutes. Option B is 1-2 days. Option C is 2-3 hours and should be done regardless.

---

## SCALE-02: Gemini Model Routing

**WHEN:** AI API costs exceed $50/month, OR you notice quality differences between simple TOS (short, standard) and complex TOS (long, unusual clauses).

**THEN:** Implement smart model routing — simple analyses on Gemini Flash-Lite (cheapest), complex analyses on Gemini Flash, company page curation on Gemini Pro (highest quality).

**BECAUSE:** Currently everything runs through Gemini Flash, which is the best quality-to-cost ratio for general use. But at scale, most analyses are for standard TOS documents that a cheaper model handles fine. And flagship company pages (your best SEO content) deserve the highest quality model.

**CURRENT STATE:** All analyses use Gemini Flash (same model for everything).

**UPGRADE PATH:**
1. Add a token-count router: under 3,000 tokens input → Flash-Lite, over 3,000 → Flash
2. Admin panel "Re-Analyze" button already supports choosing a model — use Pro for Tier 1 company pages
3. Monitor quality: if Flash-Lite analyses get user complaints, adjust the routing threshold
4. Estimated savings: 40-60% cost reduction at scale

**EFFORT:** 2-3 hours for the router logic.

---

## VIRAL-01: Wall of Shame Comments

**WHEN:** Wall of Shame submissions consistently get 50+ upvotes AND you're seeing social media discussion ABOUT the submissions that would be better served on your own platform.

**THEN:** Add comments to Wall of Shame submissions.

**BECAUSE:** Currently Wall of Shame has upvotes only — clean, simple, zero moderation burden. But if submissions go viral and people are discussing them on Reddit/Twitter instead of on FinePrint, you're losing engagement and return visits. Comments bring that discussion home.

**CURRENT STATE:** Upvotes only (IP-limited, one per submission). No comments.

**UPGRADE PATH:**
1. Add `comments` table in Supabase (submission_id, comment_text, commenter_ip_hash, status, created_at)
2. All comments go through moderation queue (same admin panel, new tab)
3. Display approved comments below the submission on individual submission pages
4. Rate limit: 5 comments per IP per day
5. Consider requiring a display name (not an account — just a name field) for accountability

**EFFORT:** Half a day for the table + API + display. The ongoing moderation is the real cost.

---

## SEO-01: Dynamic OG Images for All Page Types

**WHEN:** You notice low click-through rates on social shares (people share but nobody clicks), OR you want to A/B test different OG card designs.

**THEN:** Expand OG image generation to support A/B testing and richer card designs (e.g., include specific red flag text, not just the grade).

**BECAUSE:** The current OG card shows company name + grade + verdict. This is good but generic. A card that shows "Instagram claims a non-exclusive worldwide license to all your content" is more clickable than "Instagram — Grade: C-". The red flag text creates curiosity.

**CURRENT STATE:** Dynamic OG images via `@vercel/og` showing grade + verdict for every company page and Wall of Shame entry.

**UPGRADE PATH:**
1. Add a `featured_red_flag` field to the company data — the single most shocking finding, pulled into the OG card
2. A/B test: generate two OG images (grade-only vs. grade + red flag), track click-through rates via share events
3. For Wall of Shame: include a snippet of the actual clause text in the OG image (truncated to fit)

**EFFORT:** 2-3 hours for the enhanced cards. A/B testing adds more complexity.

---

## MONETIZE-01: Ad Network Progression

**WHEN:** Monthly sessions hit the thresholds below.

**THEN:** Apply for the next ad network in the progression.

| Sessions/Month | Network | Action | Expected RPM |
|---|---|---|---|
| 0-10K | Google AdSense | Apply when you have 15+ content pages | $5-$10 |
| 10K-50K | Ezoic | Apply, no minimum but works better at scale | $10-$18 |
| 50K+ | Mediavine | Apply (requires 50K sessions minimum) | $20-$35 |
| 100K+ | Raptive | Consider (requires 100K pageviews) | $25-$45 |

**BECAUSE:** Each ad network tier has higher RPM but higher traffic requirements. Switching too early means rejection. Switching too late means leaving money on the table.

**CURRENT STATE:** `ADS_ENABLED=false`. Ad zone placeholders in place. No ad network active.

**EFFORT:** Application is 30 minutes per network. Integration is 1-2 hours per switch.

---

## MONETIZE-02: Affiliate Integration

**WHEN:** Monthly traffic exceeds 5K visits AND you've identified affiliate partners with decent commissions in the privacy/legal space.

**THEN:** Activate the AffiliateCTA component and populate with real partner links.

**BECAUSE:** Affiliate CTAs are designed and built but hidden behind `AFFILIATE_CTA_ENABLED=false`. Potential partners: NordVPN, ExpressVPN, ProtonMail, DeleteMe, LegalZoom, Rocket Lawyer, attorney matching services.

**CURRENT STATE:** AffiliateCTA component exists, feature-flagged off. No active partnerships.

**UPGRADE PATH:**
1. Research and apply to affiliate programs (NordVPN, ExpressVPN have public programs)
2. Update AffiliateCTA with real links and tracking parameters
3. Set `AFFILIATE_CTA_ENABLED=true`
4. A/B test CTA placement and copy
5. Track conversions per company page (which analyses lead to affiliate clicks)

**EFFORT:** Research is 2-3 hours. Integration is 1 hour. Ongoing optimization is continuous.

---

**Review this document monthly. If any WHEN condition matches your current situation, execute the upgrade. If not, keep building content and traffic.**
