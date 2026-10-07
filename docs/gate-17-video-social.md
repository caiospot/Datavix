# Gate 17 · Vídeo para redes sociais (MP4)

Quinto e último gate do plano "mobile → painel → apresentação → vídeo social".

## O que mudou
- **Botão "Gerar vídeo (MP4)"** na aba Exportar do painel. A janela pergunta o formato, avisa que o vídeo mostra os números e textos da peça e que a aba deve ficar aberta, grava com prévia ao vivo e barra de progresso, e entrega o vídeo com **Baixar**, **Compartilhar** (folha de compartilhamento do celular, quando existe) e **Gravar de novo**. Cancelar a qualquer momento restaura tudo.
- **Formatos:** vertical 9:16 (Reels, TikTok, Shorts, Stories) e quadrado 1:1 (feed, LinkedIn), 1080 de largura, 30 quadros por segundo, uns 18 a 23 s, sem áudio, MP4 (H.264).
- **Roteiro do vídeo:** abertura com título e o número principal contando; visão geral; até 2 recortes (ex.: categorias maiores ou Top N); até 2 insights **com o cálculo à vista**; resumo com os insights; fecho de marca com o logotipo DATAVIX, "Tudo vira dado." e o endereço do site. O **logotipo DATAVIX fica centralizado no topo em todo o vídeo** (na cena final ele passa a ser o grande, no centro). Barra de progresso embaixo e brilho de fundo na cor da peça. As margens evitam as áreas cobertas pelas redes (topo e base).
- **Todos os 17 gráficos:** os do Vizzu (barras, linhas, treemap etc.) **animam de verdade** entre os passos numa instância própria fora da tela; os de canvas próprio (Leque, Cordilheira, Rio, Raios, Fluxo, Árvore), o calendário e o KPI usam o mesmo desenho estático do PNG, com revelação e transição suave entre cenas. O KPI tem um desenho em grade 2×2 próprio para o vídeo.
- **Compatibilidade:** o Chrome grava MP4 fragmentado (`moov` + `moof`/`mdat`). Um remuxador próprio (`src/mp4.js`, sem recodificar) converte para um MP4 comum com o índice no início (`ftyp`, `moov`, `mdat`), que as redes e os players aceitam melhor. Sem suporte a MP4 (Firefox), grava WebM e avisa.
- **Privacidade:** nada sai do navegador. A política de privacidade foi atualizada para citar o vídeo.
- **Segurança:** a política de conteúdo ganhou `media-src blob:` (só para tocar o vídeo recém-gerado na própria página).
- Endereço exibido no fecho: `caiospot.github.io/Datavix` por padrão; para outro domínio, defina a variável `DATAVIX_SITE` (Actions → Variables) ou `DATAVIX_SITE=meusite.com node build.mjs`.

## Onde está
`src/video.js` (plano de cenas, composição, gravação, janela), `src/mp4.js` (remuxador), `src/ui.js` (botão e ação `video`), `src/i18n-charts.js` (`vid_*`), `src/styles.css` (bloco "vídeo para redes"), `build.mjs` (CSP e `site`).

## Testado (Chrome 154 headless)
- Gravação de ponta a ponta de barras horizontais (Vizzu), Leque (canvas próprio) e KPI, em vertical e quadrado; arquivos de 1080×1920 e 1080×1080, 18 a 23 s, 2,5 a 4,5 MB, ~57 quadros/s de composição sem travadas.
- Os recortes "Top 3" e "Top 5" animam de verdade (3 e 5 barras); quadros extraídos do vídeo conferidos visualmente (abertura, legendas, cálculo dos insights, resumo, fecho).
- Remuxador: estrutura `ftyp, moov, mdat`, mesma duração e quadros idênticos aos do original; reprodução no navegador.
- Janela pela interface: abrir, trocar formato, gravar, cancelar no meio (resolução e elementos temporários restaurados), gravar, baixar (nome `titulo-9x16.mp4`), gravar de novo, Esc; no celular com toque real.
- Regressão sem erros: onboarding, privacidade, NPS, PWA offline, 5 histórias × todos os gráficos, 10 arquivos, painel, apresentação.
Roteiros: `test/m/video-run.js`, `video-ui.js`, `video-remux.js`, `video-viz.js`, `steps-video.mjs`.

## Limites (honestos)
- **Não testei o envio para Instagram, TikTok, LinkedIn nem YouTube.** O arquivo é um MP4/H.264 padrão, mas só o teste real de upload confirma a aceitação de cada rede.
- A gravação acontece em tempo real: a aba precisa ficar aberta e visível, e em aparelhos fracos podem ocorrer quadros perdidos (a janela avisa).
- Firefox grava WebM (as redes costumam recusar); Chrome, Edge e Safari gravam MP4. Safari/iPhone de verdade continua sem teste (sem Simulator nesta máquina).
- Gráficos de canvas próprio e calendário entram como imagens por cena (com transição), não como animação interna do gráfico.
- Sem áudio, sem GIF e sem 16:9 nesta versão (previstos para uma segunda fase).
