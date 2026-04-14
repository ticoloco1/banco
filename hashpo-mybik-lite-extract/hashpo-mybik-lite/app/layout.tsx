import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HASHPO - Mini sites with links, feed, CV and paywall",
  description:
    "Build your mini site with links, 7-day feed, premium pinned feed, resume, blog and paid content. SEO-friendly structure for Google indexing.",
  keywords: [
    "mini site",
    "link in bio",
    "online resume",
    "premium feed",
    "paywall",
    "mini site SEO",
    "resume directory",
  ],
  openGraph: {
    title: "HASHPO - Mini sites with links, feed, CV and paywall",
    description:
      "Launch a mini site with links, CV, professional directory and premium content.",
    url: "https://hashpo.com/",
    siteName: "HASHPO",
    images: [{ url: "https://hashpo.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HASHPO - Mini sites with links, feed, CV and paywall",
    description:
      "Public mini sites with better indexing potential, online resume and monetization.",
  },
  metadataBase: new URL("https://hashpo.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
