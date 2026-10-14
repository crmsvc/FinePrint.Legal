import Link from "next/link";
import { siteConfig } from "@/lib/site/config";
import { Separator } from "@/components/ui/separator";

const WALL_OF_SHAME_ENABLED = false;

const footerLinks = [
  { label: "About", href: siteConfig.links.about },
  { label: "Companies", href: siteConfig.links.companies },
  { label: "Guides", href: siteConfig.links.guides },
  ...(WALL_OF_SHAME_ENABLED
    ? [{ label: "Wall of Shame", href: "/wall-of-shame" }]
    : []),
  { label: "Privacy", href: siteConfig.links.privacy },
  { label: "Terms", href: siteConfig.links.terms },
  { label: "Disclaimer", href: siteConfig.links.disclaimer },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Disclaimer */}
        <div className="rounded-lg border border-border bg-background p-4 text-center text-xs leading-relaxed text-muted-foreground">
          {siteConfig.disclaimer.global}
        </div>

        <Separator className="my-6" />

        {/* Nav + copyright */}
        <div className="flex flex-col items-center gap-4 text-center">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
