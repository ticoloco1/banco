import { useState } from "react";
import { useSitePropertiesForEditor, useAddProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Image, Upload } from "lucide-react";
import { toast } from "sonner";

/** Até 10 espaços (imóveis) grátis; cada um com até 10 fotos. Extra = US$ 1 por espaço/mês */
const DEFAULT_LIMIT = 10;
const PHOTOS_PER_PROPERTY_FREE = 10;
const EXTRA_SPACE_PRICE = 1;

interface PropertyEditorProps {
  siteId: string;
  extraSpaces?: number;
  onRequestMoreSpaces?: () => void;
}

export default function PropertyEditor({ siteId, extraSpaces = 0, onRequestMoreSpaces }: PropertyEditorProps) {
  const { user } = useAuth();
  const { data: properties = [], isLoading } = useSitePropertiesForEditor(siteId);
  const addProperty = useAddProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoPanelId, setPhotoPanelId] = useState<string | null>(null);
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    currency: "BRL",
    property_type: "apartment",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
  });

  const limit = DEFAULT_LIMIT + extraSpaces;
  const canAdd = properties.length < limit;

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      location: "",
      price: "",
      currency: "BRL",
      property_type: "apartment",
      bedrooms: "",
      bathrooms: "",
      area_sqm: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    try {
      await addProperty.mutateAsync({
        site_id: siteId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        property_type: form.property_type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms, 10) : null,
        area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      });
      toast.success("Imóvel adicionado.");
      resetForm();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao adicionar.");
    }
  };

  const handleUpdate = async (id: string, updates: Record<string, unknown>) => {
    try {
      await updateProperty.mutateAsync({ id, site_id: siteId, ...updates });
      toast.success("Imóvel atualizado.");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este imóvel?")) return;
    try {
      await deleteProperty.mutateAsync({ id, site_id: siteId });
      toast.success("Imóvel removido.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
    }
  };

  const photosFor = (p: any): string[] => Array.isArray(p?.image_urls) ? p.image_urls : [];
  const canAddPhoto = (p: any) => photosFor(p).length < PHOTOS_PER_PROPERTY_FREE;

  const handlePhotoUpload = async (propertyId: string, file: File) => {
    if (!user) return;
    const urls = photosFor(properties.find((x: any) => x.id === propertyId));
    if (urls.length >= PHOTOS_PER_PROPERTY_FREE) {
      toast.info(`Até ${PHOTOS_PER_PROPERTY_FREE} fotos grátis por imóvel. Mais fotos = US$ 1/mês por imóvel.`);
      return;
    }
    setUploadingPhotoFor(propertyId);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/properties/${propertyId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      const newUrls = [...urls, data.publicUrl];
      await updateProperty.mutateAsync({ id: propertyId, site_id: siteId, image_urls: newUrls });
      toast.success("Foto adicionada.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload.");
    }
    setUploadingPhotoFor(null);
  };

  const handleRemovePhoto = async (propertyId: string, index: number) => {
    const p = properties.find((x: any) => x.id === propertyId) as any;
    const urls = photosFor(p);
    const next = urls.filter((_, i) => i !== index);
    await updateProperty.mutateAsync({ id: propertyId, site_id: siteId, image_urls: next });
    toast.success("Foto removida.");
  };

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando imóveis…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">
          {properties.length} / {limit} imóveis · até {PHOTOS_PER_PROPERTY_FREE} fotos por imóvel (carrossel)
        </span>
        {canAdd ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Adicionar imóvel
          </Button>
        ) : (
          onRequestMoreSpaces && (
            <Button type="button" size="sm" variant="outline" onClick={onRequestMoreSpaces}>
              +1 espaço — US$ {EXTRA_SPACE_PRICE}/mês
            </Button>
          )
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
          <Input
            placeholder="Título do imóvel"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="text-sm"
          />
          <Textarea
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="text-sm min-h-[60px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Localização"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="text-sm"
            />
            <Input
              placeholder="Preço"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Quartos"
              type="number"
              value={form.bedrooms}
              onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
              className="text-sm w-20"
            />
            <Input
              placeholder="Banheiros"
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
              className="text-sm w-20"
            />
            <Input
              placeholder="m²"
              type="number"
              value={form.area_sqm}
              onChange={(e) => setForm((f) => ({ ...f, area_sqm: e.target.value }))}
              className="text-sm w-20"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Salvar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {properties.map((p: any) => (
          <li key={p.id} className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 text-sm">
              {editingId === p.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    defaultValue={p.title}
                    className="text-sm"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== p.title) handleUpdate(p.id, { title: v });
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      defaultValue={p.price}
                      type="number"
                      className="text-sm w-24"
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v !== p.price) handleUpdate(p.id, { price: v });
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Fechar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    {photosFor(p).length > 0 ? (
                      <img src={photosFor(p)[0]} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center shrink-0">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{p.title}</span>
                      {p.location && <span className="text-muted-foreground ml-2"> · {p.location}</span>}
                      {p.price != null && <span className="text-muted-foreground ml-2"> · R$ {Number(p.price).toLocaleString()}</span>}
                      <span className="text-muted-foreground ml-2 text-[10px]">({photosFor(p).length} fotos)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setPhotoPanelId(photoPanelId === p.id ? null : p.id)} className="p-1.5 rounded hover:bg-muted text-xs font-medium flex items-center gap-1" title="Fotos">
                      <Image className="w-3.5 h-3.5" /> Fotos
                    </button>
                    <button type="button" onClick={() => setEditingId(p.id)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* Painel de fotos: sempre visível ao clicar em "Fotos", sem precisar abrir Editar */}
            {(photoPanelId === p.id || editingId === p.id) && (
              <div className="border-t border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  <Image className="w-3 h-3" /> Fotos ({photosFor(p).length}/{PHOTOS_PER_PROPERTY_FREE}) — aparecem no carrossel do site
                </p>
                <div className="flex flex-wrap gap-2">
                  {photosFor(p).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-14 h-14 rounded object-cover border border-border" />
                      <button type="button" onClick={() => handleRemovePhoto(p.id, i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {canAddPhoto(p) && (
                    <label className="w-14 h-14 rounded border-2 border-dashed border-primary/50 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors bg-background">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(p.id, f); e.target.value = ""; }} disabled={uploadingPhotoFor === p.id} />
                    </label>
                  )}
                </div>
                {photosFor(p).length >= PHOTOS_PER_PROPERTY_FREE && (
                  <p className="text-[9px] text-muted-foreground mt-1">+ fotos = US$ 1/mês por imóvel (em breve)</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
