"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { ShieldCheck } from "lucide-react";

/** Página pública: explica o código de verificação do YouTube (também usada pelo criador após copiar o link). */
export default function VerifyYoutubeCodePage() {
  const params = useParams();
  const code = String(params?.code ?? "").trim().toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-black text-foreground">Verificação YouTube</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este endereço confirma que você controla o vídeo no YouTube. Abra o{" "}
          <strong className="text-foreground">YouTube Studio</strong>, edite o vídeo e inclua na{" "}
          <strong className="text-foreground">descrição</strong> ou nos <strong className="text-foreground">links</strong>{" "}
          exatamente um destes textos:
        </p>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 font-mono text-xs break-all">
          <p className="text-foreground">
            <span className="text-muted-foreground">Opção A:</span>{" "}
            {typeof window !== "undefined" ? window.location.origin : ""}/verify/{code || "…"}
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Opção B:</span> hashpo-verify-{code || "…"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Depois salve no YouTube e use o botão <strong className="text-foreground">Verificar agora</strong> no editor do
          mini site (só o dono do vídeo).
        </p>
        <Link href="/site/edit" className="inline-flex text-sm font-bold text-primary hover:underline">
          ← Voltar ao editor do mini site
        </Link>
      </div>
    </div>
  );
}
