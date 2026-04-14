"use client";

import { useState } from "react";
import Link from "next/link";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useGlobalClassifieds } from "@/hooks/useClassifieds";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Car, Home, Package, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClassificadosProps = {
  category?: string;
  title: string;
  description?: string;
  icon?: "all" | "carros" | "imoveis" | "produtos";
};

const CATEGORY_LABELS: Record<string, string> = {
  carros: "Carros",
  imoveis: "Imóveis",
  produtos: "Produtos",
  servicos: "Serviços",
  outros: "Outros",
};

export default function Classificados({ category, title, description, icon = "all" }: ClassificadosProps) {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useGlobalClassifieds(category);

  const filtered = (items ?? []).filter(
    (c: any) =>
      !search.trim() ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const IconComp = icon === "carros" ? Car : icon === "imoveis" ? Home : icon === "produtos" ? Package : Tag;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description || `Classificados - ${title}`} />
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconComp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button asChild size="default" className="shrink-0">
              <Link href="/classificados/novo">
                <Plus className="w-4 h-4 mr-2" />
                Novo anúncio
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <IconComp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum anúncio encontrado</p>
            <p className="text-sm mt-1">
              {search.trim() ? "Tente outro termo de busca." : "Os classificados aparecerão aqui quando forem publicados."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any) => {
              const img = (c.image_urls && c.image_urls[0]) || c.image_url || null;
              const price = c.price != null ? Number(c.price) : null;
              return (
                <Link key={c.id} href={`/classificados/${c.id}`}>
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      {img ? (
                        <img src={img} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <IconComp className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[c.category] || c.category || "Anúncio"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-2">{c.title}</h3>
                      {c.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        {price != null && (
                          <span className="flex items-center gap-1 font-bold text-primary">
                            <DollarSign className="w-4 h-4" />
                            {price.toLocaleString("pt-BR")} {c.currency || "BRL"}
                          </span>
                        )}
                        {typeof c.location === "object" && c.location?.cidade && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {c.location.cidade}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
