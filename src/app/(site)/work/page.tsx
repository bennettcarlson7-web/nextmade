import { siteConfig } from "@/lib/site-config";
import { buildMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/button";
import { ProductsSection } from "@/components/products/products-section";
import { PageHero } from "@/components/sections/page-hero";
import { CTASection } from "@/components/sections/cta-section";

export const metadata = buildMetadata({
  title: "Work — The Products We're Building",
  description: `The AI products ${siteConfig.name} is building — ClientFlow AI, CommercePilot AI, and FieldOps AI: what each one does, how it works, and where it stands.`,
  path: "/work",
});

/** Real work only: our own products. Client case studies are added here once they're complete and approved. */
export default function WorkPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Work", href: "/work" }]}
        eyebrow="Work"
        title="Real problems, practical solutions"
        intro="The software we're building ourselves, designed around real business problems. See what each product does, how it works, and exactly where it stands."
        actions={
          <ButtonLink href="#products" size="lg" arrow>
            See Our Products
          </ButtonLink>
        }
      />

      <ProductsSection />

      <CTASection
        title="Want to see how we'd approach your project?"
        body="Share a short description and we'll walk you through how we would scope it, what we'd build first, and the trade-offs worth considering."
      />
    </>
  );
}
