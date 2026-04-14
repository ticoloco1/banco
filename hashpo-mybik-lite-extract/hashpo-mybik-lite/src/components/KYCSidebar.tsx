import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useState } from "react";
import KYCModal from "@/components/KYCModal";

const KYCSidebar = () => {
  const { user, kycVerified } = useAuth();
  const { data: settings } = useSettings();
  const [kycOpen, setKycOpen] = useState(false);

  return (
    <>
      <KYCModal open={kycOpen} onClose={() => setKycOpen(false)} />
      <div className="bg-card border border-border rounded-lg p-4 space-y-4 sticky top-24">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wide">
              KYC Status
            </h3>
          </div>

          {!user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-secondary rounded p-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Sign in required</span>
              </div>
            </div>
          ) : kycVerified ? (
            <div className="flex items-center gap-2 bg-primary/10 rounded p-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Verified Identity</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-accent/10 rounded p-3">
                <AlertTriangle className="w-4 h-4 text-accent-foreground" />
                <span className="text-xs font-semibold text-accent-foreground">Not Verified</span>
              </div>
              <button
                onClick={() => setKycOpen(true)}
                className="w-full gold-bg font-bold text-sm py-2.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Verify Identity (18+)
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Platform Fees
          </h4>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listing (Internal)</span>
              <span className="font-mono font-bold text-card-foreground">${settings?.listing_fee_internal ?? 20}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listing (Annual)</span>
              <span className="font-mono font-bold text-card-foreground">${settings?.annual_plan_price ?? 80}/yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paywall Fee</span>
              <span className="font-mono font-bold text-card-foreground">{settings?.commission_paywall ?? 30}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ads Fee</span>
              <span className="font-mono font-bold text-card-foreground">{settings?.commission_ads ?? 35}%</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono">Polygon Network</span>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-[7px] text-muted-foreground/60 leading-tight">
            HASHPO IS A TECH PLATFORM. CONTENT IS CREATOR RESPONSIBILITY. HIGH RISK ASSET.
            Shares do not represent equity ownership. Trading involves risk of total loss.
          </p>
        </div>
      </div>
    </>
  );
};

export default KYCSidebar;
