"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useMySite } from "@/hooks/useMiniSite";
import { useAddClassified } from "@/hooks/useClassifieds";
import ClassificadoForm, { defaultValues, getFormPayload } from "@/components/ClassificadoForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ClassificadoNovo() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: site, isLoading: siteLoading } = useMySite();
  const addClassified = useAddClassified();
  const [values, setValues] = useState(defaultValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site?.id) {
      toast.error("Crie um mini site primeiro para publicar classificados.");
      return;
    }
    try {
      const payload = getFormPayload(values, site.id);
      await addClassified.mutateAsync(payload as any);
      toast.success("Anúncio criado!");
      router.push("/classificados");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar anúncio.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Novo classificado" />
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Faça login para publicar um anúncio.</p>
          <Button asChild>
            <Link href="/auth">Entrar</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (siteLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Novo classificado" />
        <Header />
        <main className="max-w-md mx-auto px-4 py-8">
          <div className="animate-pulse h-10 w-48 bg-muted rounded mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!site?.id) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Novo classificado" />
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Crie seu mini site primeiro para publicar classificados.
          </p>
          <Button asChild>
            <Link href="/site/edit">Criar mini site</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Novo classificado" description="Publicar novo anúncio nos classificados." />
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/classificados">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <ClassificadoForm
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          isPending={addClassified.isPending}
          submitLabel="Publicar anúncio"
        />
      </main>
    </div>
  );
}
