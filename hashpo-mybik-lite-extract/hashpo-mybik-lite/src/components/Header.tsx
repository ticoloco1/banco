import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import AvatarMenu from "@/components/AvatarMenu";
import WalletButton from "@/components/WalletButton";
import NotificationBell from "@/components/NotificationBell";
import VerificationModal from "@/components/VerificationModal";
import { TrendingUp, HelpCircle, ShoppingBag, Briefcase, Crown, Globe, BadgeCheck, Link2, Tag, LayoutGrid, Car, Home, FileText, Megaphone, Package } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";

const Header = () => {
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const [showVerification, setShowVerification] = useState(false);
  const { t, language, setLanguage, languages } = useI18n();

  const platformName = settings?.platform_name || "HASHPO";
  const logoUrl = settings?.logo_url;

  return (
    <>
      <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-50 bg-primary border-b-2 border-accent">
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
          ) : (
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          )}
          <div className="flex flex-col">
            <span className="text-primary-foreground font-black text-lg tracking-tight font-mono leading-none">
              {platformName}
            </span>
            <span className="text-accent text-[8px] font-mono uppercase tracking-[0.2em] leading-none font-bold">
              Videos • Mini Sites • Jobs
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/servicos" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Package className="w-3.5 h-3.5" /> {t("nav.services")}
          </Link>
          <Link href="/how-it-works" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <HelpCircle className="w-3.5 h-3.5" /> {t("nav.howItWorks")}
          </Link>
          <Link href="/marketplace" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <ShoppingBag className="w-3.5 h-3.5" /> {t("nav.marketplace")}
          </Link>
          <Link href="/exchange" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <TrendingUp className="w-3.5 h-3.5" /> {t("nav.exchange")}
          </Link>
          <Link href="/" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/directory" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <LayoutGrid className="w-3.5 h-3.5" /> {t("nav.directory")}
          </Link>
          <Link href="/professionais" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Tag className="w-3.5 h-3.5" /> {t("nav.professions")}
          </Link>
          <Link href="/domains" className="hidden lg:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Globe className="w-3.5 h-3.5" /> {t("nav.domains")}
          </Link>
          <Link href="/slugs" className="hidden lg:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Link2 className="w-3.5 h-3.5" /> {t("nav.slugs")}
          </Link>
          <Link href="/careers" className="hidden sm:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Briefcase className="w-3.5 h-3.5" /> {t("nav.jobs")}
          </Link>
          <Link href="/cv" className="hidden sm:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <FileText className="w-3.5 h-3.5" /> {t("nav.cv")}
          </Link>
          <Link href="/classificados" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Megaphone className="w-3.5 h-3.5" /> {t("nav.classifieds")}
          </Link>
          <Link href="/carros" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Car className="w-3.5 h-3.5" /> {t("nav.cars")}
          </Link>
          <Link href="/imoveis" className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Home className="w-3.5 h-3.5" /> {t("nav.properties")}
          </Link>
          <Link href="/site/edit" className="hidden lg:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
            <Crown className="w-3.5 h-3.5" /> {t("nav.miniSite")}
          </Link>
          <label className="hidden xl:flex items-center gap-1 text-primary-foreground/80 text-[10px] font-extrabold">
            {t("label.language")}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="h-7 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 px-2 text-primary-foreground text-[10px] font-bold"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.name}
                </option>
              ))}
            </select>
          </label>
          {user && (
            <button onClick={() => setShowVerification(true)} className="hidden md:flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-extrabold transition-colors">
              <BadgeCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <WalletButton />
          <NotificationBell />
          <AvatarMenu />
        </nav>
      </header>
      {user && <VerificationModal open={showVerification} onClose={() => setShowVerification(false)} />}
    </>
  );
};

export default Header;
