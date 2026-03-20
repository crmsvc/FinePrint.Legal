import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site/config";
import { GradeBadge } from "@/components/site/GradeBadge";

export const metadata: Metadata = {
  title: `How We Grade Terms of Service & Privacy Policies | ${siteConfig.name}`,
  description:
    "Our scoring methodology breaks down five key areas: data collection, data sharing, user rights, exit difficulty, and transparency. Here's how we calculate letter grades.",
  alternates: { canonical: `${siteConfig.url}/how-we-grade` },
  openGraph: {
    title: `How We Grade Terms of Service & Privacy Policies | ${siteConfig.name}`,
    description:
      "Our scoring methodology breaks down five key areas: data collection, data sharing, user rights, exit difficulty, and transparency.",
  },
};

const scoringCriteria = [
  {
    name: "Data Collection Scope",
    weight: "30%",
    description:
      "How much data they collect and whether it's necessary for the service. Collecting your name for an account is expected. Collecting your contacts, location, and browsing history when they don't need it drops the grade.",
  },
  {
    name: "Data Sharing & Third Parties",
    weight: "25%",
    description:
      "Who gets your data, for what purpose, and whether you can opt out. Sharing with service providers is normal. Selling to data brokers or licensing to AI companies without clear consent is not.",
  },
  {
    name: "User Rights Surrendered",
    weight: "20%",
    description:
      "Content licensing terms, arbitration clauses, class action waivers, and IP assignment. A perpetual, irrevocable, worldwide license on your content is far more aggressive than a service-operation-only license.",
  },
  {
    name: "Account Deletion & Portability",
    weight: "15%",
    description:
      "How easy it is to leave, what data they keep after deletion, and whether you can export your data. A 30-day deletion with data export is good. A 90-day wait with 7-year retention is not.",
  },
  {
    name: "Transparency & Readability",
    weight: "10%",
    description:
      "Is the policy clear, accessible, and honest about what they're doing? Buried settings, misleading toggles, and vague language all hurt this score.",
  },
];

const gradeScale = [
  { grade: "A", label: "Excellent", description: "Industry-leading privacy practices. Minimal data collection, strong user rights, easy exit." },
  { grade: "A-", label: "Very Good", description: "Strong protections with minor areas for improvement." },
  { grade: "B+", label: "Good", description: "Above-average practices. Respectful of user data with some standard industry compromises." },
  { grade: "B", label: "Fair", description: "Solid baseline. Reasonable data practices, decent transparency." },
  { grade: "B-", label: "Fair", description: "Acceptable but with notable gaps in one or two areas." },
  { grade: "C+", label: "Average", description: "Industry standard — which is, frankly, nothing to brag about. More data collection than necessary." },
  { grade: "C", label: "Mediocre", description: "Typical big-tech terms. Broad data collection, ad targeting, limited user control." },
  { grade: "C-", label: "Below Average", description: "Worse than average. Aggressive licensing, poor deletion, or extensive tracking." },
  { grade: "D+", label: "Poor", description: "Problematic terms that heavily favor the company over users." },
  { grade: "D", label: "Bad", description: "Invasive practices, hostile exit terms, or exploitative data monetization." },
  { grade: "D-", label: "Very Bad", description: "Among the worst in the industry. Multiple red flags across all categories." },
  { grade: "F", label: "Fail", description: "Predatory terms. Avoid if possible." },
];

const faqItems = [
  {
    question: "Why are so many companies getting C's?",
    answer:
      "Because the industry standard genuinely IS mediocre. Most companies collect more data than necessary, share it broadly, and make it hard to leave. A C doesn't mean we're being generous — it means the bar is that low.",
  },
  {
    question: "Is FinePrint a legal authority?",
    answer:
      "No. FinePrint provides educational analysis using AI. Grades are AI-generated assessments based on our scoring criteria, not legal opinions. Always consult a qualified attorney for legal decisions.",
  },
  {
    question: "How often are grades updated?",
    answer:
      "Company pages are re-analyzed when a company updates their Terms of Service. The \"Last analyzed\" date on each page tells you when we last reviewed the document.",
  },
  {
    question: "Can companies request a review?",
    answer:
      "We welcome corrections. If a company believes their grade doesn't reflect their actual practices, they can contact us. But the grade is based on what's in the published TOS, not what a company says they do.",
  },
  {
    question: "Why didn't my analysis get a letter grade?",
    answer:
      "Letter grades require both the Terms of Service and Privacy Policy analyzed together from a verified source URL. If you pasted text or uploaded a file, you'll get a full analysis with risk badges but no grade. Use the Paste URL tab — we'll automatically find the companion document and give you the complete grade.",
  },
];

export default function HowWeGradePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          How We Grade
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Our methodology for evaluating Terms of Service and Privacy Policies.
        </p>

        {/* What Qualifies for a Grade */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">
            What Qualifies for a Grade
          </h2>
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A FinePrint letter grade represents a complete review of both a
              company&apos;s Terms of Service AND Privacy Policy, analyzed
              together. We only assign letter grades when both documents have
              been verified from the same source.
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              This ensures every grade reflects the full picture &mdash; not just
              half the story. A Terms of Service alone can&apos;t tell you about
              data collection. A Privacy Policy alone can&apos;t tell you about
              content licensing. You need both for the complete assessment.
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              If you analyze a single document (just a TOS or just a PP),
              you&apos;ll still get our full plain-English breakdown with risk
              badges on every clause. The letter grade is the bonus you earn when
              both documents are verified.
            </p>
          </div>
        </section>

        {/* Scoring Criteria */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-foreground">
            Scoring Criteria
          </h2>
          <p className="mt-2 text-muted-foreground">
            Every analysis evaluates five weighted factors. The combined score
            determines the letter grade.
          </p>

          <div className="mt-6 space-y-4">
            {scoringCriteria.map((criteria) => (
              <div
                key={criteria.name}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-foreground">
                    {criteria.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                    {criteria.weight}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {criteria.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Grade Scale */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground">
            The Grading Scale
          </h2>
          <p className="mt-2 text-muted-foreground">
            From A (excellent) to F (avoid). Here&apos;s what each grade means.
          </p>

          <div className="mt-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Label
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground hidden sm:table-cell">
                    What It Means
                  </th>
                </tr>
              </thead>
              <tbody>
                {gradeScale.map((row) => (
                  <tr
                    key={row.grade}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <GradeBadge grade={row.grade} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real Examples */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Real Examples
          </h2>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s how real companies score across our grading system.
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">
                B Range &mdash; Above Average
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  href="/company/decipherdocs-com"
                  className="text-accent hover:underline"
                >
                  DecipherDocs.com (B-)
                </Link>{" "}
                earns a spot in our{" "}
                <Link
                  href="/hall-of-fame"
                  className="text-accent hover:underline"
                >
                  Hall of Fame
                </Link>{" "}
                with limited data collection, clear policies, and genuine
                respect for user privacy. The bar for a B- is high &mdash;
                most companies don&apos;t clear it.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">
                C Range &mdash; Industry Standard (Mediocre)
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  href="/company/google"
                  className="text-accent hover:underline"
                >
                  Google (C-)
                </Link>
                ,{" "}
                <Link
                  href="/company/discord"
                  className="text-accent hover:underline"
                >
                  Discord (C-)
                </Link>
                ,{" "}
                <Link
                  href="/company/chatgpt"
                  className="text-accent hover:underline"
                >
                  ChatGPT (C-)
                </Link>
                , and{" "}
                <Link
                  href="/company/linkedin"
                  className="text-accent hover:underline"
                >
                  LinkedIn (C-)
                </Link>{" "}
                collect more data than necessary, share broadly, and limit user
                control &mdash; but at least they&apos;re somewhat transparent
                about it. This is where most of Big Tech lands.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">
                D Range &mdash; Problematic
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  href="/company/facebook"
                  className="text-accent hover:underline"
                >
                  Facebook (D+)
                </Link>
                ,{" "}
                <Link
                  href="/company/reddit"
                  className="text-accent hover:underline"
                >
                  Reddit (D+)
                </Link>
                ,{" "}
                <Link
                  href="/company/spotify"
                  className="text-accent hover:underline"
                >
                  Spotify (D+)
                </Link>
                ,{" "}
                <Link
                  href="/company/uber"
                  className="text-accent hover:underline"
                >
                  Uber (D-)
                </Link>
                , and{" "}
                <Link
                  href="/company/x-twitter"
                  className="text-accent hover:underline"
                >
                  X/Twitter (D-)
                </Link>{" "}
                have aggressive data collection, exploitative content licenses,
                and practices that heavily favor the company over users.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-lg border border-border bg-card p-5"
              >
                <h3 className="font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            Ready to see how your favorite app scores?
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors cursor-pointer"
            >
              Analyze Any TOS
            </Link>
            <Link
              href="/company"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Browse Companies
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
