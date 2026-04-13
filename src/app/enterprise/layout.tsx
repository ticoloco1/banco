import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal do Anunciante — Campanhas Master | TrustBank',
  description:
    'Campanhas de aquisição de leads com NFT: wallets verificadas, QR, mercado secundário e vitrine no mini-site. Calculadora de impacto vs Google e Meta.',
  openGraph: {
    title: 'TrustBank Enterprise — Master Lead NFT Campaigns',
    description: 'Marketing que vira colecionável na carteira do utilizador.',
  },
};

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
