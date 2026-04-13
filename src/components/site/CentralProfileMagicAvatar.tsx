'use client';

import type { ReactNode } from 'react';

/**
 * Antigo “retrato mágico” com moldura extra em gradiente — removido do UI (feedback: moldura pesada).
 * Mantemos o componente para não rebentar imports; `enabled` é ignorado.
 */
export function CentralProfileMagicAvatar({
  children,
}: {
  enabled?: boolean;
  accent?: string;
  children: ReactNode;
}) {
  return <>{children}</>;
}
