import { useState } from "react";
import SEO from "@/components/SEO";
import { useNavigate, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/mockDatabase";
import { toast } from "sonner";
import { Upload, ArrowLeft, Info, Globe, Server } from "lucide-react";

const subcategories: Record<string, string[]> = {
  filmmaker: ["Short Film", "Documentary", "Music Video", "Vlog", "Tutorial"],
  singer: ["Cover", "Original", "Live Performance", "Acoustic", "Remix"],
  musician: ["Instrumental", "Beat", "Composition", "Live Session", "Tutorial"],
  podcaster: ["Interview", "Solo", "Panel", "News", "Commentary"],
  streamer: ["Gameplay", "IRL", "Talk Show", "Creative", "Esports"],
  gamer: ["Walkthrough", "Review", "Highlights", "Speedrun", "Tips"],
  influencer: ["Lifestyle", "Fashion", "Travel", "Food", "Tech"],
  "digital-artist": ["Timelapse", "Tutorial", "Showcase", "Process", "NFT"],
  designer: ["UI/UX", "Graphic", "Motion", "Branding", "3D"],
  journalist: ["Investigation", "Report", "Opinion", "Interview", "Breaking"],
};

type HostingType = "embed" | "upload";

const hostingPlans: { id: HostingType; label: string; price: string; priceNum: number; minPaywall: number; icon: React.ReactNode; desc: string }[] = [
  { id: "embed", label: "Embed (YouTube, Rumble)", price: "$5.99/yr", priceNum: 5.99, minPaywall: 0.15, icon: <Globe className="w-5 h-5" />, desc: "External embed. Min paywall: $0.15 USDC. Thumbnail frames stored locally." },
  { id: "upload", label: "Upload to HASHPO CDN", price: "$19.90/yr", priceNum: 19.90, minPaywall: 0.60, icon: <Server className="w-5 h-5" />, desc: "Bunny.net CDN hosting. Min paywall: $0.60 USDC. Thumbnail frames stored locally." },
];

function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(40, '0')}`;
}

function generateTicker(title: string): string {
  const words = title.replace(/[^a-zA-Z ]/g, '').split(' ').filter(Boolean);
  let ticker = '';
  for (const w of words) {
    ticker += w[0].toUpperCase();
    if (ticker.length >= 3) break;
  }
  while (ticker.length < 3) ticker += 'X';
  const num = Math.floor(Math.random() * 90) + 10;
  return `$${ticker.slice(0, 3)}${num}`;
}

const AD_SLOTS = [
  { id: "footer_banner", label: "Footer banner (40px) inside video player" },
  { id: "top_banner", label: "Top banner (40px) above video player" },
  { id: "sponsor_logo", label: "Sponsor logo overlay (top-left corner)" },
  { id: "pre_roll", label: "Full-screen pre-roll ad (5 seconds before video)" },
];

const Studio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [madeForKids, setMadeForKids] = useState(false);
  const [aiContent, setAiContent] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [hostingType, setHostingType] = useState<HostingType>("embed");
  const [paywallPrice, setPaywallPrice] = useState("0.15");

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAccepted) { toast.error("You must accept the legal declaration."); return; }
    if (!title.trim() || !category) { toast.error("Title and category are required."); return; }

    const pw = parseFloat(paywallPrice);
    const minPaywall = selectedPlan.minPaywall;
    if (isNaN(pw) || pw < minPaywall) { 
      toast.error(`Minimum paywall price for ${selectedPlan.label} is $${minPaywall.toFixed(2)} USDC.`); 
      return; 
    }

    setSubmitting(true);
    try {
      const ticker = generateTicker(title);
      const metadataHash = generateHash(JSON.stringify({ title, description, category, subcategory }));
      const videoHash = generateHash(videoUrl || title);
      const legalHash = generateHash(`legal-${user.id}-${Date.now()}`);
      const tagsArray = hashtags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

      const { error } = await supabase.from("videos").insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        ticker,
        creator_id: user.id,
        video_url: videoUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        status: "draft" as any,
        subcategory: subcategory || null,
        hashtags: tagsArray.length > 0 ? tagsArray : null,
        made_for_kids: madeForKids,
        ai_content: aiContent,
        metadata_hash: metadataHash,
        video_hash: videoHash,
        legal_hash: legalHash,
        listing_plan: hostingType,
        hosting_type: hostingType,
        share_price: 1.0,
        total_shares: 1000,
        paywall_price: pw,
      } as any);

      if (error) throw error;
      toast.success("Video registered as DRAFT! Go to Channel Content to publish.");
      navigate("/channel");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const subs = subcategories[category] || [];
  const selectedPlan = hostingPlans.find(p => p.id === hostingType)!;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Creator Studio" description="Upload and list your content on HASHPO. Set your price, issue shares, and start earning." noIndex />
      <Header />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-extrabold text-foreground uppercase tracking-wide">HASHPO Studio</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} required
              className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Video title" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={4}
              className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Describe your content..." />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase">Category *</label>
              <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }} required
                className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase">Subcategory</label>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!category}
                className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40">
                <option value="">Select...</option>
                {subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase">Hashtags</label>
            <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#music, #viral, #indie"
              className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-[10px] text-muted-foreground">Comma-separated. Max 10 tags.</p>
          </div>

          {/* Paywall Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase">Paywall Price (USDC) *</label>
            <input type="number" step="0.01" min={selectedPlan.minPaywall} value={paywallPrice} onChange={e => setPaywallPrice(e.target.value)}
              className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            <p className="text-[10px] text-muted-foreground">Min: ${selectedPlan.minPaywall.toFixed(2)} USDC for {selectedPlan.label}.</p>
          </div>

          {/* Hosting Plan */}
          <div className="space-y-3 border-t border-border pt-4">
            <label className="text-xs font-bold text-foreground uppercase">Hosting Plan (Annual) *</label>
            <div className="grid grid-cols-1 gap-3">
              {hostingPlans.map(plan => (
                <button type="button" key={plan.id} onClick={() => setHostingType(plan.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors flex items-start gap-3 ${hostingType === plan.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className={`mt-0.5 ${hostingType === plan.id ? "text-primary" : "text-muted-foreground"}`}>{plan.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{plan.label}</span>
                      <span className="text-lg font-extrabold font-mono text-primary">{plan.price}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{plan.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 gap-4">
            {hostingType === "embed" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase">Embed URL (YouTube, Rumble, etc.)</label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            {hostingType === "upload" && (
              <div className="space-y-1.5 bg-secondary/50 rounded-lg p-4">
                <label className="text-xs font-bold text-foreground uppercase">Upload Video to HASHPO CDN</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                  <p className="text-[9px] text-muted-foreground mt-1">MP4, MOV, WebM — Max 2GB</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Thumbnail frames will be auto-extracted and stored locally</p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase">Thumbnail URL</label>
              <input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..."
                className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Mandatory Ads Notice */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-foreground uppercase">Mandatory Ad Slots</label>
              <span className="text-[9px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-bold">REQUIRED</span>
            </div>
            <p className="text-[10px] text-muted-foreground">All listed videos must accept the following ad placements. This is non-negotiable and ensures platform sustainability.</p>
            <div className="space-y-2">
              {AD_SLOTS.map(slot => (
                <div key={slot.id} className="flex items-center gap-2 bg-secondary/50 rounded px-3 py-2">
                  <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                    <span className="text-primary-foreground text-[8px] font-bold">✓</span>
                  </div>
                  <span className="text-xs text-foreground">{slot.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={madeForKids} onChange={e => setMadeForKids(e.target.checked)} className="rounded border-border" />
              <span className="text-xs text-foreground">Made for Kids</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={aiContent} onChange={e => setAiContent(e.target.checked)} className="rounded border-border" />
              <span className="text-xs text-foreground">AI / Altered Content Disclosure</span>
            </label>
          </div>

          {/* Legal */}
          <div className="space-y-2 border-t border-border pt-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={legalAccepted} onChange={e => setLegalAccepted(e.target.checked)} className="mt-0.5 rounded border-border" />
              <span className="text-[11px] text-foreground leading-relaxed">
                I declare this content is mine and follows HASHPO safety policies. I accept all mandatory ad placements. I understand that once shares are issued, this content becomes <strong>permanently immutable</strong> and cannot be edited or deleted.
              </span>
            </label>
          </div>

          {/* Price Summary */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Annual Hosting Fee</span>
              <span className="text-lg font-extrabold font-mono text-primary">{selectedPlan.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Paywall Price</span>
              <span className="text-sm font-mono font-bold text-foreground">${parseFloat(paywallPrice || "0").toFixed(2)} USDC</span>
            </div>
          </div>

          {/* Hashes Preview */}
          {title && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <Info className="w-3 h-3" /> Lazy Mint Hashes (Off-Chain)
              </div>
              <div className="text-[9px] font-mono text-muted-foreground space-y-0.5 break-all">
                <p>META: {generateHash(JSON.stringify({ title, description, category, subcategory }))}</p>
                <p>VIDEO: {generateHash(videoUrl || title)}</p>
                <p>LEGAL: {generateHash(`legal-${user.id}-${Date.now()}`)}</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting || !legalAccepted}
            className="w-full bg-primary text-primary-foreground font-bold text-sm py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
            {submitting ? "Registering..." : "Register Video (Draft)"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Studio;
