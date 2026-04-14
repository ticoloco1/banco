import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { DollarSign, Percent, Coins, RefreshCw, ShoppingBag, FileText, Hexagon } from "lucide-react";
import { toast } from "sonner";

const AdminRevenueSplits = () => {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  if (!settings) return null;
  const s = settings as any;

  return (
    <div className="space-y-6">
      {/* NFT Launch */}
      <SplitCard
        icon={<Coins className="w-4 h-4 text-primary" />}
        title="NFT Launch"
        description="Fee charged to creators for launching an NFT collection"
        items={[
          { label: "Launch Fee ($)", key: "nft_launch_fee", value: s.nft_launch_fee ?? 300, type: "number" },
          { label: "Creator Share (%)", key: "nft_creator_pct", value: s.nft_creator_pct ?? 70, type: "number" },
          { label: "Platform Share (%)", key: "nft_platform_pct", value: s.nft_platform_pct ?? 30, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* Paywall */}
      <SplitCard
        icon={<DollarSign className="w-4 h-4 text-primary" />}
        title="Paywall Content"
        description="Revenue split & pricing rules for video paywall (12h access)"
        items={[
          { label: "Creator Share (%)", key: "paywall_creator_pct", value: s.paywall_creator_pct ?? 75, type: "number" },
          { label: "Platform Share (%)", key: "paywall_platform_pct", value: s.paywall_platform_pct ?? 25, type: "number" },
          { label: "Access Duration (hours)", key: "paywall_expires_hours", value: s.paywall_expires_hours ?? 12, type: "number" },
          { label: "Min Price — Embed ($)", key: "paywall_min_embed", value: s.paywall_min_embed ?? 0.10, type: "number" },
          { label: "Min Price — Bunny.net ($)", key: "paywall_min_bunny", value: s.paywall_min_bunny ?? 0.60, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* Recharge */}
      <SplitCard
        icon={<RefreshCw className="w-4 h-4 text-primary" />}
        title="View Recharge"
        description="Revenue split when NFT holders buy additional views"
        items={[
          { label: "Creator Share (%)", key: "recharge_creator_pct", value: s.recharge_creator_pct ?? 50, type: "number" },
          { label: "Platform Share (%)", key: "recharge_platform_pct", value: s.recharge_platform_pct ?? 50, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* Marketplace Resale */}
      <SplitCard
        icon={<ShoppingBag className="w-4 h-4 text-primary" />}
        title="Marketplace Resale Fee"
        description="Fee charged on secondary NFT sales (speculative resale)"
        items={[
          { label: "Total Fee (%)", key: "marketplace_fee_pct", value: s.marketplace_fee_pct ?? 5, type: "number" },
          { label: "Creator Royalty (%)", key: "marketplace_creator_pct", value: s.marketplace_creator_pct ?? 2, type: "number" },
          { label: "Platform Fee (%)", key: "marketplace_platform_pct", value: s.marketplace_platform_pct ?? 3, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* CV Contact Unlock */}
      <SplitCard
        icon={<FileText className="w-4 h-4 text-primary" />}
        title="CV Contact Unlock"
        description="Companies pay to unlock creator contact info on CV/profile"
        items={[
          { label: "Unlock Price ($)", key: "cv_unlock_price", value: s.cv_unlock_price ?? 20, type: "number" },
          { label: "Creator Share (%)", key: "cv_creator_pct", value: s.cv_creator_pct ?? 50, type: "number" },
          { label: "Platform Share (%)", key: "cv_platform_pct", value: s.cv_platform_pct ?? 50, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      <SplitCard
        icon={<ShoppingBag className="w-4 h-4 text-primary" />}
        title="Slug Marketplace"
        description="Platform fee for slug sales and auctions"
        items={[
          { label: "Platform Fee (%)", key: "slug_marketplace_fee_pct", value: s.slug_marketplace_fee_pct ?? 10, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      <SplitCard
        icon={<FileText className="w-4 h-4 text-primary" />}
        title="Classifieds & CV Directory Plans"
        description="Monthly plans for classifieds and company CV search"
        items={[
          { label: "Classified Ad Monthly ($)", key: "classified_listing_monthly_usd", value: s.classified_listing_monthly_usd ?? 2, type: "number" },
          { label: "CV Directory Monthly ($)", key: "cv_directory_monthly_usd", value: s.cv_directory_monthly_usd ?? 199, type: "number" },
          { label: "CV Opens Included / Month", key: "cv_directory_monthly_opens", value: s.cv_directory_monthly_opens ?? 15, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* Existing commissions */}
      <SplitCard
        icon={<Percent className="w-4 h-4 text-primary" />}
        title="Exchange & Ads Commissions"
        description="Existing platform commissions for shares trading and advertising"
        items={[
          { label: "Shares Commission (%)", key: "commission_shares", value: s.commission_shares ?? 5, type: "number" },
          { label: "Ads Commission (%)", key: "commission_ads", value: s.commission_ads ?? 35, type: "number" },
          { label: "Brokerage Fee (%)", key: "brokerage_fee_pct", value: s.brokerage_fee_pct ?? 0.5, type: "number" },
        ]}
        onSave={(key, val) => updateSettings.mutate({ [key]: val } as any, { onSuccess: () => toast.success("Updated!") })}
      />

      {/* Polygon Blockchain */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Hexagon className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-bold text-card-foreground uppercase">Polygon Blockchain</h2>
            <p className="text-[10px] text-muted-foreground">Smart contract and wallet addresses for on-chain payments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextSettingInput
            label="Contract Address (Polygon)"
            placeholder="0x..."
            defaultValue={s.polygon_contract_address ?? ""}
            onSave={v => updateSettings.mutate({ polygon_contract_address: v } as any, { onSuccess: () => toast.success("Updated!") })}
          />
          <TextSettingInput
            label="Receiver Wallet (Polygon)"
            placeholder="0x..."
            defaultValue={s.polygon_receiver_address ?? ""}
            onSave={v => updateSettings.mutate({ polygon_receiver_address: v } as any, { onSuccess: () => toast.success("Updated!") })}
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <h3 className="text-sm font-bold text-card-foreground uppercase mb-3">Revenue Model Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-muted-foreground">Source</th>
                <th className="py-2 px-3 text-right text-muted-foreground">Fee/Price</th>
                <th className="py-2 px-3 text-right text-[hsl(var(--ticker-up))]">Creator</th>
                <th className="py-2 px-3 text-right text-primary">Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <Row label="NFT Launch" fee={`$${s.nft_launch_fee ?? 300}`} creator={`${s.nft_creator_pct ?? 70}%`} platform={`${s.nft_platform_pct ?? 30}%`} />
              <Row label="Paywall" fee="Variable" creator={`${s.paywall_creator_pct ?? 75}%`} platform={`${s.paywall_platform_pct ?? 25}%`} />
              <Row label="View Recharge" fee="Variable" creator={`${s.recharge_creator_pct ?? 50}%`} platform={`${s.recharge_platform_pct ?? 50}%`} />
              <Row label="NFT Resale" fee={`${s.marketplace_fee_pct ?? 5}%`} creator={`${s.marketplace_creator_pct ?? 2}%`} platform={`${s.marketplace_platform_pct ?? 3}%`} />
              <Row label="CV Unlock" fee={`$${s.cv_unlock_price ?? 20}`} creator={`${s.cv_creator_pct ?? 50}%`} platform={`${s.cv_platform_pct ?? 50}%`} />
              <Row label="Slug Marketplace" fee={`${s.slug_marketplace_fee_pct ?? 10}%`} creator="Seller receives net" platform={`${s.slug_marketplace_fee_pct ?? 10}%`} />
              <Row label="Classified Listing" fee={`$${s.classified_listing_monthly_usd ?? 2}/month`} creator="N/A" platform="100%" />
              <Row label="CV Directory Plan" fee={`$${s.cv_directory_monthly_usd ?? 199}/month`} creator={`Includes ${s.cv_directory_monthly_opens ?? 15} CV opens`} platform="Plan revenue" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, fee, creator, platform }: { label: string; fee: string; creator: string; platform: string }) => (
  <tr>
    <td className="py-2 px-3 font-medium text-foreground">{label}</td>
    <td className="py-2 px-3 text-right font-mono">{fee}</td>
    <td className="py-2 px-3 text-right font-mono font-bold text-[hsl(var(--ticker-up))]">{creator}</td>
    <td className="py-2 px-3 text-right font-mono font-bold text-primary">{platform}</td>
  </tr>
);

type SplitItem = { label: string; key: string; value: number; type: "number" };

const SplitCard = ({ icon, title, description, items, onSave }: {
  icon: React.ReactNode; title: string; description: string;
  items: SplitItem[]; onSave: (key: string, val: number) => void;
}) => (
  <div className="border border-border rounded-lg p-5 bg-card space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <h2 className="text-sm font-bold text-card-foreground uppercase">{title}</h2>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map(item => (
        <SplitInput key={item.key} label={item.label} defaultValue={item.value} onSave={v => onSave(item.key, v)} />
      ))}
    </div>
  </div>
);

const SplitInput = ({ label, defaultValue, onSave }: { label: string; defaultValue: number; onSave: (v: number) => void }) => {
  const [value, setValue] = useState(String(defaultValue));
  useEffect(() => { setValue(String(defaultValue)); }, [defaultValue]);
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 mt-1">
        <input type="number" value={value} onChange={e => setValue(e.target.value)} step="0.1"
          className="flex-1 bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={() => onSave(parseFloat(value) || 0)}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
      </div>
    </label>
  );
};

const TextSettingInput = ({ label, placeholder, defaultValue, onSave }: { label: string; placeholder?: string; defaultValue: string; onSave: (v: string) => void }) => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => { setValue(defaultValue); }, [defaultValue]);
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 mt-1">
        <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary truncate" />
        <button onClick={() => onSave(value)}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
      </div>
    </label>
  );
};

export default AdminRevenueSplits;
