# Gate 50 — Modelo "Face a face" (local, aguardando aprovação)

Terceiro portão de `docs/especificacao-modelos-e-abas.md` (§5). Quando a planilha é uma comparação entre 2 a 4 entidades (gate 49), o Datavix passa a sugerir a história **Face a face** como primeira opção e monta um roteiro próprio, de **até 8 slides**, em que só entra slide que tem dados.

## Como funciona
1. **Pacote de dados (`nvVsPack`, `src/versusplan.js`)**: calculado junto com a peça e guardado em `built.vs` (números e textos puros). Por isso a apresentação exportada em HTML, o PPTX e o vídeo não precisam da planilha.
2. **Regras de comparação**
   - Só se comparam métricas de **mesma unidade**, completas para todas as entidades.
   - **Ordens** (posição, idade, ranking, grid) e **colunas de exposição** (GP disputados, jogos) ficam fora do placar e vão para a nota de limites.
   - Período em que alguma entidade **não tem registro** fica fora do recorte e é citado nos limites; nunca vira zero.
   - Aba de período (Comparativo): o placar usa o **total do recorte** (soma, só de métricas aditivas). Aba de métricas (Sheet1): usa o bloco com mais métricas comparáveis (preferindo "Carreira", "Total", "Geral"), com o valor da própria célula.
   - "Maior valor" é **neutro**: empates contam à parte; "menor é melhor" aparece só como nota (Abandonos, custo…).
3. **Roteiro** (`nvPlanVersus`), cada slide só existe se houver dados:
   | Slide | Conteúdo | Visual |
   |---|---|---|
   | Capa | A × B, nº de métricas comparáveis, período, fonte | texto |
   | Placar | em quantas métricas cada um tem o maior valor, empates à parte | barras por entidade + "3 × 2" |
   | Período a período (ou Temporada a temporada) | placar de cada período, quem fica à frente e a métrica de maior diferença | barras por período |
   | Totais lado a lado | totais do recorte, quem tem o maior valor em cada métrica, maior contraste (ex.: 3,8×) | barras pareadas, cada métrica na escala do seu maior valor |
   | Eficiência | taxas da planilha (verbatim) e taxas calculadas (total ÷ exposição) com a conta à vista | barras pareadas |
   | Perfil | textos da planilha, **na íntegra** | lista de texto |
   | Limites | períodos sem registro, exposição diferente, ordens fora do placar, abandonos, colunas derivadas | texto |
   | Síntese | "A 3 · B 2 em 5 métricas comparáveis" | texto |
   Tamanhos: **2** (Placar + Síntese e limites), **5** (Capa, Placar, 2 slides do meio, Síntese e limites), **10** (até 7 slides na ordem acima).
4. **Linguagem**: "tem o maior valor em", "dividem", "empate em". Nada de "melhor", "superior", "por causa de" ou "culpa"; nenhuma causa é afirmada.
5. **Validação**: novas evidências `vsscore` (contagem do placar), `vsratio` (contraste) e `vsrate` (taxa), recalculadas pelo validador. Textos copiados da planilha (nomes, perfis) não passam pelo lint de causa/acusação (`lintText`).

## Interface e exportação
- A história aparece na escolha ("Que história contar?") e no painel somente quando a planilha é um face a face.
- O título da peça passa a ser "A × B".
- Apresentação: slides de dados usam barras próprias (modo denso para 7 ou mais linhas); slides de texto não mostram o gráfico geral da peça (`noChart`).
- PPTX: barras pareadas desenhadas como formas (`pxVsRows`), com valores reais; vídeo: as mesmas barras, sem o gráfico geral nos slides de texto.

## Resultado nas planilhas da Fórmula 1
`Comparativo 1989-94`: recorte 1991–1994, 1989 e 1990 fora do placar com nota, 5 métricas (Vitórias, Pódios, Poles, Voltas mais rápidas, Pontos oficiais), placar **Senna 3 × 2 Schumacher**, por temporada **1991 5×0, 1992 2×3, 1993 3×2, 1994 0×5** (a tabela de aceite da especificação), nota "1991: GP disputados* 16 × 6".
`Sheet1`: bloco "Carreira Completa" (Títulos, Vitórias, Poles, Aproveitamento, Pódios, Voltas), Idade e Posição fora do placar, perfil com os textos originais, 8 slides.

## Fora deste portão (próximos)
- Interruptor "maior é melhor / menor é melhor" por métrica no painel (hoje só a nota e o texto neutro).
- Slide **Fontes e método** e a ressalva "Comparabilidade" da aba de método (portão 51), conciliação entre abas (52), galeria visual (53).
- Perfil em cartões (hoje lista de texto); texto longo demais pode precisar de ajuste na galeria.

## Testes
`test/m/versus-plan-run.js` (novo): tabela de aceite, totais, razão 3,8×, limites, textos sem palavras proibidas, Sheet1 completa, perfil sem alteração, sugestão como primeira história, ausência em 5 outras planilhas, PPTX com barras pareadas e versão em inglês. Regressão completa em `/tmp/regr4.sh`.
