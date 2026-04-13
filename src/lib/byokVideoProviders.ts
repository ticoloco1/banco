type Provider = 'kling' | 'luma';

function env(name: string): string {
  return process.env[name]?.trim() || '';
}

function extractJobId(payload: any): string {
  return String(
    payload?.id ||
    payload?.job_id ||
    payload?.task_id ||
    payload?.data?.id ||
    payload?.data?.job_id ||
    '',
  ).trim();
}

function extractResultUrl(payload: any): string {
  return String(
    payload?.video_url ||
    payload?.result_url ||
    payload?.url ||
    payload?.data?.video_url ||
    payload?.data?.url ||
    payload?.output?.video_url ||
    payload?.output?.url ||
    '',
  ).trim();
}

function extractStatus(payload: any): string {
  const s = String(payload?.status || payload?.state || payload?.data?.status || '').toLowerCase();
  if (!s) return 'processing';
  if (['completed', 'done', 'succeeded', 'success', 'ready'].includes(s)) return 'completed';
  if (['failed', 'error', 'cancelled', 'canceled'].includes(s)) return 'failed';
  return 'processing';
}

function createUrlFor(provider: Provider): string {
  return provider === 'kling' ? env('BYOK_KLING_CREATE_URL') : env('BYOK_LUMA_CREATE_URL');
}

function statusTemplateFor(provider: Provider): string {
  return provider === 'kling'
    ? env('BYOK_KLING_STATUS_URL_TEMPLATE')
    : env('BYOK_LUMA_STATUS_URL_TEMPLATE');
}

export async function createExternalVideoJob(params: {
  provider: Provider;
  apiKey: string;
  prompt: string;
}): Promise<{ externalJobId: string; status: string; resultUrl: string; raw: any }> {
  const url = createUrlFor(params.provider);
  if (!url) {
    throw new Error(
      params.provider === 'kling'
        ? 'BYOK_KLING_CREATE_URL is missing'
        : 'BYOK_LUMA_CREATE_URL is missing',
    );
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({ prompt: params.prompt }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Provider create failed (${resp.status})`);
  }
  const externalJobId = extractJobId(json);
  const resultUrl = extractResultUrl(json);
  const status = resultUrl ? 'completed' : extractStatus(json);
  return { externalJobId, status, resultUrl, raw: json };
}

export async function fetchExternalVideoJobStatus(params: {
  provider: Provider;
  apiKey: string;
  externalJobId: string;
}): Promise<{ status: string; resultUrl: string; raw: any }> {
  const tpl = statusTemplateFor(params.provider);
  if (!tpl || !params.externalJobId) {
    return { status: 'processing', resultUrl: '', raw: {} };
  }
  const url = tpl.replace('{id}', encodeURIComponent(params.externalJobId));
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${params.apiKey}` },
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Provider status failed (${resp.status})`);
  }
  return {
    status: extractStatus(json),
    resultUrl: extractResultUrl(json),
    raw: json,
  };
}

