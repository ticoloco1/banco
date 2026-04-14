"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useClassifiedById, useUpdateClassified, useDeleteClassified } from "@/hooks/useClassifieds";
import ClassificadoForm, { formValuesFromItem, getFormPayload } from "@/components/ClassificadoForm";
import type { ClassificadoFormValues } from "@/components/ClassificadoForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClassificadoEditar() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const { data: item, isLoading: itemLoading, error } = useClassifiedById(id);
  const updateClassified = useUpdateClassified();
  const deleteClassified = useDeleteClassified();
  const [values, setValues] = useState<ClassificadoFormValues | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item) setValues(formValuesFromItem(item));
  }, [item]);

  const isOwner = user?.id && item?.user_id === user.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item?.site_id || !id || !values) return;
    try {
      const payload = getFormPayload(values, item.site_id);
      const { site_id, ...rest } = payload;
      await updateClassified.mutateAsync({ id, site_id, ...rest } as any);
      toast.success("Anúncio atualizado!");
      router.push(`/classificados/${id}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar.");
    }
  };

  const handleDelete = async () => {
    if (!item?.site_id || !id) return;
    try {
      await deleteClassified.mutateAsync({ id, site_id: item.site_id });
      toast.success("Anúncio excluído.");
      router.push("/classificados");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Editar" />
        <Header />
        <main className="max-w-lg mx-auto px-4 py-8">ID inválido.</main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Editar classificado" />
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Faça login para editar.</p>
          <Button asChild>
            <Link href="/auth">Entrar</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (itemLoading || !values) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Editar classificado" />
        <Header />
        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
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
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Anúncio não encontrado.</p>
          <Button asChild variant="outline">
            <Link href="/classificados">Voltar aos classificados</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Sem permissão" />
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Você não pode editar este anúncio.</p>
          <Button asChild variant="outline">
            <Link href={`/classificados/${id}`}>Ver anúncio</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Editar classificado" />
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href={`/classificados/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <ClassificadoForm
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          isPending={updateClassified.isPending}
          submitLabel="Salvar alterações"
          children={
            <Button
              type="button"
              variant="destructive"
              className="w-full mt-2"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir anúncio
            </Button>
          }
        />
      </main>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteClassified.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
