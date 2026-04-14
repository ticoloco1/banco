"use client";

import Link from "next/link";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DROPSHIPPING_PARCEIROS } from "@/data/servicosParceiros";
import { Package, ExternalLink, Globe } from "lucide-react";

export default function Dropshipping() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Dropshipping – Ligue-se a fornecedores e venda no seu mini site"
        description="Conecte-se a empresas e marketplaces para oferecer produtos no seu mini site, sem estoque."
      />
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/servicos">← Serviços</Link>
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dropshipping</h1>
            <p className="text-sm text-muted-foreground">
              Conecte-se a fornecedores e venda no seu mini site sem estoque
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-8">
          Use parceiros e marketplaces (incluindo fornecedores chineses) para escolher produtos e
          oferecê-los no seu mini site. Você vende, o parceiro envia – sem comprar estoque.
        </p>

        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-semibold text-foreground">Onde encontrar fornecedores</h2>
          {DROPSHIPPING_PARCEIROS.map((p) => (
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
            Usar no meu mini site
          </Link>
        </Button>
      </main>
    </div>
  );
}
