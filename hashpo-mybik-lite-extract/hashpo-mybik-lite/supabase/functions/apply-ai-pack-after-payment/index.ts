import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 1 unit = 1000 interactions, 10 units = 10000 (mesmo padrão do ai-chat)
const PACK_UNITS: Record<string, number> = { "1000": 1, "10000": 10 };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    if (!data.user) throw new Error("Unauthorized");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = session.metadata?.user_id;
    const pack = session.metadata?.ai_pack as string | undefined;
    const unitsToAdd = pack ? PACK_UNITS[pack] : undefined;
    if (!userId || unitsToAdd == null || unitsToAdd < 1) {
      return new Response(JSON.stringify({ error: "Invalid metadata for AI pack" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: existing } = await supabaseClient
      .from("ai_usage")
      .select("id, interactions_paid")
      .eq("user_id", userId)
      .maybeSingle();

    const now = new Date().toISOString();
    if (existing) {
      const { error } = await supabaseClient
        .from("ai_usage")
        .update({
          interactions_paid: (existing.interactions_paid ?? 0) + unitsToAdd,
          updated_at: now,
        })
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from("ai_usage").insert({
        user_id: userId,
        interactions_used: 0,
        interactions_paid: unitsToAdd,
        updated_at: now,
      });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, units_added: unitsToAdd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
