"use client";

import { Suspense } from "react";
import SlugMarketplace from "@/views/SlugMarketplace";

export default function SlugsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>}>
      <SlugMarketplace />
    </Suspense>
  );
}
