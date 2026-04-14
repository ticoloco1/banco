import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { AuthProvider } from "@/hooks/useAuth";
import { createWagmiConfig, fetchWalletConnectId } from "@/lib/web3Config";
import type { Config } from "wagmi";
import Index from "./views/Index";
import Admin from "./views/Admin";
import Auth from "./views/Auth";
import VideoDetail from "./views/VideoDetail";
import Dashboard from "./views/Dashboard";
import Studio from "./views/Studio";
import Channel from "./views/Channel";
import Advertiser from "./views/Advertiser";
import CreatorProfile from "./views/CreatorProfile";
import Exchange from "./views/Exchange";
import ExchangeIndex from "./views/ExchangeIndex";
import ExchangeFutures from "./views/ExchangeFutures";
import MiniSiteEditor from "./views/MiniSiteEditor";
import MiniSitePublic from "./views/MiniSitePublic";
import MiniSiteDirectory from "./views/MiniSiteDirectory";
import Marketplace from "./views/Marketplace";
import Careers from "./views/Careers";
import HowItWorks from "./views/HowItWorks";
import SubdomainAuction from "./views/SubdomainAuction";
import Directory from "./views/Directory";
import DomainMarketplace from "./views/DomainMarketplace";
import SlugMarketplace from "./views/SlugMarketplace";
import NotFound from "./views/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [wagmiConfig, setWagmiConfig] = useState<Config>(() =>
    createWagmiConfig()
  );

  useEffect(() => {
    fetchWalletConnectId().then((id) => {
      if (id) setWagmiConfig(createWagmiConfig(id));
    });
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/governance" element={<Admin />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/video/:id" element={<VideoDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/channel" element={<Channel />} />
                <Route path="/advertiser" element={<Advertiser />} />
                <Route path="/creator/:id" element={<CreatorProfile />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/exchange/index" element={<ExchangeIndex />} />
                <Route path="/exchange/futures" element={<ExchangeFutures />} />
                <Route path="/site/edit" element={<MiniSiteEditor />} />
                <Route path="/s/:slug" element={<MiniSitePublic />} />
                <Route path="/@:slug" element={<MiniSitePublic />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/professionais" element={<MiniSiteDirectory />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/auction" element={<SubdomainAuction />} />
                <Route path="/domains" element={<DomainMarketplace />} />
                <Route path="/slugs" element={<SlugMarketplace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
