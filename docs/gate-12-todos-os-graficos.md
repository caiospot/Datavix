# Gate 12: todos os gráficos sempre visíveis (item 1 do plano pós-Fase B)

Plano acordado: 1) todos os gráficos sempre visíveis; 2) PWA hospedado; 3) NPS + Google Sheets (Apps Script); 4) instalador Electron assinado, se a distribuição pedir.

## O que mudou
- Painel "Gráfico" lista sempre os 17 tipos (`ALL_CHARTS` em `src/data.js`) em 3 grupos: **Recomendados** (sugerido + 2 alternativas), **Também disponíveis** e **Precisam de outros dados**. Os do terceiro grupo aparecem pontilhados, com o motivo ("Precisa de uma coluna de data e um valor", etc., chaves `why_*` em `src/i18n-charts.js`) e o rótulo "Ajustar dados".
- Clicar num gráfico indisponível (`pickChart` em `src/ui.js`):
  - gráficos nativos (linha, área, corrida, calendário, barras, empilhado 100%, treemap, dispersão, bolhas): tenta um mapeamento alternativo da planilha (tempo, comparação, composição, relação, calendário). Se os dados comportam, refaz a peça mantendo estilo e textos, com aviso "Mapeamento ajustado para X" e **Desfazer**; se não, mostra o motivo;
  - gráficos de canvas (árvore, raios, rio, leque, cordilheira, funil): abre "Editar mapeamento" já no bloco daquele gráfico (abre a seção, rola e pisca) e mostra o motivo;
  - projeto reaberto sem a planilha: avisa que é preciso subir a planilha.
- Landing: abaixo dos 6 cartões, as pílulas dos outros 11 gráficos ("Também: …").

## Verificado
- `pedidos.csv`: 17 botões, 8 indisponíveis com motivo; calendário refaz a peça (aviso + desfazer) e a lista muda (hbars/treemap passam a precisar de outros dados); dispersão informa que faltam duas colunas de número; funil abre o mapeamento no bloco do funil. Regressão (5 histórias × todos os gráficos) e testes de mapeamento sem erro.
