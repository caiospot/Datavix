# Migração do Datavix do GitHub Pages para a Hostinger

Status: **preparo pronto e testado localmente; nada publicado.** O código continua no GitHub. O que muda é onde o site mora: hoje https://caiospot.github.io/Datavix/, depois https://datavix.app.

## Como funciona

```
push na main ──► GitHub Actions (hostinger.yml) ──► branch "hostinger" (só o site pronto)
                  node build.mjs com DATAVIX_HOST=hostinger          │
                  e as variáveis do NPS                              ▼
                                                  Hostinger (hPanel > Avançado > Git, app do GitHub)
                                                  copia a branch para public_html a cada push
```

- Não há senha da Hostinger no GitHub. A Hostinger puxa a branch com o app do GitHub dela (instalado por você, só para este repositório).
- A Hostinger **não roda build**: por isso o GitHub Actions monta o site (com os segredos do NPS) e guarda o resultado na branch `hostinger`.
- O mesmo site também fica como arquivo `datavix-hostinger` na página de cada execução do fluxo (aba Actions, 30 dias). Serve para subir à mão pelo Gerenciador de Arquivos do hPanel, se o plano não tiver Git.
- A GitHub Pages continua funcionando como hoje enquanto você não a desligar. Cada site diz a verdade sobre a própria hospedagem na política de privacidade (variável de build `DATAVIX_HOST`).

## O que mudou no repositório

| Arquivo | Para quê |
|---|---|
| `.github/workflows/hostinger.yml` | Monta o site para a Hostinger e atualiza a branch `hostinger` |
| `build.mjs` | Gera `dist/.htaccess` e `dist/icons/.htaccess` (a Hostinger ignora o `_headers`); grava `host` no app; corrige a CSP do `_headers` (ver abaixo) |
| `src/privacy.js` | O texto da hospedagem segue o host do build (GitHub Pages ou Hostinger); data da política: 17/out/2026 |
| `src/pwa.js` | A primeira visita não recarrega mais a página (ver abaixo) |
| `test/hostinger-check.mjs` | Confere tudo isso num Apache local e no Chrome (33 verificações); também confere um site já montado: `--dist=PASTA` |
| `test/pwa-update.mjs` | Primeira visita e fluxo de atualização do app, em Chrome de perfil novo (9 verificações) |

O `.htaccess` gerado faz o que o `_headers` faz na Netlify e na Cloudflare:
- `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, HSTS (só em HTTPS) e a mesma CSP da meta tag, **só para o HTML**;
- `Cache-Control: no-cache` no `index.html`, no `sw.js` e no manifesto (a versão nova chega na próxima visita) e cache de 1 ano nos ícones;
- gzip/brotli, `DirectoryIndex index.html`, listagem de pasta desligada;
- HTTP vira HTTPS (301) e `www.datavix.app` vira `datavix.app` (301).

**Correção achada no caminho:** o `_headers` aplicava a CSP a todos os arquivos, inclusive ao `sw.js`. Com isso o service worker não ativa (a CSP não deixa ele buscar os arquivos do app): testado, o cache do app fica vazio e o app deixa de abrir offline. Na GitHub Pages isso nunca apareceu porque ela ignora o `_headers`. Agora a CSP vale só para `/` e `/index.html`, no `_headers` e no `.htaccess`.

**Segunda correção, achada pelo mesmo teste:** na primeira visita o app **recarregava a própria página** poucos instantes depois de abrir (o service worker assume o controle e o app tratava isso como "versão nova"). Com a migração, todo mundo faria uma primeira visita no endereço novo. Se a pessoa já tivesse começado a digitar (o cadastro, por exemplo), perdia o texto. Agora só recarrega quando ela escolhe **Atualizar** no aviso de versão nova; a atualização continua funcionando e foi testada (aviso, espera, clique, recarga, cache novo e cache antigo apagado). Este item ainda **não está publicado**: vai no próximo push.

## O que você precisa fazer na Hostinger

O DNS mostra que `datavix.app` já está na sua conta (parqueado, nameservers `dns-parking.com`). Falta uma hospedagem.

1. **Plano.** Hospedagem compartilhada (Premium ou Business) serve; o site é estático (6 MB). VPS é desnecessário. Escolha o data center **São Paulo** (menor latência e LGPD mais simples). Confira em hPanel > Avançado se o plano tem **Git**.
2. **Criar o site no endereço temporário.** hPanel > Websites > Adicionar site, site vazio / enviar arquivos. Não conecte o `datavix.app` ainda: o endereço temporário (`*.hostingersite.com`, botão Pré-visualizar) permite testar tudo antes da virada.
3. **Eu publico o preparo** (precisa do seu "pode publicar"): o primeiro push na `main` roda o `hostinger.yml` e cria a branch `hostinger`.
4. **Conectar o GitHub.** hPanel > Avançado > Git > Conectar com o GitHub. Autorize o app **só para o repositório `caiospot/Datavix`**. Escolha a branch **`hostinger`** e o diretório **`public_html`**. Clique em Implantar.
5. **Testar no endereço temporário.** Eu rodo as verificações (cabeçalhos, HTTPS, service worker, manifesto, política de privacidade, abertura no Chrome); você abre e usa. Usar a ferramenta pede o cadastro por e-mail, e o cadastro e o NPS gravam na sua planilha do Google: se for testar, use o seu e-mail. Eu não envio cadastro nem NPS no site publicado.
6. **Conectar o domínio.** No site, conecte `datavix.app` (a Hostinger recomenda trocar os nameservers pelos que o hPanel mostrar para o site; como o domínio já está na conta, o hPanel costuma fazer isso por você). Propagação: de minutos a 24 horas.
7. **SSL.** hPanel > Segurança > SSL: confirme "Ativo" para `datavix.app` e `www`. O `.app` **só abre em HTTPS** (o navegador não deixa passar sem certificado), então só anuncie o endereço depois de testar.
8. **Verificação final no domínio** (eu faço): HTTPS, www e HTTP redirecionando, cabeçalhos, service worker, manifesto, instalação como app.
9. **Depois da virada:** atualize a URL no painel do Clarity (se o projeto limitar o site), atualize a linha "Site:" do `README.md` e decida o que fazer com o endereço antigo (abaixo).

## O endereço antigo (decisão sua, na virada)

O app guarda os **projetos salvos** no navegador (IndexedDB) e o aceite do cadastro (localStorage). Navegador separa esses dados por endereço, então **o que foi salvo em `caiospot.github.io` não aparece em `datavix.app`**, e o cadastro por e-mail é pedido de novo no endereço novo (o e-mail entra outra vez na planilha). O app instalado como PWA também é outro app.

| Opção | Efeito |
|---|---|
| Manter a GitHub Pages como está, com um aviso do novo endereço (recomendado) | Quem tem projetos salvos continua acessando; nada quebra |
| Redirecionar tudo para `datavix.app` | Quem tem projetos salvos no endereço antigo perde o acesso a eles |
| Desligar a GitHub Pages | Os links antigos deixam de funcionar |

## Voltar atrás

`datavix.app` hoje não serve o app (está parqueado), então não há site nele para quebrar. A GitHub Pages segue no ar até você decidir. Para desfazer a ligação: desconecte o Git no hPanel (os arquivos já implantados ficam) e/ou apague o site na Hostinger.

## Atenção

- **A branch `hostinger` fica pública no repositório** e contém o `index.html` pronto, com o endereço do Apps Script e o token do NPS embutidos. Isso já é público no site (o token é anti-ruído, não segredo), mas passa a existir também no Git. Para evitar, o caminho alternativo é enviar por SFTP/SSH (plano com SSH, chave em Segredos do GitHub); dá para trocar depois sem mexer no app.
- O Git da Hostinger **substitui os arquivos de `public_html`** a cada implantação. Não coloque outras coisas nessa pasta.
- O LiteSpeed da Hostinger é compatível com o Apache, mas o teste local foi no Apache 2.4. A conferência final é no endereço temporário (item 5).
- `FTP` simples (porta 21) não é criptografado: não use em fluxo automático.

## Como conferir de novo

```bash
node test/hostinger-check.mjs                       # Apache local + Chrome headless, 33 verificações
node test/hostinger-check.mjs --dist=PASTA             # o mesmo, sobre um site já montado (ex.: a branch hostinger clonada)
node test/hostinger-check.mjs --csp-all                # experimento: mostra o service worker quebrando com a CSP em todos os arquivos
node test/pwa-update.mjs                               # primeira visita sem recarregar + fluxo de atualização
```

Fontes (documentação da Hostinger consultada em 17/out/2026): [Git no hPanel](https://docs.hostinger.com/websites/git), [FTP e SSH](https://docs.hostinger.com/websites/ftp-ssh), [domínio temporário](https://www.hostinger.com/support/2489693-how-to-access-your-website-content-without-a-domain-in-hostinger/), [apontar o domínio](https://www.hostinger.com/support/1863967-how-to-point-a-domain-to-hostinger/).
