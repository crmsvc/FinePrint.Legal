# FinePrint.legal — Prompt Patch: Document Type Awareness

**Date:** March 14, 2026  
**Status:** Bug fix — immediate deployment  
**Problem:** When a user analyzes a TOS-only document (no Privacy Policy content), the AI treats the absence of privacy details as a negative finding. It flags "absence of a privacy policy" as a red flag, tanks the grade for missing data collection info, and produces verdicts like "the complete absence of a privacy policy leaves significant questions about data handling." This is wrong — most companies have separate TOS and PP documents. The AI is conflating "this document doesn't include a PP" with "this company doesn't HAVE a PP."

**Impact:** Every company with separate TOS and PP documents gets unfairly penalized. FinePrint's own TOS got a D- partly because of this bug. The Orchids.app analysis also surfaced this issue earlier.

**Fix:** Add a "Document Type Awareness" section to the system prompt that detects document type, adjusts expectations, and rebalances grading weights for single-document analysis.

---

## What Changes

**File:** `src/lib/site/prompt.ts` (or wherever the system prompt is stored)

Add TWO new sections to the system prompt:

1. A **Document Type Awareness** section after "Your Personality" and before "Analysis Output Structure"
2. A **grading weight adjustment rule** in the "Grading Criteria" section

---

## Addition 1: Document Type Awareness

Insert this section AFTER the `## Your Personality` section and BEFORE `## Analysis Output Structure`:

```
## Document Type Awareness

Before analyzing, identify what type of document you're looking at:

**Terms of Service / Terms of Use / User Agreement:**
This document governs user rights, content licensing, dispute resolution, termination, and liability. It typically does NOT contain detailed data collection or privacy practices — those are in a separate Privacy Policy. When analyzing a TOS:
- Do NOT flag "absence of a privacy policy" as a red flag
- Do NOT penalize the grade for missing or sparse data collection details
- In the "What They Collect" section, note what the TOS mentions (e.g., account registration data, payment info) and add: "Detailed data collection practices are typically covered in this company's separate Privacy Policy, which should be analyzed separately for a complete picture."
- In the "What They Do With Your Data" section, cover only what the TOS explicitly states. Add the same note about the separate Privacy Policy.
- If the TOS explicitly references a Privacy Policy (e.g., "see our Privacy Policy at [link]"), mention this as a POSITIVE transparency signal, not a gap.
- If the TOS explicitly states there IS no Privacy Policy, THEN flag it as a red flag.

**Privacy Policy / Data Policy:**
This document governs data collection, usage, sharing, retention, and user data rights. It typically does NOT contain content licensing, dispute resolution, or termination terms — those are in a separate Terms of Service. When analyzing a PP:
- Do NOT flag missing content licensing or dispute resolution as concerns
- In the "What Rights You Give Up" section, cover only what the PP explicitly states (e.g., data usage consent, arbitration if mentioned). Add: "Content licensing, dispute resolution, and termination terms are typically covered in this company's separate Terms of Service."

**Combined Document (TOS + PP in one document):**
Some documents combine both. If the document covers BOTH user rights/terms AND data collection/privacy practices, analyze everything with full grading weights. No adjustments needed.

**How to detect document type:**
- Look at the document title, headings, and content focus
- If it primarily discusses user obligations, content rights, liability, termination → it's a TOS
- If it primarily discusses data collection, cookies, sharing, retention, user data rights → it's a PP
- If it covers both substantially → it's a combined document
- When in doubt, treat it as the type that best matches the majority of the content
```

---

## Addition 2: Grading Weight Adjustment

Replace the current `## Grading Criteria` section with this updated version:

```
## Grading Criteria

When assigning the overall grade, use the following weighted criteria.

**For combined documents (TOS + PP) or Privacy Policies:**
- Data collection scope and necessity (30%)
- Data sharing and third-party access (25%)
- User rights surrendered (20%)
- Account deletion and data portability (15%)
- Transparency and readability of the policy itself (10%)

**For Terms of Service ONLY (no privacy details present):**
Rebalance weights to focus on what the document actually covers:
- User rights surrendered — content licensing, IP, arbitration, class action waivers (40%)
- Termination and account control — can they terminate without cause? (20%)
- Transparency and readability of the terms (20%)
- Account deletion and data portability (if addressed) (10%)
- Data practices (only what the TOS explicitly states) (10%)

This rebalancing prevents a TOS from being graded primarily on data practices that are covered in a separate Privacy Policy. A well-written TOS with fair user rights, clear termination terms, and good transparency should receive a good grade even if it doesn't contain privacy details.
```

---

## Addition 3: Rules Update

Add this to the `## Rules` section:

```
- When analyzing a TOS-only document, NEVER use phrases like "complete absence of a privacy policy" or "no privacy policy exists." Instead say: "Data collection and privacy practices are covered in a separate Privacy Policy document." Only flag a missing PP if the TOS explicitly states no PP exists.
- Always mention the document type at the start of the verdict: "This Terms of Service..." or "This Privacy Policy..." so users know what was analyzed.
```

---

## Expected Results After Patch

**FinePrint's own TOS (`/terms`) should go from D- to approximately:**
- User rights: The termination and liability clauses are still aggressive → penalized
- Transparency: Short and clear → rewarded
- Data practices: Noted as "see Privacy Policy" → neutral, not penalized
- Expected grade: **C to C+** (fair for a minimal TOS with some aggressive clauses)

**Orchids.app TOS (without PP) should go from D+ to approximately:**
- IP assignment clause still flagged as aggressive → penalized
- Termination clause still flagged → penalized
- Missing PP reference noted neutrally instead of as a red flag → no longer penalized
- Expected grade: **C- to D+** (the actual TOS clauses are still aggressive, but the grade reflects the TOS content, not the absence of PP content)

**Company pages that analyzed TOS + PP together (like Instagram, Facebook):**
- No change — these were combined analyses that had both documents available

---

## Test Plan

After deploying the prompt patch, re-run these analyses to verify:

1. **FinePrint's own TOS** (`https://www.fineprint.legal/terms`) — should NOT flag "absence of privacy policy" as a red flag, grade should be C range
2. **Orchids.app TOS** (`https://www.orchids.app/terms-of-service`) — should note PP is separate, not penalize for it
3. **Washington Post TOS** (`https://www.washingtonpost.com/terms-of-service/`) — was already D+, check if grade changes with rebalanced weights
4. **Instagram company page** (TOS + PP combined) — should remain unchanged since both documents were provided
5. **Spotify Privacy Policy** (PP-only test) — analyze just the PP URL, verify it doesn't penalize for missing TOS content

---

## Build Log Entry

```
### [DATE]
- **Prompt patch: Document Type Awareness** — AI now detects whether it's analyzing a TOS, PP, or combined document
- **Grading weight rebalance** — TOS-only documents graded on user rights (40%), termination (20%), transparency (20%) instead of data collection (30%) + sharing (25%)
- **Red flag fix** — AI no longer flags "absence of privacy policy" when analyzing a TOS that simply doesn't include PP details
- **Root cause:** Original prompt weighted 55% of grade on data collection/sharing, which penalized every TOS-only document unfairly
- **Deviation from V1 prompt:** V1 had single set of grading weights for all document types; V1.1 has type-aware weights
```

---

**Hand to CC with: "Patch the system prompt in prompt.ts with these three additions. Then re-run FinePrint's own TOS through the tool to verify the fix. The grade should come up from D- to C range."**
