"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const CATEGORIAS = [
  { value: "carros", label: "Carros" },
  { value: "imoveis", label: "Imóveis" },
  { value: "produtos", label: "Produtos" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

const TIPOS_ANUNCIO = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "servico", label: "Serviço" },
  { value: "produto", label: "Produto" },
];

export type ClassificadoFormValues = {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  tipo_anuncio: string;
  price: string;
  pais: string;
  estado: string;
  cidade: string;
  imageUrlsText: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  // imóveis
  area: string;
  quartos: string;
  banheiros: string;
  garagem: string;
  tipo_imovel: string;
  ano_construcao: string;
  // carros
  marca: string;
  modelo: string;
  ano: string;
  quilometragem: string;
  combustivel: string;
  // produtos
  condicao: string;
  estoque: string;
  sku: string;
};

const defaultValues: ClassificadoFormValues = {
  title: "",
  description: "",
  category: "outros",
  subcategory: "",
  tipo_anuncio: "venda",
  price: "",
  pais: "Brasil",
  estado: "",
  cidade: "",
  imageUrlsText: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactEmail: "",
  area: "",
  quartos: "",
  banheiros: "",
  garagem: "",
  tipo_imovel: "",
  ano_construcao: "",
  marca: "",
  modelo: "",
  ano: "",
  quilometragem: "",
  combustivel: "",
  condicao: "novo",
  estoque: "",
  sku: "",
};

function parsePrice(price: string): number {
  return parseFloat(price.replace(/\D/g, "").replace(",", ".")) || 0;
}

function parseImageUrls(text: string): string[] {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getFormPayload(
  v: ClassificadoFormValues,
  siteId: string
): {
  site_id: string;
  title: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  price: number;
  currency: string;
  tipo_anuncio?: string | null;
  pais?: string | null;
  estado?: string | null;
  cidade?: string | null;
  image_urls?: string[] | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  details?: Record<string, unknown> | null;
} {
  const image_urls = parseImageUrls(v.imageUrlsText);
  const details: Record<string, unknown> = {};
  if (v.category === "imoveis") {
    if (v.area) details.area = parseFloat(v.area) || undefined;
    if (v.quartos) details.quartos = parseInt(v.quartos, 10) || undefined;
    if (v.banheiros) details.banheiros = parseInt(v.banheiros, 10) || undefined;
    if (v.garagem) details.garagem = parseInt(v.garagem, 10) || undefined;
    if (v.tipo_imovel) details.tipo_imovel = v.tipo_imovel;
    if (v.ano_construcao) details.ano_construcao = parseInt(v.ano_construcao, 10) || undefined;
  } else if (v.category === "carros") {
    if (v.marca) details.marca = v.marca;
    if (v.modelo) details.modelo = v.modelo;
    if (v.ano) details.ano = parseInt(v.ano, 10) || undefined;
    if (v.quilometragem) details.quilometragem = v.quilometragem;
    if (v.combustivel) details.combustivel = v.combustivel;
  } else if (v.category === "produtos") {
    if (v.condicao) details.condicao = v.condicao;
    if (v.estoque) details.estoque = parseInt(v.estoque, 10) || undefined;
    if (v.sku) details.sku = v.sku;
  }

  return {
    site_id: siteId,
    title: v.title.trim(),
    description: v.description.trim() || undefined,
    category: v.category,
    subcategory: v.subcategory.trim() || undefined,
    price: parsePrice(v.price),
    currency: "BRL",
    tipo_anuncio: v.tipo_anuncio || null,
    pais: v.pais.trim() || null,
    estado: v.estado.trim() || null,
    cidade: v.cidade.trim() || null,
    image_urls: image_urls.length ? image_urls : null,
    contact_phone: v.contactPhone.trim() || null,
    contact_whatsapp: v.contactWhatsapp.trim() || null,
    contact_email: v.contactEmail.trim() || null,
    details: Object.keys(details).length ? details : null,
  };
}

export function formValuesFromItem(item: any): ClassificadoFormValues {
  const loc = typeof item?.location === "object" ? item.location : {};
  const details = item?.details && typeof item.details === "object" ? item.details : {};
  const urls = Array.isArray(item?.image_urls) ? item.image_urls : [];
  return {
    ...defaultValues,
    title: item?.title ?? "",
    description: item?.description ?? "",
    category: item?.category ?? "outros",
    subcategory: item?.subcategory ?? "",
    tipo_anuncio: item?.tipo_anuncio ?? "venda",
    price: item?.price != null ? String(item.price) : "",
    pais: item?.pais ?? loc?.pais ?? "Brasil",
    estado: item?.estado ?? loc?.estado ?? "",
    cidade: item?.cidade ?? loc?.cidade ?? "",
    imageUrlsText: urls.join("\n"),
    contactPhone: item?.contact_phone ?? "",
    contactWhatsapp: item?.contact_whatsapp ?? "",
    contactEmail: item?.contact_email ?? "",
    area: details?.area != null ? String(details.area) : "",
    quartos: details?.quartos != null ? String(details.quartos) : "",
    banheiros: details?.banheiros != null ? String(details.banheiros) : "",
    garagem: details?.garagem != null ? String(details.garagem) : "",
    tipo_imovel: details?.tipo_imovel ?? "",
    ano_construcao: details?.ano_construcao != null ? String(details.ano_construcao) : "",
    marca: details?.marca ?? "",
    modelo: details?.modelo ?? "",
    ano: details?.ano != null ? String(details.ano) : "",
    quilometragem: details?.quilometragem ?? "",
    combustivel: details?.combustivel ?? "",
    condicao: details?.condicao ?? "novo",
    estoque: details?.estoque != null ? String(details.estoque) : "",
    sku: details?.sku ?? "",
  };
}

type ClassificadoFormProps = {
  values: ClassificadoFormValues;
  onChange: (values: ClassificadoFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
  children?: React.ReactNode;
};

export default function ClassificadoForm({
  values: v,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
  children,
}: ClassificadoFormProps) {
  const set = (key: keyof ClassificadoFormValues, value: string) => {
    onChange({ ...v, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-bold">Classificado</h1>
        <p className="text-sm text-muted-foreground">
          Título, descrição, categoria, preço e tipo de anúncio.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Carro Sedan 2020"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descreva o item ou serviço..."
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={v.category} onValueChange={(s) => set("category", s)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de anúncio *</Label>
              <Select value={v.tipo_anuncio} onValueChange={(s) => set("tipo_anuncio", s)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ANUNCIO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="subcategory">Subcategoria</Label>
            <Input
              id="subcategory"
              value={v.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="Ex: Apartamento, Sedan..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price">Preço (BRL) *</Label>
            <Input
              id="price"
              type="text"
              value={v.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0,00"
              required
              className="mt-1"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Localização</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="País"
                value={v.pais}
                onChange={(e) => set("pais", e.target.value)}
              />
              <Input
                placeholder="Estado"
                value={v.estado}
                onChange={(e) => set("estado", e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={v.cidade}
                onChange={(e) => set("cidade", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="images">Fotos (URLs, uma por linha)</Label>
            <Textarea
              id="images"
              value={v.imageUrlsText}
              onChange={(e) => set("imageUrlsText", e.target.value)}
              placeholder="https://exemplo.com/foto1.jpg"
              rows={3}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {v.category === "imoveis" && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Imóvel</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Input placeholder="Área (m²)" value={v.area} onChange={(e) => set("area", e.target.value)} />
                <Input placeholder="Quartos" value={v.quartos} onChange={(e) => set("quartos", e.target.value)} />
                <Input placeholder="Banheiros" value={v.banheiros} onChange={(e) => set("banheiros", e.target.value)} />
                <Input placeholder="Garagem" value={v.garagem} onChange={(e) => set("garagem", e.target.value)} />
                <Input placeholder="Tipo (casa, apt...)" value={v.tipo_imovel} onChange={(e) => set("tipo_imovel", e.target.value)} />
                <Input placeholder="Ano construção" value={v.ano_construcao} onChange={(e) => set("ano_construcao", e.target.value)} />
              </div>
            </div>
          )}
          {v.category === "carros" && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Veículo</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Input placeholder="Marca" value={v.marca} onChange={(e) => set("marca", e.target.value)} />
                <Input placeholder="Modelo" value={v.modelo} onChange={(e) => set("modelo", e.target.value)} />
                <Input placeholder="Ano" value={v.ano} onChange={(e) => set("ano", e.target.value)} />
                <Input placeholder="Quilometragem" value={v.quilometragem} onChange={(e) => set("quilometragem", e.target.value)} />
                <Input placeholder="Combustível" value={v.combustivel} onChange={(e) => set("combustivel", e.target.value)} />
              </div>
            </div>
          )}
          {v.category === "produtos" && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Produto</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Select value={v.condicao} onValueChange={(s) => set("condicao", s)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="usado">Usado</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Estoque" value={v.estoque} onChange={(e) => set("estoque", e.target.value)} />
                <Input placeholder="SKU" value={v.sku} onChange={(e) => set("sku", e.target.value)} />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Contato</p>
            <div className="space-y-2">
              <Input placeholder="Telefone" value={v.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              <Input placeholder="WhatsApp (com DDD)" value={v.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)} />
              <Input type="email" placeholder="E-mail" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
          </div>

          {children}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { defaultValues };
