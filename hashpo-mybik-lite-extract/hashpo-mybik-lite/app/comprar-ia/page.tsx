"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRICES } from "@/data/stripeProducts";
import { MessageCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function ComprarIaContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<"1000" | "10000" | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  const success = searchParams.get("success");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (authLoading || !user || !success || !sessionId || applyDone) return;
    setApplyLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("apply-ai-pack-after-payment", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setApplyDone(true);
        router.replace("/comprar-ia");
      } catch (e: any) {
        console.error(e);
      } finally {
        setApplyLoading(false);
      }
    })();
  }, [user, authLoading, success, sessionId, applyDone, router]);

  const startCheckout = async (pack: "1000" | "10000") => {
    if (!user) return;
    const priceId = pack === "1000" ? STRIPE_PRICES.ai_pack_1000.price_id : STRIPE_PRICES.ai_pack_10000.price_id;
    setCheckoutLoading(pack);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id: priceId,
          success_path: "/comprar-ia?success=1&session_id={CHECKOUT_SESSION_ID}",
          cancel_path: "/comprar-ia",
          metadata: { ai_pack: pack },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Resposta inválida do checkout");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao abrir pagamento. Crie os produtos no Stripe (ai_pack_1000 e ai_pack_10000) e atualize stripeProducts.ts.");
      setCheckoutLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground mb-4">Faça login para comprar pacotes de interações IA.</p>
          <Link href="/auth" className="text-primary font-medium underline">Ir para login</Link>
        </div>
      </div>
    );
  }

  if (applyLoading || (success && sessionId && !applyDone)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Confirmando seu pagamento...</p>
        </div>
      </div>
    );
  }

  if (applyDone) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Interações creditadas!</h1>
          <p className="text-muted-foreground mb-6">Suas interações já estão disponíveis. Use o assistente IA no mini site.</p>
          <Link href="/" className="text-primary font-medium underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Pacotes de interações IA</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Use o assistente (robô) nos mini sites. 1.000 interações grátis; depois compre mais. Cobrança na hora.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => startCheckout("1000")}
            disabled={!!checkoutLoading}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="text-left">
              <p className="font-bold text-foreground">1.000 interações</p>
              <p className="text-sm text-muted-foreground">$5.00 US</p>
            </div>
            {checkoutLoading === "1000" ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <span className="text-sm font-medium text-primary">Comprar</span>
            )}
          </button>
          <button
            onClick={() => startCheckout("10000")}
            disabled={!!checkoutLoading}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="text-left">
              <p className="font-bold text-foreground">10.000 interações</p>
              <p className="text-sm text-muted-foreground">$50.00 US (melhor custo)</p>
            </div>
            {checkoutLoading === "10000" ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <span className="text-sm font-medium text-primary">Comprar</span>
            )}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-6 text-center">
          Após o pagamento você será redirecionado de volta e as interações serão creditadas na hora.
        </p>
      </div>
    </div>
  );
}

export default function ComprarIaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ComprarIaContent />
    </Suspense>
  );
}
