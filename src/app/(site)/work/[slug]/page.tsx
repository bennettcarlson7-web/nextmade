import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getProducts } from "@/content/products";
import { buildMetadata } from "@/lib/seo";
import { ProductDetail } from "@/components/products/product-detail";

// Fully prerendered from generateStaticParams; unknown slugs render the 404 page.
// Retired concept-project addresses redirect to /work (see next.config.ts).
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return buildMetadata({ title: `${product.name} — ${product.category}`, description: product.seoDescription, path: `/work/${slug}` });
}

export default async function ProductPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
