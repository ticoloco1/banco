'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/store/cart';
import { MARKETING_PRICING_CONFIG, marketingSetupFeeUsd } from '@/lib/pricing_config';

type CampaignType = 'Lead_Only' | 'Full_Access';

export default function DashboardCampanhasPage() {
  const { user } = useAuth();
  const { add, open } = useCart();
  const [title, setTitle] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('Lead_Only');
  const [budget, setBudget] = useState(1000);
  const [targetAccountType, setTargetAccountType] = useState<'freemium' | 'premium' | 'all'>('freemium');
  const [placementType, setPlacementType] = useState<'targeted' | 'opt_in_marketplace'>('targeted');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adVideoUrl, setAdVideoUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [payerWallet, setPayerWallet] = useState('');
  const [confirmIntentId, setConfirmIntentId] = useState('');
  const [confirmTxHash, setConfirmTxHash] = useState('');
  const [usdcCreating, setUsdcCreating] = useState(false);
  const [kycSaving, setKycSaving] = useState(false);
  const [kyc, setKyc] = useState({
    kyc_verified: false,
    full_name: '',
    city: '',
    email: '',
    wallet_address: '',
    consent_nft_ads: false,
  });

  const pricePerLead =
    placementType === 'opt_in_marketplace'
      ? MARKETING_PRICING_CONFIG.leadOptInReceiveUsd
      : targetAccountType === 'premium'
        ? MARKETING_PRICING_CONFIG.leadPremiumUsd
        : MARKETING_PRICING_CONFIG.leadFreemiumUsd;
  const setupFee = marketingSetupFeeUsd();
  const totalCheckout = setupFee + Math.max(0, Number(budget || 0));

  const roi = useMemo(() => {
    const leads = Math.floor(Math.max(0, Number(budget || 0)) / Math.max(1, pricePerLead));
    const instagramCpl = 38;
    const igCost = leads * instagramCpl;
    const tbCost = leads * pricePerLead;
    return { leads, igCost, tbCost };
  }, [budget, pricePerLead]);

  async function loadData() {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const [kycRes, campRes] = await Promise.all([
        fetch('/api/platform/kyc/status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/platform/marketing-campaigns/my', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);
      const kycData = await kycRes.json().catch(() => ({}));
      const campData = await campRes.json().catch(() => ({}));
      if (kycRes.ok) setKyc((prev) => ({ ...prev, ...kycData }));
      if (campRes.ok) setCampaigns(Array.isArray(campData.campaigns) ? campData.campaigns : []);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  async function saveKyc() {
    if (!user?.id || kycSaving) return;
    setKycSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/platform/kyc/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(kyc),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data?.error === 'totp_required') {
        const code = window.prompt('Insere o código TOTP de 6 dígitos para editar a wallet:') || '';
        if (!code) throw new Error('Código TOTP obrigatório');
        const retry = await fetch('/api/platform/kyc/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ...kyc, totpCode: code }),
        });
        const retryData = await retry.json().catch(() => ({}));
        if (!retry.ok) throw new Error(retryData?.error || 'Falha ao salvar KYC');
      } else if (!res.ok) {
        throw new Error(data?.error || 'Falha ao salvar KYC');
      }
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Falha ao salvar KYC');
    } finally {
      setKycSaving(false);
    }
  }

  async function createCampaign() {
    if (!user?.id || creating) return;
    setCreating(true);
    try {
      const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/platform/marketing-campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim() || 'NFT Campaign',
          type: campaignType,
          targetAccountType,
          placementType,
          budgetUsd: Math.max(0, Number(budget || 0)),
          adLinkUrl,
          adVideoUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.campaign?.id) {
        throw new Error(data?.error || 'Could not create campaign');
      }
      const cid = String(data.campaign.id);
      setCreatedId(cid);
      add({
        id: `marketing_campaign_setup_${cid}_${Math.max(0, Number(budget || 0))}`,
        label: `Campaign setup · ${campaignType === 'Full_Access' ? 'Full Access' : 'Lead Only'}`,
        price: totalCheckout,
        type: 'marketing_campaign_setup',
      });
      open();
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Error creating campaign');
    } finally {
      setCreating(false);
    }
  }

  async function createUsdcIntent() {
    if (!createdId || !user?.id || !payerWallet || usdcCreating) return;
    setUsdcCreating(true);
    try {
      const res = await fetch('/api/platform/marketing-campaigns/usdc-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: createdId,
          brandId: user.id,
          payerWallet,
          amountUsd: totalCheckout,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'USDC intent failed');
      setConfirmIntentId(String(data.intent?.id || ''));
      alert(`Envia USDC para ${data.intent?.treasury_wallet} no valor ${data.intent?.amount_units} unidades e depois confirma o tx hash.`);
    } catch (e: any) {
      alert(e?.message || 'USDC intent failed');
    } finally {
      setUsdcCreating(false);
    }
  }

  async function confirmUsdc() {
    if (!confirmIntentId || !confirmTxHash || !payerWallet) return;
    const res = await fetch('/api/platform/marketing-campaigns/usdc-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentId: confirmIntentId, txHash: confirmTxHash, payerWallet }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || 'USDC confirm failed');
      return;
    }
    alert('Pagamento USDC confirmado. Campanha financiada.');
    await loadData();
  }

  function exportLeadsCsv(campaign: any) {
    const rows = Array.isArray(campaign?.leads) ? campaign.leads : [];
    const lines = [
      ['lead_id', 'campaign_id', 'has_kyc', 'name', 'email', 'city', 'created_at'].join(','),
      ...rows.map((r: any) => {
        const p = (r?.data_payload || {}) as Record<string, string>;
        const name = String(p.name || '').replace(/"/g, '""');
        const email = String(p.email || '').replace(/"/g, '""');
        const city = String(p.city || '').replace(/"/g, '""');
        return [
          r.id,
          r.campaign_id,
          r.has_kyc ? 'true' : 'false',
          `"${name}"`,
          `"${email}"`,
          `"${city}"`,
          r.created_at || '',
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign?.id || 'leads'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="card p-5 space-y-2">
          <h1 className="font-black text-2xl text-[var(--text)]">Campanhas NFT para marcas</h1>
          <p className="text-sm text-[var(--text2)]">
            Objetivo: captar leads com consentimento e executar drops NFT com dados próprios.
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-black text-lg text-[var(--text)]">KYC e consentimento do usuário</h2>
          <p className="text-xs text-[var(--text2)]">
            Para usar freemium e receber campanhas NFT/ads: nome, cidade, email, wallet e consentimento são obrigatórios.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Nome completo"
              value={kyc.full_name}
              onChange={(e) => setKyc((p) => ({ ...p, full_name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Cidade"
              value={kyc.city}
              onChange={(e) => setKyc((p) => ({ ...p, city: e.target.value }))}
            />
            <input
              className="input"
              placeholder="E-mail"
              value={kyc.email}
              onChange={(e) => setKyc((p) => ({ ...p, email: e.target.value }))}
            />
            <input
              className="input font-mono"
              placeholder="Wallet Polygon 0x..."
              value={kyc.wallet_address}
              onChange={(e) => setKyc((p) => ({ ...p, wallet_address: e.target.value }))}
            />
          </div>
          <label className="text-xs flex items-start gap-2 text-[var(--text2)]">
            <input
              type="checkbox"
              checked={kyc.consent_nft_ads}
              onChange={(e) => setKyc((p) => ({ ...p, consent_nft_ads: e.target.checked }))}
            />
            <span>Aceito receber NFTs promocionais e anúncios patrocinados na wallet cadastrada.</span>
          </label>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={saveKyc} disabled={kycSaving || !user}>
              {kycSaving ? 'Salvando...' : 'Salvar KYC'}
            </button>
            <span className={`text-xs font-semibold ${kyc.kyc_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
              {kyc.kyc_verified ? 'KYC verificado' : 'KYC pendente'}
            </span>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <label className="block text-sm font-semibold text-[var(--text)]">
            Nome da campanha
            <input
              className="input w-full mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Drop Abril 2026"
              maxLength={120}
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCampaignType('Lead_Only')}
              className={`rounded-xl border p-4 text-left ${campaignType === 'Lead_Only' ? 'border-brand bg-brand/10' : 'border-[var(--border)]'}`}
            >
              <p className="font-bold text-[var(--text)]">Capturar Leads Qualificados</p>
              <p className="text-xs text-[var(--text2)]">US$ {MARKETING_PRICING_CONFIG.leadFreemiumUsd} base por lead</p>
            </button>
            <button
              type="button"
              onClick={() => setCampaignType('Full_Access')}
              className={`rounded-xl border p-4 text-left ${campaignType === 'Full_Access' ? 'border-brand bg-brand/10' : 'border-[var(--border)]'}`}
            >
              <p className="font-bold text-[var(--text)]">Conexão Eterna via Wallet</p>
              <p className="text-xs text-[var(--text2)]">US$ {MARKETING_PRICING_CONFIG.leadPremiumUsd} premium / US$ {MARKETING_PRICING_CONFIG.leadOptInReceiveUsd} opt-in</p>
              <p className="text-[11px] text-brand mt-2">Domine sua audiência e envie anúncios para sempre sem intermediários.</p>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-[var(--text)]">
              Tipo de usuário alvo
              <select className="input w-full mt-1" value={targetAccountType} onChange={(e) => setTargetAccountType(e.target.value as any)}>
                <option value="freemium">Freemium (US$ {MARKETING_PRICING_CONFIG.leadFreemiumUsd})</option>
                <option value="premium">Premium (US$ {MARKETING_PRICING_CONFIG.leadPremiumUsd})</option>
                <option value="all">Todos</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[var(--text)]">
              Entrada da campanha
              <select className="input w-full mt-1" value={placementType} onChange={(e) => setPlacementType(e.target.value as any)}>
                <option value="targeted">Marketing direcionado</option>
                <option value="opt_in_marketplace">Usuário clicou receber (US$ {MARKETING_PRICING_CONFIG.leadOptInReceiveUsd})</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-[var(--text)]">
            Depósito antecipado (budget de leads)
            <input
              type="number"
              min={0}
              step={50}
              className="input w-full mt-1"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value || 0))}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Original ad link (vitalício)"
              value={adLinkUrl}
              onChange={(e) => setAdLinkUrl(e.target.value)}
            />
            <input
              className="input"
              placeholder="Original ad video URL (vitalício)"
              value={adVideoUrl}
              onChange={(e) => setAdVideoUrl(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4 text-sm space-y-1">
            <p className="font-bold text-[var(--text)]">Calculadora de ROI</p>
            <p className="text-[var(--text2)]">
              No Instagram você gastaria <b>US$ {roi.igCost.toLocaleString()}</b> para esse alcance.
            </p>
            <p className="text-[var(--text2)]">
              No Trustbank você gasta <b>US$ {roi.tbCost.toLocaleString()}</b> e é dono do dado.
            </p>
            <p className="text-xs text-[var(--text2)]">Leads estimados: {roi.leads}</p>
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
            <p className="text-[var(--text)]">Setup fee (criação + lançamento): <b>US$ {setupFee}</b></p>
            <p className="text-[var(--text)]">Checkout agora: <b>US$ {totalCheckout.toLocaleString()}</b></p>
            <p className="text-xs text-[var(--text2)] mt-2">
              USDC Polygon = automático (principal). Stripe = fallback, mais lento por depender de ação humana.
            </p>
          </div>

          <button type="button" className="btn-primary" onClick={createCampaign} disabled={!user || creating}>
            {creating ? 'Criando...' : 'Criar campanha e abrir checkout'}
          </button>
          {createdId ? <p className="text-xs text-[var(--text2)]">Campanha criada: {createdId}</p> : null}
          {createdId ? (
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
              <p className="text-xs font-bold text-[var(--text)]">USDC Polygon payment (primary)</p>
              <input
                className="input font-mono"
                placeholder="Payer wallet 0x..."
                value={payerWallet}
                onChange={(e) => setPayerWallet(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary text-xs" onClick={() => void createUsdcIntent()} disabled={usdcCreating}>
                  {usdcCreating ? 'Criando...' : 'Create USDC intent'}
                </button>
              </div>
              <input
                className="input font-mono"
                placeholder="Intent ID"
                value={confirmIntentId}
                onChange={(e) => setConfirmIntentId(e.target.value)}
              />
              <input
                className="input font-mono"
                placeholder="Tx hash 0x..."
                value={confirmTxHash}
                onChange={(e) => setConfirmTxHash(e.target.value)}
              />
              <button className="btn-primary text-xs" onClick={() => void confirmUsdc()}>
                Confirm USDC payment
              </button>
            </div>
          ) : null}
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-[var(--text)]">Campanhas e leads</h2>
            <button className="btn-secondary text-xs" onClick={() => void loadData()} disabled={loadingData}>
              {loadingData ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          {campaigns.length === 0 ? (
            <p className="text-sm text-[var(--text2)]">Sem campanhas ainda.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-[var(--border)] p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[var(--text)]">{c.title}</p>
                    <button className="btn-secondary text-xs" onClick={() => exportLeadsCsv(c)}>
                      Exportar CSV
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text2)]">
                    Tipo: {c.type} · Lead: US$ {Number(c.price_per_lead || 0).toLocaleString()} · Saldo: US$ {Number(c.total_budget || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--text2)]">Leads: {c.leadCount || 0}</p>
                  {Array.isArray(c.leads) && c.leads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-[var(--text2)] border-b border-[var(--border)]">
                            <th className="py-1 pr-2">Nome</th>
                            <th className="py-1 pr-2">Email</th>
                            <th className="py-1 pr-2">Cidade</th>
                            <th className="py-1 pr-2">KYC</th>
                            <th className="py-1">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.leads.slice(0, 25).map((l: any) => {
                            const p = (l.data_payload || {}) as Record<string, string>;
                            return (
                              <tr key={l.id} className="border-b border-[var(--border)]/60">
                                <td className="py-1 pr-2">{p.name || '—'}</td>
                                <td className="py-1 pr-2">{p.email || '—'}</td>
                                <td className="py-1 pr-2">{p.city || '—'}</td>
                                <td className="py-1 pr-2">{l.has_kyc ? 'sim' : 'não'}</td>
                                <td className="py-1">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
