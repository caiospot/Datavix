# Portão 55: modelos extras (Resumo por temporada e Ficha / perfil)

Status: **feito e testado localmente; não publicado** (depende do seu "Aprovado, pode publicar", junto com os portões 42 a 54).
Especificação de origem: `docs/especificacao-modelos-e-abas.md`, linha 55.

## O que entrou

Dois modelos novos na galeria, cada um com roteiro próprio de **2, 5 ou 10 slides** ("até N", só entra slide que tem dados), cálculo à vista, texto da planilha na íntegra e conclusão em branco para você escrever (a partir de 5 slides).

| Modelo | Para que planilha | Pergunta | Grupo na galeria |
|---|---|---|---|
| **Resumo por temporada** | Uma linha por entidade e período (piloto × temporada, loja × mês), várias medidas. É a aba `Comparativo 1989-94` vista **por piloto**, em vez de comparada | "Como cada um evoluiu de uma temporada para a outra?" | Ao longo do tempo |
| **Ficha / perfil** | Lista de indicadores de **uma só entidade**: cada linha é uma métrica diferente (Indicador, Valor, Unidade…) ou uma coluna de valores misturados (número com unidade e texto) | "Quais são os números e os traços de uma só entidade?" | Panorama |

## Resumo por temporada

**Leitura.** Não lê nada novo: usa o pacote por períodos do Face a face (`built.vs.pd`). Serve quando pelo menos uma entidade tem **3 ou mais períodos** com número e uma medida que soma com maior valor positivo. Nota 0,9 (o Face a face continua em primeiro, com 1,2; o resumo vem logo depois).

**Roteiro (F1, `Comparativo 1989-94`).**

| N | Slides |
|---|---|
| 2 | Maior valor de cada métrica, limites e síntese |
| 5 | Ayrton Senna, Michael Schumacher, maior valor de cada métrica, limites, conclusão em branco. Com a aba Fontes e método, o slide de Fontes entra antes da conclusão e sai o do segundo piloto (continua no slide de maior valor e nos limites) |
| 10 | Capa, um slide por piloto (até 4), maior valor de cada métrica, limites, (Fontes e método, se a pasta tiver), conclusão em branco |

- **Slide de cada piloto:** tabela com as métricas nas linhas e as temporadas nas colunas (a linha de GP disputados vem primeiro), a célula de **maior valor de cada métrica marcada**, a frase "Ayrton Senna, 1989–1994: maior valor de Vitórias em 1991 (7), de Pódios em 1991 (12) e de Poles em 1989 (13)." (as 3 primeiras medidas que somam, na ordem da planilha), número grande e "ver cálculo" com o maior valor de cada métrica. A evidência (`sspeak`) é recalculada pelo validador.
- **Temporada incompleta** (nota no slide): menos da metade do maior valor de exposição **do próprio piloto** (Senna 1994: 3 de 16 GPs; Schumacher 1991: 6 de 16).
- **Maior valor de cada métrica:** uma tabela com os pilotos nas colunas ("Vitórias: 1991 · 7 × 1994 · 8").
- **Limites:** quantas temporadas cada um tem, quem não tem registro (Schumacher em 1989 e 1990, nunca como zero), temporadas incompletas, posições e ordens (aparecem na tabela, sem destaque), ressalvas da aba de método na íntegra, conciliação com a aba de detalhe, "o resumo mostra o que mudou, não por que mudou".
- **Neutro:** "maior valor", nunca "melhor"; nada de causa; ordens (Posição final) e taxas nunca ganham destaque de maior valor.

## Ficha / perfil

**Leitura (`nvFichaPack`, em `src/ficha.js`; vai em `built.fc`).**

1. Uma coluna de **rótulos** (texto, quase todos diferentes) e **uma** coluna de valores: ou numérica (as outras colunas só podem ser eixo, unidade, ano) ou de texto misturado (`"161 largadas"`, `"40,3% das corridas"`, `"41 (25.4% de aproveitamento)"`, frases).
2. De 4 a 80 linhas; pelo menos 3 indicadores com número; **nenhuma outra coluna numérica** (duas colunas, como meta e realizado, não é ficha).
3. **Sinal de que as linhas são indicadores diferentes** (senão é ranking de itens do mesmo tipo, como região × vendas): cabeçalho do rótulo como `Indicador`, `Métrica`, `Atributo`…; ou 2 ou mais unidades diferentes; ou textos misturados aos números.
4. Número com unidade só é lido quando não há dúvida; "1.234" é ambíguo e fica como texto. Célula sem número reconhecível fica como texto, **nunca vira zero**.
5. Nome da entidade: coluna constante (`Nome`, `Município`…), cabeçalho da coluna de valores (`Ayrton Senna`) ou linha de título; sem nenhum, o slide usa o nome do arquivo e o título da peça é "Ficha de indicadores".
6. A coluna `Valor` passa a ter papel **`mixed`**: nunca entra em soma, média ou ranking genérico. E, como as linhas são métricas diferentes, **contar linhas por grupo não é mais oferecido** (Comparativo, Ranking e Composição aparecem indisponíveis, com o motivo).

**Roteiro.**

| N | Slides |
|---|---|
| 2 | Indicadores (até 8) e limites; o que ficou de fora vai para os limites |
| 5 | Capa, Indicadores 1/2, Indicadores 2/2 ou Textos, (Fontes), limites, conclusão em branco |
| 10 | Capa, até 4 páginas de indicadores, textos da planilha, (Fontes), limites, conclusão em branco |

- **Indicadores:** tabela na **ordem da planilha**, 8 por slide, com eixo (só na primeira linha de cada grupo), indicador, ano e valor. O valor aparece **como a planilha traz** ("161 largadas", "R$ 47.900", "9,7 por mil nascidos vivos"), sem arredondar. O número grande é o primeiro indicador da planilha.
- **Ver cálculo:** só lista o que a leitura transformou, com o texto original e o número lido ("40,3% das corridas → 40,3%").
- **Textos da planilha:** copiados sem alteração, em coluna única e fonte grande (até 6 frases; mais que isso, duas colunas menores).
- **Limites:** unidades diferentes (nada foi somado nem comparado), indicadores sem valor, indicadores e textos que ficaram só na planilha, ressalvas da aba de método, "uma ficha mostra os números de uma entidade e não os compara com outras".

## Peças comuns

- **Tabela com célula de destaque** (`{ t, hi }`) e modo `plain` (sem negrito na última coluna): HTML, PPTX (retângulo de destaque) e vídeo (a cena vira texto, como nos outros slides com tabela).
- **Texto grande** (`big`) para os textos de perfil.
- **Vídeo:** só o slide de contexto (a capa) vira o gancho; um modelo que abre direto no conteúdo (Resumo por temporada com 5 slides) não perde o primeiro slide. A **conclusão em branco não vira cena de vídeo** (antes aparecia uma cena vazia, também no Face a face); só entra se você escreveu o texto na apresentação.
- **Galeria:** miniaturas com dados reais. Resumo por temporada: uma linha por piloto na primeira medida, com os pontos de maior valor; Ficha: os 5 primeiros indicadores e os valores. Sequência de slides vinda do plano real. Em tela pequena, lista.
- **`NV_OWN`:** os três modelos com roteiro próprio (Face a face, Resumo, Ficha) montam o plano a partir do pacote lido, não do conjunto de achados do motor.

## Correções achadas no caminho

1. **Coluna "Ano" em CSV ficava vazia e oculta** (os anos chegam como texto e o leitor só tratava número). Agora vira data, com ano como grão. Antes, uma planilha `Ano, Receita` em CSV perdia o eixo do tempo ("falta uma coluna de datas").
2. **"Temporada" (anos como número) era tratada como medida**: aparecia "Temporada por Piloto: 2 mil" na galeria do Face a face. Colunas inteiras entre 1900 e 2100 com nome `Temporada`, `Ano`, `Safra`, `Período`, `Exercício`… viram eixo do tempo (papel `id`), nunca somam.

## Testes

Rodados no build final, em Chrome headless (inclusive `file://` com CSP estrita), todos verdes.

- `test/m/models-run.js` (85 verificações): valores do pacote conferidos contra as colunas da planilha (60 valores do Resumo, 42 células da tabela do Senna, 14 indicadores e valores da ficha), maior valor e período recalculados de forma independente, frases exatas, planos de 2, 5 e 10, PPTX, vídeo, inglês, planilha com temporadas fora de ordem, e **17 planilhas que não são ficha nem resumo** (as dos portões anteriores, a bateria e as outras abas da F1) mais 5 listas sintéticas (região × vendas, preços, meta × realizado, menos de 4 linhas, "Indicador, Valor").
- `test/m/models-ui.js` (42 verificações, com `?tell`): galeria (cartões, miniaturas, sequência, indisponíveis, lista), escolha, painel, apresentação de cada modelo (tabela, destaque, negrito, texto grande), inglês, console sem erro.
- `test/m/models-export-make.js` + `models-export-check.js`: os 3 HTML exportados (resumo da F1, ficha do município, ficha do piloto) abertos por `file://`, todos os slides percorridos, 0 recursos externos, 0 erros.
- `test/m/models-mobile.js` (420 px): as tabelas cabem na tela (332 px de largura, fonte de 11 px), sem rolagem horizontal.
- PPTX: todas as formas dentro do slide (máx. 1224 × 706 px), 5 destaques de maior valor por piloto.
- Regressão completa dos portões anteriores: arco de histórias, bateria, narrativa, plano (inclui o vídeo), histórias (UI, geografia e funil, meta, elegibilidade), caminho curto, Face a face, abas, conciliação e galeria (inclusive 420 px).

Arquivos de teste novos: `dados-teste/ficha-municipio.csv` (14 indicadores sintéticos, com eixo, unidade e ano), `dados-teste/ficha-piloto.csv` (os números do Senna da sua planilha, em coluna de valores misturados).

## Limites e hipóteses a calibrar (precisam de planilhas reais)

- **Ficha só com uma entidade em linhas** (um indicador por linha). Planilha de **uma linha só com muitas colunas** não é lida como ficha.
- **Sinais da ficha** (cabeçalho do rótulo, 2 unidades, textos misturados) e os tamanhos (8 indicadores por slide, até 4 páginas, 4 a 80 linhas) são hipóteses de produto.
- **Resumo por temporada exige o formato "entidade × período"** que o Face a face já reconhece (2 a 4 entidades). Uma série de uma entidade só (`Ano, Receita, Custo`) ainda vai pela Evolução no tempo, que mostra uma medida.
- **Medidas na frase:** as 3 primeiras que somam, na ordem da planilha; o Datavix não sabe qual é a principal.
- **Temporada incompleta** usa o limiar de 0,5 do Face a face, agora em relação ao máximo da própria entidade.
- Sem seletor "maior ou menor é melhor" por métrica (continua neutro) e sem escolher manualmente qual entidade ou métrica citar.
