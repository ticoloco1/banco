import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface KYCModalProps {
  open: boolean;
  onClose: () => void;
}

const KYCModal = ({ open, onClose }: KYCModalProps) => {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleVerify = async () => {
    if (!user || !confirmed) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ kyc_verified: true, kyc_verified_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Verification failed");
    } else {
      toast.success("Identity verified successfully!");
      onClose();
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Identity Verification (KYC)</h2>
        </div>

        <div className="bg-accent/10 rounded p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-accent-foreground">
            You must be at least 18 years old to buy shares, boost content, or access the exchange. This is a regulatory requirement.
          </p>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground">
          <p>By verifying your identity, you confirm:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>You are at least 18 years of age</li>
            <li>You understand that shares are high-risk digital assets</li>
            <li>You accept the terms of the perpetual license agreement</li>
            <li>You acknowledge HASHPO is a tech platform, not a financial advisor</li>
          </ul>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="accent-primary"
          />
          <span className="text-xs font-semibold text-card-foreground">
            I confirm I am 18+ and accept the terms above
          </span>
        </label>

        <button
          onClick={handleVerify}
          disabled={!confirmed || loading}
          className="w-full gold-bg font-bold text-sm py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify My Identity"}
        </button>

        <p className="text-[7px] text-muted-foreground/60 text-center">
          HASHPO IS A TECH PLATFORM. HIGH RISK ASSET. TRADING INVOLVES RISK OF TOTAL LOSS.
        </p>
      </div>
    </div>
  );
};

export default KYCModal;
