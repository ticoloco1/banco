'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, Link2, Loader2, Mic, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

type Provider = {
  id: string;
  label: string;
  category: string;
  docsUrl: string;
  keyHint: string;
};

type Connection = {
  provider: string;
  is_active: boolean;
  updated_at?: string | null;
  last_checked_at?: string | null;
};

export function ApiHubDrawer({ siteId }: { siteId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [creativeProvider, setCreativeProvider] = useState('openai');
  const [creativePrompt, setCreativePrompt] = useState('');
  const [creativeContext, setCreativeContext] = useState('');
  const [creativeOut, setCreativeOut] = useState('');
  const [creativeBusy, setCreativeBusy] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceAudioSrc, setVoiceAudioSrc] = useState('');
  const [videoProvider, setVideoProvider] = useState<'kling' | 'luma'>('kling');
  const [videoTitle, setVideoTitle] = useState('AI Video');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoPaywallEnabled, setVideoPaywallEnabled] = useState(true);
  const [videoPaywallPrice, setVideoPaywallPrice] = useState('6.99');
  const [videoBusy, setVideoBusy] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [youtubeDrafts, setYoutubeDrafts] = useState<Record<string, string>>({});

  const connectedSet = useMemo(
    () => new Set(connections.filter((c) => c.is_active).map((c) => c.provider)),
    [connections],
  );
  const connectedTextProviders = useMemo(
    () => providers.filter((p) => connectedSet.has(p.id) && (p.category === 'text' || p.category === 'multi')),
    [providers, connectedSet],
  );
  const elevenConnected = connectedSet.has('elevenlabs');
  const videoProviderConnected = connectedSet.has(videoProvider);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/byok/connections', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load API Hub');
      setProviders(Array.isArray(data.providers) ? data.providers : []);
      setConnections(Array.isArray(data.connections) ? data.connections : []);
      if (siteId) {
        const jobsRes = await fetch(`/api/byok/video/jobs?siteId=${encodeURIComponent(siteId)}`, { credentials: 'include' });
        const jobsData = await jobsRes.json().catch(() => ({}));
        if (jobsRes.ok && Array.isArray(jobsData.jobs)) setJobs(jobsData.jobs);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load API Hub');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!siteId) return;
    const res = await fetch(`/api/byok/video/jobs?siteId=${encodeURIComponent(siteId)}`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.jobs)) setJobs(data.jobs);
  };

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open]);
  useEffect(() => {
    if (connectedTextProviders.length === 0) return;
    if (!connectedTextProviders.some((p) => p.id === creativeProvider)) {
      setCreativeProvider(connectedTextProviders[0].id);
    }
  }, [connectedTextProviders, creativeProvider]);

  const saveKey = async (provider: Provider) => {
    const key = (drafts[provider.id] || '').trim();
    if (!key) {
      toast.error('Please enter an API key');
      return;
    }
    setSavingProvider(provider.id);
    try {
      const res = await fetch('/api/byok/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: provider.id, apiKey: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not save API key');
      setDrafts((prev) => ({ ...prev, [provider.id]: '' }));
      toast.success(`${provider.label} key saved`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not save API key');
    } finally {
      setSavingProvider(null);
    }
  };

  const removeKey = async (provider: Provider) => {
    setSavingProvider(provider.id);
    try {
      const res = await fetch(`/api/byok/connections?provider=${encodeURIComponent(provider.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not remove API key');
      toast.success(`${provider.label} key removed`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove API key');
    } finally {
      setSavingProvider(null);
    }
  };

  const runCreative = async (mode: 'script' | 'seo') => {
    const p = creativePrompt.trim();
    if (!p) {
      toast.error('Write a prompt first');
      return;
    }
    if (!creativeProvider) {
      toast.error('Connect a text AI provider first');
      return;
    }
    setCreativeBusy(true);
    try {
      const res = await fetch('/api/byok/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: creativeProvider,
          mode,
          prompt: p,
          siteContext: creativeContext,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Generation failed');
      if (mode === 'seo') {
        setCreativeOut(JSON.stringify(data.data, null, 2));
      } else {
        setCreativeOut(String(data.text || ''));
      }
      toast.success(mode === 'seo' ? 'SEO pack generated' : 'Script generated');
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
    } finally {
      setCreativeBusy(false);
    }
  };

  const runVoice = async () => {
    const text = voiceText.trim();
    if (!text) {
      toast.error('Write voice text first');
      return;
    }
    if (!elevenConnected) {
      toast.error('Connect ElevenLabs key in API Hub first');
      return;
    }
    setVoiceBusy(true);
    try {
      const res = await fetch('/api/byok/voice/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, voiceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Voice generation failed');
      const mime = String(data.mime || 'audio/mpeg');
      const b64 = String(data.audioBase64 || '');
      if (!b64) throw new Error('No audio returned');
      setVoiceAudioSrc(`data:${mime};base64,${b64}`);
      toast.success('Voice generated');
    } catch (e: any) {
      toast.error(e?.message || 'Voice generation failed');
    } finally {
      setVoiceBusy(false);
    }
  };

  const createVideoJob = async () => {
    if (!siteId) {
      toast.error('Open API Hub from editor site context');
      return;
    }
    const p = videoPrompt.trim();
    if (!p) {
      toast.error('Write a video prompt');
      return;
    }
    if (!videoProviderConnected) {
      toast.error(`Connect ${videoProvider} key first`);
      return;
    }
    setVideoBusy(true);
    try {
      const res = await fetch('/api/byok/video/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          siteId,
          provider: videoProvider,
          prompt: p,
          title: videoTitle,
          paywallEnabled: videoPaywallEnabled,
          paywallPrice: Number(videoPaywallPrice || 6.99),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create video job');
      toast.success('Video job created');
      await loadJobs();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create video job');
    } finally {
      setVideoBusy(false);
    }
  };

  const refreshJob = async (jobId: string) => {
    const res = await fetch(`/api/byok/video/jobs?jobId=${encodeURIComponent(jobId)}&refresh=1`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data?.error || 'Could not refresh job');
      return;
    }
    await loadJobs();
  };

  const publishJob = async (jobId: string) => {
    try {
      const youtubeUrl = (youtubeDrafts[jobId] || '').trim();
      const res = await fetch('/api/byok/video/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobId, youtubeUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Publish failed');
      toast.success('Published to video paywall');
      await loadJobs();
    } catch (e: any) {
      toast.error(e?.message || 'Publish failed');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-20 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
      >
        <KeyRound className="w-4 h-4" />
        API Hub
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-full max-w-md bg-[var(--bg)] border-l border-[var(--border)] p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text)]">API Hub (BYOK)</h3>
                <p className="text-xs text-[var(--text2)]">
                  Manage your own API keys in one place.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--bg2)] text-[var(--text2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-14 flex items-center justify-center text-[var(--text2)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                    <p className="text-sm font-bold text-[var(--text)]">Creative Assistant</p>
                  </div>
                  <p className="text-xs text-[var(--text2)]">
                    Generate ad scripts and SEO packs without leaving this tab.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="input text-xs"
                      value={creativeProvider}
                      onChange={(e) => setCreativeProvider(e.target.value)}
                    >
                      {connectedTextProviders.length === 0 ? (
                        <option value="">No text provider connected</option>
                      ) : connectedTextProviders.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      className="input text-xs"
                      placeholder="Context: product/site/offer"
                      value={creativeContext}
                      onChange={(e) => setCreativeContext(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input text-xs min-h-20"
                    placeholder="Prompt: short video about..."
                    value={creativePrompt}
                    onChange={(e) => setCreativePrompt(e.target.value)}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={creativeBusy || connectedTextProviders.length === 0}
                      onClick={() => void runCreative('script')}
                      className="btn-primary text-xs gap-1.5"
                    >
                      {creativeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Generate Script
                    </button>
                    <button
                      type="button"
                      disabled={creativeBusy || connectedTextProviders.length === 0}
                      onClick={() => void runCreative('seo')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--text2)] disabled:opacity-40"
                    >
                      {creativeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Generate SEO Pack
                    </button>
                    <button
                      type="button"
                      disabled={!creativeOut}
                      onClick={async () => {
                        await navigator.clipboard.writeText(creativeOut);
                        toast.success('Copied');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--text2)] disabled:opacity-40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                  {creativeOut ? (
                    <pre className="rounded-lg border border-[var(--border)] bg-black/30 p-2 text-[11px] text-zinc-200 overflow-auto max-h-56 whitespace-pre-wrap">
                      {creativeOut}
                    </pre>
                  ) : null}
                </div>

                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-sky-300" />
                    <p className="text-sm font-bold text-[var(--text)]">Voice Assistant (ElevenLabs)</p>
                  </div>
                  <p className="text-xs text-[var(--text2)]">
                    Generate voice-over from text without leaving editor.
                  </p>
                  <input
                    className="input text-xs font-mono"
                    placeholder="Voice ID (optional)"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                  />
                  <textarea
                    className="input text-xs min-h-20"
                    placeholder="Text for narration..."
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => void runVoice()}
                      disabled={voiceBusy || !elevenConnected}
                      className="btn-primary text-xs gap-1.5"
                    >
                      {voiceBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                      Generate Voice
                    </button>
                    {!elevenConnected ? (
                      <span className="text-[11px] text-amber-300">Connect ElevenLabs key first</span>
                    ) : null}
                  </div>
                  {voiceAudioSrc ? (
                    <audio controls src={voiceAudioSrc} className="w-full mt-1" />
                  ) : null}
                </div>

                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                  <p className="text-sm font-bold text-[var(--text)]">Video Pipeline (Kling/Luma)</p>
                  <p className="text-xs text-[var(--text2)]">
                    Create jobs with your BYOK keys, refresh status, and publish to paywall.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="input text-xs"
                      value={videoProvider}
                      onChange={(e) => setVideoProvider(e.target.value as 'kling' | 'luma')}
                    >
                      <option value="kling">Kling</option>
                      <option value="luma">Luma</option>
                    </select>
                    <input
                      className="input text-xs"
                      placeholder="Video title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input text-xs min-h-20"
                    placeholder="Video prompt..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-[var(--text2)]">
                      <input
                        type="checkbox"
                        checked={videoPaywallEnabled}
                        onChange={(e) => setVideoPaywallEnabled(e.target.checked)}
                      />
                      Paywall enabled
                    </label>
                    <input
                      className="input text-xs"
                      placeholder="Paywall price"
                      value={videoPaywallPrice}
                      onChange={(e) => setVideoPaywallPrice(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void createVideoJob()}
                    disabled={videoBusy || !videoProviderConnected || !siteId}
                    className="btn-primary text-xs gap-1.5"
                  >
                    {videoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Create Video Job
                  </button>
                  {!videoProviderConnected ? (
                    <p className="text-[11px] text-amber-300">Connect {videoProvider} key first</p>
                  ) : null}
                  {jobs.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {jobs.slice(0, 6).map((j) => (
                        <div key={j.id} className="rounded-lg border border-[var(--border)] bg-black/20 p-2 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--text)] truncate">{j.title || 'AI Video'}</p>
                            <span className="text-[10px] text-[var(--text2)]">{String(j.status || '').toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text2)] line-clamp-2">{j.prompt}</p>
                          {j.result_url ? (
                            <a
                              href={j.result_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-300 hover:underline break-all"
                            >
                              {j.result_url}
                            </a>
                          ) : null}
                          {j.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => void refreshJob(j.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--border)] text-[10px]"
                            >
                              Refresh
                            </button>
                          ) : null}
                          <div className="flex gap-1.5">
                            <input
                              className="input text-[10px] py-1"
                              placeholder="YouTube/Vimeo/Rumble URL (if required)"
                              value={youtubeDrafts[j.id] || ''}
                              onChange={(e) => setYoutubeDrafts((prev) => ({ ...prev, [j.id]: e.target.value }))}
                            />
                            <button
                              type="button"
                              onClick={() => void publishJob(j.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                            >
                              Publish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {providers.map((p) => {
                  const connected = connectedSet.has(p.id);
                  const busy = savingProvider === p.id;
                  return (
                    <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg2)]/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[var(--text)]">{p.label}</p>
                          <p className="text-[11px] text-[var(--text2)] uppercase tracking-wide">{p.category}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                            connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-300'
                          }`}
                        >
                          {connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={p.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:underline"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Open provider console
                        </a>
                      </div>

                      <input
                        type="password"
                        className="input w-full font-mono text-xs"
                        placeholder={p.keyHint}
                        value={drafts[p.id] || ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void saveKey(p)}
                          disabled={busy}
                          className="btn-primary text-xs gap-1.5"
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Save key
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeKey(p)}
                          disabled={busy || !connected}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--text2)] disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

