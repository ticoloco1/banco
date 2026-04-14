import Link from "next/link";
import { Package, Shirt, ArrowRight, BrainCircuit, BriefcaseBusiness } from "lucide-react";

const items = [
  { href: "/cv", icon: BriefcaseBusiness, title: "CV e diretório", desc: "Currículo online dentro do mini site para recrutadores encontrarem profissionais." },
  { href: "/comprar-ia", icon: BrainCircuit, title: "IA barata para triagem", desc: "Área pensada para filtros e busca assistida por IA de candidatos e prestadores." },
  { href: "/dropshipping", icon: Package, title: "Dropshipping", desc: "Conecte-se a fornecedores e venda pelo mini site sem estoque." },
  { href: "/impressao-sob-demanda", icon: Shirt, title: "Impressão sob demanda", desc: "Use sua página para vender produtos com a sua marca." },
];

const ServicosSection = () => (
  <section className="py-16 px-6 bg-primary/5">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-foreground mb-2">Módulos que fazem sentido agora</h2>
      <p className="text-center text-muted-foreground text-sm mb-8 max-w-2xl mx-auto">
        Em vez de deixar o sistema pesado demais, o melhor caminho é vender primeiro o núcleo e ligar os extras com calma.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default ServicosSection;
