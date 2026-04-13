'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';

export default function AdminMarketingDeliveryPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [cashbackEnabled, setCashbackEnabled] = useState(true);
  const [cashbackRate, setCashbackRate] = useState(0.05);
  const [savingCashback, setSavingCashback] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/admin/marketing/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        setLeads(Array.isArray(data.leads) ? data.leads : []);
      }
      const cfgRes = await fetch('/api/admin/cashback-config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const cfg = await cfgRes.json().catch(() => ({}));
      if (cfgRes.ok) {
        setCashbackEnabled(Boolean(cfg.enabled));
        setCashbackRate(Number(cfg.rate || 0.05));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function runWorker() {
    setRunning(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/admin/marketing/process-delivery', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      alert(res.ok ? `Worker OK: ${JSON.stringify(data)}` : data?.error || 'Erro no worker');
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function retryLead(leadId: string) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/admin/marketing/retry-failed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || 'Falha no retry');
      return;
    }
    await load();
  }

  async function saveCashbackConfig() {
    setSavingCashback(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/admin/cashback-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled: cashbackEnabled, rate: cashbackRate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Falha ao salvar cashback');
      alert('Cashback config salva.');
    } catch (e: any) {
      alert(e?.message || 'Falha ao salvar cashback');
    } finally {
      setSavingCashback(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="card p-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-[var(--text)]">Admin NFT Delivery</h1>
            <p className="text-sm text-[var(--text2)]">Queue, retries and automatic campaign wallet delivery.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => void load()} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button className="btn-primary text-xs" onClick={() => void runWorker()} disabled={running}>
              {running ? 'Processando...' : 'Rodar worker'}
            </button>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-black text-[var(--text)]">Cashback Pro config</h2>
          <label className="text-xs flex items-center gap-2 text-[var(--text2)]">
            <input
              type="checkbox"
              checked={cashbackEnabled}
              onChange={(e) => setCashbackEnabled(e.target.checked)}
            />
            Cashback ligado
          </label>
          <div className="flex items-center gap-2">
            <input
              className="input w-32"
              type="number"
              step="0.01"
              min="0"
              value={cashbackRate}
              onChange={(e) => setCashbackRate(Number(e.target.value || 0))}
            />
            <span className="text-xs text-[var(--text2)]">taxa (ex: 0.05 = 5%)</span>
          </div>
          <button className="btn-primary text-xs" onClick={() => void saveCashbackConfig()} disabled={savingCashback}>
            {savingCashback ? 'Salvando...' : 'Salvar cashback'}
          </button>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-black text-[var(--text)]">Leads (delivery state)</h2>
          <div className="space-y-2">
            {leads.slice(0, 80).map((l) => (
              <div key={l.id} className="rounded-xl border border-[var(--border)] p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  <p className="text-[var(--text)] font-semibold">{l.id}</p>
                  <p className="text-[var(--text2)]">campaign: {l.campaign_id}</p>
                  <p className="text-[var(--text2)]">status: {l.delivery_status}</p>
                  {l.delivery_error ? <p className="text-red-400">{l.delivery_error}</p> : null}
                </div>
                {l.delivery_status === 'failed' ? (
                  <button className="btn-secondary text-xs" onClick={() => void retryLead(l.id)}>
                    Retry
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-black text-[var(--text)]">Jobs</h2>
          <div className="space-y-2">
            {jobs.slice(0, 80).map((j) => (
              <div key={j.id} className="rounded-xl border border-[var(--border)] p-3 text-xs">
                <p className="text-[var(--text)] font-semibold">{j.id}</p>
                <p className="text-[var(--text2)]">status: {j.status} · attempts: {j.attempts}</p>
                {j.tx_hash ? <p className="text-[var(--text2)]">tx: {j.tx_hash}</p> : null}
                {j.error ? <p className="text-red-400">{j.error}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
