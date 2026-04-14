import { useState, useEffect, useRef } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Palette, Type, Globe, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FONT_OPTIONS = [
  "Inter", "Poppins", "Roboto", "Montserrat", "Playfair Display",
  "Space Grotesk", "DM Sans", "Outfit", "Sora", "Clash Display",
  "Satoshi", "Cabinet Grotesk", "General Sans", "Switzer",
];

const AdminBranding = () => {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [fontHeading, setFontHeading] = useState("Inter");
  const [fontBody, setFontBody] = useState("Inter");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [heroText, setHeroText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [hashpoName, setHashpoName] = useState("");
  const [hashpoColor, setHashpoColor] = useState("");
  const [mybikName, setMybikName] = useState("");
  const [mybikColor, setMybikColor] = useState("");
  const [trustbankName, setTrustbankName] = useState("");
  const [trustbankColor, setTrustbankColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;
    const s = settings as any;
    setPlatformName(s.platform_name || "HASHPO");
    setLogoUrl(s.logo_url || "");
    setFontHeading(s.font_heading || "Inter");
    setFontBody(s.font_body || "Inter");
    setPrimaryColor(s.primary_color || "222 100% 20%");
    setAccentColor(s.accent_color || "51 100% 50%");
    setHeroText(s.hero_text || "");
    setFooterText(s.footer_text || "");
    setHashpoName(s.brand_hashpo_name || "HASHPO");
    setHashpoColor(s.brand_hashpo_color || "51 100% 50%");
    setMybikName(s.brand_mybik_name || "MYBIK");
    setMybikColor(s.brand_mybik_color || "210 90% 56%");
    setTrustbankName(s.brand_trustbank_name || "TrustBank");
    setTrustbankColor(s.brand_trustbank_color || "155 70% 43%");
  }, [settings]);

  const handleSave = (key: string, value: any) => {
    updateSettings.mutate({ [key]: value } as any, {
      onSuccess: () => toast.success(`${key} updated!`),
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("platform-assets").getPublicUrl(path);
      setLogoUrl(publicUrl);
      handleSave("logo_url", publicUrl);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    handleSave("logo_url", "");
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Platform Identity</h2>
        </div>

        <Field label="Platform Name" value={platformName} onChange={setPlatformName}
          onSave={() => handleSave("platform_name", platformName)} />

        {/* Logo Upload */}
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Platform Logo</span>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg flex-1">
                <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                <div className="flex-1 text-xs text-muted-foreground truncate">{logoUrl.split("/").pop()}</div>
                <button onClick={handleRemoveLogo} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm font-bold text-muted-foreground disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {uploading ? "Uploading..." : "Upload Logo"}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logoUrl && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="bg-primary text-primary-foreground px-3 py-2 rounded text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? "..." : "Change"}
              </button>
            )}
          </div>
        </div>

        <Field label="Hero Title" value={heroText} onChange={setHeroText}
          onSave={() => handleSave("hero_text", heroText)} />

        <Field label="Footer Disclaimer" value={footerText} onChange={setFooterText}
          onSave={() => handleSave("footer_text", footerText)} />
      </div>

      {/* Typography */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Typography</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Heading Font</span>
            <div className="flex gap-2">
              <select value={fontHeading} onChange={e => setFontHeading(e.target.value)}
                className="flex-1 bg-secondary text-foreground text-sm border border-border rounded px-3 py-2">
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => handleSave("font_heading", fontHeading)}
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
            </div>
            <p className="mt-2 text-lg font-bold" style={{ fontFamily: fontHeading }}>Preview Heading Text</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Body Font</span>
            <div className="flex gap-2">
              <select value={fontBody} onChange={e => setFontBody(e.target.value)}
                className="flex-1 bg-secondary text-foreground text-sm border border-border rounded px-3 py-2">
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => handleSave("font_body", fontBody)}
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
            </div>
            <p className="mt-2 text-sm" style={{ fontFamily: fontBody }}>Preview body text for the platform.</p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Theme Colors (HSL)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Field label="Primary Color (HSL)" value={primaryColor} onChange={setPrimaryColor}
              onSave={() => handleSave("primary_color", primaryColor)} placeholder="222 100% 20%" />
            <div className="mt-2 h-8 rounded" style={{ background: `hsl(${primaryColor})` }} />
          </div>
          <div>
            <Field label="Accent Color (HSL)" value={accentColor} onChange={setAccentColor}
              onSave={() => handleSave("accent_color", accentColor)} placeholder="51 100% 50%" />
            <div className="mt-2 h-8 rounded" style={{ background: `hsl(${accentColor})` }} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Format: H S% L% (e.g. 222 100% 20%)</p>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Multi-Brand Domains</h2>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Ajuste nome e cor para cada domínio: mybik.com, hashpo.com e trustbank.xyz.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Field label="hashpo.com Name" value={hashpoName} onChange={setHashpoName} onSave={() => handleSave("brand_hashpo_name", hashpoName)} />
            <Field label="hashpo.com Color (HSL)" value={hashpoColor} onChange={setHashpoColor} onSave={() => handleSave("brand_hashpo_color", hashpoColor)} placeholder="51 100% 50%" />
            <div className="h-6 rounded" style={{ background: `hsl(${hashpoColor || "51 100% 50%"})` }} />
          </div>
          <div className="space-y-2">
            <Field label="mybik.com Name" value={mybikName} onChange={setMybikName} onSave={() => handleSave("brand_mybik_name", mybikName)} />
            <Field label="mybik.com Color (HSL)" value={mybikColor} onChange={setMybikColor} onSave={() => handleSave("brand_mybik_color", mybikColor)} placeholder="210 90% 56%" />
            <div className="h-6 rounded" style={{ background: `hsl(${mybikColor || "210 90% 56%"})` }} />
          </div>
          <div className="space-y-2">
            <Field label="trustbank.xyz Name" value={trustbankName} onChange={setTrustbankName} onSave={() => handleSave("brand_trustbank_name", trustbankName)} />
            <Field label="trustbank.xyz Color (HSL)" value={trustbankColor} onChange={setTrustbankColor} onSave={() => handleSave("brand_trustbank_color", trustbankColor)} placeholder="155 70% 43%" />
            <div className="h-6 rounded" style={{ background: `hsl(${trustbankColor || "155 70% 43%"})` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, onSave, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; onSave: () => void; placeholder?: string;
}) => (
  <label className="block">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex gap-2 mt-1">
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
      <button onClick={onSave}
        className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
    </div>
  </label>
);

export default AdminBranding;
