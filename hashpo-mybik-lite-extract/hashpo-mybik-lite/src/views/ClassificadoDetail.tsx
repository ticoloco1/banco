"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useClassifiedById } from "@/hooks/useClassifieds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  ExternalLink,
  Calendar,
  Eye,
  Pencil,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  carros: "Carros",
  imoveis: "Imóveis",
  produtos: "Produtos",
  servicos: "Serviços",
  outros: "Outros",
};

export default function ClassificadoDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const { data: item, isLoading, error } = useClassifiedById(id);
  const isOwner = !!user?.id && !!item?.user_id && user.id === item.user_id;

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Classificados" />
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse h-8 w-32 bg-muted rounded" />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Carregando..." />
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="aspect-video bg-muted rounded" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Anúncio não encontrado" />
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Anúncio não encontrado ou removido.</p>
          <Button asChild variant="outline">
            <Link href="/classificados">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos classificados
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const img = (item.image_urls && item.image_urls[0]) || item.image_url || null;
  const price = item.price != null ? Number(item.price) : null;
  const loc = typeof item.location === "object" ? item.location : null;
  const cidade = loc?.cidade ?? item.cidade;
  const estado = loc?.estado ?? item.estado;
  const pais = loc?.pais ?? item.pais;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={item.title} description={item.description || undefined} />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/classificados">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos classificados
            </Link>
          </Button>
          {isOwner && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/classificados/${id}/editar`}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden">
            {img ? (
              <img src={img} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>

          <div>
            <Badge variant="secondary" className="mb-2">
              {CATEGORY_LABELS[item.category] || item.category || "Anúncio"}
            </Badge>
            <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
            {price != null && (
              <p className="text-xl font-semibold text-primary mt-2 flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {price.toLocaleString("pt-BR")} {item.currency || "BRL"}
              </p>
            )}
          </div>

          {item.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descrição</h2>
              <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {(cidade || estado || pais) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                {[cidade, estado, pais].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {(item.views != null || item.created_at) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {item.views != null && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {item.views} visualizações
                </span>
              )}
              {item.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(item.created_at).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contato</h2>
            <div className="flex flex-wrap gap-3">
              {item.contact_phone && (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${item.contact_phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {item.contact_phone}
                  </a>
                </Button>
              )}
              {item.contact_whatsapp && (
                <Button asChild size="sm">
                  <a
                    href={`https://wa.me/${item.contact_whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
              {item.contact_email && (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${item.contact_email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    E-mail
                  </a>
                </Button>
              )}
              {item.seller_site && (
                <Button asChild variant="outline" size="sm">
                  <a href={item.seller_site} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Site
                  </a>
                </Button>
              )}
            </div>
            {!item.contact_phone && !item.contact_whatsapp && !item.contact_email && (
              <p className="text-sm text-muted-foreground">Contato não informado.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
