# Gate 36 (motor de história, etapa 5): bateria de planilhas e calibragem

Base: `docs/prompt-narrative-engine.md`. Sem planilhas reais, a calibragem usa uma bateria **sintética** (inventada, determinística) com o que foi plantado em cada planilha. Os limites abaixo são calibração inicial e devem ser revistos com planilhas reais.

## A bateria
`node dados-teste/gerar-bateria.mjs` escreve 16 planilhas em `dados-teste/bateria/` e o `bateria.json` com o que foi plantado: vendas com tendência e líder, vendas planas (nada a dizer), pesquisa NPS com um canal pior, folha com ID numérico e salário assimétrico, campanhas com associação e atípico, saúde com cauda longa e unidade pior, educação com nota e frequência, orçamento público com coluna que é múltiplo da outra, armadilha de identificadores numéricos (CEP, telefone, código), planilha de 12 linhas, 35% de valores faltantes, resultados negativos e zeros, cliente que concentra 55%, formato brasileiro (R$ e dd/mm/aaaa), meses em colunas e texto livre.
`test/m/battery-run.js` carrega cada uma, extrai os achados e confere recall (achou o que existe), precisão (não inventou o que não existe) e se os planos de 2, 5 e 10 slides ficam válidos e determinísticos. Opções: `?only=nome1,nome2`, `?det=1` (papéis das colunas, mapeamento e frases).

## Antes e depois
Primeira rodada: 8 de 16 com falha. Depois da calibragem: 16 de 16, com os testes anteriores (narrativa e planos) passando.

## O que a bateria mostrou e o que mudou
1. **Identificadores**: uma coluna de inteiros consecutivos (20000, 20001...) virava medida e até a métrica principal; CEP de 8 dígitos também. Agora inteiros consecutivos e nomes como CEP, CPF e CNPJ viram identificador (`understand.js`).
2. **Agregação padrão**: nota, percentual e duração eram somados no mapeamento padrão; passam a usar a média quando a coluna é desse tipo (`suggestMappingBase`).
3. **Tendência** só com teste de Mann-Kendall z ≥ 2 sobre os períodos (6 ou mais). Em série plana, um simples +8% por acaso não é mais "crescimento".
4. **Pico, vale, maior salto e maior queda** só quando saem da variação normal (z ≥ 2, com 8 ou mais períodos, e 7 ou mais variações para o salto). Planilha plana deixa de ganhar "o maior valor foi X".
5. **Outras dimensões**: o gráfico mostra uma só; agora cada coluna de categorias (até 5, até 300 grupos) é varrida. Aparecem a maior participação (≥ 40%, 3+ grupos, sem negativos) e o grupo que destoa da média por registro (z ≥ 3 + 0,8·log10(grupos), diferença ≥ 20%, 10+ registros). Isso trouxe "Telefone tem a menor nota", "Sudeste concentra 45%", "Cliente Alfa concentra 55%".
6. **Relação mecânica**: se uma coluna é praticamente múltiplo da outra (a razão varia menos de 8%), não vira associação (executado ≈ 90% do orçado).
7. **Associação** exige |ρ| ≥ 0,4 e |ρ|·√(n−1) ≥ 3,5 (o acaso em poucas linhas gera ρ alto).
8. **Distribuição**: diferença média/mediana mínima caiu de 25% para 15% (salário assimétrico passou a ser reconhecido).
9. **Datas só no dia 1** (jan/25, fev/25...): são meses, mesmo que poucos; antes saíam semanas com buracos e rótulos como "30/12/2024" (tabela, Rio e Cordilheira).
- Novos tipos de evidência: `gapz`; ampliação de `trend` (S e n), `peak` e `low` (sd), `jump` (média e desvio das variações). O validador recalcula a significância e bloqueia o que estiver dentro da variação normal.

## Efeito nos testes existentes (comparação com o commit anterior)
- Primeira sugestão de gráfico, construtor, exportação e regressão: idênticos.
- `story-check`: duas planilhas de teste perdem atos que eram acaso (canais 7→6, lojas 8→6); `facts-run`: o primeiro insight de uma planilha passou de "pico +19%" para a tendência (+25%).

## Limites conhecidos
- Os limiares (z, 15%, 40%, 20%...) vieram de dados sintéticos; calibre com planilhas reais antes de tratá-los como definitivos.
- Colunas de data de admissão ou cadastro viram "evolução no tempo" da métrica, o que semanticamente pode não fazer sentido (folha por ano de admissão).
- A varredura de dimensões usa a média por registro, não a média ponderada por volume.
- Sem teste com planilhas reais ou com mais de 100 mil linhas.
