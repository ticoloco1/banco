'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/r2';
import { useAuth } from '@/hooks/useAuth';
import { useMySite } from '@/hooks/useSite';
import { useCart } from '@/store/cart';
import { Home, Upload, X, Plus, MapPin, DollarSign, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { PLATFORM_USD } from '@/lib/platformPricing';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { ClassifiedMapPicker } from '@/components/classified/ClassifiedMapPicker';

const REGIONS = ['Americas','Europe','Asia','Africa','Oceania','Middle East'];
const TIPOS   = ['Apartamento','Casa','Comercial','Terreno','Studio','Fazenda','Outro'];
const CURRENCIES = ['BRL','USD','EUR','GBP','ARS','MXN','COP','CLP','AED'];

export default function NovoImoveisPage() {
  const T = useT();
  const { user } = useAuth();
  const { site } = useMySite();
  const { add, open: openCart } = useCart();
  const router = useRouter();

  const [title, setTitle]       = useState('');
  const [price, setPrice]       = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [tipo, setTipo]         = useState('Apartamento');
  const [quartos, setQuartos]   = useState('');
  const [banheiros, setBanheiros] = useState('');
  const [m2, setM2]             = useState('');
  const [garagem, setGaragem]   = useState('');
  const [desc, setDesc]         = useState('');
  const [region, setRegion]     = useState('Americas');
  const [country, setCountry]   = useState('BR');
  const [stateCity, setStateCity] = useState('');
  const [images, setImages]     = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [mapLabel, setMapLabel] = useState('');
  const [iaAssistLoading, setIaAssistLoading] = useState(false);

  if (!user) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--text2)] mb-3">Login required</p>
        <Link href="/auth" className="btn-primary">Sign In</Link>
      </div>
    </div>
  );

  const uploadPhoto = async (file: File) => {
    if (images.length >= 10) { toast.error(T('err_max_10_photos')); return; }
    setUploading(true);
    try { const url = await uploadFile(file, 'imoveis', user.id); setImages(prev => [...prev, url]); } catch (e: any) { toast.error(e.message || T('toast_upload_failed')); }
    setUploading(false);
  };

  const runDeepseekAssist = async () => {
    setIaAssistLoading(true);
    try {
      const res = await fetch('/api/classified/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'imovel',
          title,
          description: desc,
          price,
          currency,
          region,
          country,
          stateCity,
          extraContext: { tipo, quartos, banheiros, m2, garagem },
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        suggestions?: Record<string, unknown>;
        notes_pt?: string;
        would_pass_moderation?: boolean;
      };
      if (!res.ok) {
        toast.error(j.error || T('classified_ia_error'));
        return;
      }
      const s = j.suggestions || {};
      if (typeof s.title === 'string' && s.title.trim()) setTitle(s.title.trim());
      if (typeof s.descricao === 'string' && s.descricao.trim()) setDesc(s.descricao.trim());
      if (typeof s.tipo === 'string' && TIPOS.includes(s.tipo as (typeof TIPOS)[number])) setTipo(s.tipo as (typeof TIPOS)[number]);
      if (typeof s.quartos === 'number' && Number.isFinite(s.quartos)) setQuartos(String(s.quartos));
      if (typeof s.banheiros === 'number' && Number.isFinite(s.banheiros)) setBanheiros(String(s.banheiros));
      if (typeof s.m2 === 'number' && Number.isFinite(s.m2)) setM2(String(s.m2));
      if (typeof s.garagem === 'number' && Number.isFinite(s.garagem)) setGaragem(String(s.garagem));
      if (typeof s.region === 'string' && REGIONS.includes(s.region as (typeof REGIONS)[number])) setRegion(s.region as (typeof REGIONS)[number]);
      if (typeof s.country === 'string' && s.country.trim().length >= 2) setCountry(s.country.trim().toUpperCase().slice(0, 2));
      if (typeof s.state_city === 'string' && s.state_city.trim()) setStateCity(s.state_city.trim());
      if (typeof s.price_hint === 'number' && Number.isFinite(s.price_hint) && !price.trim()) setPrice(String(s.price_hint));
      if (typeof s.currency_hint === 'string' && CURRENCIES.includes(s.currency_hint as (typeof CURRENCIES)[number])) {
        setCurrency(s.currency_hint as (typeof CURRENCIES)[number]);
      }
      if (typeof s.lat === 'number' && typeof s.lng === 'number') {
        setMapLat(s.lat);
        setMapLng(s.lng);
      }
      if (typeof s.map_label === 'string' && s.map_label.trim()) setMapLabel(s.map_label.trim());
      if (j.notes_pt) toast.success(j.notes_pt);
      else toast.success(T('classified_assist_ok'));
      if (j.would_pass_moderation === false) toast.message(T('classified_assist_warn_moderation'));
    } catch {
      toast.error(T('classified_ia_error'));
    } finally {
      setIaAssistLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) { toast.error(T('err_title_price_required')); return; }
    if (!site?.id) { toast.error(T('err_mini_site_required')); return; }
    if (images.length < 1) { toast.error(T('classified_err_photos_required')); return; }

    setVerifying(true);
    try {
      const vr = await fetch('/api/classified/verify-before-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'imovel',
          title,
          description: desc,
          imagePaths: images,
        }),
      });
      const vj = (await vr.json().catch(() => ({}))) as { accept?: boolean; reasonPt?: string; error?: string };
      if (!vr.ok) {
        toast.error(vj.error || T('classified_ia_error'));
        setVerifying(false);
        return;
      }
      if (!vj.accept) {
        toast.error(vj.reasonPt || T('classified_ia_rejected'));
        setVerifying(false);
        return;
      }
    } catch {
      toast.error(T('classified_ia_error'));
      setVerifying(false);
      return;
    }
    setVerifying(false);

    setSaving(true);
    const extraPayload: Record<string, unknown> = {
      tipo,
      quartos: quartos ? parseInt(quartos, 10) : null,
      banheiros: banheiros ? parseInt(banheiros, 10) : null,
      m2: m2 ? parseInt(m2, 10) : null,
      garagem: garagem ? parseInt(garagem, 10) : null,
      descricao: desc,
    };
    if (mapLat != null && mapLng != null) {
      extraPayload.lat = mapLat;
      extraPayload.lng = mapLng;
    }
    if (mapLabel.trim()) extraPayload.map_label = mapLabel.trim();

    const { data: listingRow, error } = await (supabase as any).from('classified_listings').insert({
      site_id: site.id, user_id: user.id, type: 'imovel',
      title, price: parseFloat(price), currency,
      region, country, state_city: stateCity,
      images, status: 'pending', // pending until payment
      extra: extraPayload,
    }).select('id').single();
    if (error) { toast.error(error.message); setSaving(false); return; }
    const listingMo = PLATFORM_USD.classifiedListingMonthly;
    add({
      id: `classified_${listingRow.id}`,
      label: `Property listing: ${title} — $${listingMo.toFixed(2)} USD/month`,
      price: listingMo,
      type: 'classified',
    });
    toast.success(T('toast_property_created_pay'));
    openCart();
    router.push('/imoveis');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/imoveis" className="flex items-center gap-2 text-sm text-[var(--text2)] hover:text-[var(--text)] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Home className="w-5 h-5 text-blue-500" /></div>
          <div>
            <h1 className="font-black text-xl text-[var(--text)]">List a Property</h1>
            <p className="text-xs text-[var(--text2)]">${PLATFORM_USD.classifiedListingMonthly.toFixed(2)} USDC/month · Cancel anytime</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos */}
          <div className="card p-5">
            <label className="label block mb-3">Photos (up to 10)</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg2)]">
                  <img src={getAssetUrl(img)} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded">Cover</span>}
                </div>
              ))}
              {images.length < 10 && (
                <label className={`aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-brand/50 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[var(--text2)]" /> : <><Upload className="w-5 h-5 text-[var(--text2)] mb-1" /><span className="text-[10px] text-[var(--text2)]">Add photo</span></>}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label block mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="3-bedroom apartment in São Paulo" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1">Price *</label>
                <input value={price} onChange={e => setPrice(e.target.value)} className="input" placeholder="500000" type="number" required />
              </div>
              <div>
                <label className="label block mb-1">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="input">
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label block mb-1">Type</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${tipo === t ? 'bg-brand text-white' : 'bg-[var(--bg2)] text-[var(--text2)] hover:border-brand/50 border border-[var(--border)]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="card p-5">
            <label className="label block mb-3">Specifications</label>
            <div className="grid grid-cols-2 gap-3">
              {[['Bedrooms', quartos, setQuartos], ['Bathrooms', banheiros, setBanheiros], ['Area m²', m2, setM2], ['Parking', garagem, setGaragem]].map(([label, val, set]) => (
                <div key={label as string}>
                  <label className="text-xs text-[var(--text2)] block mb-1">{label as string}</label>
                  <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} className="input" type="number" min="0" placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="card p-5 space-y-3">
            <label className="label block">Location</label>
            <div>
              <label className="text-xs text-[var(--text2)] block mb-1">Region</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(r => (
                  <button key={r} type="button" onClick={() => setRegion(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${region === r ? 'bg-indigo-600 text-white' : 'bg-[var(--bg2)] text-[var(--text2)] border border-[var(--border)]'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text2)] block mb-1">Country code</label>
                <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} className="input font-mono" placeholder="BR" maxLength={2} />
              </div>
              <div>
                <label className="text-xs text-[var(--text2)] block mb-1">City, State</label>
                <input value={stateCity} onChange={e => setStateCity(e.target.value)} className="input" placeholder="São Paulo, SP" />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-[var(--text)]">{T('classified_map_title')}</p>
                <p className="text-xs text-[var(--text2)]">{T('classified_map_hint')}</p>
              </div>
              <button
                type="button"
                onClick={() => void runDeepseekAssist()}
                disabled={iaAssistLoading || (!title.trim() && desc.trim().length < 8)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-300 hover:bg-violet-500/15 disabled:opacity-40"
              >
                {iaAssistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {T('classified_assist_btn')}
              </button>
            </div>
            <ClassifiedMapPicker lat={mapLat} lng={mapLng} onPick={(la, ln) => { setMapLat(la); setMapLng(ln); }} />
            {mapLabel && <p className="text-[10px] text-[var(--text2)] font-mono truncate">{mapLabel}</p>}
          </div>

          {/* Description */}
          <div className="card p-5">
            <label className="label block mb-2">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input resize-none" rows={4} placeholder="Describe the property..." />
          </div>

          {/* Pricing info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-blue-300">${PLATFORM_USD.classifiedListingMonthly.toFixed(2)} USDC/month</p>
              <p className="text-xs text-blue-400/70 mt-0.5">Your listing goes live after payment. Global visibility. Cancel anytime.</p>
            </div>
          </div>

          <button type="submit" disabled={saving || uploading || verifying} className="btn-primary w-full justify-center py-3.5 text-base gap-2">
            {verifying || saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            <span>
              {verifying
                ? T('classified_ia_checking')
                : saving
                  ? T('classified_ia_saving')
                  : `List for $${PLATFORM_USD.classifiedListingMonthly.toFixed(2)}/month`}
            </span>
          </button>
          <p className="text-[10px] text-[var(--text2)] text-center mt-2">{T('classified_ia_hint')}</p>
        </form>
      </div>
    </div>
  );
}
