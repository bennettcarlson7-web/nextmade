import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  // Indexing is on for the production deployment only (see siteConfig.allowIndexing).
  if (!siteConfig.allowIndexing || !siteConfig.url) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  // Everything public is crawlable; the private admin area and form endpoints are not.
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: absoluteUrl("/sitemap.xml") ?? undefined,
  };
}
