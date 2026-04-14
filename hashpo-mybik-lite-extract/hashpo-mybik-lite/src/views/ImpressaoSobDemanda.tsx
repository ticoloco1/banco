"use client";

import { useState } from "react";
import Link from "next/link";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRINT_ON_DEMAND_PARCEIROS } from "@/data/servicosParceiros";
import { Shirt, ExternalLink, Globe, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ImpressaoSobDemanda() {
  const [designPrompt, setDesignPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGerarDesign = async () => {
    if (!designPrompt.trim()) {
      toast.error("Descreva o que você quer no design.");
      return;
    }
    setLoading(true);
    setBrief("");
    try {
      const payload: { prompt: string; api_key?: string } = { prompt: designPrompt };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      const res = await fetch("/api/design-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erro ao gerar. Tente de novo.");
        return;
      }
      setBrief(data.brief || "");
      toast.success("Descrição do design gerada!");
    } catch {
      toast.error("Erro ao gerar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = () => {
    if (!brief) return;
    navigator.clipboard.writeText(brief);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Impressão sob demanda – Venda sua marca no mini site"
        description="Conecte-se a gráficas e imprima camisetas, canecas e mais com sua arte. Venda sua marca no seu mini site."
      />
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/servicos">← Serviços</Link>
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Impressão sob demanda</h1>
            <p className="text-sm text-muted-foreground">
              Sua marca em camisetas, canecas e mais – sem estoque
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-8">
          Parceiros imprimem sob demanda (print on demand): você cria o design, eles produzem e
          enviam. Ofereça no seu mini site e ganhe por venda – sem comprar lote nem estoque.
        </p>

        <Card className="p-4 mb-8 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Criar design com IA (DeepSeek)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Descreva o que você quer (ex: &quot;camiseta com dragão azul e letras em dourado&quot;). 
            A IA gera uma descrição do design para você usar nos parceiros ou no seu mini site – o cliente pede, a IA cria, você vende.
          </p>
          <div className="space-y-2">
            <Label htmlFor="design-prompt">O que você quer no design?</Label>
            <Textarea
              id="design-prompt"
              placeholder="Ex: camiseta preta com um lobo howling e lua, estilo minimalista"
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="space-y-1">
              <Label htmlFor="api-key" className="text-muted-foreground font-normal text-xs">
                API key DeepSeek (opcional – já pode estar no Admin &gt; API Keys, ou envie aqui)
              </Label>
              <input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={handleGerarDesign} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Gerando..." : "Gerar descrição do design"}
            </Button>
          </div>
          {brief && (
            <div className="mt-4 p-3 rounded-lg bg-background border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{brief}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={copyBrief}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-foreground">Parceiros de impressão</h2>
          {PRINT_ON_DEMAND_PARCEIROS.map((p) => (
            <Card key={p.nome} className="flex flex-row items-center justify-between p-4">
              <div>
                <p className="font-medium text-foreground">{p.nome}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </Card>
          ))}
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/site/edit">
            <Globe className="w-4 h-4 mr-2" />
            Vender minha marca no mini site
          </Link>
        </Button>
      </main>
    </div>
  );
}
