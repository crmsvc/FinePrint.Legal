import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/config";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: `Legal Disclaimer — ${siteConfig.name}`,
  description:
    "Legal disclaimer for FinePrint: not a law firm, not legal advice, AI limitations explained.",
  alternates: { canonical: `${siteConfig.url}/disclaimer` },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Legal Disclaimer
      </h1>

      <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-foreground">
            {siteConfig.disclaimer.global}
          </p>
        </div>
      </div>

      <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
        <h2>FinePrint Is NOT a Law Firm</h2>
        <p>
          FinePrint is NOT a law firm and does not provide legal services.
          FinePrint does not employ attorneys and does not create an
          attorney-client relationship with any user.
        </p>

        <h2>This Is NOT Legal Advice</h2>
        <p>
          All analysis provided by FinePrint is educational information, not
          legal advice. The information should not be used as a substitute for
          professional legal counsel. Do not make legal decisions based solely on
          FinePrint analysis.
        </p>

        <h2>AI Limitations</h2>
        <p>
          FinePrint uses artificial intelligence to analyze legal documents. AI
          analysis has inherent limitations:
        </p>
        <ul>
          <li>AI may contain errors or produce incorrect assessments</li>
          <li>AI may miss important nuances or context in legal language</li>
          <li>AI may misinterpret ambiguous clauses</li>
          <li>AI output should not be considered comprehensive legal review</li>
        </ul>

        <h2>Letter Grades</h2>
        <p>
          Letter grades (A through F) are AI-generated assessments based on
          predefined criteria. They are not legal opinions and do not represent
          the views of any attorney or legal professional. Different legal
          experts may reach different conclusions about the same document.
        </p>

        <h2>Company Analyses</h2>
        <p>
          Pre-analyzed company pages are based on publicly available Terms of
          Service and Privacy Policies as of the analysis date. Terms may have
          changed since the analysis was performed. Always check the current
          version of any terms before making decisions.
        </p>

        <h2>Always Consult an Attorney</h2>
        <p>
          Before making any legal decisions — including whether to agree to or
          reject any Terms of Service — consult a qualified attorney licensed in
          your jurisdiction. Legal interpretation depends on your specific
          circumstances, jurisdiction, and applicable law.
        </p>

        <h2>No Warranty</h2>
        <p>
          FinePrint is provided &ldquo;as-is&rdquo; without warranty of any
          kind, express or implied. We make no guarantees regarding accuracy,
          completeness, reliability, or suitability of any analysis.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          FinePrint, its creators, operators, and affiliates shall not be liable
          for any direct, indirect, incidental, special, consequential, or
          punitive damages arising from the use of this service, including but
          not limited to reliance on analysis results, loss of data, or
          interruption of service.
        </p>
      </div>
    </div>
  );
}
