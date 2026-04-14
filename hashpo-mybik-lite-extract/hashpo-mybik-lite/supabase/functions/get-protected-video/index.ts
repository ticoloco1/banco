import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // User client to verify identity
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

    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client to access private tables
    const admin = createClient(supabaseUrl, serviceKey);

    // Get video info (without youtube_video_id - it's in private table now)
    const { data: video, error: videoErr } = await admin
      .from("mini_site_videos")
      .select("id, nft_enabled, paywall_enabled, user_id, youtube_video_id")
      .eq("id", video_id)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to get youtube_video_id from private table
    const getPrivateVideoId = async () => {
      const { data } = await admin
        .from("private_video_urls")
        .select("youtube_video_id")
        .eq("video_id", video_id)
        .maybeSingle();
      const fromPrivate = data?.youtube_video_id || null;
      const fromRow = (video as { youtube_video_id?: string | null }).youtube_video_id || null;
      return fromPrivate || fromRow;
    };

    // Owner always has access
    if (video.user_id === user.id) {
      const youtubeId = await getPrivateVideoId();
      return new Response(
        JSON.stringify({ access: true, youtube_video_id: youtubeId, access_type: "owner" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check NFT access - user has valid purchase with remaining views
    if (video.nft_enabled) {
      const { data: nftPurchase } = await admin
        .from("nft_purchases")
        .select("id, views_allowed, views_used")
        .eq("video_id", video_id)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (nftPurchase && nftPurchase.views_used < nftPurchase.views_allowed) {
        const youtubeId = await getPrivateVideoId();
        return new Response(
          JSON.stringify({ 
            access: true, 
            youtube_video_id: youtubeId,
            access_type: "nft",
            views_remaining: nftPurchase.views_allowed - nftPurchase.views_used
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check paywall access - user has valid unexpired unlock
    if (video.paywall_enabled) {
      const { data: paywallUnlock } = await admin
        .from("video_paywall_unlocks")
        .select("id, expires_at")
        .eq("video_id", video_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (paywallUnlock) {
        const notExpired = !paywallUnlock.expires_at || new Date(paywallUnlock.expires_at) > new Date();
        if (notExpired) {
          const youtubeId = await getPrivateVideoId();
          return new Response(
            JSON.stringify({ 
              access: true, 
              youtube_video_id: youtubeId,
              access_type: "paywall",
              expires_at: paywallUnlock.expires_at
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Free videos (no paywall or nft enabled)
    if (!video.nft_enabled && !video.paywall_enabled) {
      const youtubeId = await getPrivateVideoId();
      return new Response(
        JSON.stringify({ access: true, youtube_video_id: youtubeId, access_type: "free" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No access
    return new Response(
      JSON.stringify({ 
        access: false, 
        reason: "Payment required",
        nft_enabled: video.nft_enabled,
        paywall_enabled: video.paywall_enabled
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
