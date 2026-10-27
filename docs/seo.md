# SEO do Datavix: buscadores, assistentes de IA e redes sociais

Status: **feito e testado localmente; não publicado** (depende do seu "pode publicar").

Ninguém promete posição no Google. O que dá para entregar, e foi entregue aqui, é um site **tecnicamente impecável e legível por máquinas** (buscadores, robôs de IA e prévias de redes sociais). Posição depende também de conteúdo útil, de links de outros sites e de tempo. A seção "O que só você pode fazer" lista o que não se resolve no código.

## O problema que existia

O endereço `/` era o app: um HTML de 5,9 MB que só mostrava conteúdo depois de rodar JavaScript.

| Medida | Antes | Agora |
|---|---|---|
| Texto visível no HTML bruto (o que robôs de IA e prévias de redes veem) | 36 caracteres | página inteira (450+ palavras na landing) |
| Tamanho da página que o Google lê | 5,9 MB (o Googlebot só lê os primeiros 2 MB de cada arquivo) | 28 KB |
| LCP no celular (Slow 4G, CPU 4× mais lenta) | 13,8 s | 0,4 a 1,0 s |
| CLS, TBT | n/d | 0 e 0 ms |
| Título, descrição, canonical, hreflang, Open Graph, dados estruturados, sitemap, robots.txt | nenhum | em todas as páginas |

## Como ficou

```
datavix.app/                       landing em português (pt-BR)
datavix.app/en/                    landing em inglês
datavix.app/<página>/              9 páginas de conteúdo em português
datavix.app/en/<page>/             9 páginas de conteúdo em inglês
datavix.app/app/                   o app (noindex), com service worker, manifesto e ícones próprios
datavix.app/robots.txt  sitemap.xml  llms.txt  llms-full.txt  favicon.ico  favicon.svg
```

| Página (PT) | Página (EN) | Pergunta de busca que responde |
|---|---|---|
| `/` | `/en/` | planilha em gráficos animados e storytelling |
| `/planilha-em-grafico-animado/` | `/en/spreadsheet-to-animated-chart/` | como transformar planilha em gráfico animado |
| `/corrida-de-barras/` | `/en/bar-chart-race/` | corrida de barras / bar chart race a partir de planilha |
| `/storytelling-com-dados/` | `/en/data-storytelling/` | storytelling com dados (método) |
| `/modelos-de-apresentacao/` | `/en/presentation-templates/` | modelos de apresentação de dados (os 13 modelos de história) |
| `/exportar-para-powerpoint/` | `/en/export-to-powerpoint/` | exportar gráfico para PowerPoint editável |
| `/video-para-redes-sociais/` | `/en/social-video/` | vídeo de gráfico animado para redes |
| `/tipos-de-grafico/` | `/en/chart-types/` | tipos de gráfico e o que cada um pede dos dados (os 30 gráficos) |
| `/perguntas-frequentes/` | `/en/faq/` | privacidade, formatos, limites, custo |
| `/privacidade/` | `/en/privacy/` | política de privacidade (o mesmo texto do app) |

**O texto só diz o que o produto faz.** Os 30 gráficos, os 13 modelos e o "precisa de…" de cada gráfico são lidos do próprio código (`site/catalog.mjs`), então não divergem do app. Afirmações sobre exportação (PowerPoint nativo, vídeo, formatos) vêm dos documentos dos portões 17 e 38 e do código; os limites (Firefox grava WebM, animações não vão para o PowerPoint, fonte instalada na máquina) estão nas páginas. Nenhuma nota ou avaliação inventada em dados estruturados.

### Técnica, em cada página

- `<title>` (22 a 61 caracteres) e descrição (107 a 163) únicos; **canonical** absoluto; **hreflang** `pt-BR`, `en` e `x-default` (→ inglês) recíprocos e iguais aos do sitemap; `<html lang>` certo; `robots` com `max-image-preview:large`.
- **Open Graph e Twitter Card** completos, com cartão 1200×630 PNG por página e idioma (feitos com capturas reais do produto), `og:locale` e `og:locale:alternate`.
- **JSON-LD**: `Organization` (logo, `sameAs` com o GitHub do projeto), `WebSite`, `WebApplication` (gratuito), a página (`WebPage`, `Article`, `CollectionPage` ou `FAQPage`), `BreadcrumbList` e `FAQPage` com as perguntas que estão visíveis na página.
- **Sem JavaScript**, sem recurso de terceiros, sem rastreador. CSP na meta tag sem `unsafe-inline` (libera só o hash do CSS). Fontes (Geist, Geist Mono, Doto) próprias, com hash no nome e cache de 1 ano. Imagens WebP com largura/altura (CLS 0) e `srcset`.
- Contraste AA nos temas escuro e claro (o claro vale quando o sistema pede), foco visível, link de pular para o conteúdo, tabelas que rolam sem estourar a tela, 320 a 1280 px sem rolagem lateral.
- `sitemap.xml` com `lastmod` (a data de atualização de cada página, não a do build) e as versões de idioma; `robots.txt` liberando buscadores, robôs de IA (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot, CCBot e outros) e prévias de redes sociais; `llms.txt` e `llms-full.txt` (texto completo em Markdown).
- `.htaccess`: `/pasta/index.html` vira `/pasta/` (301), endereço sem barra vira com barra, página 404 própria (noindex), `www` e HTTP vão para `https://datavix.app`, cache longo só onde o nome tem hash.

### O app em `/app/`

`noindex` na meta tag e no cabeçalho (`X-Robots-Tag`). Não está bloqueado no `robots.txt` de propósito: bloquear impediria o buscador de ver o noindex e ele poderia listar o endereço sem descrição. O botão "Começar de graça" das páginas leva a `/app/` (em inglês, `/app/?lang=en`: o app agora aceita `?lang=pt` ou `?lang=en`, que vale sobre o idioma do navegador).

### Design da landing (inspirado no sistema de espaçamento da Apple)

- **Sistema** em `site/site.css` (um único `<style>` com hash na CSP): respiro de seção de 56/80/112 px (celular/tablet/desktop; 80/112/160 nos capítulos grandes), colunas de 980 px (texto) e 1260 px (cartões), vão de 12 px entre cartões, raio de 28 px nos cartões e de pílula nos botões, navegação de vidro de 44 px (`backdrop-filter`, com fundo sólido para quem pede menos transparência) e escala de tipos com `clamp()`. A fonte segue Geist (a SF Pro só pode ser usada em produtos da Apple). Escuro com lima `#d4ff00`; o claro vale quando o sistema pede.
- **Home**: abertura → 4 cartões de passos (os mesmos da landing do app) → 6 cartões de gráficos com clipe + 24 ícones dos demais → capítulos grandes (a conta à vista, privacidade, PowerPoint editável, vídeo para as redes) → modelos de história como perguntas → "em números" → "para quem" → perguntas frequentes → chamada final. Os números ("30", "13", "5", "0") são fixos no texto: confira ao mudar o produto.
- **Movimento sem JavaScript**: cada clipe é um `<iframe loading="lazy">` para um documento minúsculo (`assets/clips/<id>.<hash>.html`, `noindex`, CSP própria só com `media-src 'self'`) com um `<video autoplay muted loop playsinline>`; por baixo fica o pôster em WebP. O navegador só baixa o clipe perto da tela e pausa o que sai dela. Com `prefers-reduced-motion` ou `prefers-reduced-data` o iframe some e fica só o pôster. Cada clipe tem de 70 a 200 KB (5 s, H.264, 800 kbps, sem áudio). No celular os cartões formam um carrossel e o Chrome carrega os iframes logo ao abrir a página (cerca de 520 KB de vídeo a mais; LCP e CLS não mudam: 1,3 s e 0 no teste de Slow 4G); no desktop só o primeiro clipe carrega na abertura.
- **Refazer as mídias** (precisa de `node build.mjs`, do servidor de teste `node test/server.mjs` na porta 8768 e, para os clipes, do site em `http://localhost:8780`): `node scripts/make-clips.mjs [id ...] [--lang=pt|en] [--secs=5]` (clipes e pôsteres dos gráficos), `node scripts/make-shots.mjs` (capturas, inclusive os slides `slide-calc` e `slide-over`) e `node scripts/make-video-stills.mjs` (quadros do vídeo vertical). Os cartões de dados são fictícios (`dados-teste/`), nunca de planilha de gente de verdade.

## Quem já tinha o app instalado na raiz

O service worker antigo ficava na raiz (`/sw.js`, escopo `/`) e abria o app do cache. Agora `/sw.js` é um service worker de **limpeza**: ele não ativa sozinho (o app antigo avisa "Há uma versão nova" e a pessoa escolhe, como sempre, então ninguém perde o que estava fazendo); ao ser aceito, apaga o cache antigo e se desliga, e a raiz passa a mostrar a landing. O `manifest.webmanifest` da raiz continua existindo e aponta `start_url` para `/app/?source=pwa`, para quem instalou o app. Projetos salvos (IndexedDB) e o e-mail lembrado (localStorage) são do endereço e continuam no mesmo navegador, agora lidos por `/app/`. Testado de ponta a ponta com o site antigo de verdade (`test/migration-sw.mjs`, 24 verificações).

**Endereço antigo (GitHub Pages):** vira uma página de aviso bilíngue (canonical e redirecionamento em 8 s para `datavix.app`) mais o mesmo service worker de limpeza. **Projetos salvos nesse endereço deixam de abrir pelo app** (o navegador separa os dados por endereço); foi a escolha feita.

## Testes (todos verdes na última rodada)

| Comando | O que confere |
|---|---|
| `node test/seo-check.mjs` | 725 verificações em 20 páginas (inclui os clipes: iframe preguiçoso, documento com CSP própria, MP4 e pôster): título, descrição, canonical, hreflang recíproco, OG/Twitter (inclui o tamanho real do PNG), JSON-LD, títulos, links internos, imagens, CSP com o hash certo, peso, contraste AA, sitemap, robots, llms, noindex do app. Foi testado "quebrando" o site de 8 jeitos (canonical sumido, hreflang errado, h1 duplicado, JSON-LD inválido, GPTBot bloqueado, lastmod no futuro, script injetado, alt vazio) e pegou todos. |
| `node test/seo-render.mjs` | Chrome: 20 páginas sem rolagem lateral em 320/390/768/1280 px, imagens e fontes carregadas, h1 na primeira tela, sem erro de console nem violação de CSP; tema escuro e claro. |
| `node test/hostinger-check.mjs` | Apache local com os `.htaccess` + Chrome: 64 verificações (cabeçalhos por tipo de arquivo, clipes em MP4 com `Range`, redirecionamentos, 404, compressão, cache, landing sem service worker, app com service worker em `/app/`). |
| `node test/migration-sw.mjs` | O site antigo de verdade (commit c90b28a) trocado pelo novo: 24 verificações. |
| `node test/pwa-update.mjs` | Primeira visita sem recarregar e atualização do app (9). |
| `node test/perf-probe.mjs dist / 9` | Slow 4G, CPU 4× mais lenta: FCP, LCP, CLS, TBT, bytes. |
| `node test/hostinger-check.mjs --url=https://datavix.app` | O site no ar (só leitura). Rodar logo depois de publicar. |

## Como manter

- **Textos**: `site/content-pt.mjs` e `site/content-en.mjs` (as duas línguas têm de ter as mesmas páginas, o build avisa se faltar). Links internos: `[texto](page:id)`. Ao mudar o conteúdo de uma página, **atualize o `updated` dela** (vira `lastmod` no sitemap, `dateModified` nos dados estruturados e a data na página). Não mude a data sem mudar o conteúdo.
- **Gráficos, modelos e "precisa de…"** vêm do app: ao mudar o produto, o site acompanha no próximo build. Os números "30" e "13" no texto são fixos: confira ao mudar o catálogo (o `seo-check` exige 20 páginas, não confere esses números).
- **Imagens**: `node scripts/make-sample.mjs` (planilhas fictícias), `node scripts/make-shots.mjs` (capturas do app, precisa de `node build.mjs` e `node test/server.mjs`), `node scripts/make-og.mjs` (cartões 1200×630), `node scripts/make-favicon.mjs`. Refazer quando a interface mudar muito.
- **Variáveis do GitHub** (Settings > Secrets and variables > Actions > Variables), todas opcionais: `DATAVIX_GSC_TOKEN` (verificação do Google Search Console), `DATAVIX_BING_TOKEN`, `DATAVIX_SAMEAS` (perfis oficiais separados por vírgula, entram em `sameAs`), `DATAVIX_CONTACT_EMAIL` (política de privacidade e dados estruturados), `DATAVIX_INDEXNOW_KEY` (grava o arquivo-chave do IndexNow na raiz; depois de publicar, `node scripts/indexnow.mjs https://datavix.app CHAVE --send` avisa o Bing das mudanças; sem `--send` só mostra o que enviaria).
- Nova página: acrescente nas duas línguas, rode `node build.mjs` e os testes; o sitemap, o `llms.txt` e o rodapé se atualizam sozinhos (o rodapé lista as páginas em `ui.footer.cols`).

## O que só você pode fazer (fora do código)

Em ordem de retorno:

1. **Google Search Console** (grátis): adicione `datavix.app` como propriedade de domínio (verificação por registro TXT no DNS, no hPanel) ou por prefixo de URL com a meta tag (crie a variável `DATAVIX_GSC_TOKEN` e eu publico). Envie `https://datavix.app/sitemap.xml`. Use "Inspeção de URL" em `/` e em `/en/` e confirme que o Googlebot consegue acessar (a CDN da Hostinger bloqueou, para o meu IP, robôs com User-Agent falso; o Googlebot de verdade é verificado por DNS reverso e deve passar, mas só o Search Console confirma). Depois acompanhe "Páginas" (indexação) e "Desempenho" (buscas e cliques).
2. **Bing Webmaster Tools** (grátis): importe do Search Console. O ChatGPT com busca usa o índice do Bing, então estar indexado lá importa para respostas de IA. Opcional: IndexNow (o Bing e outros ficam sabendo de cada mudança na hora; o Google não participa).
3. **Links de outros sites** (o que mais pesa na posição e o que o código não faz): preencha a descrição, o site e os tópicos do repositório no GitHub; publique o produto em diretórios (AlternativeTo, Product Hunt, listas de ferramentas de dataviz); compartilhe o vídeo gerado pelo próprio Datavix no LinkedIn e no Instagram com o link; escreva ou ceda um tutorial para comunidades de dados e Excel em português. Cada menção com link para `datavix.app` ajuda.
4. **Perfis oficiais** (LinkedIn, Instagram, YouTube, X): crie os que for usar e me passe os endereços, que entram em `sameAs` e ajudam os buscadores e as IAs a reconhecer "Datavix" como uma entidade.
5. **E-mail de contato** (por exemplo `contato@datavix.app`, criado no hPanel): defina `DATAVIX_CONTACT_EMAIL`. Aparece na política de privacidade e nos dados estruturados; hoje a política manda abrir uma conversa pública no GitHub, o que é fraco como contato.
6. **Conferir as prévias de compartilhamento** depois de publicar: cole a URL em uma conversa de WhatsApp, em um post do LinkedIn e do Facebook (o depurador do Facebook e o Post Inspector do LinkedIn forçam a atualização do cache). Os cartões têm nome fixo (`/og/…png`); se trocar a imagem, as redes podem guardar a antiga por dias.
7. **Conteúdo novo, de vez em quando**: 1 a 2 páginas por mês respondendo perguntas reais (ideias: "como fazer um gráfico de funil a partir do Excel", "mapa de bolhas por estado no Brasil", "como apresentar dados de vendas para a diretoria", "storytelling com dados: exemplos"). Cada uma com uma imagem do produto e o link para o app.
8. **Avaliações**: não há nota nem depoimento no site e não vamos inventar. Quando houver avaliações reais (de usuários que concordarem em ser citados), dá para publicá-las com dados estruturados.

## Limites e riscos, ditos com franqueza

- **Posição no Google não é garantida.** O site novo precisa ser rastreado, indexado e ganhar confiança; isso leva de dias a meses. O termo "Datavix" (a marca) tende a ranquear primeiro; termos genéricos ("planilha em gráfico animado", "storytelling com dados") têm concorrentes fortes e dependem de links e de conteúdo ao longo do tempo.
- **FAQ rich results:** desde 2023 o Google só mostra o rich result de perguntas para sites de governo e de saúde. O `FAQPage` fica porque descreve bem o conteúdo para máquinas, não porque vai aparecer com estrelas ou acordeão nos resultados.
- **`llms.txt`:** é uma convenção; nenhuma grande empresa de IA confirmou usá-lo para responder. Está lá porque custa nada e é legível por agentes. O que realmente conta para IAs é o HTML estático e claro, que agora existe, e o rastreamento liberado.
- **Robôs de IA liberados, inclusive os de treinamento** (GPTBot, ClaudeBot, Google-Extended, CCBot), como pedido ("todas as IAs"). Para bloquear só o treinamento e manter a busca, troque `Allow: /` por `Disallow: /` nos grupos desses robôs em `site/generate.mjs` (lista `AI_BOTS`).
- **CDN da Hostinger**: mostrou uma tela "Checking your browser" a Chrome automatizado e bloqueou User-Agents falsos de buscadores. Para pessoas e para o Googlebot verificado não deve atrapalhar, mas é o primeiro ponto a conferir no Search Console (cobertura de páginas com "bloqueada" ou "erro 403").
- **Projetos salvos no endereço antigo** (`caiospot.github.io`) deixam de abrir pelo app. Se isso importar para alguém, dá para manter uma cópia do app antigo numa subpasta de lá; não foi feito.
- **Imagens do produto**: são capturas reais com dados fictícios gerados por `scripts/make-sample.mjs`. Se a interface mudar, refaça.

## Voltar atrás

A publicação é um push (nada de ação manual na Hostinger). Para voltar ao app na raiz, reverta o commit e o `hostinger.yml` refaz a branch `hostinger`; quem já recebeu o service worker de limpeza só vê uma landing a mais antes de abrir `/app/`.
