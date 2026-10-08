# Gate 30: tela do editor, título do tema e vídeo para celular

Pedido do usuário (out/2026): vídeo vertical aproveitando a tela, título do tema no primeiro slide (campo "Digite o título aqui"), animar os gráficos no vídeo, gráficos grandes no vídeo, "Apresentar" e "? Como usar" em todos os gráficos, fundo do gráfico com o mesmo respiro embaixo.

## Etapa 1: botões em todos os gráficos e fundo mais alto (feita)
- `src/runtime.js` (`createChartHost`): barra `.orgtools.row` acima do gráfico para os tipos que não são de canvas (barras, barras horizontais, empilhado 100%, treemap, corrida, linha, área, dispersão, bolhas, calendário e indicadores). Os gráficos de canvas seguem com a barra dentro do palco; a barra do host some quando o tipo é de canvas.
- Tutorial "? Como usar" próprio: `tut_vz_*` (Vizzu, 4 passos), `tut_cal_*` (calendário), `tut_kpi_*` (indicadores); textos em `src/i18n-charts.js`. Não abre sozinho: só ao clicar (chave `dv-vz-tutorial` reservada).
- "Apresentar" aciona o mesmo botão do painel; funciona também no HTML exportado.
- `src/piece.css`: `.piece` com 36 px nos quatro lados (antes 32/36/26) e altura mínima até o fim da área visível (`max(560px, 100dvh - 113px)`).
- Teste: `test/cdp.mjs` com roteiro que percorre os 11 tipos (botões visíveis, tour abre e fecha, apresentação inicia), regress (30 gráficos × 5 histórias), exportado em `file://`.
