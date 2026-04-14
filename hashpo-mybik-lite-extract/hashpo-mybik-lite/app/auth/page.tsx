"use client";

import { Suspense } from "react";
import Auth from "@/views/Auth";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <Auth />
    </Suspense>
  );
}
