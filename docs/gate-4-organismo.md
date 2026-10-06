# Datavix · Gate 4, árvore radial ("organismo") (status em 2026-10-05)

Motivo: o feedback do usuário, com 3 prints de projetos.ilumeo.com.br, mostrou que o produto deve funcionar como aquele site: **um único gráfico animado, radial, com todos os dados**, e não uma lista de gráficos tradicionais. A árvore radial passou a ser o visual principal (primeira opção sempre que a planilha tem período + entidades). Desenho e código próprios, sem copiar marca nem assets.

## Como a planilha vira o organismo
raiz (centro) > **período** (ramos, com rótulo girado) > **entidade** (nós brancos no anel do meio) > **registro** (bolhas no anel externo). Cor = categoria. Tamanho = valor (referência no percentil 97, para um outlier não achatar o resto).
- Período: coluna de data (ano, trimestre, mês, semana ou dia, o que der 3 a 24 ramos) ou categoria.
- Entidade: categoria com 4 a 80 valores (top 48 + "Outros").
- Cor: categoria com 2 a 12 valores (top 12 + "Outros").
- Tamanho: medida (soma) ou contagem de linhas.
- Uma bolha por linha até 3.000 linhas; acima disso, uma por (período, entidade, categoria). A tela diz qual dos dois ocorreu.
- Sugestão automática; tudo editável na tela de mapeamento (bloco "Árvore radial" vem primeiro; os outros gráficos ficam recolhidos).

## Interações (editor, apresentação e HTML exportado)
- Passar o mouse numa bolha: destaca o caminho (bolha, entidade, período, raiz) e mostra tooltip (entidade, categoria, período, valor, nº de linhas).
- Clicar num período ou bolha: foca o ano (o ramo se abre em leque, os demais comprimem e apagam). Clicar de novo limpa.
- Legenda por categoria: filtra (primeiro clique isola; demais somam); passar o mouse destaca. "Selecionar tudo".
- Intervalo de períodos (dois controles).
- Mini-gráfico de valor por período (com variação contra o período anterior) e ranking das 10 maiores entidades (passar o mouse destaca no gráfico).
- Animação: crescimento a partir do centro (raiz, períodos, entidades, bolhas em etapas) e reorganização suave a cada filtro. `prefers-reduced-motion` respeitado.
- Apresentação: uma etapa por período (foco), depois os insights. PNG: quadro final com o fundo da peça.

## Verificado (Chrome headless real, inclusive `file://` com CSP estrita)
- Planilha de 50 mil linhas: 3 períodos, 14 UFs, 4 categorias, 168 bolhas; soma das bolhas = soma dos períodos = soma das entidades = soma independente (R$ 115.670.246,76).
- Exemplo com 2.600 bolhas (uma por linha): 3,9 ms por quadro de desenho.
- Hover, foco em período, filtro de categoria; HTML exportado (915 KB, 0 recursos externos, apresentação em 6 etapas); PNG com o fundo certo.
- Regressão: todos os tipos de gráfico nas 5 histórias, sem erro. Celular (390 px): gráfico no topo, painel embaixo.

## Bugs que o teste pegou
`.vzbox canvas` esticava o mini-gráfico por cima da peça (riscos brancos); tooltip vazio visível (`[hidden]` vencido por `display:grid`); PNG com a área do gráfico branca (`clearRect`); nota de rodapé do tipo errado; rótulos de período sobrepostos em telas pequenas.

## Falta / limites
- Sem tutorial de abertura (a referência tem um passo a passo ao abrir).
- Ranking só destaca (não filtra) a entidade.
- Com poucos períodos (3) a árvore é mais simples que a da referência (13 anos); com muitos registros fica densa de propósito.
- Precisa de uma coluna de período e uma de entidade; sem elas o tipo some e os outros gráficos continuam.
