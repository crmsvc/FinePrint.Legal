import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";
import { Shield, UserX, Link2, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: `About ${siteConfig.name} — Plain-English Terms of Service Analysis`,
  description:
    "Learn how FinePrint analyzes Terms of Service and Privacy Policies in plain English, with letter grades and risk assessments.",
  alternates: { canonical: `${siteConfig.url}/about` },
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        About {siteConfig.name}
      </h1>

      <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <h2>What We Do</h2>
        <p>
          FinePrint cuts through legal jargon to tell you what you&apos;re
          actually agreeing to when you click &ldquo;I accept.&rdquo; Paste a
          URL, drop in a privacy policy, or upload a TOS — and get a
          plain-English breakdown with a letter grade in seconds.
        </p>

        <h2>How It Works</h2>
        <ol>
          <li>
            <strong>Submit a policy</strong> — Paste a URL to any company&apos;s
            Terms of Service, paste the text directly, or upload a document.
          </li>
          <li>
            <strong>AI analyzes it</strong> — Our AI reads every clause and
            grades the policy A through F based on how it treats users.
          </li>
          <li>
            <strong>Get your breakdown</strong> — Seven sections explain what
            they collect, what they do with it, what rights you give up, and
            more.
          </li>
        </ol>

        <h2>Who It&apos;s For</h2>
        <ul>
          <li>
            Anyone who&apos;s ever agreed to terms without reading them
          </li>
          <li>
            Parents curious about what their kids signed up for
          </li>
          <li>Freelancers evaluating new SaaS tools</li>
          <li>Journalists and researchers investigating data practices</li>
        </ul>

        <h2>Trust &amp; Transparency</h2>
        <div className="not-prose mt-4 grid gap-4 sm:grid-cols-2">
          <TrustCard
            icon={Eye}
            title="We don't store your documents"
            text="Analyses happen in memory, never saved to our servers."
          />
          <TrustCard
            icon={UserX}
            title="No account required"
            text="No signup, no email, no login."
          />
          <TrustCard
            icon={Shield}
            title="URLs are not logged"
            text="We fetch the public TOS page on your behalf, but don't store which URLs you submit."
          />
          <TrustCard
            icon={Link2}
            title="URL fetching explained"
            text="We use the Jina Reader API to fetch the public text of TOS pages — the same content any visitor would see in their browser."
          />
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Want to know how we assign grades?{" "}
          <a href="/how-we-grade" className="text-accent hover:underline">
            See our grading methodology →
          </a>
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          FinePrint is an educational tool, not a law firm. For full legal
          details, see our{" "}
          <a href="/disclaimer" className="text-accent hover:underline">
            disclaimer
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
