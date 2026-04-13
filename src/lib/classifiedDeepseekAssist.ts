import type { SupabaseClient } from '@supabase/supabase-js';
import { openAiCompatibleChat, resolveAiRuntime, type AiConfigRow } from '@/lib/aiOpenAiCompatible';
import { nominatimGeocode } from '@/lib/nominatimGeocode';

export type ClassifiedAssistType = 'imovel' | 'carro';

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  return t;
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

const REGIONS = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania', 'Middle East'] as const;

/**
 * DeepSeek (OpenAI-compatible): sugere campos estilo Zillow / Cars.com e indica se o anúncio parece legítimo.
 */
export async function runClassifiedDeepseekAssist(
  db: SupabaseClient,
  params: {
    type: ClassifiedAssistType;
    title: string;
    description: string;
    price?: string;
    currency?: string;
    region?: string;
    country?: string;
    stateCity?: string;
    /** Campos já preenchidos (marca, modelo, tipo…) para contexto */
    extraContext?: Record<string, unknown>;
  },
): Promise<{
  suggestions: Record<string, unknown>;
  notes_pt: string;
  would_pass_moderation: boolean;
  listing_quality: string;
} | null> {
  const aiRow = await loadPlatformAiConfig(db);
  const runtime = resolveAiRuntime(aiRow);
  if (!runtime) return null;

  const system = `Respondes APENAS com JSON válido (sem markdown). Chaves fixas conforme o pedido do utilizador.`;

  let user: string;
  if (params.type === 'imovel') {
    user = `És especialista em portais imobiliários (estilo Zillow). Ajuda a estruturar um anúncio de IMÓVEL no TrustBank.

Dados actuais do utilizador:
- título: ${params.title.slice(0, 200)}
- descrição: ${params.description.slice(0, 4000)}
- preço (texto): ${params.price || '(vazio)'}
- moeda: ${params.currency || '(vazio)'}
- região: ${params.region || '(vazio)'}
- país (ISO2): ${params.country || '(vazio)'}
- cidade/estado: ${params.stateCity || '(vazio)'}
- contexto extra: ${JSON.stringify(params.extraContext || {}).slice(0, 1500)}

Devolve JSON com esta forma exacta:
{
  "title": "string curta e profissional",
  "descricao": "2 a 5 frases para o anúncio, tom neutro",
  "tipo": "Apartamento" | "Casa" | "Comercial" | "Terreno" | "Studio" | "Fazenda" | "Outro",
  "quartos": number ou null,
  "banheiros": number ou null,
  "m2": number ou null,
  "garagem": number ou null,
  "region": uma de ${JSON.stringify([...REGIONS])} ou null,
  "country": "BR" etc. ISO2 ou null,
  "state_city": "Cidade, UF" ou equivalente,
  "price_hint": number ou null (só se inferível do texto),
  "currency_hint": "BRL"|"USD"|"EUR"|null,
  "listing_quality": "strong" | "medium" | "weak",
  "would_pass_moderation": boolean (true só se for claramente imóvel real; false para ebook, curso, perfil pessoal sem imóvel, spam),
  "notes_pt": "1-3 frases de dicas ao vendedor em português"
}

Regras: não inventes números que contradizem o texto. Se o texto for vago, listing_quality=weak e would_pass_moderation=false.`;
  } else {
    user = `És especialista em classificados de veículos (estilo Cars.com / Webmotors). Ajuda a estruturar anúncio de CARRO.

Dados actuais:
- título: ${params.title.slice(0, 200)}
- descrição: ${params.description.slice(0, 4000)}
- preço: ${params.price || '(vazio)'}
- moeda: ${params.currency || '(vazio)'}
- região/país/cidade: ${params.region || ''} / ${params.country || ''} / ${params.stateCity || ''}
- contexto extra: ${JSON.stringify(params.extraContext || {}).slice(0, 1500)}

Devolve JSON:
{
  "title": "string",
  "descricao": "2 a 5 frases",
  "marca": "string ou vazio",
  "modelo": "string ou vazio",
  "ano": number ou null,
  "km": number ou null,
  "cor": "string ou vazio",
  "combustivel": "Flex"|"Gasolina"|"Diesel"|"Elétrico"|"Híbrido"|"GNV"|"",
  "cambio": "Manual"|"Automático"|"CVT"|"Semi-automático"|"",
  "portas": number ou null,
  "region": uma de ${JSON.stringify([...REGIONS])} ou null,
  "country": ISO2 ou null,
  "state_city": "Cidade, Estado" ou "",
  "price_hint": number ou null,
  "currency_hint": "BRL"|"USD"|null,
  "listing_quality": "strong"|"medium"|"weak",
  "would_pass_moderation": boolean (true só se for claramente venda de veículo),
  "notes_pt": "dicas em português"
}`;
  }

  const raw = await openAiCompatibleChat({
    baseUrl: runtime.baseUrl,
    model: runtime.model,
    apiKey: runtime.apiKey,
    system,
    user,
    max_tokens: 1200,
    temperature: 0.35,
  });
  if (!raw) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripJsonFence(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }

  const suggestions: Record<string, unknown> = { ...parsed };
  for (const k of ['notes_pt', 'would_pass_moderation', 'listing_quality', 'lat', 'lng', 'map_label']) {
    delete suggestions[k];
  }

  const notes_pt = typeof parsed.notes_pt === 'string' ? parsed.notes_pt.slice(0, 800) : '';
  const would_pass_moderation = parsed.would_pass_moderation === true;
  const listing_quality = typeof parsed.listing_quality === 'string' ? parsed.listing_quality : 'medium';

  const cityLine =
    typeof parsed.state_city === 'string' && parsed.state_city.trim()
      ? `${parsed.state_city.trim()}, ${typeof parsed.country === 'string' ? parsed.country : ''}`.replace(/, $/, '')
      : '';
  if (cityLine.length > 4) {
    const geo = await nominatimGeocode(cityLine);
    if (geo) {
      suggestions.lat = geo.lat;
      suggestions.lng = geo.lng;
      suggestions.map_label = geo.display_name;
    }
  }

  return {
    suggestions,
    notes_pt,
    would_pass_moderation,
    listing_quality,
  };
}
