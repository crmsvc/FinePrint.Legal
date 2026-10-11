import { siteConfig } from "@/lib/site/config";
import { HomeTool } from "@/components/site/HomeTool";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Shield, Clock, Eye } from "lucide-react";

function JsonLd() {
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Terms of Service analysis in plain English",
      "Letter grade scoring (A-F)",
      "Privacy Policy breakdown",
      "URL fetching and analysis",
      "PDF and DOCX file upload support",
      "Risk assessment for every clause",
      "Free to use, no account required",
    ],
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />

      {/* Hero */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-6 text-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {siteConfig.tagline}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          {siteConfig.subtitle}
        </p>
      </div>

      {/* Tool */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-12">
        <ErrorBoundary>
          <HomeTool />
        </ErrorBoundary>
      </div>

      {/* Trust signals */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 print:hidden">
        <div className="grid gap-4 sm:grid-cols-3">
          <TrustSignal
            icon={Shield}
            title="Free, no account required"
            description="No signup, no email, no tracking."
          />
          <TrustSignal
            icon={Eye}
            title="We don't store your documents"
            description="Analyses happen in memory, never saved."
          />
          <TrustSignal
            icon={Clock}
            title="AI-powered in seconds"
            description="Get a full breakdown in 10-20 seconds."
          />
        </div>
      </div>
    </>
  );
}

function TrustSignal({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
