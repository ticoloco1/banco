import type { SupabaseClient } from '@supabase/supabase-js';
import { getAssetUrl } from '@/lib/getAssetUrl';
import { openAiCompatibleChat, resolveAiRuntime, type AiConfigRow } from '@/lib/aiOpenAiCompatible';

export type ClassifiedGateType = 'imovel' | 'carro';

export type ClassifiedGateResult = {
  accept: boolean;
  reasonPt: string;
  /** Análise só por texto (sem fotos) — recomenda-se OPENAI_API_KEY para visão. */
  textOnly?: boolean;
  bypass?: boolean;
};

const SYSTEM_JSON =
  'Respondes APENAS com um objeto JSON válido, sem markdown: {"accept":true ou false,"reason_pt":"explicação curta em português para o utilizador"}';

function parseGateJson(raw: string | null): ClassifiedGateResult | null {
  if (!raw) return null;
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    const j = JSON.parse(t) as { accept?: boolean; reason_pt?: string };
    if (typeof j.accept !== 'boolean') return null;
    return {
      accept: j.accept,
      reasonPt: typeof j.reason_pt === 'string' ? j.reason_pt.slice(0, 500) : (j.accept ? 'Aprovado.' : 'Recusado.'),
    };
  } catch {
    return null;
  }
}

async function loadPlatformAiConfig(db: SupabaseClient): Promise<AiConfigRow | null> {
  const { data } = await db
    .from('platform_settings' as never)
    .select('value')
    .eq('key', 'ai_config')
    .maybeSingle();
  const row = data as { value?: string } | null;
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as AiConfigRow;
  } catch {
    return null;
  }
}

/**
 * OpenAI Vision (gpt-4o-mini): analisa fotos públicas + texto.
 * Requer OPENAI_API_KEY e URLs HTTPS acessíveis pela OpenAI.
 */
async function verifyWithOpenAiVision(params: {
  type: ClassifiedGateType;
  title: string;
  description: string;
  imagePaths: string[];
}): Promise<ClassifiedGateResult | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const category = params.type === 'imovel' ? 'IMÓVEL / imóvel / terreno / apartamento' : 'CARRO / veículo automóvel';
  const urls = params.imagePaths
    .slice(0, 5)
    .map((p) => getAssetUrl(p))
    .filter((u) => /^https:\/\//i.test(u));
  if (urls.length === 0) return null;

  const userText = `Moderador do diretório classificados TrustBank (qualidade tipo Zillow / Cars.com).

Categoria declarada: ${category}

Título: ${params.title.slice(0, 200)}
Descrição: ${params.description.slice(0, 2000)}

Regras:
- ACEITA só se as imagens mostram claramente conteúdo adequado: ${params.type === 'imovel' ? 'edifícios, interiores, terrenos, plantas de imóvel' : 'automóveis (carros, motos só se categoria fosse carro — aqui é carro)'}.
- REJEITA: retratos só de pessoas sem veículo/imóvel, ebooks/PDF/cursos digitais, OnlyFans, dropshipping genérico, produtos que não são imóvel nem carro, spam vazio, imagens irrelevantes (memes, natureza sem contexto de anúncio).
- Se as fotos não permitem concluir, ou parecem golpe, reason_pt explica e accept=false.

Responde só o JSON pedido.`;

  const content: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [
    { type: 'text', text: userText },
  ];
  for (const url of urls) {
    content.push({ type: 'image_url', image_url: { url, detail: 'low' } });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_JSON },
        { role: 'user', content },
      ],
      max_tokens: 400,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[classifiedAiGate] OpenAI vision', res.status, err.slice(0, 300));
    return null;
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content?.trim() || null;
  const parsed = parseGateJson(raw);
  if (!parsed) return { accept: false, reasonPt: 'Não foi possível validar o anúncio automaticamente. Tenta outras fotos ou contacta suporte.', textOnly: false };
  return { ...parsed, textOnly: false };
}

/**
 * DeepSeek / OpenAI-compat só texto (sem ver imagens).
 */
async function verifyTextOnly(params: {
  type: ClassifiedGateType;
  title: string;
  description: string;
  runtime: { apiKey: string; baseUrl: string; model: string };
}): Promise<ClassifiedGateResult> {
  const category = params.type === 'imovel' ? 'imóvel (casa, apartamento, terreno, comercial)' : 'veículo (carro)';
  const user = `És moderador de classificados (padrão de qualidade estilo portais Zillow para imóveis / Cars.com para veículos).

Anúncio declarado: ${category} no TrustBank.

Título: ${params.title.slice(0, 200)}
Descrição: ${params.description.slice(0, 2000)}

Sem acesso às fotos: sê exigente. REJEITA ebook, curso, PDF, dropshipping, perfil pessoal sem bem, OnlyFans, NFT, emprego, serviços genéricos, texto vazio ou spam.
ACEITA só se for claramente venda ou arrendamento de ${category} com descrição coerente.

JSON apenas.`;

  const raw = await openAiCompatibleChat({
    baseUrl: params.runtime.baseUrl,
    model: params.runtime.model,
    apiKey: params.runtime.apiKey,
    system: SYSTEM_JSON,
    user,
    max_tokens: 400,
    temperature: 0.25,
  });
  const parsed = parseGateJson(raw);
  if (!parsed) {
    return {
      accept: false,
      reasonPt: 'A validação automática falhou. Configura OPENAI_API_KEY para análise com fotos ou tenta de novo.',
      textOnly: true,
    };
  }
  return { ...parsed, textOnly: true };
}

export async function runClassifiedAiGate(
  db: SupabaseClient,
  params: {
    type: ClassifiedGateType;
    title: string;
    description: string;
    imagePaths: string[];
  },
): Promise<ClassifiedGateResult> {
  if (process.env.CLASSIFIED_AI_GATE_DISABLED === 'true' || process.env.CLASSIFIED_AI_GATE_DISABLED === '1') {
    return { accept: true, reasonPt: 'Verificação IA desativada (CLASSIFIED_AI_GATE_DISABLED).', bypass: true };
  }

  if (!params.imagePaths.length) {
    return { accept: false, reasonPt: 'Adiciona pelo menos uma foto do imóvel ou do carro antes de publicar.' };
  }

  const vision = await verifyWithOpenAiVision(params);
  if (vision) return vision;

  const aiRow = await loadPlatformAiConfig(db);
  const runtime = resolveAiRuntime(aiRow);
  if (!runtime) {
    return {
      accept: false,
      reasonPt:
        'A plataforma ainda não tem IA configurada para validar anúncios. Define OPENAI_API_KEY (recomendado, com análise de fotos) ou DEEPSEEK_API_KEY / ai_config no admin.',
    };
  }

  return verifyTextOnly({
    type: params.type,
    title: params.title,
    description: params.description,
    runtime,
  });
}
