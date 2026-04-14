import Link from "next/link";
import { Crown, Star, Sparkles, Globe } from "lucide-react";

const tiers = [
  { letters: "1 letter", example: "hashpo.com/@a", price: "$2,000", icon: Crown, highlight: true },
  { letters: "2 letters", example: "hashpo.com/@ab", price: "$1,500", icon: Star, highlight: false },
  { letters: "3 letters", example: "hashpo.com/@abc", price: "$1,000", icon: Sparkles, highlight: false },
  { letters: "4 letters", example: "hashpo.com/@abcd", price: "$500", icon: Globe, highlight: false },
];

const SubdomainPricing = () => (
  <section className="py-16 px-6 bg-primary/5">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
        Premium Subdomains
      </h2>
      <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
        Grab a short, memorable slug for your mini site. The shorter the slug, the more exclusive and valuable.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div
            key={t.letters}
            className={`rounded-xl p-6 border text-center transition-all hover:-translate-y-1 hover:shadow-lg ${
              t.highlight
                ? "bg-accent text-accent-foreground border-accent shadow-md"
                : "bg-card border-border"
            }`}
          >
            <t.icon className={`w-8 h-8 mx-auto mb-3 ${t.highlight ? "text-accent-foreground" : "text-accent"}`} />
            <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{t.letters}</p>
            <p className={`text-2xl font-black mb-2 ${t.highlight ? "" : "text-foreground"}`}>{t.price}</p>
            <p className={`text-[11px] font-mono ${t.highlight ? "opacity-80" : "text-muted-foreground"}`}>
              {t.example}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-6">
        5+ letter slugs are <strong>free</strong> for all users. Premium slugs are one-time purchases.
      </p>
      <Link
        href="/site/edit"
        className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 rounded-lg font-bold text-sm mt-6 hover:opacity-90 transition-opacity"
      >
        Claim Your Slug
      </Link>
    </div>
  </section>
);

export default SubdomainPricing;
