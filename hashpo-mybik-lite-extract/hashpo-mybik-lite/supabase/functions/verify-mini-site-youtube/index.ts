import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extrai ID 11 caracteres do HTML da página do YouTube (player response / shortDescription). */
function extractYoutubeIdFromPage(html: string): string | null {
  const m =
    html.match(/"videoId":"([\w-]{11})"/) ||
    html.match(/embed\/([\w-]{11})/) ||
    html.match(/watch\?v=([\w-]{11})/);
  return m?.[1] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = await req.json();
    const clean = String(code || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean.length < 6) {
      return new Response(JSON.stringify({ error: "Código inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: row, error: findErr } = await admin
      .from("mini_site_videos")
      .select("id, user_id, youtube_verification_code, youtube_verified_at")
      .eq("youtube_verification_code", clean)
      .maybeSingle();

    if (findErr || !row) {
      return new Response(JSON.stringify({ error: "Código não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Este código pertence a outro criador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.youtube_verified_at) {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: priv } = await admin
      .from("private_video_urls")
      .select("youtube_video_id")
      .eq("video_id", row.id)
      .maybeSingle();

    const { data: pub } = await admin
      .from("mini_site_videos")
      .select("youtube_video_id")
      .eq("id", row.id)
      .maybeSingle();

    const ytId = priv?.youtube_video_id || (pub as { youtube_video_id?: string } | null)?.youtube_video_id;
    if (!ytId) {
      return new Response(JSON.stringify({ error: "Vídeo sem ID do YouTube" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(ytId)}`;
    const res = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HASHPO-Verify/1.0; +https://hashpo.com)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Não foi possível ler a página do YouTube. Tente de novo em instantes." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = await res.text();
    const pageVid = extractYoutubeIdFromPage(html);
    if (pageVid && pageVid !== ytId) {
      return new Response(JSON.stringify({ error: "Resposta do YouTube inconsistente" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const needle = `hashpo.com/verify/${clean}`;
    const needleAlt = `hashpo-verify-${clean}`;
    const blob = html.toLowerCase();
    if (!blob.includes(needle) && !blob.includes(needleAlt)) {
      return new Response(
        JSON.stringify({
          ok: false,
          hint:
            `Inclua no título, descrição ou links do vídeo o texto: ${needle} (ou ${needleAlt}) e clique em verificar novamente.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: upErr } = await admin
      .from("mini_site_videos")
      .update({ youtube_verified_at: new Date().toISOString() })
      .eq("id", row.id);

    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, verified: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
