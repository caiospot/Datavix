# Gate 53 — Conciliação entre abas (local, aguardando aprovação)

Sexto portão de `docs/especificacao-modelos-e-abas.md` (§6.4). Quando a pasta tem uma aba **Principal** (por período e entidade) e uma aba **Detalhe** (por corrida), o Datavix soma ou conta o detalhe e compara com a principal. É a verificação que prova o valor das abas.

## Como funciona (`src/wbrecon.js`)
Para cada período e entidade em que a Principal tem valor, o Datavix calcula na aba Detalhe:

| Métrica da Principal | Regra no Detalhe |
|---|---|
| Pontos | soma da coluna Pontos |
| Vitórias | contagem de Resultado = 1 |
| Pódios | contagem de Resultado de 1 a 3 |
| Poles | contagem de Grid = 1 |
| Coluna de exposição (GP disputados) | contagem de linhas em que a entidade tem resultado e não está marcada "não participou" |

Cada regra só vale se a coluna existe no Detalhe e a métrica existe na Principal; métricas sem regra (ex.: voltas mais rápidas) não são conferidas. Linhas sem registro (Schumacher em 1989 e 1990) não entram na conta.

## O que aparece
- **Conferido**: "Conciliação com a aba “Resultados por GP”: conferido (Pontos oficiais, Vitórias, Pódios, Poles, GP disputados*; 50 comparações por período e entidade)".
- **Não confere**: "não confere em 1 de 50 comparações" e a lista (até 5) como "Vitórias 1993, Ayrton Senna: resumo 5, soma dos detalhes 4".
- **Onde**: na tela de leitura ("Conferência entre abas"), no painel do editor (seção "Abas da planilha") e na **Síntese e limites**, com "ver cálculo" (uma linha por métrica, com a regra e o número de comparações).
- **Regra de ouro**: o Datavix só compara. Nunca corrige um número nem diz qual aba está certa. Nos testes, adulterar o Detalhe muda só o aviso: placar, totais e o pacote de dados ficam idênticos.

## Resultado na planilha da Fórmula 1
Conferido nas 5 métricas, **50 comparações** (5 métricas × 10 pares período-entidade com registro): vitórias, pódios, poles, pontos e largadas por temporada batem exatamente entre `Comparativo 1989-94` e `Resultados por GP`, como a especificação previa.

## Também neste portão
- `nvWbDetail` (ligação do Detalhe à Principal pelo período e pelo sufixo com o nome da entidade) foi extraído de `nvWbRaces` e é compartilhado com a conciliação.

## Fora deste portão
- Regras para outras áreas além de competições (ex.: soma de vendas por loja entre um resumo e um detalhe com colunas de mesmo nome): ficam para calibrar com planilhas reais.
- Escolher manualmente as corridas do corrida a corrida.

## Testes
`test/m/workbook-recon-run.js` (novo): conferido em 5 métricas e 50 comparações, texto e "ver cálculo", linha nos limites, painel e leitura, **adulteração** de uma vitória (aponta Vitórias 1993 do Senna: 5 × 4) e de um ponto (Pontos 1992 do Schumacher: 53 × 54) sem mudar nenhum número do Datavix, restauração, ausência do Detalhe, inglês e PPTX.
