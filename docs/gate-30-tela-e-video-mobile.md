# Gate 30: tela do editor, título do tema e vídeo para celular

Pedido do usuário (out/2026): vídeo vertical aproveitando a tela, título do tema no primeiro slide (campo "Digite o título aqui"), animar os gráficos no vídeo, gráficos grandes no vídeo, "Apresentar" e "? Como usar" em todos os gráficos, fundo do gráfico com o mesmo respiro embaixo.

## Etapa 1: botões em todos os gráficos e fundo mais alto (feita)
- `src/runtime.js` (`createChartHost`): barra `.orgtools.row` acima do gráfico para os tipos que não são de canvas (barras, barras horizontais, empilhado 100%, treemap, corrida, linha, área, dispersão, bolhas, calendário e indicadores). Os gráficos de canvas seguem com a barra dentro do palco; a barra do host some quando o tipo é de canvas.
- Tutorial "? Como usar" próprio: `tut_vz_*` (Vizzu, 4 passos), `tut_cal_*` (calendário), `tut_kpi_*` (indicadores); textos em `src/i18n-charts.js`. Não abre sozinho: só ao clicar (chave `dv-vz-tutorial` reservada).
- "Apresentar" aciona o mesmo botão do painel; funciona também no HTML exportado.
- `src/piece.css`: `.piece` com 36 px nos quatro lados (antes 32/36/26) e altura mínima até o fim da área visível (`max(560px, 100dvh - 113px)`).
- Teste: `test/cdp.mjs` com roteiro que percorre os 11 tipos (botões visíveis, tour abre e fecha, apresentação inicia), regress (30 gráficos × 5 histórias), exportado em `file://`.

## Etapa 2: título do tema escrito pela pessoa (feita)
- A peça nasce com `title: ''` e `autoTitle` (o texto gerado vira só sugestão). O título do editor mostra o placeholder "Digite o título aqui" (CSS `h1[contenteditable]:empty::before`, nunca aparece na apresentação, exportação ou vídeo).
- `titleOf(P)` (piece.js) devolve o digitado ou, na falta, o sugerido; usado em aria-labels, nome de arquivo, aba do HTML exportado, nome do projeto salvo e vídeo.
- Antes de **apresentar**, **exportar** (HTML, PNG, etapas) ou **gerar vídeo**, se o título estiver vazio, abre o aviso "Qual é o título da apresentação?" com o campo (placeholder) e as opções Continuar / Usar o título sugerido / Cancelar (`ensureTitle` em ui.js).
- Roteiro em 3 perguntas: campo "Título da apresentação (o tema)" na primeira tela (com chip de sugestão) e campo "Título do slide" em cada cartão. O título do cartão substitui o rótulo pequeno do slide (ex.: "O LÍDER") na apresentação e no vídeo; vazio mantém o rótulo padrão. A tese não vira mais o título da apresentação.
- Build de teste (`test/dev.html`) preenche o título sugerido para os testes antigos seguirem iguais; `?asktitle` liga o comportamento real. Teste novo: `test/title-run.js` (abrir com `?asktitle`).
