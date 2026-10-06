# Gate 10: Cordilheira isométrica (Fase B, gráfico 4 de 5)

Casca de `src/charts.js`. Arquivos: `src/ridge.js` (dados, motor `RidgeEngine`, interface), textos em `src/i18n-charts.js`.

## O gráfico
- Projeção isométrica (30°) sobre um piso com grade: o tempo corre ao longo de cada cadeia, a altura é o valor (mesma escala para todas), as entidades ficam em fileiras. Desenho do fundo para a frente com preenchimento opaco (a cadeia da frente oculta o que está atrás), linha de topo mais clara, nomes à esquerda e períodos na borda da frente.
- Comparação: uma dimensão com exatamente 2 valores vira duas cadeias lado a lado por entidade, em duas cores da paleta; legenda liga/desliga cada lado.
- Hover: destaca a cadeia, apaga as outras, marca vertical pontilhada no período sob o mouse com o valor de cada lado; o cartão mostra período, valor de cada lado, diferença percentual, totais, posição, pico, variação do primeiro ao último período e média. Clique fixa; o nome da cadeia também é clicável.
- Painel: intervalo de períodos (zoom contínuo: a cordilheira se reescala animada), lado da comparação, ordenar (maior total, maior pico, nome, ordem da planilha), "mostrar as N maiores", ranking com os dois lados empilhados. Lista com todas as cadeias.
- Cálculo: soma, média ou contagem. Com média, o "total" vira média no intervalo (rótulos e cartão mudam); com 2 lados, a média dos lados ativos. Até 24 entidades (as maiores; a nota avisa) e até 48 períodos. Valores negativos não aparecem (nota avisa).
- Insights: pico, salto, queda, tendência e dominante sobre os períodos/entidades, mais um insight próprio de comparação (soma de cada lado e diferença percentual, com "ver cálculo").
- Animação: as cadeias sobem em onda do fundo para a frente; filtros, ordenação e zoom movem em onda; movimento reduzido cai no estado final.
- Apresentação: uma cadeia por vez (até 6), cada lado da comparação, primeira e segunda metade do período. Tutorial de 4 etapas (`dv-ridge-tutorial`), PNG com estado, HTML offline, PT/EN.
- Sugestão: período (data) + entidade (3 a 60 valores) + valor + dimensão de 2 valores. Lidera (0,94) nas histórias tempo/comparação com a comparação de 2 lados; sem comparação fica como opção (0,5).

## Verificado (Chrome headless)
- `dados-teste/lojas.csv` (720 linhas, 10 lojas × B2C/B2B, 2022–2024, inventado): sugestão = Cordilheira; totais B2C 64,9 mi × B2B 42,6 mi conferem com o insight.
- Hover com marca vertical e cartão, filtro de lado, ordenação, claro e escuro; apresentação (11 passos); PNG com estado (um lado, intervalo, ordem, top 6); HTML de `file://` sem recurso externo; mapeamento (média refaz e rotula certo); salvar e reabrir; tutorial.
- Regressão: 5 histórias × todos os gráficos; 9 arquivos de teste geram peça sem erro.

## Limites
- Facetas empilhadas (planejadas como opcionais) não foram feitas: as cadeias ficam em uma única grade; filtros por "N maiores" e ordenação cobrem o recorte.
- Cadeias da frente altas ocultam parte das de trás (é a natureza da projeção); use hover, ordenação, "N maiores" ou o intervalo.
- Só aceita período em coluna de data.
