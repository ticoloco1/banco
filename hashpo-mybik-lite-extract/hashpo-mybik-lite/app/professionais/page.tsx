"use client";

import { Suspense } from "react";
import MiniSiteDirectory from "@/views/MiniSiteDirectory";

export default function ProfessionaisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>}>
      <MiniSiteDirectory />
    </Suspense>
  );
}
