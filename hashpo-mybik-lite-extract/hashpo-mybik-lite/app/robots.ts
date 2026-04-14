import type { MetadataRoute } from "next";

/** Robots básicos: mini sites e home indexáveis; área logada e API não. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/site/edit", "/auth", "/api/"],
    },
    sitemap: "https://hashpo.com/sitemap.xml",
  };
}
