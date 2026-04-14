"use client";

import Link from "next/link";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Package, Shirt, ChevronRight } from "lucide-react";

const SERVICOS = [
  {
    title: "Dropshipping",
    desc: "Ligue-se a fornecedores (incl. chineses) e ofereça produtos no seu mini site, sem estoque.",
    href: "/dropshipping",
    icon: Package,
  },
  {
    title: "Impressão sob demanda",
    desc: "Empresas de impressão de camisetas e produtos. Venda sua marca no mini site.",
    href: "/impressao-sob-demanda",
    icon: Shirt,
  },
];

export default function Servicos() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Serviços – Dropshipping e Impressão sob demanda"
        description="Dropshipping com fornecedores e impressão sob demanda para vender no seu mini site."
      />
      <Header />
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">Serviços</h1>
        <p className="text-muted-foreground mb-8">
          Conecte-se a parceiros e venda no seu mini site: dropshipping ou sua marca em produtos.
        </p>
        <div className="space-y-4">
          {SERVICOS.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
