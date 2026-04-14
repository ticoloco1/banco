"use client";

import Link from "next/link";
import Header from "@/components/Header";
import HeroSection from "@/components/home/HeroSection";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import MiniSiteShowcase from "@/components/home/MiniSiteShowcase";
import DirectorySection from "@/components/home/DirectorySection";
import ServicosSection from "@/components/home/ServicosSection";
import ZicoFusionSection from "@/components/home/ZicoFusionSection";
import AiChatWidget from "@/components/AiChatWidget";
import { useSettings } from "@/hooks/useSettings";
import type { PlatformSettings } from "@/hooks/useSettings";

export default function HomePage({
  initialSettings,
}: {
  initialSettings?: PlatformSettings | null;
}) {
  const { data: settings } = useSettings();
  const resolved = (settings ?? initialSettings) as PlatformSettings | undefined;
  const platformName = resolved?.platform_name || "HASHPO";

  return (
    <div
      className="min-h-screen bg-background"
      style={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}
    >
      <Header />
      <HeroSection />
      <FeaturesGrid />
      <ZicoFusionSection />
      <MiniSiteShowcase />
      <DirectorySection />
      <ServicosSection />

      <AiChatWidget
        siteName={platformName}
        siteContext={`Site principal ${platformName}. Plataforma de mini sites com links, feed de 7 dias, feed fixo premium por US$10, currículo online, diretório profissional e conteúdo com paywall.`}
      />

      <footer className="bg-primary text-primary-foreground py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 text-xs opacity-90 mb-3">
          <Link href="/servicos" className="hover:underline">Serviços</Link>
          <Link href="/classificados" className="hover:underline">Classificados</Link>
          <Link href="/how-it-works" className="hover:underline">Como funciona</Link>
          <Link href="/directory" className="hover:underline">Diretório</Link>
          <Link href="/cv" className="hover:underline">CV</Link>
        </div>
        <p className="text-[9px] font-mono text-center opacity-70">
          {resolved?.footer_text ||
            "HASHPO · MINI SITES · LINKS · FEED · CV · PAYWALL · DIRETÓRIO · © 2026"}
        </p>
      </footer>
    </div>
  );
}
