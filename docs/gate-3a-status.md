# Datavix · Gate 3a (status em 2026-10-04)

Exportação, apresentação e interações. Build: `node build.mjs` (gera `index.html` 2,2 MB e `test/dev.html`).

## Entregue
- **HTML interativo autossuficiente** (botão Exportar): 748 KB com o exemplo, Vizzu + WASM + fontes embutidos, CSP `default-src 'none'`. Testado servido isolado: 0 recursos externos, console limpo. Preserva paleta, fundo, tipo e ordenação do editor.
- **Interações na peça** (editor e HTML exportado, mesmo código em `src/runtime.js`): tooltip, clique em barra/área/bolha ou chip para isolar série ou categoria, "Limpar", zoom em séries temporais (dois controles de período), ordenação (maior valor, A–Z, original), troca de tipo de gráfico com morph (no HTML exportado).
- **Modo apresentação**: tela cheia, setas/espaço avançam, Esc sai. Etapas: visão geral, uma por série (até 8), recortes (terços do período ou Top 3/Top 5), um por insight. Também funciona no HTML exportado.
- **PNG** 1920×1080 e 3840×2160, e **ZIP com um PNG por etapa** (para slides), com o gráfico renderizado em resolução própria. Verificado: dimensões corretas, ZIP íntegro (7 arquivos), imagem nítida.
- **Fontes embutidas** (Geist, Geist Mono, Doto): o app não faz mais nenhuma chamada ao Google Fonts.

## Descoberto no teste
- `</script>` dentro do JS embutido fechava o script do app: o build escapa agora.
- Painel de navegador oculto pausa `requestAnimationFrame`: a exportação usa limites de tempo e não trava.

## Não verificado
- `index.html`/export abertos por `file://` (testei por localhost) e Fullscreen API real (o painel de teste não entra em tela cheia).
- Safari e Firefox. Só Chromium.
- Apresentar com setas apertadas muito rápido enfileira as animações (estado final correto).

## Falta (gate 3b)
Gráficos: KPI cards, treemap, heatmap de calendário, bar chart race. Editor: rótulos, legenda, grade e anotações editáveis; 3 pares tipográficos; projetos recentes (IndexedDB); tooltip estilizado.
