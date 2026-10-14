# Gate 52 — Face a face por fases (local, aguardando aprovação)

Quinto portão de `docs/especificacao-modelos-e-abas.md`, a partir do roteiro sugerido para a planilha da Fórmula 1. Comparar tudo junto engana quando um lado ainda não existia ou correu pela metade: o portão 50 incluía 1991 (6 × 16 GPs) e 1994 (3 × 14) no mesmo placar. Agora o roteiro é montado por **fases**, em ordem cronológica, e só a fase comparável tem placar.

## Como cada período é classificado (`src/versusphases.js`)
| Classe | Regra (calculada na planilha) | Slide |
|---|---|---|
| **Só um lado tem registro** | alguma entidade sem registro no período (exposição zero, "não participou", "ainda não…") | valores de quem tem registro, sem comparação |
| **Incompleta** | todas têm registro, mas o menor valor de exposição (GP disputados, jogos…) é **menos da metade** do maior | cada métrica **por exposição**, com a conta à vista; sem placar de "maior valor" |
| **Comparável** | os demais | placar, totais pareados e placar de cada período |

Períodos vizinhos de mesma classe formam uma fase. O limite de metade é uma hipótese de produto (`NV_VS_PARTIAL`) e aparece no "ver cálculo" da linha do tempo.

## O roteiro (até 10 slides; só existe slide que tem dados)
1. **A pergunta**: "Como A e B se comparam entre 1989 e 1994?" (modelo de frase), o recorte comparável calculado ("Só 1992 e 1993 têm todos em condições comparáveis"), período e fonte.
2. **Linha do tempo**: uma linha por entidade, uma célula por período, com a exposição (GPs); períodos sem registro tracejados; incompletos e comparáveis em cores diferentes.
3. **Fases em ordem**, uma por slide: só Senna (1989–90), incompleta (1991), comparável (1992–93), incompleta (1994).
4. **Corrida a corrida** (aba Detalhe), logo depois da fase comparável: até **4 corridas por temporada comparável**, pela regra **maior diferença de pontos** entre os dois (só corridas em que todos têm pontos; empates pela ordem do calendário), mostradas em ordem de calendário, com equipe e resultado como estão na aba. O critério e a conta aparecem no "ver cálculo".
5. **Síntese e limites**: resumo em números do período comparável, definição de "incompleta", ressalvas da aba de método na íntegra (Comparabilidade), notas do Datavix.
6. **Fontes e método** (penúltimo, gate 51).
7. **Conclusão**: slide **em branco, escrito por você** na apresentação; o Datavix não escreve veredito.

Tamanhos: **2** (fase comparável e síntese), **5** (pergunta, fase comparável, síntese, fontes e conclusão), **10** (todos acima). Sai primeiro o que menos pesa: fases só de um lado, incompletas, linha do tempo e corrida a corrida.

## Textos da planilha, sem reescrever
- O texto de contexto de cada linha ("Schumacher estreou no GP da Bélgica…", "Campeão. Cumpriu suspensão de duas provas…") entra **na íntegra** como nota do slide, com o nome da coluna e da entidade. Texto com mais de 220 caracteres não entra (nunca é cortado).
- A frase "Comparabilidade" da aba de método vai idêntica para os Limites.

## Resultado na planilha da Fórmula 1
Fases detectadas: `1989–90 só Senna`, `1991 incompleta (16 × 6)`, `1992–93 comparável`, `1994 incompleta (3 × 14)`. Na fase comparável: Senna **3 × 2** Schumacher (Vitórias 8×2, Pódios 14×17, Poles 2×0, Voltas 2×7, Pontos 123×105; 1992 2×3, 1993 3×2). Corrida a corrida: 1992 Spanish, Monaco, Hungarian, Belgian; 1993 European, Monaco, Portuguese, Japanese (conferidas contra a aba).

## Outras mudanças
- Planilhas sem exposição, só com período comparável ou no formato de métricas em linhas seguem o roteiro clássico do portão 50.
- Aba **Detalhe**: o leitor passa a guardar a matriz (até 1.500 linhas × 40 colunas) da aba com esse papel.
- Visuais novos: linha do tempo e tabela de corridas (HTML, PPTX); no vídeo esses slides mostram só o texto.
- Slide em branco é aceito pelo validador (`blank`) e a conclusão digitada fica salva com o projeto (`sedits`).
- O validador de causa agora lê só o texto do Datavix (`lintText`), não o texto copiado da planilha.

## Fora deste portão
- Escolha manual das corridas (lista com seleção); a regra automática é a única por enquanto.
- Conciliação entre a aba Principal e o Detalhe ("Conferido" / "Não confere"): próximo portão.

## Testes
`test/m/versus-phases-run.js` (novo): fases, linha do tempo, os três tamanhos, placar da fase comparável, taxas por GP, textos de contexto idênticos, corrida a corrida **conferida de forma independente** na matriz da aba, Comparabilidade idêntica, conclusão em branco e editável, sem palavras de veredito, PPTX, inglês e roteiro clássico preservado. `versus-plan-run` passou a testar o roteiro clássico sem fases.
