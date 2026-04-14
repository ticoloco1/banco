import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";

async function getDeepSeekKeyFromAdmin(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const supabase = createClient(url, serviceKey);
  const { data } = await supabase
    .from("platform_api_keys")
    .select("api_key")
    .eq("service_name", "deepseek_api_key")
    .maybeSingle();
  const k = (data as { api_key?: string } | null)?.api_key?.trim();
  return k || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    let key = (typeof body?.api_key === "string" ? body.api_key.trim() : null) || process.env.DEEPSEEK_API_KEY || null;
    if (!key) key = await getDeepSeekKeyFromAdmin();

    if (!key) {
      return NextResponse.json(
        { error: "Configure a API key no Admin (API Keys > DeepSeek), envie no campo api_key da página, ou defina DEEPSEEK_API_KEY no servidor." },
        { status: 503 }
      );
    }

    if (!prompt || prompt.length > 500) {
      return NextResponse.json(
        { error: "Descreva o que você quer (até 500 caracteres)." },
        { status: 400 }
      );
    }

    const res = await fetch(DEEPSEEK_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de design para produtos de impressão sob demanda (camisetas, canecas, posters).
O cliente descreveu o que quer. Sua tarefa: responder em português, em 2 a 4 frases curtas, com uma DESCRIÇÃO VISUAL CLARA do design (cores, estilo, elementos, disposição) para um designer ou para uso em ferramenta de IA de imagem.
Seja objetivo e criativo. Não inclua saudações nem explicações longas, só a descrição do design.`,
          },
          {
            role: "user",
            content: `O cliente pediu: "${prompt}". Gere a descrição visual do design.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Erro ao gerar design. Tente de novo." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const brief =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Não foi possível gerar a descrição. Tente outra frase.";

    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao gerar design. Tente de novo." },
      { status: 500 }
    );
  }
}
