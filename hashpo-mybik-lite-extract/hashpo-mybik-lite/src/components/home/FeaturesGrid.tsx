import { Link2, FileText, Lock, Zap, Globe, DollarSign, Rss, LayoutPanelTop } from "lucide-react";

const features = [
  { icon: Globe, title: "Mini site público", desc: "Página pública com melhor chance de indexação no Google do que um perfil fechado comum." },
  { icon: Link2, title: "Links principais", desc: "Instagram, YouTube, TikTok, X, WhatsApp e links de venda em um lugar só." },
  { icon: Rss, title: "Feed 7 dias", desc: "Posts curtos com validade rápida para manter o mini site vivo sem ficar poluído." },
  { icon: Zap, title: "Feed fixo premium", desc: "Por US$10, um post pode ficar em destaque por 365 dias no seu mini site." },
  { icon: FileText, title: "CV no mini site", desc: "Currículo online junto do perfil, com headline, skills, experiência e contato." },
  { icon: LayoutPanelTop, title: "Até 3 páginas", desc: "Página principal, página extra de links/serviços e página de CV ou conteúdo premium." },
  { icon: Lock, title: "Paywall opcional", desc: "Conteúdo premium, artigo pago ou desbloqueio de informações especiais para leads quentes." },
  { icon: DollarSign, title: "Diretório + IA", desc: "Empresas encontram perfis no diretório e a IA pode ajudar a filtrar candidatos e prestadores." },
];

const FeaturesGrid = () => (
  <section className="py-16 px-6 bg-secondary/30">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-3 text-foreground">
        Um produto mais simples, mais fácil de vender e melhor para crescer
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Em vez de mil módulos, o foco fica no que tem valor real: mini site, links, feed, currículo, diretório e monetização leve.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <f.icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-sm font-black text-foreground mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesGrid;
