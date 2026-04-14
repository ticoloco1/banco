import Link from "next/link";
import { Globe, Link2, FileText, Rss, Lock, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Globe,
    title: "1. Pegue seu nome",
    desc: "Crie seu mini site e publique uma página leve, bonita e pronta para começar a indexar.",
    mockup: (
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-xl p-4 text-center space-y-2 h-full">
        <div className="w-10 h-10 rounded-full bg-purple-500 mx-auto" />
        <div className="h-3 w-20 bg-white/30 rounded mx-auto" />
        <div className="h-2 w-32 bg-white/15 rounded mx-auto" />
        <div className="h-2 w-28 bg-white/10 rounded mx-auto" />
      </div>
    ),
  },
  {
    icon: Link2,
    title: "2. Coloque seus links",
    desc: "Organize links sociais, serviços, produtos e contatos em um bloco simples e forte para conversão.",
    mockup: (
      <div className="bg-white rounded-xl p-3 space-y-1.5 h-full">
        {["Instagram", "YouTube", "WhatsApp"].map((n) => (
          <div key={n} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-accent/30" />
            <span className="text-[10px] font-bold text-gray-700">{n}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Rss,
    title: "3. Use o feed curto",
    desc: "Posts de 7 dias mantêm o site atualizado. O feed fixo premium pode segurar o melhor conteúdo por 365 dias.",
    mockup: (
      <div className="bg-gray-950 rounded-xl p-3 space-y-2 h-full text-white">
        <div className="h-12 rounded-lg bg-white/10" />
        <div className="h-12 rounded-lg bg-white/10" />
        <div className="text-[10px] text-amber-300 font-bold">Post fixo premium: 365 dias</div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "4. Mostre seu CV",
    desc: "Headline profissional, experiência, skills e portfolio dentro do mini site ajudam muito no diretório.",
    mockup: (
      <div className="bg-amber-50 rounded-xl p-3 space-y-2 h-full">
        <div className="h-2.5 w-28 bg-amber-900/20 rounded" />
        <div className="h-2 w-20 bg-amber-900/10 rounded" />
        <div className="flex gap-1 flex-wrap">
          {["React", "Node", "Vendas"].map((s) => (
            <span key={s} className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-200/60 text-amber-800 rounded-full">{s}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Lock,
    title: "5. Monetize o melhor bloco",
    desc: "Conteúdo premium, contato qualificado, serviço especial ou material exclusivo podem ficar sob paywall.",
    mockup: (
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-3 space-y-2 h-full text-white">
        <div className="h-20 rounded-xl bg-white/10 border border-white/10" />
        <div className="text-[10px] font-bold text-emerald-300">Desbloquear por US$10</div>
      </div>
    ),
  },
];

const MiniSiteShowcase = () => (
  <section className="py-16 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">Fluxo simples para o usuário entender e pagar</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Quanto mais claro o produto, melhor a conversão. Esta versão deixa o mini site mais enxuto e mais fácil de explicar.
          </p>
        </div>
        <Link href="/site/edit" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          Abrir editor <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <step.icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-sm font-black text-foreground mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
            <div className="h-40">{step.mockup}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default MiniSiteShowcase;
