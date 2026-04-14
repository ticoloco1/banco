"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://hashpo.com";
const DEFAULT_TITLE = "HASHPO – Creator Content Exchange on Polygon";
const DEFAULT_DESC =
  "Tokenise your content, trade creator shares and earn dividends — all in USDC on Polygon.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    const [attrName] = selector.match(/\[([^\]]+)=/) ?? [];
    if (attrName) {
      const name = attrName.replace(/[\[\]"'=]/g, "").split("=")[0];
      el.setAttribute(name, attr);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const setCanonical = (href: string) => {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
}: SEOProps) => {
  const pathname = usePathname() ?? "";
  const resolvedTitle = title ? `${title} | HASHPO` : DEFAULT_TITLE;
  const resolvedDesc = description || DEFAULT_DESC;
  const resolvedCanonical = canonical || `${BASE_URL}${pathname}`;
  const resolvedImage = ogImage || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = resolvedTitle;

    setMeta('meta[name="description"]', "content", resolvedDesc);
    setMeta('meta[name="robots"]', "content", noIndex ? "noindex, nofollow" : "index, follow");

    // OG
    setMeta('meta[property="og:title"]', "content", resolvedTitle);
    setMeta('meta[property="og:description"]', "content", resolvedDesc);
    setMeta('meta[property="og:url"]', "content", resolvedCanonical);
    setMeta('meta[property="og:image"]', "content", resolvedImage);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", resolvedTitle);
    setMeta('meta[name="twitter:description"]', "content", resolvedDesc);
    setMeta('meta[name="twitter:image"]', "content", resolvedImage);

    // Canonical
    setCanonical(resolvedCanonical);
  }, [resolvedTitle, resolvedDesc, resolvedCanonical, resolvedImage, noIndex]);

  return null;
};

export default SEO;
