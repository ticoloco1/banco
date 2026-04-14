"use client";

import { Suspense } from "react";
import Directory from "@/views/Directory";

export default function DirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>}>
      <Directory />
    </Suspense>
  );
}
