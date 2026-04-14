"use client";

import { Suspense } from "react";
import MiniSiteEditor from "@/views/MiniSiteEditor";

export default function MiniSiteEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>}>
      <MiniSiteEditor />
    </Suspense>
  );
}
