# Gate 7: casca dos gráficos de canvas + Raios radiais (Fase B, gráfico 1 de 5)

## Arquitetura (vale para os próximos 4 gráficos)
- `src/charts.js`: registro `regChart({id, suggest, build, fit, insights, fields, names, summary, render, steps, drawStatic, note})`, tutorial compartilhado (`createTour`) e a montagem `csMount` (palco, painel da coluna 1, cartão e lista da coluna 2, mouse, fixar, Esc, apresentação). Cada gráfico entrega só o motor (`resize/snap/draw/pick/setHover/setState/getState/kick/stop`) e os modelos de cartão/lista.
- `src/rays.js`: dados (`raysSuggest`, `raysBuild`, `raysFit`, `raysInsights`), motor `RaysEngine` e interface `renderRays`.
- `src/i18n-charts.js`: textos PT/EN dos gráficos novos.
- Mapeamento: `mapping.cs[id]` (colunas por papel + cálculo soma/média/contagem). `built.cs[id]` guarda os dados do gráfico (vai no HTML exportado e nos projetos salvos). O bloco "Mais gráficos de dados" do mapeamento é gerado a partir de `reg.fields`.
- Sugestão pelo formato dos dados: `fit()` de cada gráfico (0 a 1). Quem passa de 0,9 vai na frente das opções nativas; os demais entram depois delas. Raios radiais: 0,95 quando há ~1 linha por entidade; 0,6 até 3 linhas; 0,45 acima disso (a árvore radial segue na frente).
- A árvore radial passou a usar o mesmo tutorial compartilhado. O estado de apresentação agora é `{cs: …}` para todos.

## Raios radiais
- Um raio por entidade; comprimento = valor a partir do círculo central (proporcional, escala nos anéis pontilhados, com valores reais); cor = grupo; degradê que some no centro.
- Entidade: coluna de categoria, geo ou texto curto (entidades únicas viram "texto" no leitor, por isso `csIsEntCol` aceita texto). Grupo: categoria de 2 a 12 valores em que ≥85% das entidades pertencem a um só grupo. Até 150 raios (os maiores; a nota diz "Os N maiores de M").
- Cálculo: soma, média ou contagem por entidade (média sugerida para colunas de %, nota, idade, taxa etc.). Valores negativos aparecem em módulo (a nota avisa; o cartão mostra o valor real).
- Rótulos: na ponta quando há espaço entre vizinhos; senão alinhados no anel externo com guia pontilhada. Nome do grupo em arco, de pé.
- Interação: passar o mouse destaca o raio (e o grupo, mais fraco) e apaga o resto; valor sobre o raio; clique fixa o cartão. Painel: grupos (filtro), ordenar (valor/nome/ordem da planilha), "mostrar os N maiores", valor por grupo, ranking.
- Animação: raios saem do centro em onda (2,4 s); filtros e ordenação movem em onda; `prefers-reduced-motion` cai direto no estado final.
- Cartão: grupo, posição (Nº de N), participação (soma/contagem), contra a média, linhas somadas (se >1) e as colunas da planilha (curtas à esquerda, textos longos ao lado). Visão geral: total/média, maior, menor, média, mediana.
- Insights: peak/low/dominant/outlier calculados sobre as entidades e grupos do gráfico, com "ver cálculo".
- Apresentação: visão geral, um passo por grupo (até 9), "os 10 maiores", destaque do maior. PNG e ZIP por etapa respeitam o estado do passo.
- Tutorial de 4 etapas (`dv-rays-tutorial`), HTML exportado offline.

## Verificado (Chrome headless)
- `unidades.csv` (96 unidades, 6 regiões, dados inventados; `dados-teste/gerar-unidades.mjs`): sugestão = Raios radiais; totais conferem com o CSV (312,2 mi; Sudeste 120,2 mi; Nordeste 55,1 mi…).
- Hover, fixar, lista com rolagem até o item, filtro por grupo (96 → 22 raios, cartão fixo de item oculto fecha), claro e escuro, 1700 px sem painel (3 colunas), 390 px (empilhado).
- Mapeamento: bloco aparece, trocar cálculo para média refaz o gráfico (3,3 mi, "MÉDIA · FATURAMENTO"), salvar e reabrir o projeto.
- Apresentação (14 passos), PNG com estado (grupos + top 40 + nome), HTML exportado de `file://` (sem recursos externos, hover e fixar funcionam).
- Regressão: 5 histórias × todos os gráficos sem erro no console; mm, nav, pres, card-all, org-seq (tutorial da árvore já na casca nova); os 5 arquivos de teste geram peça sem erro.

## Limites conhecidos
- Em tela estreita o painel da coluna 1 (filtros, rankings) vem antes do gráfico; a ordem narrow foi mantida como na árvore radial.
- Mais de 150 entidades: só os 150 maiores.
- Com 300+ rótulos o texto é decimado (aparece o do raio sob o mouse).
