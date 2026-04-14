import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function recomputeExtraSpacesForSite(
  supabaseClient: ReturnType<typeof createClient>,
  siteId: string,
) {
  const now = new Date();
  const { data: rows, error } = await supabaseClient
    .from("extra_space_subscriptions")
    .select("extra_type, current_period_end, status")
    .eq("site_id", siteId);
  if (error) throw error;

  const activeRows = (rows || []).filter((r: any) => {
    if (!ACTIVE_SUB_STATUSES.has(String(r.status || "").toLowerCase())) return false;
    if (!r.current_period_end) return false;
    return new Date(r.current_period_end) > now;
  });

  const countByType = { classified: 0, property: 0 };
  let classifiedMaxEnd: string | null = null;
  let propertyMaxEnd: string | null = null;

  for (const row of activeRows as any[]) {
    const type = row.extra_type === "property" ? "property" : "classified";
    countByType[type] += 1;
    if (type === "classified") {
      if (!classifiedMaxEnd || new Date(row.current_period_end) > new Date(classifiedMaxEnd)) {
        classifiedMaxEnd = row.current_period_end;
      }
    } else {
      if (!propertyMaxEnd || new Date(row.current_period_end) > new Date(propertyMaxEnd)) {
        propertyMaxEnd = row.current_period_end;
      }
    }
  }

  const { error: upErr } = await supabaseClient
    .from("mini_sites")
    .update({
      extra_classified_spaces: countByType.classified,
      extra_classified_spaces_expires_at: classifiedMaxEnd,
      extra_property_spaces: countByType.property,
      extra_property_spaces_expires_at: propertyMaxEnd,
    })
    .eq("id", siteId);
  if (upErr) throw upErr;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecret || !webhookSecret) {
    return jsonResponse({ error: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Missing stripe-signature" }, 400);

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (e: any) {
    return jsonResponse({ error: `Invalid signature: ${e?.message || "unknown"}` }, 400);
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const extraType = session.metadata?.extra_type;
      const siteId = session.metadata?.extra_site_id;
      const billingCycle = session.metadata?.billing_cycle;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as any)?.id;

      if (billingCycle === "monthly" && siteId && (extraType === "classified" || extraType === "property") && subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEndIso = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        const amountUsd = Number(session.amount_total ?? 0) / 100;
        const metadataUserId = session.metadata?.user_id;
        let effectiveUserId = metadataUserId || "";
        if (!effectiveUserId) {
          const { data: siteOwner } = await supabaseClient
            .from("mini_sites")
            .select("user_id")
            .eq("id", siteId)
            .maybeSingle();
          effectiveUserId = siteOwner?.user_id || "";
        }
        if (!effectiveUserId) throw new Error("Unable to resolve user_id for extra space subscription");

        const { error: upsertErr } = await supabaseClient
          .from("extra_space_subscriptions")
          .upsert(
            {
              site_id: siteId,
              user_id: effectiveUserId,
              extra_type: extraType,
              stripe_subscription_id: subscriptionId,
              stripe_checkout_session_id: session.id,
              status: sub.status || "active",
              amount_usd: amountUsd,
              current_period_end: periodEndIso,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          );
        if (upsertErr) throw upsertErr;
        await recomputeExtraSpacesForSite(supabaseClient, siteId);
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
    ) {
      const obj: any = event.data.object as any;
      const subscriptionId =
        obj?.id && String(obj.object || "").startsWith("subscription")
          ? obj.id
          : obj?.subscription;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEndIso = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        const { data: existing } = await supabaseClient
          .from("extra_space_subscriptions")
          .select("id, site_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (existing?.id) {
          const { error: upErr } = await supabaseClient
            .from("extra_space_subscriptions")
            .update({
              status: sub.status,
              current_period_end: periodEndIso,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (upErr) throw upErr;
          await recomputeExtraSpacesForSite(supabaseClient, existing.site_id);
        }
      }
    }

    return jsonResponse({ received: true });
  } catch (e: any) {
    return jsonResponse({ error: e?.message || "Webhook processing failed" }, 500);
  }
});
