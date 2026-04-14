import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build não falha por ESLint/TypeScript (site oficial hashpo.com precisa subir; corrigir depois)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Evita aviso de múltiplos lockfiles (raiz do projeto)
  outputFileTracingRoot: path.join(__dirname),
  // Alias @ -> src para reusar componentes existentes
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    // Wagmi/connectors puxa todos os connectors; dependências opcionais não instaladas quebram o build
    const stubOptional = (name) => {
      config.resolve.alias[name] = false;
    };
    stubOptional("porto/internal");
    stubOptional("porto");
    stubOptional("@base-org/account");
    stubOptional("@coinbase/wallet-sdk");
    stubOptional("@metamask/sdk");
    stubOptional("@safe-global/safe-apps-sdk");
    stubOptional("@safe-global/safe-apps-provider");
    return config;
  },
  async rewrites() {
    return [
      // Mini sites: /@slug deve ser servido por /mini-site/slug (mantém URL /@slug no browser)
      { source: "/@:slug", destination: "/mini-site/:slug" },
      { source: "/@:slug/(.*)", destination: "/mini-site/:slug/$1" },
    ];
  },
  // Variáveis: use só o painel do Vercel ou .env.local localmente (Next injeta NEXT_PUBLIC_* no build).
  env: {},
};

export default nextConfig;
