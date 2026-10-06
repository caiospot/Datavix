# Gate 9: Leque de barras (Fase B, gráfico 3 de 5)

Casca de `src/charts.js`. Arquivos: `src/fan.js` (dados, motor `FanEngine`, interface) e textos em `src/i18n-charts.js`.

## O gráfico
- Um eixo vertical estreito à direita; cada item é uma barra que sai dele e se abre em leque (**triângulo áureo**: ângulo de 36° no eixo, então a corda do leque mede 1/φ do raio; o maior que cabe no palco, cerca de 2× o tamanho da primeira versão; o comprimento é igual em todos os ângulos, então a proporção entre valores se mantém). Comprimento = valor (linear, a partir do eixo), cor = categoria. Arcos pontilhados com a escala real. Até 1500 itens (os maiores, se houver mais; a nota avisa).
- Hover numa barra (ou no eixo): destaca a barra, apaga as outras (a mesma categoria menos), mostra o nome e o valor no eixo e o valor na ponta. Clique fixa o cartão.
- Painel: categorias (filtro), ordenar (ordem da planilha — padrão —, maior valor, categoria, nome), "mostrar os N maiores", valor por categoria, ranking.
- Cartão: categoria, posição geral e dentro da categoria, participação (casa decimal quando < 10%), contra a média, linhas somadas, e as colunas da planilha (curtas à esquerda, textos longos ao lado). Visão geral: total/média, maior, menor, média, mediana.
- Itens: coluna de identificação (pedido, produto…) agregada por soma, média ou contagem; sem coluna, cada linha é um item. Categoria: 2 a 12 valores (resto vira "Outros").
- Animação: o leque se abre (ângulo e comprimento) em onda de cima para baixo; filtros e ordenação movem em onda; movimento reduzido cai no estado final.
- Apresentação: uma categoria por vez (até 9), os 10% maiores e o maior destacado. Tutorial de 4 etapas (`dv-fan-tutorial`), PNG com estado, HTML offline, PT/EN, insights (maior, destoa, dominante) com "ver cálculo".
- Sugestão: lidera (0,93) só quando os itens são identificados por uma coluna e há 150 ou mais; linhas anônimas ficam como opção (0,5). Os Raios radiais cedem (0,5) quando há mais de 150 entidades.

## Verificado (Chrome headless)
- `dados-teste/pedidos.csv` (900 pedidos, 8 categorias, comentário longo, inventado): sugestão = Leque de barras.
- Hover, fixar, hover pelo eixo, filtro por categoria, ordenar, "N maiores", claro/escuro; apresentação completa (14 passos); PNG com estado; HTML de `file://` sem recurso externo (1,4 MB com 900 itens e textos); mapeamento (média refaz); salvar e reabrir; tutorial.
- Regressão: 5 histórias × todos os gráficos; 7 arquivos de teste geram peça sem erro; árvore radial/raios/rio continuam primeiro onde antes.

## Limites
- Com dados muito assimétricos e ordenados por valor, o leque vira uma cunha fina (é a forma real dos dados); a ordem da planilha mostra melhor.
- Com 1000+ barras o traço é fino e só o destacado fica legível; use filtros e o cartão.
- Nomes no eixo: só alguns (decimados); o do item sob o mouse aparece sempre.

## Ajuste 2: perspectiva do "56 dias de comida" (substitui o triângulo áureo)
Referência enviada pelo usuário: eixo = coluna alta à direita; cada item sai dele numa diagonal que converge para o centro (abertura de ~90°) e vira uma barra horizontal para a esquerda.
- Geometria: eixo com a altura toda do palco; diagonal do eixo até a "raiz" (compressão vertical `kc` calculada para dar 45° de cada lado); da raiz, barra horizontal com comprimento = valor (mesma escala para todas, então a proporção entre valores se mantém).
- Proporção áurea mantida na largura: 38,2% para as diagonais e 61,8% para o comprimento máximo das barras.
- Escala: linhas verticais pontilhadas a partir da raiz, com valores reais no alto.
- Animação de abertura: começa como barras horizontais saindo do eixo (sem compressão) e a perspectiva se fecha, com as barras crescendo em onda de cima para baixo.
- Hover/pick: diagonal e barra respondem; nome e valor no eixo, valor na ponta; clique fixa. PNG, HTML, apresentação e tutorial seguem funcionando (testados).
