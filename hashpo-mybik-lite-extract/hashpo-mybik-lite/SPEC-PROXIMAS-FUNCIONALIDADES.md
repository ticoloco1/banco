# Especificação – Próximas funcionalidades

Documento para você e o time verem o que está planejado e o que falta. Tudo opcional; pode ir implementando por partes.

---

## 1. Corretor de imóveis – fotos e limites

**Hoje:**
- **10 espaços (imóveis)** grátis por mini site.
- **10 fotos por imóvel** em carrossel; na página pública, clique na foto ou no ícone expandir → **janela expansível** (tela cheia, setas, Escape para fechar).
- Upload de fotos no editor ao editar cada imóvel (até 10 fotos por imóvel).

**Futuro (billing):**
- Se quiser **mais de 10 fotos por imóvel**: **US$ 1,00/mês por imóvel** (extra).

| Item | Status |
|------|--------|
| 10 espaços (imóveis) grátis | ✅ |
| 10 fotos por imóvel, carrossel + janela expansível | ✅ |
| Cobrança US$ 1/mês por imóvel (fotos extras) | 🔲 A fazer (backend/billing) |

---

## 2. i18n – idiomas

**Base:** Inglês.  
**Idiomas:** Português, Espanhol, Alemão, Francês, Italiano, Chinês, Japonês.

- Troca de idioma no site (selector).
- Textos traduzidos (JSON ou CMS por idioma).
- Rotas opcionais: ex. `/en/`, `/pt/`, `/es/`, etc.

| Item | Status |
|------|--------|
| Estrutura i18n (react-i18next ou similar) | 🔲 A fazer |
| Traduções EN + PT + ES + DE + FR + IT + ZH + JA | 🔲 A fazer |

---

## 3. Carros, motos, barcos (veículos)

- **10 espaços** grátis (10 itens listáveis).
- Cada item com **até 10 fotos**.
- Se quiser **mais espaços**: **US$ 1,00/mês por espaço**.
- Diretório/classificados **separados** (ex.: filtro “Veículos” ou seção própria).

| Item | Status |
|------|--------|
| Modelo de dados (ex.: vehicle_listings ou classificados) | 🔲 A fazer |
| Editor no mini site (tipo “Veículos”) | 🔲 A fazer |
| 10 fotos por item, 10 itens grátis | 🔲 A fazer |
| Cobrança US$ 1/mês por espaço extra | 🔲 A fazer |

---

## 4. Diretório / classificados

- Tudo **separado e classificado** (categorias).
- **10 espaços** grátis, com fotos (ex.: 10 fotos por espaço).
- **Mais espaços**: **US$ 1,00/mês por espaço**.
- Opcional por mini site (quem quiser usa).

| Item | Status |
|------|--------|
| Categorias de classificados no diretório | 🔲 A fazer |
| 10 espaços + 10 fotos cada, grátis | 🔲 A fazer |
| Cobrança US$ 1/mês por espaço extra | 🔲 A fazer |

---

## 5. Designers, arquitetos – templates específicos

- Templates específicos para **designer** e **arquiteto** (além dos de imóveis já existentes).
- Na escolha de template (ex.: 3 colunas), aparecer opções por “tipo” (Designer, Arquiteto, Corretor, etc.).

| Item | Status |
|------|--------|
| Novos templates Designer / Arquiteto | 🔲 A fazer |
| Filtro por profissão na escolha de template | 🔲 A fazer |

---

## 6. Layout 3 colunas – drag and drop

- Quando o usuário escolhe **template de 3 colunas**, poder **arrastar e soltar** blocos.
- Ex.: feed à direita, fotos à esquerda, etc. – usar a página inteira de forma flexível.
- Layout customizável por seção (blocos reordenáveis).

| Item | Status |
|------|--------|
| Editor de layout drag-and-drop (3 colunas) | 🔲 A fazer |
| Blocos: feed, fotos, vídeos, links, etc. | 🔲 A fazer |

---

## 7. Produtos digitais e pagamentos

- **Ebooks, músicas, NFTs, domínios** – o sistema aceitar **pagamentos automáticos**.
- **Stripe** e/ou **crypto** como opção.
- **Paywall** por conteúdo (desbloquear com pagamento).
- Tudo automático (pagamento → liberar acesso).

| Item | Status |
|------|--------|
| Integração Stripe (checkout / paywall) | 🔲 A fazer |
| Opção crypto (já existe algo; integrar ao fluxo) | 🔲 A fazer |
| Paywall por item (vídeo, ebook, link, etc.) | 🔲 A fazer |

---

## Resumo rápido

| Área | Resumo |
|------|--------|
| **Imóveis** | 3 imóveis, 10 fotos cada; extra = US$ 1/mês por imóvel |
| **i18n** | EN base + PT, ES, DE, FR, IT, ZH, JA |
| **Veículos** | 10 espaços, 10 fotos cada; extra = US$ 1/mês por espaço |
| **Classificados** | 10 espaços com fotos; extra = US$ 1/mês por espaço |
| **Templates** | Designer, Arquiteto; filtro por profissão |
| **Layout** | 3 colunas com drag-and-drop |
| **Pagamentos** | Stripe + crypto, paywall automático para digitais |

Quando for implementar, dá para seguir esta spec e marcar os itens (🔲 → ✅) conforme for fazendo.
