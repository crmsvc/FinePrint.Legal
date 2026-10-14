import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
  description:
    "FinePrint's privacy policy: what we collect, how we use it, and your rights.",
  alternates: { canonical: `${siteConfig.url}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        FinePrint Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 19, 2026
      </p>

      <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <p>
          FinePrint is a free, AI-powered educational tool. We believe in
          practicing what we preach &mdash; so here&apos;s exactly what we
          collect, what we do with it, and what we don&apos;t do.
        </p>

        <h2>The Short Version</h2>
        <ul>
          <li>We don&apos;t require accounts, emails, or personal information</li>
          <li>Documents you submit are processed in memory and never stored</li>
          <li>
            Your IP address is hashed (made irreversible) and used only for rate
            limiting
          </li>
          <li>
            We use cookieless analytics that don&apos;t track individual users
          </li>
          <li>We don&apos;t sell, share, or monetize your personal data</li>
          <li>
            We don&apos;t use your submitted documents to train AI models
          </li>
        </ul>

        <h2>What We Collect</h2>

        <h3>Technical Data</h3>
        <p>
          <strong>Your IP address</strong> is hashed immediately upon receipt
          using a one-way hash function. The original IP address is never
          stored. The hash is used solely to enforce rate limits (
          {siteConfig.rateLimit.maxRequests} analyses per 24-hour period) and is
          automatically deleted after 24 hours.
        </p>

        <h3>Submitted Content</h3>
        <p>
          <strong>URLs you submit</strong> are used to fetch publicly available
          web pages for analysis. The fetched text is processed in real-time by
          our AI model (Google Gemini API) and is not stored on our servers
          after the analysis is returned to you.
        </p>
        <p>
          <strong>Text you paste or files you upload</strong> are similarly
          processed in memory only. They are sent to the AI model for analysis
          and discarded immediately after results are generated.
        </p>

        <h3>Website Analytics</h3>
        <p>
          We use <strong>Plausible Analytics</strong>, a privacy-focused,
          cookieless analytics service. Plausible does not use cookies, does not
          track individual users, and does not collect personal information. It
          provides us with aggregate data only &mdash; total page views,
          referral sources, and general geographic regions. No personal data is
          collected for analytics purposes.
        </p>

        <h3>Company Directory Data</h3>
        <p>When users submit companies to our public directory, we store:</p>
        <ul>
          <li>The company name and domain</li>
          <li>The TOS and Privacy Policy URLs used for analysis</li>
          <li>The AI-generated analysis content and grade</li>
          <li>A hashed version of the submitter&apos;s IP (for abuse prevention)</li>
        </ul>
        <p>
          This is information ABOUT the analyzed company, not about the user who
          submitted it. No personal user data is stored in directory submissions.
        </p>

        <h3>Share Events</h3>
        <p>When you use the share button on an analysis, we record:</p>
        <ul>
          <li>Which page was shared (e.g., &ldquo;Instagram company page&rdquo;)</li>
          <li>
            Which platform was selected (e.g., &ldquo;Facebook,&rdquo;
            &ldquo;Copy Link&rdquo;)
          </li>
          <li>A timestamp</li>
        </ul>
        <p>
          We do NOT record your IP address, identity, or any personal
          information with share events. This data helps us understand which
          analyses are most useful to our users.
        </p>

        <h2>What We Do With Your Data</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Purpose</th>
                <th>Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IP hash</td>
                <td>Rate limiting only</td>
                <td>24 hours, then deleted</td>
              </tr>
              <tr>
                <td>Submitted URLs/text</td>
                <td>AI analysis only</td>
                <td>Not stored &mdash; processed in memory</td>
              </tr>
              <tr>
                <td>Analytics (Plausible)</td>
                <td>Understand site usage (aggregate)</td>
                <td>Managed by Plausible</td>
              </tr>
              <tr>
                <td>Directory submissions</td>
                <td>Public company directory</td>
                <td>Indefinite (public content)</td>
              </tr>
              <tr>
                <td>Share events</td>
                <td>Understand sharing patterns</td>
                <td>Indefinite (no personal data)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>What We Don&apos;t Do</h2>
        <ul>
          <li>
            <strong>We don&apos;t sell your data.</strong> Period.
          </li>
          <li>
            <strong>We don&apos;t share personal data with third parties.</strong>{" "}
            The AI model (Google Gemini) processes the document text you submit
            but does not receive your IP address or any personal identifiers.
          </li>
          <li>
            <strong>We don&apos;t use cookies for tracking.</strong> Our
            analytics are cookieless. When display ads are enabled, ad networks
            may use their own cookies &mdash; we&apos;ll clearly disclose this
            when it applies.
          </li>
          <li>
            <strong>We don&apos;t train AI on your submissions.</strong>{" "}
            Documents you submit are processed by Google Gemini&apos;s API for
            analysis only. We do not use your submitted content to fine-tune,
            train, or improve any AI models. Google&apos;s Gemini API data
            handling is governed by their own terms.
          </li>
          <li>
            <strong>We don&apos;t build user profiles.</strong> We don&apos;t
            have accounts, logins, or any mechanism to track individual users
            across sessions.
          </li>
        </ul>

        <h2>Third-Party Services</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Their Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Gemini API</td>
                <td>AI analysis of submitted documents</td>
                <td>
                  <a
                    href="https://ai.google.dev/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google AI Privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Vercel</td>
                <td>Website hosting</td>
                <td>
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vercel Privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Supabase</td>
                <td>Database for company directory</td>
                <td>
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Supabase Privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Upstash Redis</td>
                <td>Rate limiting</td>
                <td>
                  <a
                    href="https://upstash.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Upstash Privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Plausible Analytics</td>
                <td>Website analytics</td>
                <td>
                  <a
                    href="https://plausible.io/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Plausible Privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td>Jina Reader</td>
                <td>URL content fetching</td>
                <td>
                  <a
                    href="https://jina.ai/legal/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Jina Privacy
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Your Rights</h2>
        <p>
          Since we don&apos;t collect personal data beyond a temporary IP hash,
          there is minimal personal data to exercise rights over. However:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> You can contact us to ask what data we hold
            about you (the answer is likely &ldquo;none&rdquo; or &ldquo;a
            temporary IP hash that expires in 24 hours&rdquo;)
          </li>
          <li>
            <strong>Deletion:</strong> IP hashes auto-delete after 24 hours.
            Share events contain no personal data. Directory submissions can be
            removed by contacting us.
          </li>
          <li>
            <strong>Opt-out of analytics:</strong> Plausible respects
            &ldquo;Do Not Track&rdquo; browser settings automatically
          </li>
        </ul>

        <h2>Children&apos;s Privacy</h2>
        <p>
          FinePrint is not directed at children under 13. We do not knowingly
          collect information from children. If you believe a child has submitted
          information to us, please contact us.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          When we update this policy, we&apos;ll change the &ldquo;Last
          Updated&rdquo; date at the top and note significant changes on the
          website. We encourage you to review this policy periodically.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about our privacy practices? Reach us at{" "}
          <strong>privacy@fineprint.legal</strong>.
        </p>
      </div>
    </div>
  );
}
