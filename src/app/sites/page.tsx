'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { SiteFollowButton } from '@/components/site/SiteFollowButton';
import { useI18n, useT } from '@/lib/i18n';
import { DIRECTORY_PROFILE_I18N_KEYS } from '@/lib/directoryProfileLabels';
import { Shield, Search, Globe, Users, ExternalLink, ChevronDown, ChevronUp, CheckSquare, Square, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getAssetUrl } from '@/lib/getAssetUrl';
type AdSlot = 'feed_pinned' | 'avatar_ai' | 'ticker_header';

interface SiteEntry {
  id: string; slug: string; site_name: string; bio?: string;
  avatar_url?: string; accent_color?: string; theme?: string;
  is_verified?: boolean; boost_score?: number;
  follower_count?: number | null;
  directory_profile_slug?: string | null;
  site_category_slug?: string | null;
  ad_asking_price_usdc?: number | null;
}

const PAGE_SIZE = 16;

export default function SitesDirectoryPage() {
  const T = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const numLocale = lang === 'pt' ? 'pt-BR' : 'en-US';
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'followers'>('followers');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalBody, setProposalBody] = useState('');
  const [proposalBudget, setProposalBudget] = useState('500');
  const [proposalDays, setProposalDays] = useState('7');
  const [proposalColor, setProposalColor] = useState('#6366f1');
  const [proposalProduct, setProposalProduct] = useState('');
  const [proposalTone, setProposalTone] = useState<'professional' | 'wild_monkey'>('professional');
  const [proposalScript, setProposalScript] = useState('');
  const [slots, setSlots] = useState<AdSlot[]>(['feed_pinned', 'avatar_ai', 'ticker_header']);
  const [bulkSubject, setBulkSubject] = useState('');
  const [minPerSite, setMinPerSite] = useState('0');
  const [maxPerSite, setMaxPerSite] = useState('0');
  const [estCpmUsd, setEstCpmUsd] = useState('12');
  const [sendingBulk, setSendingBulk] = useState(false);

  const subjectOptions = [
    'creator', 'services', 'tech', 'business', 'local', 'automotive', 'influencer', 'entrepreneur',
  ];

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const from = reset ? 0 : page * PAGE_SIZE;
    let q = supabase.from('mini_sites')
      .select('id, slug, site_name, bio, avatar_url, accent_color, theme, is_verified, follower_count, directory_profile_slug, site_category_slug, ad_asking_price_usdc')
      .eq('published', true);
    if (search) q = (q as any).or(`site_name.ilike.%${search}%,bio.ilike.%${search}%,slug.ilike.%${search}%`);
    if (profileFilter) q = q.eq('directory_profile_slug', profileFilter);
    if (categoryFilter) q = q.eq('site_category_slug', categoryFilter);
    if (sortBy === 'followers') q = q.order('follower_count', { ascending: false });
    else q = q.order('created_at', { ascending: false });
    q = q.range(from, from + PAGE_SIZE - 1);
    const { data } = await q;
    const items = (data || []) as SiteEntry[];
    setSites(prev => reset ? items : [...prev, ...items]);
    setHasMore(items.length === PAGE_SIZE);
    if (!reset) setPage(p => p + 1);
    setLoading(false);
  }, [page, search, profileFilter, categoryFilter, sortBy]);

  useEffect(() => { load(true); setPage(1); }, [search, profileFilter, categoryFilter, sortBy]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMore && !loading) load(); }, { threshold: 0.1 });
    if (observerRef.current) obs.observe(observerRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, load]);

  const selectedSites = useMemo(
    () => sites.filter((s) => selectedSiteIds.includes(s.id)),
    [sites, selectedSiteIds],
  );

  const allocationPreview = useMemo(() => {
    const budget = Number(proposalBudget.replace(',', '.'));
    if (!Number.isFinite(budget) || budget <= 0 || selectedSites.length === 0) return [];
    const minManual = Math.max(0, Number(minPerSite.replace(',', '.')) || 0);
    const maxManualRaw = Math.max(0, Number(maxPerSite.replace(',', '.')) || 0);
    const weighted = selectedSites.map((s) => {
      const followers = Math.max(0, Number(s.follower_count || 0));
      const followerScore = Math.log10(followers + 10) + 1;
      const profile = (s.directory_profile_slug || '').toLowerCase();
      const cat = (s.site_category_slug || '').toLowerCase();
      const sub = bulkSubject.toLowerCase().trim();
      const nicheBoost = sub && (profile.includes(sub) || cat.includes(sub)) ? 1.35 : 1;
      const score = followerScore * nicheBoost;
      return { site: s, score };
    });
    const totalScore = weighted.reduce((a, r) => a + r.score, 0) || 1;
    let rows = weighted
      .map((r) => ({
        site: r.site,
        amount: Number(((budget * r.score) / totalScore).toFixed(2)),
        score: r.score,
      }));

    rows = rows.map((r) => {
      const floorCreator = Number(r.site.ad_asking_price_usdc || 0);
      const floor = Math.max(minManual, floorCreator);
      return { ...r, amount: Math.max(r.amount, floor) };
    });

    const maxManual = maxManualRaw > 0 ? maxManualRaw : Infinity;
    rows = rows.map((r) => ({ ...r, amount: Math.min(r.amount, maxManual) }));

    const totalNow = rows.reduce((a, r) => a + r.amount, 0);
    if (totalNow > 0) {
      const factor = budget / totalNow;
      rows = rows.map((r) => ({ ...r, amount: Number((r.amount * factor).toFixed(2)) }));
    }

    rows = rows.map((r) => {
      const floorCreator = Number(r.site.ad_asking_price_usdc || 0);
      const floor = Math.max(minManual, floorCreator);
      return { ...r, amount: Math.max(r.amount, floor) };
    });

    return rows.sort((a, b) => b.amount - a.amount);
  }, [selectedSites, proposalBudget, bulkSubject, minPerSite, maxPerSite]);

  const roiPreview = useMemo(() => {
    const spend = allocationPreview.reduce((a, r) => a + r.amount, 0);
    const cpm = Math.max(0.1, Number(estCpmUsd.replace(',', '.')) || 12);
    const estImpressions = (spend / cpm) * 1000;
    const estClicks = estImpressions * 0.015;
    const estLeads = estClicks * 0.06;
    return {
      spend,
      estImpressions,
      estClicks,
      estLeads,
    };
  }, [allocationPreview, estCpmUsd]);

  const toggleSiteSelection = (siteId: string) => {
    setSelectedSiteIds((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]));
  };

  const selectTopSites = (count: number) => {
    const top = [...sites]
      .sort((a, b) => Number(b.follower_count || 0) - Number(a.follower_count || 0))
      .slice(0, count)
      .map((s) => s.id);
    setSelectedSiteIds(top);
  };

  const submitBulkProposal = async () => {
    if (!user) {
      toast.error(T('mkt_magic_need_login'));
      return;
    }
    const title = proposalTitle.trim();
    if (!title) {
      toast.error(T('mkt_field_title'));
      return;
    }
    const duration = Math.max(1, Math.min(365, Number(proposalDays) || 7));
    const budget = Number(proposalBudget.replace(',', '.'));
    if (!Number.isFinite(budget) || budget < 1) {
      toast.error(T('mkt_field_bid'));
      return;
    }
    if (allocationPreview.length === 0) {
      toast.error(T('sites_bulk_pick_some'));
      return;
    }

    setSendingBulk(true);
    try {
      const { data: prop, error: pe } = await (supabase as any)
        .from('ad_proposals')
        .insert({
          advertiser_user_id: user.id,
          title,
          body: proposalBody.trim() || null,
          duration_days: duration,
          total_budget_usdc: budget,
          status: 'sent',
          magic_brand_color: proposalColor.trim() || null,
          magic_product_label: proposalProduct.trim() || null,
          magic_tone: proposalTone,
          magic_script: proposalScript.trim() || null,
        })
        .select('id')
        .single();
      if (pe || !prop?.id) throw pe || new Error('proposal insert failed');

      const targets = allocationPreview.map((r) => ({
        proposal_id: prop.id,
        site_id: r.site.id,
        bid_amount_usdc: r.amount,
        owner_status: 'pending',
        ad_slots: slots,
      }));
      const { error: te } = await (supabase as any).from('ad_proposal_targets').insert(targets);
      if (te) throw te;

      toast.success(T('sites_bulk_sent_ok').replace('{n}', String(targets.length)));
      setSelectedSiteIds([]);
      setProposalScript('');
    } catch (e) {
      console.error(e);
      toast.error(T('mkt_magic_err'));
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Header />
      <div className="border-b border-[var(--border)] bg-[var(--bg2)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Globe className="w-6 h-6 text-brand" /> {T('sites_title')}</h1>
              <p className="text-sm text-[var(--text2)]">{T('sites_subtitle')}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text2)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder={T('sites_search_placeholder')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <select value={profileFilter} onChange={e => setProfileFilter(e.target.value)} className="input text-sm">
              <option value="">{T('sites_filter_all_profiles')}</option>
              <option value="influencer">{T('sites_prof_influencer')}</option>
              <option value="actor">{T('sites_prof_actor')}</option>
              <option value="actress">{T('sites_prof_actress')}</option>
              <option value="athlete">{T('sites_prof_athlete')}</option>
              <option value="entrepreneur">{T('sites_prof_entrepreneur')}</option>
              <option value="automotive">{T('sites_prof_automotive')}</option>
              <option value="creator">{T('sites_prof_creator')}</option>
              <option value="services">{T('sites_prof_services')}</option>
              <option value="other">{T('sites_prof_other')}</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input text-sm">
              <option value="">{T('sites_filter_all_categories')}</option>
              <option value="creator">{T('sites_cat_creator')}</option>
              <option value="services">{T('sites_cat_services')}</option>
              <option value="tech">{T('sites_cat_tech')}</option>
              <option value="business">{T('sites_cat_business')}</option>
              <option value="local">{T('sites_cat_local')}</option>
              <option value="other">{T('sites_cat_other')}</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'recent' | 'followers')} className="input text-sm">
              <option value="followers">{T('sites_filter_sort_followers')}</option>
              <option value="recent">{T('sites_filter_sort_recent')}</option>
            </select>
            <a
              href="/marketplace/ads"
              className="input text-sm flex items-center justify-center font-semibold text-brand border-brand/40 hover:bg-brand/10"
            >
              {T('sites_sponsor_cta')}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1">
        <div className="card p-4 md:p-5 mb-5 border border-amber-500/35 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--text)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {T('sites_bulk_title')}
              </p>
              <p className="text-xs text-[var(--text2)] mt-1">{T('sites_bulk_sub')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => selectTopSites(20)} className="btn-secondary text-xs py-1.5 px-3">
                {T('sites_bulk_pick20')}
              </button>
              <button type="button" onClick={() => setSelectedSiteIds([])} className="btn-secondary text-xs py-1.5 px-3">
                {T('sites_bulk_clear')}
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
            <input className="input text-sm" placeholder={T('mkt_field_title')} value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} />
            <input className="input text-sm" placeholder={T('mkt_field_product')} value={proposalProduct} onChange={(e) => setProposalProduct(e.target.value)} />
            <input className="input text-sm" placeholder={T('mkt_field_bid')} value={proposalBudget} onChange={(e) => setProposalBudget(e.target.value)} inputMode="decimal" />
            <input className="input text-sm" placeholder={T('sites_bulk_days')} value={proposalDays} onChange={(e) => setProposalDays(e.target.value)} inputMode="numeric" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            <select className="input text-sm" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)}>
              <option value="">{T('sites_bulk_subject_any')}</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input text-sm" value={proposalTone} onChange={(e) => setProposalTone(e.target.value as any)}>
              <option value="professional">{T('mkt_tone_pro')}</option>
              <option value="wild_monkey">{T('mkt_tone_wild')}</option>
            </select>
            <input className="input text-sm font-mono" placeholder={T('mkt_field_color')} value={proposalColor} onChange={(e) => setProposalColor(e.target.value)} />
            <button type="button" disabled={sendingBulk} onClick={() => void submitBulkProposal()} className="btn-primary text-sm justify-center">
              {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {T('sites_bulk_send')}
            </button>
          </div>
          <div className="mt-2">
            <label className="text-xs text-[var(--text2)] mb-1 block">{T('mkt_slots_title')}</label>
            <div className="flex flex-wrap gap-2">
              {([
                ['feed_pinned', 'mkt_slot_feed'],
                ['avatar_ai', 'mkt_slot_avatar'],
                ['ticker_header', 'mkt_slot_ticker'],
              ] as const).map(([slot, key]) => {
                const active = slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${active ? 'border-brand bg-brand/15 text-brand' : 'border-[var(--border)] text-[var(--text2)]'}`}
                  >
                    {T(key)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mt-2">
            <input className="input text-sm" placeholder={T('sites_bulk_min_per_site')} value={minPerSite} onChange={(e) => setMinPerSite(e.target.value)} inputMode="decimal" />
            <input className="input text-sm" placeholder={T('sites_bulk_max_per_site')} value={maxPerSite} onChange={(e) => setMaxPerSite(e.target.value)} inputMode="decimal" />
            <input className="input text-sm" placeholder={T('sites_bulk_cpm')} value={estCpmUsd} onChange={(e) => setEstCpmUsd(e.target.value)} inputMode="decimal" />
          </div>
          <textarea className="input text-sm resize-none min-h-[64px] mt-2" placeholder={T('mkt_field_script')} value={proposalScript} onChange={(e) => setProposalScript(e.target.value)} />
          <textarea className="input text-sm resize-none min-h-[56px] mt-2" placeholder={T('mkt_field_body')} value={proposalBody} onChange={(e) => setProposalBody(e.target.value)} />
          <p className="text-xs text-[var(--text2)] mt-2">
            {T('sites_bulk_selected').replace('{n}', String(selectedSiteIds.length))}
          </p>
          {allocationPreview.length > 0 && (
            <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allocationPreview.slice(0, 9).map((r) => (
                <div key={r.site.id} className="rounded-lg border border-amber-500/20 bg-black/10 px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
                  <span className="truncate">{r.site.site_name}</span>
                  <span className="text-amber-300 font-bold">${r.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {allocationPreview.length > 0 && (
            <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
              <p className="text-xs font-bold text-violet-200 uppercase tracking-wide mb-1">{T('sites_bulk_roi_title')}</p>
              <p className="text-xs text-[var(--text2)]">
                {T('sites_bulk_roi_line')
                  .replace('{spend}', roiPreview.spend.toFixed(2))
                  .replace('{impressions}', Math.round(roiPreview.estImpressions).toLocaleString(numLocale))
                  .replace('{clicks}', Math.round(roiPreview.estClicks).toLocaleString(numLocale))
                  .replace('{leads}', Math.max(1, Math.round(roiPreview.estLeads)).toLocaleString(numLocale))}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sites.map(site => {
            const accent = site.accent_color || '#818cf8';
            const expanded = expandedSiteId === site.id;
            const selected = selectedSiteIds.includes(site.id);
            return (
              <div key={site.id} className={`card p-4 hover:border-brand/40 transition-all hover:-translate-y-0.5 duration-200 ${expanded ? 'col-span-2 sm:col-span-3 md:col-span-4' : ''}`}>
                <div className="text-center mb-3">
                  {site.avatar_url
                    ? <img src={getAssetUrl(site.avatar_url)} className="w-14 h-14 rounded-xl mx-auto object-cover" style={{ border: `2px solid ${accent}40` }} />
                    : <div className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center font-black text-2xl text-white" style={{ background: accent }}>{site.site_name?.[0]?.toUpperCase()}</div>
                  }
                </div>
                <p className="font-black text-[var(--text)] text-sm text-center flex items-center justify-center gap-1">
                  {site.site_name}
                  {site.is_verified && <Shield className="w-3 h-3 text-blue-500" />}
                </p>
                <p className="text-xs text-center font-mono mt-0.5" style={{ color: accent }}>{site.slug}.trustbank.xyz</p>
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 min-h-[22px]">
                  {site.directory_profile_slug && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg2)] text-[var(--text2)] border border-[var(--border)]">
                      {DIRECTORY_PROFILE_I18N_KEYS[site.directory_profile_slug]
                        ? T(DIRECTORY_PROFILE_I18N_KEYS[site.directory_profile_slug])
                        : site.directory_profile_slug}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/25">
                    <Users className="w-3 h-3 inline mr-0.5 align-text-bottom" />
                    {(site.follower_count ?? 0).toLocaleString(numLocale)}
                  </span>
                  {site.ad_asking_price_usdc != null && site.ad_asking_price_usdc > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30" title={T('ads_price_title')}>
                      {T('sites_from_usdc').replace('{value}', Number(site.ad_asking_price_usdc).toLocaleString(numLocale))}
                    </span>
                  )}
                </div>
                {site.bio && <p className="text-xs text-[var(--text2)] text-center mt-1.5 line-clamp-2">{site.bio}</p>}
                <div className="flex flex-wrap gap-1.5 mt-3 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSiteSelection(site.id)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${selected ? 'border-emerald-500/60 text-emerald-400 bg-emerald-500/10' : 'border-[var(--border)] text-[var(--text2)] hover:border-emerald-400/40'}`}
                  >
                    {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {T('sites_pick')}
                  </button>
                  <SiteFollowButton
                    siteId={site.id}
                    siteSlug={site.slug}
                    accentColor={accent}
                    textColor="var(--text)"
                    borderColor="var(--border)"
                    compact
                  />
                  <a href={`https://${site.slug}.trustbank.xyz`} target="_blank" rel="noopener"
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text2)] hover:border-brand/50 hover:text-brand transition-all">
                    <ExternalLink className="w-3 h-3" /> {T('sites_visit')}
                  </a>
                  <a
                    href={`/marketplace/ads?slug=${encodeURIComponent(site.slug)}`}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-all"
                  >
                    {T('sites_ads_short')}
                  </a>
                  <button
                    type="button"
                    onClick={() => setExpandedSiteId(expanded ? null : site.id)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text2)] hover:text-brand hover:border-brand/40 transition-all"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {T('sites_expand')}
                  </button>
                </div>
                {expanded && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-[var(--bg2)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-[var(--text)]">{T('sites_preview_title')}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selected) toggleSiteSelection(site.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        {T('sites_propose_here')}
                      </button>
                    </div>
                    {site.bio && <p className="text-sm text-[var(--text2)] mb-2">{site.bio}</p>}
                    <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-black">
                      <iframe
                        src={`https://${site.slug}.trustbank.xyz`}
                        title={`${site.site_name} preview`}
                        className="w-full h-[360px]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {loading && [...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg2)] mx-auto mb-3" />
              <div className="h-3 bg-[var(--bg2)] rounded mx-auto w-3/4 mb-2" />
              <div className="h-2 bg-[var(--bg2)] rounded mx-auto w-1/2" />
            </div>
          ))}
        </div>
        {!loading && sites.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-brand/30 mx-auto mb-3" />
            <p className="text-[var(--text2)]">{T('sites_not_found')}</p>
          </div>
        )}
        <div ref={observerRef} className="h-10" />
      </div>
      <Footer />
    </div>
  );
}
