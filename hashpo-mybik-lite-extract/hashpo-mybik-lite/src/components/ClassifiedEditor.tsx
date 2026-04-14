import { useState } from "react";
import { useSiteClassifiedsForEditor, useAddClassified, useUpdateClassified, useDeleteClassified } from "@/hooks/useClassifieds";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Image, Upload } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_LIMIT = 10;
const PHOTOS_PER_ITEM = 10;

const CLASSIFIED_CATEGORIES = [
  { value: "carros", label: "Carros" },
  { value: "motos", label: "Motos" },
  { value: "barcos", label: "Barcos" },
  { value: "outros", label: "Outros" },
] as const;

interface ClassifiedEditorProps {
  siteId: string;
  extraSpaces?: number;
  extraSpacePriceUsd?: number;
  onRequestMoreSpaces?: () => void;
}

export default function ClassifiedEditor({ siteId, extraSpaces = 0, extraSpacePriceUsd = 2, onRequestMoreSpaces }: ClassifiedEditorProps) {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useSiteClassifiedsForEditor(siteId);
  const addClassified = useAddClassified();
  const updateClassified = useUpdateClassified();
  const deleteClassified = useDeleteClassified();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoPanelId, setPhotoPanelId] = useState<string | null>(null);
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "carros" as string,
    price: "",
  });

  const limit = DEFAULT_LIMIT + extraSpaces;
  const canAdd = items.length < limit;

  const resetForm = () => {
    setForm({ title: "", description: "", category: "carros", price: "" });
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
      await addClassified.mutateAsync({
        site_id: siteId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: parseFloat(form.price) || 0,
      });
      toast.success("Item adicionado aos classificados.");
      resetForm();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao adicionar.");
    }
  };

  const handleUpdate = async (id: string, updates: Record<string, unknown>) => {
    try {
      await updateClassified.mutateAsync({ id, site_id: siteId, ...updates });
      toast.success("Item atualizado.");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este item dos classificados?")) return;
    try {
      await deleteClassified.mutateAsync({ id, site_id: siteId });
      toast.success("Item removido.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover.");
    }
  };

  const photosFor = (item: any): string[] => Array.isArray(item?.image_urls) ? item.image_urls : [];
  const canAddPhoto = (item: any) => photosFor(item).length < PHOTOS_PER_ITEM;

  const handlePhotoUpload = async (itemId: string, file: File) => {
    if (!user) return;
    const urls = photosFor(items.find((x: any) => x.id === itemId));
    if (urls.length >= PHOTOS_PER_ITEM) {
      toast.info(`Até ${PHOTOS_PER_ITEM} fotos por item.`);
      return;
    }
    setUploadingPhotoFor(itemId);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/classifieds/${itemId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      const newUrls = [...urls, data.publicUrl];
      await updateClassified.mutateAsync({ id: itemId, site_id: siteId, image_urls: newUrls });
      toast.success("Foto adicionada.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload.");
    }
    setUploadingPhotoFor(null);
  };

  const handleRemovePhoto = async (itemId: string, index: number) => {
    const item = items.find((x: any) => x.id === itemId) as any;
    const urls = photosFor(item);
    const next = urls.filter((_, i) => i !== index);
    await updateClassified.mutateAsync({ id: itemId, site_id: siteId, image_urls: next });
    toast.success("Foto removida.");
  };

  const getCategoryLabel = (value: string) => CLASSIFIED_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando classificados…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
        <p className="text-[11px] font-semibold text-foreground">
          {items.length <= DEFAULT_LIMIT
            ? `Plano atual: ${DEFAULT_LIMIT} anúncios grátis.`
            : `Limite grátis atingido (${DEFAULT_LIMIT}).`}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Após os {DEFAULT_LIMIT} grátis, cada anúncio extra custa US$ {Number(extraSpacePriceUsd || 2).toFixed(2)}/mês.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">
          {items.length} / {limit} itens (carros, motos, barcos) · até {PHOTOS_PER_ITEM} fotos por item
        </span>
        {canAdd ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Adicionar item
          </Button>
        ) : (
          onRequestMoreSpaces && (
            <Button type="button" size="sm" variant="outline" onClick={onRequestMoreSpaces} className="gap-1">
              +1 espaço — US$ {Number(extraSpacePriceUsd || 2).toFixed(2)}/mês
            </Button>
          )
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
          <Input
            placeholder="Título (ex.: Honda Civic 2020)"
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
          <div className="flex gap-2 flex-wrap">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="text-sm border border-input rounded-md px-3 py-2 bg-background"
            >
              {CLASSIFIED_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Input
              placeholder="Preço"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="text-sm w-28"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Salvar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>Cancelar</Button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {items.map((item: any) => (
          <li key={item.id} className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 text-sm">
              {editingId === item.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    defaultValue={item.title}
                    className="text-sm"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== item.title) handleUpdate(item.id, { title: v });
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <select
                      defaultValue={item.category}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v !== item.category) handleUpdate(item.id, { category: v });
                      }}
                      className="text-sm border border-input rounded-md px-2 py-1 bg-background"
                    >
                      {CLASSIFIED_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <Input
                      defaultValue={item.price}
                      type="number"
                      className="text-sm w-24"
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v !== item.price) handleUpdate(item.id, { price: v });
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Fechar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    {photosFor(item).length > 0 ? (
                      <img src={photosFor(item)[0]} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center shrink-0">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground ml-2 text-[10px]">({getCategoryLabel(item.category)})</span>
                      {item.price != null && <span className="text-muted-foreground ml-2"> · R$ {Number(item.price).toLocaleString()}</span>}
                      <span className="text-muted-foreground ml-2 text-[10px]">({photosFor(item).length} fotos)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setPhotoPanelId(photoPanelId === item.id ? null : item.id)} className="p-1.5 rounded hover:bg-muted text-xs font-medium flex items-center gap-1" title="Fotos">
                      <Image className="w-3.5 h-3.5" /> Fotos
                    </button>
                    <button type="button" onClick={() => setEditingId(item.id)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
            {(photoPanelId === item.id || editingId === item.id) && (
              <div className="border-t border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  <Image className="w-3 h-3" /> Fotos ({photosFor(item).length}/{PHOTOS_PER_ITEM}) — aparecem no carrossel do site
                </p>
                <div className="flex flex-wrap gap-2">
                  {photosFor(item).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-14 h-14 rounded object-cover border border-border" />
                      <button type="button" onClick={() => handleRemovePhoto(item.id, i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {canAddPhoto(item) && (
                    <label className="w-14 h-14 rounded border-2 border-dashed border-primary/50 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors bg-background">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(item.id, f); e.target.value = ""; }} disabled={uploadingPhotoFor === item.id} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
