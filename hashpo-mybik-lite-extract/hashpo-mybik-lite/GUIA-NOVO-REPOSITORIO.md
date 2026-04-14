# Criar repositório novo e subir no Vercel (passo a passo)

O código já está commitado. Só falta criar o repositório novo no GitHub e enviar o código.

---

## Passo 1 — Criar o repositório no GitHub (no navegador)

1. Abra: **https://github.com/new**
2. Em **Repository name** escreva: `royal-fintech-hub-next` (ou outro nome que quiser).
3. Deixe **Public**.
4. **Não** marque "Add a README file".
5. Clique em **Create repository**.

Na página que abrir, você verá um link do repositório. Algo como:
`https://github.com/ticoloco1/royal-fintech-hub-next`

**Copie esse endereço** (ou anote o nome que você usou, ex.: `royal-fintech-hub-next`).

---

## Passo 2 — Enviar o código (no terminal)

Abra o **Terminal** (no Mac: Spotlight com Cmd+Espaço, digite "Terminal" e Enter).

Cole os comandos abaixo **um por vez**. Na segunda linha, troque `ticoloco1/royal-fintech-hub-next` pelo **seu usuário e nome do repositório** que você criou:

```bash
cd /Users/arycorreiafilho/Desktop/hashpo-next/royal-fintech-hub
```

```bash
git remote set-url origin https://github.com/ticoloco1/royal-fintech-hub-next.git
```
*(troque ticoloco1/royal-fintech-hub-next pelo seu usuário e nome do repo)*

```bash
git push -u origin main
```

Se pedir usuário e senha do GitHub, use seu login. Se tiver **2FA**, use um **Personal Access Token** em vez da senha (em GitHub → Settings → Developer settings → Personal access tokens).

---

## Passo 3 — Conectar no Vercel

1. Abra **https://vercel.com** e entre na sua conta.
2. Clique em **Add New…** → **Project**.
3. Na lista, escolha o repositório **novo** (ex.: `royal-fintech-hub-next`).
4. Clique em **Import**.
5. O Vercel deve detectar **Next.js** (não Vite).
6. Clique em **Deploy**.

Pronto. Quando o deploy terminar, o site estará no ar com o endereço que o Vercel mostrar.

---

## Resumo

| O que fazer | Onde |
|-------------|------|
| Criar repo vazio | github.com/new |
| Trocar o remote e dar push | Terminal (comandos acima) |
| Importar o repo novo e deployar | vercel.com → Add New → Project |

Se travar em algum passo, diga em qual (1, 2 ou 3) e o que aparece na tela.
