import Link from "next/link";
import { Briefcase, FileUser, LayoutGrid, Rocket, Sparkles, Store } from "lucide-react";

const modules = [
  {
    title: "Marketplace de Slugs",
    description: "Slug curto, memoravel e com valor comercial para perfis premium.",
    href: "/slugs",
    icon: Sparkles,
    cta: "Explorar slugs",
  },
  {
    title: "CV e Perfil Profissional",
    description: "Curriculo online integrado ao mini site para destacar experiencia e portfolio.",
    href: "/cv",
    icon: FileUser,
    cta: "Montar CV",
  },
  {
    title: "Vagas e Oportunidades",
    description: "Conecte profissionais e empresas com uma jornada simples e objetiva.",
    href: "/careers",
    icon: Briefcase,
    cta: "Ver vagas",
  },
  {
    title: "Diretorio de Talentos",
    description: "Busca rapida por especialistas com foco em contratacao e networking.",
    href: "/directory",
    icon: LayoutGrid,
    cta: "Abrir diretorio",
  },
  {
    title: "Servicos Digitais",
    description: "Monetizacao com servicos, IA, dropshipping e ofertas dentro do ecossistema.",
    href: "/servicos",
    icon: Store,
    cta: "Ver servicos",
  },
  {
    title: "Mini Site Turbo",
    description: "Construa pagina premium com feed, links e paywall em poucos minutos.",
    href: "/site/edit",
    icon: Rocket,
    cta: "Criar agora",
  },
];

const ZicoFusionSection = () => (
  <section className="py-16 px-6">
    <div
      className="max-w-6xl mx-auto rounded-3xl p-8 md:p-10 text-white border border-white/15 shadow-2xl relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(220 60% 14%), hsl(220 55% 22%), hsl(43 90% 30%))" }}
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: "hsl(43 90% 50% / 0.2)" }} />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl" style={{ background: "hsl(43 90% 50% / 0.12)" }} />

      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Fusao Hashpo + ZicoBank
        </span>
        <h2 className="text-3xl md:text-4xl font-black mt-4 mb-3">
          O melhor dos dois sistemas em uma experiencia unica
        </h2>
        <p className="text-white/80 max-w-3xl mb-8">
          Mantivemos o design forte do Hashpo e organizamos os recursos que mais geram valor no ZicoBank:
          mini site, CV, diretorio, vagas e marketplace prontos para acelerar monetizacao.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-5 hover:bg-white/15 transition-colors"
            >
              <module.icon className="w-7 h-7 text-amber-300 mb-3" />
              <h3 className="text-lg font-extrabold mb-1">{module.title}</h3>
              <p className="text-sm text-white/75 mb-4">{module.description}</p>
              <span className="text-sm font-bold text-amber-200 group-hover:text-amber-100 transition-colors">
                {module.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ZicoFusionSection;
