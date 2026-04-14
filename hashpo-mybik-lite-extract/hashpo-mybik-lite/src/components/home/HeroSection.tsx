import Link from "next/link";
import { Globe, ArrowRight, FileText, Rss, Link2 } from "lucide-react";

const HeroSection = () => (
  <section
    className="relative overflow-hidden py-24 px-6"
    style={{ background: "linear-gradient(135deg, hsl(220 60% 14%), hsl(220 55% 22%), hsl(43 90% 30%))" }}
  >
    <div className="max-w-6xl mx-auto relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full mb-6 text-sm font-bold text-white/90">
          <Globe className="w-4 h-4" /> Mini site pronto para usar e com chance real de indexação
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-5 text-white">
          Seu <span style={{ color: "hsl(43 90% 55%)" }}>mini site</span>
          <br />
          <span className="text-2xl md:text-3xl font-bold text-white/75">links, feed, CV, paywall e até 3 páginas</span>
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl lg:max-w-none mx-auto lg:mx-0 mb-8">
          Modelo simples e vendável: janela compacta, links principais, feed grátis por 7 dias,
          feed fixo premium por <strong className="text-white">US$10</strong>, currículo online e diretório para empresas encontrarem profissionais.
        </p>
        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
          <Link
            href="/site/edit"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-lg shadow-lg transition-opacity hover:opacity-90"
            style={{ background: "hsl(43 90% 50%)", color: "hsl(220 60% 12%)" }}
          >
            Criar meu mini site <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Ver diretório profissional
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[650px]">
        <div className="rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-10 px-4 flex items-center gap-2 border-b border-white/10 bg-black/10">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-3 text-xs text-white/70">crypto.hashpo.com</div>
          </div>
          <div className="grid md:grid-cols-[220px_1fr] min-h-[550px]">
            <div className="p-5 border-b md:border-b-0 md:border-r border-white/10 bg-black/10 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/15 mb-4" />
              <h2 className="text-lg font-black">Crypto Creator</h2>
              <p className="text-sm text-white/70 mt-1">Análises, links, artigos e CV em um só lugar.</p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Link2 className="w-4 h-4" /> Meus links</div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Rss className="w-4 h-4" /> Feed 7 dias</div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><FileText className="w-4 h-4" /> CV público</div>
              </div>
            </div>
            <div className="p-5 bg-slate-950/40 text-white">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 mb-4">
                <div className="text-xs uppercase tracking-wide text-white/60">Plano atual</div>
                <div className="mt-2 text-2xl font-black">US$19,90/mês</div>
                <div className="text-sm text-white/70">Links, CV, blog curto, feed 7 dias e até 3 páginas.</div>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 mb-4">
                <div className="text-xs uppercase tracking-wide text-amber-200">Upgrade premium</div>
                <div className="mt-2 text-2xl font-black text-white">+ US$10</div>
                <div className="text-sm text-white/75">Feed fixo por 365 dias e mais destaque no perfil.</div>
              </div>
              <div className="space-y-3">
                {["Post do feed com validade curta", "Artigo premium com paywall", "Bloco de currículo para recrutadores"].map((item) => (
                  <div key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/90 border border-white/10">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: "hsl(43 90% 50% / 0.15)" }} />
    <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl" style={{ background: "hsl(43 90% 50% / 0.08)" }} />
  </section>
);

export default HeroSection;
