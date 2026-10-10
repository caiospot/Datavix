# Gate 38: exportar para PowerPoint (.pptx) e modal da história

## PowerPoint (.pptx) editável (`src/pptx.js`, botão em Exportar)
Gerado no navegador, sem biblioteca: um pacote OOXML montado à mão (zip sem compressão, como as outras exportações).
- **Textos**: caixas de texto reais (título, rótulo, frase, nota, número em destaque, listas, resumo, rodapé com o endereço) e **tabelas** do PowerPoint para o "como foi calculado". Cores e fontes seguem a peça (fundo sólido ou gradiente, paleta, família do título e do texto).
- **Gráficos nativos do PowerPoint**, cada um com a **planilha embutida** (xlsx mínimo): "Editar dados" abre os números, e formas, cores, eixos e rótulos se editam no PowerPoint. Barras, barras horizontais, empilhado, 100% empilhado, linha, área, pizza, rosca, dispersão, bolhas e radar são diretos. Os demais saem como o gráfico nativo mais próximo dos mesmos dados, com uma nota no slide: treemap e corrida (barras ordenadas), calendário (colunas por mês), árvore radial, raios, leque, bolhas agrupadas e nuvem de palavras (barras), rio (áreas empilhadas), cordilheira (linhas), funil (colunas por etapa), linha radial (radar), box & whisker (colunas empilhadas com barras de erro para as hastes), mapa de bolhas (bolhas por longitude e latitude), mapa de isolinhas (dispersão dos pontos), várias pizzas e roscas (uma pizza por painel). Indicadores (KPI) viram cartões de texto editáveis.
- **Slides**: título com indicador principal; "O gráfico" com os insights; um slide para cada passo do roteiro (o mesmo plano de 2, 5 ou 10 slides da apresentação, com os textos editados e o modo em branco), com o gráfico do passo (seleção do passo esmaece o resto) e o cálculo; resumo com o endereço.
- Verificado no PowerPoint de verdade (abre sem pedir reparo, renderiza os 31 tipos), no Excel (a planilha embutida abre) e com python-pptx (`test/pptx-check.py`: 31 arquivos, gráficos, planilhas e textos).
- Limites: o PowerPoint usa a fonte instalada na máquina (se a fonte da peça não existir, ele substitui); animações e transições da apresentação não vão para o arquivo; tipos sem equivalente nativo mostram uma aproximação, não o desenho original.

## Modal da história
"Editar história", "Detalhar" e "Ver o que encontrei" agora abrem num **modal sobre o editor**, com **Fechar** (botão no rodapé, × no topo, Esc e clique fora). Dentro dele seguem os mesmos passos (Continuar, Voltar, Concluir); concluir grava e fecha, voltar no primeiro passo fecha, e o editor e o gráfico por baixo não são refeitos (`bgo`, `openLayerEl`, `renderLayer`, `closeLayer` em builder.js e ui.js). Fora do editor (primeiro uso) continuam como telas.

## Testes
`test/m/pptx-make.js` (gera um .pptx por tipo; hash `arquivo|aba|tipos`), `test/pptx-check.py`, `test/m/pptx-ui.js` (botão e status) e `test/m/layer-run.js` (modais, Fechar, Esc, fluxo completo, voltar). Regressão: `script-run`, `builder-check`, `builder-extra` e `builder-run` iguais ao anterior.
