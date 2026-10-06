# PWA e NPS (itens 2 e 3 do plano pós-Fase B)

## PWA (app instalável, abre offline)
**O que foi feito**
- `pwa/manifest.webmanifest`, `pwa/sw.js` (service worker), `pwa/icons/` (192, 512, maskable, apple-touch; gerados por `node scripts/make-icons.mjs`, a árvore radial em lima).
- `src/pwa.js`: registra o service worker e injeta o manifesto **só em http(s)/localhost** (abrir `index.html` direto continua funcionando como antes, sem instalar). Botão **⤓ Instalar app** no cabeçalho quando o navegador permite; aviso "Há uma versão nova" com **Atualizar** (pergunta se quer salvar antes).
- Service worker: guarda o app (um HTML com tudo embutido); abre na hora, mesmo sem internet. Só mexe em pedidos do mesmo domínio (o envio do NPS passa direto). A atualização espera a pessoa clicar em Atualizar.
- `node build.mjs` agora gera também **`dist/`** pronta para publicar: `index.html`, `sw.js` (com o id do build), `manifest.webmanifest`, `icons/`, `_headers` (CSP, no-referrer, cache) e `.nojekyll`.
- CSP do app: acrescentados `worker-src 'self'`, `manifest-src 'self'`, `img-src 'self'`. Os hosts do Google só entram quando o NPS está configurado. O HTML exportado continua sem rede.

**Como publicar (qualquer hospedagem estática, precisa de https)**
- **Netlify:** app.netlify.com → Add new site → Deploy manually → arraste a pasta `dist/`.
- **Cloudflare Pages:** Workers & Pages → Create → Upload assets → envie a pasta `dist/`.
- **GitHub Pages:** publique o conteúdo de `dist/` (o `.nojekyll` já está lá). O GitHub Pages ignora `_headers`; a CSP continua valendo pela meta tag do HTML.
- Domínio próprio: aponte o domínio na hospedagem. A cada nova versão, publique `dist/` de novo: quem já instalou recebe o aviso de atualização.

**Como instalar**
- **Mac e Windows, Chrome ou Edge:** ícone de instalar na barra de endereço, ou o botão "Instalar app" do cabeçalho. Sai um app com ícone próprio (Dock/Menu Iniciar/Launchpad).
- **Mac, Safari 17+:** Arquivo → Adicionar ao Dock.
- Não é um arquivo `.dmg`/`.exe`. Para esses (sem depender de hospedagem, para clientes com instalação controlada) o plano continua sendo o item 4 (Electron assinado).

## NPS
Veja `nps/LEIA-ME.md` (instalação do Google Apps Script, o que é enviado, quando pergunta, limites).
- App: `src/nps.js` (cartão de NPS 0–10, "o gráfico serviu?", "o que é enviado?", fila offline em IndexedDB, regras de frequência). Ganchos: depois de gerar (`runGeneration`), depois de exportar (`doExport`), ao sair da apresentação (`startPresentation({onEnd})`), botão "Enviar feedback" no editor e no rodapé da landing.
- Servidor: `nps/apps-script/Code.gs` (grava na planilha, valida token/formato, limite por código, sem duplicados, anti-fórmula; `setup()` cria as abas NPS e Resumo).
- Build: `DATAVIX_NPS_URL=... DATAVIX_NPS_TOKEN=... node build.mjs`. Sem as variáveis, a pesquisa fica desligada e a CSP não abre nenhum host.
- Privacidade: a landing ganha o item de FAQ "O Datavix envia algum dado?" (só com o NPS ligado), e a janela "O que é enviado?" mostra a lista exata e o código anônimo.

## Verificado
- **PWA** (`node test/pwa.mjs`, Chrome headless): manifesto, service worker ativo, cache com 7 itens, página controlada, e **abertura offline com o servidor desligado**; o botão de instalar aparece (a página é instalável).
- **NPS** (`test/nps-run.js`, servidor de teste que imita o Apps Script): cartão após exportar; passo 2 com pergunta pela faixa (promotor/detrator); comentário + e-mail com consentimento; envio conferido linha a linha (sem nome de arquivo, colunas, valores nem título); regra "uma por sessão"; **fila offline** (URL fora do ar → fica na fila → volta → entrega); 👍 e 👎 com motivo; janela "O que é enviado?"; cartão ao sair da apresentação.
- **Apps Script** (`doPost` rodado com simulações do Google): grava, ignora repetido, recusa token errado, formato errado, nota fora de 0–10, mensagem grande, excesso por código; neutraliza `=HYPERLINK(...)`.
- Regressão completa (5 histórias × todos os gráficos) sem erro.

## Limites
- Não consegui publicar nem implantar nada: não tenho acesso à sua hospedagem nem ao seu Google. As instruções acima levam cerca de 10 minutos cada.
- O token do NPS é público (anti-ruído, não segredo). O envio `no-cors` não confirma a entrega; por isso a fila local.
- Safari/iOS instalam o app por "Adicionar à Tela de Início", sem o botão do cabeçalho.
