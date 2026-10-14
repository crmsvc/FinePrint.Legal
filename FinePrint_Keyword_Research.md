# FinePrint.legal — Keyword Research & Competitive Analysis

**Date:** March 13, 2026  
**Status:** Pre-Architecture — Informs content strategy and URL structure  
**Purpose:** Guide page planning, SEO strategy, and Wall of Shame keyword targeting

---

## Competitive Landscape Summary

### Direct Competitors

| Competitor | Model | Strengths | Weaknesses | Threat Level |
|---|---|---|---|---|
| **ToS;DR (tosdr.org)** | Community-curated, volunteer grading A-E | Established brand (since 2012), browser extensions, DuckDuckGo integration | Slow (volunteer-dependent), can't analyze arbitrary TOS, dated UX, non-profit funding constraints | Medium — brand authority but can't do instant analysis |
| **iWeaver** | AI multi-model (Gemini/GPT/Claude), freemium | Batch processing, URL support, multi-format | Premium-gated features, enterprise focus, no community/viral mechanic, 3 free/day | Low — different market (prosumer/enterprise) |
| **DontGetScammed.net** | AI scam detection, 3/hour rate limit | Niche focus, Discord bot | Beta quality, narrow scope (scam-only), no SEO content, small audience | Low |
| **PrivacyPolicyAnalyzer.com** | AI analysis, Chrome extension | Privacy lawyer credibility claim | Zero Chrome extension reviews, early stage, Cloudflare-blocked access | Very Low |
| **Various GPT wrappers** | ChatGPT/yeschat.ai custom GPTs | Easy to create | No SEO, no brand, no organic traffic, require ChatGPT accounts | Negligible |

### Indirect Competitors

| Competitor | Why They Matter |
|---|---|
| **TLDRLegal** | Only ~3,500 monthly visits, focused on open-source licenses. Proves the "plain English legal" niche has limited competition but also limited execution |
| **Consumer Reports** | Their TOS articles go viral but they don't have a dedicated tool |
| **Bored Panda / Reddit threads** | Outrageous TOS clauses consistently go viral — proves the "Wall of Shame" concept has audience demand |
| **Medium / law firm blogs** | Currently fill the gap for company-specific TOS explanations — low-authority, scattered content |

### The Gap We Exploit

1. **No tool does instant AI analysis of ANY company's TOS from a URL** — ToS;DR only covers pre-reviewed services
2. **No community-driven viral content platform** exists for TOS outrage
3. **No one owns company-specific SEO pages** — "[Company] TOS explained" returns scattered blog posts
4. **No consumer-first UX** — everything is academic, enterprise, or hobby-project quality
5. **No letter-grade + clause-level hybrid scoring** with instant AI

---

## Keyword Strategy: Three Tiers

### Tier 1: Company-Specific Keywords (Highest Volume, Lowest Competition)

These are the SEO gold mine. Every major company's TOS/privacy policy generates search queries, and NO dedicated tool owns these results. Blog posts and law firm articles currently rank — FinePrint can outrank all of them with purpose-built, regularly-updated pages.

**URL Pattern:** `/company/[company-slug]`

| Target Keyword Cluster | Est. Monthly Volume | Competition | Priority |
|---|---|---|---|
| instagram terms of service explained | 20,000+ | Low-Medium | P1 |
| facebook privacy policy explained | 18,000+ | Medium | P1 |
| tiktok terms of service | 25,000+ | Medium | P1 |
| spotify privacy policy | 15,000+ | Low-Medium | P1 |
| snapchat terms of service | 10,000+ | Low | P1 |
| twitter/X terms of service | 12,000+ | Medium | P1 |
| google privacy policy explained | 20,000+ | Medium | P1 |
| amazon terms of service | 8,000+ | Low | P1 |
| netflix terms of service | 6,000+ | Low | P2 |
| uber terms of service | 5,000+ | Low | P2 |
| airbnb terms of service | 7,000+ | Low | P2 |
| discord terms of service | 8,000+ | Low | P1 |
| chatgpt terms of service / openai privacy policy | 12,000+ | Low | P1 |
| apple privacy policy explained | 10,000+ | Medium | P2 |
| zoom privacy policy | 6,000+ | Low | P2 |
| linkedin privacy policy | 5,000+ | Low | P2 |
| venmo terms of service | 4,000+ | Low | P2 |
| doordash terms of service | 3,000+ | Low | P3 |
| roblox terms of service | 8,000+ | Low | P1 |
| twitch terms of service | 5,000+ | Low | P2 |

**Content Format per Company Page:**
- Letter grade (A-F) prominently displayed
- "Last analyzed: [date]" for freshness signal
- What they collect (data breakdown)
- What they do with your data
- Red flags (with risk badges)
- How to delete your account / opt out
- CTA: "Analyze a different service →"

**SEO Advantage:** These pages get re-indexed every time a company updates their TOS, keeping content fresh. Wall of Shame submissions from these companies feed additional long-tail content.

**Important Note:** Company pages are NOT guide pages — they're tool output pages generated from real analyses. This is a critical architectural distinction. They live at `/company/[slug]` not `/guides/[slug]`.

---

### Tier 2: Concept/Clause Keywords (Educational, Link-Worthy)

These are the DecipherDocs-equivalent guide pages — explaining common TOS/privacy policy concepts in plain English. Each one links to the tool and to relevant company pages.

**URL Pattern:** `/guides/[slug]`

| Target Keyword Cluster | Est. Monthly Volume | Competition | Priority |
|---|---|---|---|
| what is binding arbitration clause | 15,000+ | Medium | P1 |
| class action waiver explained | 10,000+ | Low-Medium | P1 |
| what does "we may share your data" mean | 8,000+ | Low | P1 |
| data retention policy explained | 6,000+ | Low | P1 |
| what is a EULA / end user license agreement | 12,000+ | Medium | P2 |
| right to be forgotten explained | 8,000+ | Low-Medium | P2 |
| what does non-exclusive worldwide license mean | 5,000+ | Low | P1 |
| auto-renewal terms of service | 9,000+ | Low-Medium | P1 |
| can companies change terms of service without notice | 7,000+ | Low | P1 |
| what data do apps collect about you | 10,000+ | Low | P1 |
| AI training data privacy rights | 6,000+ | Low | P1 |
| GDPR explained simple | 15,000+ | Medium | P2 |
| CCPA privacy rights explained | 8,000+ | Medium | P2 |
| how to opt out of data selling | 5,000+ | Low | P1 |
| what happens to data when you delete account | 4,000+ | Low | P2 |

**Content Format per Guide:**
- 800-1,200 words
- Direct answer in first paragraph (GEO optimization)
- Real examples from company TOS (links to company pages)
- "What to do about it" action section
- FAQ schema for featured snippets
- CTA: "Check if your favorite app respects your privacy →"

---

### Tier 3: Action/Comparison Keywords (High Intent, Conversion-Focused)

These capture users actively looking for a tool like FinePrint.

**URL Pattern:** Homepage + `/about` optimization

| Target Keyword Cluster | Est. Monthly Volume | Competition | Priority |
|---|---|---|---|
| analyze terms of service | 3,000+ | Low | P1 |
| AI terms of service analyzer | 2,000+ | Low | P1 |
| read privacy policy for me | 4,000+ | Low | P1 |
| TOS too long didn't read | 5,000+ | Low | P1 |
| is [app] safe to use / is [app] privacy safe | 10,000+ (combined) | Low | P1 |
| worst privacy policies | 6,000+ | Low | P1 (Wall of Shame) |
| apps that sell your data | 8,000+ | Low-Medium | P1 (Wall of Shame) |
| compare privacy policies | 3,000+ | Low | P2 (future feature) |
| free terms of service checker | 2,000+ | Low | P1 |
| what am I agreeing to | 4,000+ | Low | P1 |

---

## URL Architecture Recommendation

Based on this research, FinePrint needs THREE content types, not two:

```
fineprint.legal/
├── /                               ← Homepage + Tool
├── /company/                       ← Company-specific analysis pages (Tier 1)
│   ├── /company/instagram
│   ├── /company/spotify
│   ├── /company/tiktok
│   └── ... (20+ at launch, growing)
├── /guides/                        ← Educational concept pages (Tier 2)
│   ├── /guides/binding-arbitration-explained
│   ├── /guides/class-action-waiver
│   └── ... (15+ planned)
├── /wall-of-shame/                 ← Phase 2: Community submissions
│   ├── /wall-of-shame/             ← Rankings/leaderboard
│   └── /wall-of-shame/[slug]       ← Individual submissions
├── /about
├── /privacy
├── /terms
├── /disclaimer
└── /sitemap.xml
```

**The `/company/` section is the single biggest SEO opportunity.** No competitor has this. Each page is a permanently indexed, regularly refreshed analysis that targets high-volume company-name queries.

---

## Content Calendar: First 8 Weeks Post-Launch

### Company Pages (Tier 1) — 3 per week

| Week | Companies |
|---|---|
| 1 | Instagram, TikTok, Spotify |
| 2 | Facebook/Meta, Google, Twitter/X |
| 3 | Discord, ChatGPT/OpenAI, Snapchat |
| 4 | Amazon, Netflix, Roblox |
| 5 | Apple, Uber, Airbnb |
| 6 | Zoom, LinkedIn, Twitch |
| 7 | Venmo, DoorDash, YouTube (separate from Google) |
| 8 | WhatsApp, Telegram, Reddit |

### Guide Pages (Tier 2) — 2 per week

| Week | Guides |
|---|---|
| 1 | Binding arbitration explained, Class action waiver explained |
| 2 | What "non-exclusive worldwide license" means, Auto-renewal clause traps |
| 3 | What data do apps really collect, AI training and your data |
| 4 | Can companies change TOS without telling you, How to opt out of data selling |
| 5 | GDPR rights in plain English, Right to be forgotten |
| 6 | Data retention explained, What happens when you delete your account |
| 7 | CCPA privacy rights, EULA explained simply |
| 8 | Worst things hidden in terms of service, How to actually read a privacy policy |

---

## Wall of Shame Keyword Opportunity (Phase 2)

The Wall of Shame becomes an organic content engine. Every submission creates a unique page targeting:

- `[Company] worst TOS clause`
- `[Company] privacy policy red flag`
- `apps that [specific bad practice]` (e.g., "apps that sell location data")
- `most invasive privacy policy`
- `worst terms of service [year]`

These are the queries that go viral on Reddit and social media. The Wall of Shame turns FinePrint from a utility into a destination.

---

## Key Takeaways for Architecture

1. **Three content types, not two** — Company pages (`/company/`) are distinct from guide pages (`/guides/`) and need their own route structure
2. **Company pages need a refresh mechanism** — "Last analyzed" date + ability to re-run analysis when TOS changes
3. **Internal linking is critical** — Guide pages link to company pages as examples, company pages link to relevant guides, tool results link to both
4. **URL structure must be clean and descriptive** — `/company/instagram` not `/company/123`
5. **Structured data varies by page type** — Company pages get Product/Review schema, guides get FAQ/HowTo schema, homepage gets WebApplication schema
6. **The homepage targets action keywords** — "analyze terms of service," "read privacy policy for me"
7. **Company pages are the moat** — First to build comprehensive, AI-analyzed company TOS pages wins the long-tail SEO game

---

**This document feeds directly into FinePrint_Architecture_v1.md. All keyword targets, URL structures, and content strategies above should be reflected in the architecture.**
