# Guia simples – Royal Fintech Hub

Use este guia quando não souber o que fazer. Só seguir os passos.

---

## Site original (em produção) vs site no seu PC

| Onde | URL |
|------|-----|
| **Site original / na internet** (após deploy) | **https://hashpo.com** |
| **Site no seu computador** (depois de `npm run dev`) | A URL que aparecer no terminal, ex.: **http://localhost:8080** ou **http://localhost:8081** |

Para ver o site original sem rodar nada no PC, abra no navegador: **https://hashpo.com**

---

## Como usar o Terminal – passo a passo (tudo que você precisa escrever)

O **Terminal** é a janela onde você digita comandos. No Cursor ele fica embaixo ou ao lado do código.

### Abrir o Terminal no Cursor

1. No menu do topo, clique em **Terminal** (ou **View** → **Terminal**).
2. Clique em **New Terminal** (ou atalho **Ctrl+`** no Windows / **Cmd+`** no Mac).
3. Aparece uma janela com uma linha onde você pode digitar (geralmente termina com `$` ou `%`). É ali que você cola ou digita os comandos abaixo.
4. Depois de cada comando, pressione **Enter**.

---

### Sequência de comandos “a partir de agora”

Siga na ordem. Se o Cursor já abriu o terminal na pasta do projeto, o primeiro comando pode dar “already in folder” — pode pular para o próximo.

| Passo | O que digitar (copie e cole) | Para que serve |
|-------|-------------------------------|----------------|
| **1** | `cd ~/Desktop/hashpo-next/royal-fintech-hub` | Entrar na pasta do projeto (no Mac). No Windows use: `cd Desktop\hashpo-next\royal-fintech-hub` |
| **2** | `npm install` | Instalar/atualizar dependências (rode se acabou de clonar o projeto ou se alguém disse “rode npm install”). |
| **3** | `npm run dev` | Subir o site no seu PC. Deixe o terminal aberto. **Olhe no terminal** qual URL apareceu (ex.: `http://localhost:8080` ou `http://localhost:8081`) e abra **essa** URL no navegador. |
| **4** | *(quando quiser parar o site)* | Pressione **Ctrl+C** (Windows) ou **Cmd+C** (Mac) no terminal. |
| **5** | *(quando quiser enviar as mudanças para a internet)* | Primeiro pare o `npm run dev` (Ctrl+C). Depois rode os 3 comandos abaixo, um por vez: |
| **5a** | `git add .` | Marcar todas as alterações para envio. |
| **5b** | `git commit -m "minhas alterações"` | Guardar as alterações com uma mensagem (pode trocar o texto entre aspas). |
| **5c** | `git push` | Enviar para o GitHub; o Vercel/Lovable atualiza o site na internet. |

---

### Resumo: o que digitar em qual momento

- **Só abrir o projeto e ver o site no PC:**  
  `cd ~/Desktop/hashpo-next/royal-fintech-hub` → Enter  
  `npm run dev` → Enter  
  Depois abra no navegador a **URL que aparecer no terminal** (geralmente **http://localhost:8080** ou, se essa porta estiver em uso, **http://localhost:8081**).

- **Depois de a IA (ou você) mudar o código e você quer que isso vá para a internet:**  
  No terminal (na pasta do projeto):  
  `git add .` → Enter  
  `git commit -m "atualizações"` → Enter  
  `git push` → Enter  

- **Se pedir usuário/senha no `git push`:** use seu **usuário do GitHub** e, na senha, use um **Personal Access Token** (não a senha normal da conta). Se não tiver token, peça no chat: “como criar token do GitHub”.

---

## 1. Abrir o projeto certo no Cursor

- No Cursor, clique em **File** (ou **Arquivo**) no topo.
- Clique em **Open Folder** (ou **Abrir Pasta**).
- Navegue até: **Desktop** → **hashpo-next** → **royal-fintech-hub**.
- Selecione a pasta **royal-fintech-hub** e clique em **Abrir** (ou **Open**).

Pronto: você está no projeto que está no GitHub e no Vercel.

---

## 2. Ver o site rodando no seu computador

- No Cursor, abra o **Terminal**: menu **Terminal** → **New Terminal** (ou atalho).
- Digite ou cole estes comandos, um por vez, e dê Enter depois de cada um:

```bash
cd royal-fintech-hub
npm run dev
```

- Espere aparecer no terminal algo como: `Local: http://localhost:3000/` (Next.js usa a porta 3000 por padrão).
- Abra o **navegador** e acesse **exatamente a URL que apareceu no terminal** (ex.: http://localhost:8080 ou http://localhost:8081).

Você verá o site. Para parar o servidor: no terminal, pressione **Ctrl+C** (ou **Cmd+C** no Mac).

### Se o site não carrega

1. **URL errada:** O servidor pode estar em outra porta. Olhe no terminal depois de `npm run dev` — deve aparecer algo como `Local: http://localhost:8081/`. Use **essa** URL no navegador (às vezes é 8081 e não 8080).
2. **Página fica em "Carregando…":** Abra as ferramentas do desenvolvedor (**F12** ou **Cmd+Option+I** no Mac) → aba **Console**. Se aparecer erro em vermelho, copie a mensagem e peça ajuda no chat.
3. **.env:** Confira se na raiz do projeto existe o arquivo **.env** com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` preenchidos (valores do seu projeto no Supabase).

---

## 3. Quando você pedir mudanças no chat (Cursor/AI)

- Diga o que quer em português (ex.: “mudar o título”, “adicionar um botão”).
- A IA vai alterar os arquivos do projeto.
- Se o servidor estiver rodando (`npm run dev`), **atualize a página no navegador** (F5 ou Cmd+R) para ver as mudanças.
- Se não estiver rodando, faça de novo o **passo 2** e depois atualize a página.

---

## 4. Enviar as mudanças para o GitHub (e o Vercel atualizar)

Só faça isso quando quiser que o site na internet (Vercel) fique igual ao que está aí no seu computador.

- No terminal, na pasta **royal-fintech-hub**, rode:

```bash
git add .
git commit -m "minhas alterações"
git push
```

- Se pedir **usuário e senha**: use seu usuário do GitHub e um **Personal Access Token** (não a senha normal). Se nunca criou um token, avise no chat que te explico em 2 passos.

Depois do `git push`, o Vercel atualiza o site sozinho em alguns minutos.

### Se o `git push` der erro (rejected / divergent branches)

Se aparecer **"rejected"** ou **"Need to specify how to reconcile divergent branches"**, o GitHub tem commits que você ainda não puxou. Faça assim, **um comando por vez**:

1. **Puxar as mudanças do remoto e juntar com as suas (merge):**
   ```bash
   git pull origin main --no-rebase
   ```
   Se pedir uma mensagem de merge, pode só salvar e fechar o editor (no nano: **Ctrl+O**, Enter, **Ctrl+X**).

2. **Enviar de novo:**
   ```bash
   git push origin main
   ```

Assim suas alterações e as do remoto ficam juntas e o push funciona.

### Se der **conflito de merge** (ex.: "Merge conflict in MiniSitePublic.tsx")

O Git vai marcar no arquivo as duas versões com linhas assim:

- `<<<<<<< HEAD` — começo da **sua** versão
- `=======` — separador
- `>>>>>>> origin/main` — fim da versão que **veio do GitHub**

**O que fazer:**

1. Abra o arquivo que deu conflito (ex.: `src/pages/MiniSitePublic.tsx`) no Cursor.
2. Procure por `<<<<<<<` (busque com Ctrl+F / Cmd+F).
3. Você verá dois blocos: um entre `<<<<<<< HEAD` e `=======`, outro entre `=======` e `>>>>>>> origin/main`. Escolha **qual bloco manter** (ou junte os dois, se fizer sentido) e **apague** as linhas de marcação (`<<<<<<< HEAD`, `=======`, `>>>>>>> origin/main`).
4. Salve o arquivo (Ctrl+S / Cmd+S).
5. No terminal, rode para **finalizar o merge**:
   ```bash
   git add .
   git commit -m "Merge: resolver conflito"
   git push origin main
   ```

---

## Resumo rápido

| O que você quer              | O que fazer |
|-----------------------------|-------------|
| Abrir o projeto             | File → Open Folder → royal-fintech-hub |
| Ver o site no PC            | Terminal: `cd royal-fintech-hub` e `npm run dev` → abrir http://localhost:8080 |
| Ver mudanças que a IA fez    | Atualizar a página no navegador (F5) |
| Subir alterações p/ internet| Terminal: `git add .` → `git commit -m "texto"` → `git push` |

Se travar em algum passo, copie a mensagem de erro ou diga em qual número do guia parou que te ajudo no próximo passo.

---

## 5. O que pode estar faltando (checklist)

Use esta lista para ver o que ainda falta configurar no projeto.

| Item | Onde configurar | Status |
|------|-----------------|--------|
| **API DeepSeek** (assistente IA no site e mini sites) | Supabase → Edge Functions → **ai-chat** → **Secrets** → criar `DEEPSEEK_API_KEY` com sua chave da [DeepSeek](https://platform.deepseek.com). Depois: Admin do site → **Governance** → aba **AI Brain** → ativar **DeepSeek** (ON). | ⬜ |
| **Variáveis de ambiente** (Supabase do projeto) | Arquivo **.env** na raiz já tem `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. No Vercel: Project → Settings → Environment Variables (se precisar). | ⬜ |
| **Slugs / formato de URL** | O sistema usa só **/@seunome** (não usa mais /s/). Links e diretório já estão nesse formato. | ✅ |
| **Profissões (Corretor de imóveis / Venda de domínios)** | No editor do mini site (**Mini Site** no menu), ao listar no diretório escolha a categoria (ex.: Corretor de imóveis). Página **Profissões**: http://localhost:8080/professionais | ✅ |
| **Espaços extras (imóveis e classificados)** | **Imóveis:** 10 grátis; depois US$ 1 por espaço/mês. **Classificados (carros, motos, barcos):** 10 grátis; depois US$ 1 por espaço/mês. Para cobrar: 1) Rode o SQL (bloco 5 no **SQL-PARA-LOVABLE-OU-SUPABASE.sql**). 2) No Stripe crie 2 produtos (US$ 1,00 one-time): "Espaço extra imóveis" e "Espaço extra classificados (carros/motos/barcos)". Copie os **price_id** para **src/data/stripeProducts.ts**. 3) Deploy da edge function **apply-extra-space-after-payment**. | ⬜ |

- **Assistente IA**: aparece na **home** (site principal) e em **todos os mini sites** (canto inferior direito). Com DeepSeek ativado e a chave no Supabase, ele usa a API DeepSeek.
- Se algo não funcionar (ex.: assistente não responde), confira no Supabase se o secret **DEEPSEEK_API_KEY** está preenchido e se na aba **AI Brain** o DeepSeek está **ON**.

### ⚠️ Erro "slug_format / subdomain_auctions" ao criar leilão (Admin)

Esse erro aparece quando o **site em produção** (ex.: hashpo.com) ainda está com a **versão antiga** do código. O projeto no Cursor já está corrigido: o admin cria leilões na tabela **slug_auctions** (não em subdomain_auctions) e o formulário tem **Lance mín.** e **Incremento mín.**.

**O que fazer:**
1. Enviar as alterações para o repositório e deixar o deploy atualizar (ver **§ 4**): `git add .` → `git commit -m "fix: admin leilão usa slug_auctions"` → `git push`.
2. Se o deploy for automático (Vercel/Lovable), espere alguns minutos.
3. No navegador em hashpo.com, faça **hard refresh**: **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows), ou abra a página do Admin em aba anônima para evitar cache.
4. Teste de novo **Criar Leilão** no Admin (Slugs Premium). Deve aparecer o campo **"Incremento mín. ($)"** e o botão deve gravar na tabela `slug_auctions`.

---

## 6. Próximas funcionalidades (roadmap)

As ideias que você pediu (i18n, veículos, classificados, templates, drag-and-drop, pagamentos) estão descritas em **SPEC-PROXIMAS-FUNCIONALIDADES.md**, com checklist por item. Abra esse arquivo no Cursor para ver o que já está planejado e o que falta implementar.

- **Corretor de imóveis**: já tem **fotos** — no editor, ao editar um imóvel, você vê "Fotos (x/10)" e pode fazer upload (até 10 por imóvel, carrossel na página pública). Cobrança de US$ 1/mês por imóvel para fotos extras fica para o billing depois.

---

## 7. Comandos para aplicar todas as mudanças de uma vez

Use estes comandos **no terminal**, na pasta do projeto (**royal-fintech-hub**), para que tudo que foi alterado (código + banco) funcione junto.

### Passo A — Entrar na pasta do projeto

```bash
cd royal-fintech-hub
```

*(Se você já abriu o terminal pelo Cursor na pasta do projeto, pode pular este passo.)*

### Passo B — Instalar dependências (se ainda não fez)

```bash
npm install
```

### Passo C — Aplicar as migrações no banco (Lovable ou Supabase)

As mudanças de **banner (foto/cor)**, **classificados (carros, motos, barcos)** e **show_classifieds** precisam das novas colunas e da tabela no banco.

**Opção 1 — Pelo Lovable (recomendado se você usa Lovable):**

1. Abra seu projeto no [Lovable](https://lovable.dev).
2. Vá em **Database** (ou **Supabase** / **SQL**, conforme o menu do Lovable).
3. Abra o **SQL Editor**.
4. Abra o arquivo **`SQL-PARA-LOVABLE-OU-SUPABASE.sql`** que está na raiz do projeto (no Cursor ou no repo).
5. Copie **todo** o conteúdo do arquivo, cole no SQL Editor do Lovable e clique em **Run** (ou **Execute**).

Pronto: todas as alterações de banco são aplicadas de uma vez.

**Opção 2 — Pelo Supabase (se o banco está no Supabase):**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto.
2. Menu **SQL Editor** → **New query**.
3. Copie todo o conteúdo do arquivo **`SQL-PARA-LOVABLE-OU-SUPABASE.sql`**, cole na query e clique em **Run**.

**Opção 3 — Pelo terminal (Supabase CLI):**

```bash
npx supabase db push
```

- Se der erro de “not linked”, vincule antes: no Supabase → Settings → General → **Project ID**; no terminal: `npx supabase link --project-ref SEU_PROJECT_ID`.

### Passo D — Conferir se o projeto compila

```bash
npm run build
```

Se aparecer “build at …” no final, está ok.

### Passo E — Subir as alterações para o GitHub (e Vercel)

```bash
git add .
git commit -m "Banner foto/cor, classificados, destaque, imóveis 10 fotos"
git push
```

---

**Resumo em uma sequência (terminal):**

```bash
cd royal-fintech-hub
npm install
npm run build
git add .
git commit -m "Banner foto/cor, classificados, destaque, imóveis 10 fotos"
git push
```

Antes (ou depois) disso, rode o SQL **pelo Lovable ou pelo Supabase** (Passo C acima), usando o arquivo **`SQL-PARA-LOVABLE-OU-SUPABASE.sql`**. Assim você aplica dependências, banco e código de uma vez. Depois do `git push`, o Vercel atualiza o site sozinho.

---

## 8. Fluxo após a rodada completa (ordem recomendada)

Use esta ordem quando o código já estiver ok (build passou, guia corrigido) e você for deixar tudo no ar:

| # | O que fazer | Onde |
|---|----------------|------|
| **1** | Aplicar o SQL (banner, classificados, boost, espaços extras) | Lovable ou Supabase → SQL Editor → colar **todo** o conteúdo de **`SQL-PARA-LOVABLE-OU-SUPABASE.sql`** → Run |
| **2** | (Opcional) Criar produtos de espaço extra no Stripe (US$ 1 cada) e colar `price_id` / `product_id` em **`src/data/stripeProducts.ts`** | Stripe Dashboard + arquivo `stripeProducts.ts` |
| **3** | (Opcional) Fazer deploy das edge functions **apply-boost-after-payment** e **apply-extra-space-after-payment** | Supabase Dashboard → Edge Functions ou `supabase functions deploy` |
| **4** | Enviar o código para o GitHub (e o Vercel atualizar o site) | Terminal: `git add .` → `git commit -m "sua mensagem"` → `git push` |

Depois do passo 4, o site na internet fica igual ao do seu PC. Se pedir usuário/senha no `git push`, use seu usuário do GitHub e um **Personal Access Token** (não a senha da conta).

---

## 9. Sitemap dinâmico (mini sites no Google)

O **sitemap** em **https://hashpo.com/sitemap.xml** é gerado dinamicamente no Vercel: a cada acesso, a API busca no Supabase todos os mini sites publicados e monta o XML com as páginas estáticas + todas as URLs **/@slug**. Assim o Google descobre e indexa cada mini site.

- **Onde está:** pasta **`api/sitemap.xml.js`** (função serverless do Vercel).
- **Rewrite:** no **`vercel.json`** a rota `/sitemap.xml` é atendida por essa API.
- **Variáveis no Vercel:** para a API conseguir ler o Supabase, as mesmas variáveis do front (ex.: **`VITE_SUPABASE_URL`** e **`VITE_SUPABASE_PUBLISHABLE_KEY`**) precisam estar em **Vercel → Project → Settings → Environment Variables**. Se não estiverem, o sitemap ainda funciona, mas só com as URLs estáticas (sem os mini sites).
