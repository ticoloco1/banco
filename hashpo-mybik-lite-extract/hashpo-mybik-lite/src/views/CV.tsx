"use client";

import Link from "next/link";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, User } from "lucide-react";

export default function CV() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="CV e Currículos"
        description="Encontre profissionais e currículos. Empresas podem desbloquear contatos."
      />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-6">
          <FileText className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">CV e Currículos</h1>
        <p className="text-muted-foreground mb-8">
          Veja currículos de profissionais e desbloqueie contatos para recrutamento. Ou crie seu mini site e exiba seu CV.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/careers">
              <Briefcase className="w-4 h-4" />
              Ver currículos (Jobs)
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/site/edit">
              <User className="w-4 h-4" />
              Criar meu mini site / CV
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
