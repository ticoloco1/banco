'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { sanitizeAppRedirect } from '@/lib/sanitizeAppRedirect';

export default function CompanyOnboardingPage() {
  const T = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sanitizeAppRedirect(sp.get('redirect'), '/cv');
  const { user, loading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [website, setWebsite] = useState('');
  const [goal, setGoal] = useState('');
  const [targetAccountType, setTargetAccountType] = useState<'freemium' | 'premium' | 'all'>('all');
  const [campaignCategory, setCampaignCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/auth?redirect=${encodeURIComponent('/company/onboarding')}`);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('company_profiles' as any)
        .select('company_name,industry,team_size,website,hiring_goal,target_account_type,campaign_category')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setCompanyName((data as any).company_name || '');
        setIndustry((data as any).industry || '');
        setTeamSize((data as any).team_size || '');
        setWebsite((data as any).website || '');
        setGoal((data as any).hiring_goal || '');
        setTargetAccountType((data as any).target_account_type || 'all');
        setCampaignCategory((data as any).campaign_category || '');
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user, loading, router]);

  const submit = async () => {
    if (!user) return;
    if (!companyName.trim()) {
      toast.error(T('co_name_required'));
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from('company_profiles').upsert({
      user_id: user.id,
      company_name: companyName.trim(),
      industry: industry.trim() || null,
      team_size: teamSize.trim() || null,
      website: website.trim() || null,
      hiring_goal: goal.trim() || null,
      target_account_type: targetAccountType,
      campaign_category: campaignCategory.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error(error.message || T('co_save_error'));
      return;
    }
    toast.success(T('co_saved'));
    router.push(redirect);
  };

  if (loading || !loaded) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Header />
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 border border-brand/25 bg-brand/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text)]">{T('co_title')}</h1>
              <p className="text-sm text-[var(--text2)]">{T('co_sub')}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input sm:col-span-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={T('co_name_ph')} />
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={T('co_industry_ph')} />
            <input className="input" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder={T('co_team_size_ph')} />
            <input className="input sm:col-span-2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={T('co_website_ph')} />
            <textarea className="input sm:col-span-2 resize-none min-h-[90px]" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={T('co_goal_ph')} />
            <select className="input sm:col-span-2" value={targetAccountType} onChange={(e) => setTargetAccountType(e.target.value as any)}>
              <option value="all">All user types</option>
              <option value="freemium">Freemium users (US$25 lead)</option>
              <option value="premium">Premium users (US$50 lead)</option>
            </select>
            <input className="input sm:col-span-2" value={campaignCategory} onChange={(e) => setCampaignCategory(e.target.value)} placeholder="Target category (e.g. Design, Crypto, Real Estate)" />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => void submit()} disabled={saving} className="btn-primary gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {saving ? T('auth_loading') : T('co_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
