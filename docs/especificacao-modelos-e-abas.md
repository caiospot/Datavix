# Especificação: modelos de apresentação, "Face a face" e pastas de trabalho com várias abas

Status: **proposta para aprovação**. Nada disto está implementado. Escrita em 13/out/2026, a partir de duas planilhas reais do usuário (`Formula-1.xlsx` e `Formula-SennaxShumi.xlsx`, copiada para `dados-teste/f1-senna-schumacher.xlsx`). Complementa `docs/especificacao-historias.md` (portões 42 a 47, já feitos localmente).

## 1. O problema, com evidência

Ao subir `Formula-1.xlsx` (uma aba, 23 linhas) o Datavix gerou 10 slides sem sentido. Causas, todas confirmadas no código e nos prints:

| # | O que aconteceu | Causa |
|---|---|---|
| 1 | "Desempenho teve o maior valor: 11", "Pole Positions lidera: 4, 17% do total" | Nenhuma coluna numérica foi reconhecida (as colunas dos pilotos misturam `3`, `"161 largadas"`, `"40,3% das corridas"` e frases). O motor caiu na **contagem de linhas por rótulo** e tratou "11 linhas de Desempenho" como se fosse um resultado. |
| 2 | Slides "Sem dados para esta análise", "Distribuição e atípicos: não há coluna numérica", "Poucas linhas: leitura exploratória" | O plano de 10 slides **sempre** fecha em 10, preenchendo com slides "sem base" e de qualidade de dados. |
| 3 | Nada sobre Senna ou Schumacher | A planilha é um **face a face**: cada linha é uma métrica e as **colunas são as entidades**. O Datavix só entende "uma linha = um registro". |
| 4 | Roteiro sem história | Não existe modelo que diga "para um face a face, conte assim". |

Na planilha nova, `Formula-SennaxShumi.xlsx` (4 abas), o Datavix hoje lê **uma aba por vez** (tela "Escolha a aba"; as outras são ignoradas). Resultado medido, aba a aba:

| Aba | Linhas | Leitura atual |
|---|---|---|
| `Sheet1` | 23 | igual à planilha anterior: "casos", tudo texto, confiança **baixa** |
| `Comparativo 1989-94` | 12 | boa: Temporada, Piloto e 8 medidas reconhecidas (forma "ledger") |
| `Fontes e método` | 18 | lista de texto (Item, Descrição/URL): nada a analisar, mas é conteúdo valioso |
| `Resultados por GP` | 96 | registros por GP, com colunas "… Senna" e "… Schumacher" lado a lado, sem desdobramento |

Dois achados do conteúdo que a especificação precisa tratar:
- **"Não participou" aparece como zero.** Em 1989 e 1990 Schumacher tem `GP disputados = 0`, `Vitórias = 0`… e equipe "—". Lido como número, vira "Senna 6 × 0", que é falso (ele ainda não corria).
- **As abas se conferem entre si.** Somando `Resultados por GP`, as vitórias, pódios, pontos e largadas por temporada **batem exatamente** com `Comparativo 1989-94` (ex.: 1993 Senna 5 vitórias, 73 pontos; Schumacher 1 vitória, 52 pontos; 1994 Schumacher 8 vitórias, 92 pontos, 14 largadas). Isso é uma verificação que o Datavix pode fazer e mostrar.
- **A aba "Fontes e método" traz a ressalva mais importante** ("Comparabilidade: os números brutos não isolam habilidade do piloto: Senna e Schumacher nunca foram companheiros de equipe…"). Uma apresentação honesta deve exibi-la como está.

## 2. Princípios

1. **Um modelo é uma história + um formato de planilha + um roteiro fixo.** O usuário escolhe um modelo (ou aceita a sugestão); o roteiro, os gráficos e a linguagem já vêm decididos. É a ideia da galeria de modelos do Google Planilhas.
2. **Só entra slide que tem conteúdo.** Roteiros têm "até N slides". Nada de slide "sem dados" na apresentação (isso vai para a nota de limites).
3. **Todo número vem da planilha e tem "ver cálculo".** Texto da planilha (fontes, perfis, ressalvas) é exibido **verbatim**, nunca reescrito nem interpretado.
4. **O Datavix não decide o que é "melhor".** "Maior valor" e "menor valor" são neutros; quem marca "menor é melhor" (ex.: abandonos) é a pessoa, e a sugestão fica visível.
5. **Nada de causa.** Comparar não é explicar ("A tem mais vitórias" ≠ "A é melhor piloto").
6. **Tudo no navegador.** Nada da planilha sai dele.

## 3. Camada 1: higiene do roteiro (vale para todas as planilhas)

Mudanças pequenas e de alto impacto, antes de qualquer modelo novo:

- **Sem medida numérica, sem achado de "maior valor" ou "participação"** sobre contagem de linhas. Quando não há número, o Datavix diz na leitura "Esta planilha não tem colunas numéricas; li como lista de itens" e só oferece histórias descritivas.
- **Comprimento variável.** Os planos viram "até 2, 5 ou 10". Passos sem achado **somem** em vez de virar slide "sem base". O que faltou vai, numa linha cada, para o slide final de **Limites** (que só existe se houver o que dizer).
- **Contexto e qualidade viram nota**, não slides próprios, quando não trazem nada notável ("Todas as 23 linhas foram usadas" não é slide).
- **Tamanho mínimo honesto:** se houver só 3 achados, a apresentação tem 3 achados + abertura + fecho.

## 4. Camada 2: entender o "face a face"

### 4.1 Formatos reconhecidos
- **Largo (entidades em colunas):** uma coluna de rótulo (métrica) e 2 a 4 colunas de conteúdo parecido, cujos nomes são entidades (`Ayrton Senna`, `Michael Schumacher`). Exemplo: `Sheet1`.
- **Largo com sufixo:** colunas que se repetem por entidade (`Grid Senna`, `Grid Schumacher`, `Pontos Senna`, `Pontos Schumacher`). Exemplo: `Resultados por GP`. Desdobra em Métrica × Entidade × Valor.
- **Longo (entidade em coluna):** uma coluna com 2 a 4 valores (`Piloto`) e várias medidas. Exemplo: `Comparativo 1989-94`. Já é lido hoje; só falta reconhecer como face a face.

Critério de detecção (todos verificáveis na planilha): 2 a 4 entidades; mesma lista de métricas para todas; nomes de coluna que se repetem com variação só no nome da entidade; sinais no nome do arquivo/aba ("vs", "x", "comparativo") apenas aumentam a confiança.

### 4.2 Leitura de valores mistos
Para cada célula de uma coluna de entidade:
- **Número puro** (`3`, `65`): número.
- **Número com unidade** (`"161 largadas"`, `"40,3% das corridas"`, `"32 anos"`): extrai o número e guarda a unidade e o texto original. Dois números na mesma célula (`"4º colocado (50 pontos)"`): guarda os dois (posição 4, pontos 50) e mostra o original.
- **Texto** (`"Agressivo, cerebral…"`): não é métrica; vira cartão de perfil.
- Regras de segurança: nunca somar números de métricas diferentes; só comparar métricas com a **mesma unidade**; célula sem número reconhecível fica como texto (nunca vira zero).

### 4.3 "Não participou" não é zero
Linhas em que a entidade claramente não estava presente ficam fora dos comparativos e entram na nota de limites ("Schumacher não disputou 1989 e 1990"). Sinais (qualquer um basta, e a pessoa pode desfazer): coluna de exposição igual a zero (nome com `disputad`, `largad`, `jogos`, `participa`, `GP`), rótulo "—", "n/d", "sem participação", ou texto de contexto com "ainda não" / "não participou". Sem esse sinal, zero continua sendo zero.

### 4.4 Direção da métrica
Cada métrica comparável tem um interruptor "maior é melhor / menor é melhor / neutro" no painel. O padrão é **neutro**. Sugestão visível (não aplicada sozinha) para nomes como `abandono`, `DNF`, `erro`, `falha`, `custo`, `tempo`, `cancelamento`.

## 5. Camada 3: o modelo "Face a face"

Roteiro de **até 8 slides**; cada slide só existe se houver dados.

| # | Slide | Conteúdo (tudo calculado) | Gráfico |
|---|---|---|---|
| 1 | **Capa** | "A × B", período coberto, fonte e nº de métricas comparadas | — |
| 2 | **Placar** | Em quantas métricas cada um tem o maior valor (empates contados à parte), no recorte em que **ambos** têm registro | barras empilhadas 100% ou dois grandes números |
| 3 | **Temporada a temporada** | Para cada período (1991–1994), o placar e a métrica de maior diferença | colunas agrupadas por período |
| 4 | **Carreira / total** | As métricas de total lado a lado (títulos, vitórias, poles, pódios, voltas) | barras pareadas |
| 5 | **Eficiência** | Taxas e aproveitamento (as porcentagens da planilha, ou "por largada" calculadas por ele a partir de duas colunas, com a conta à vista) | barras pareadas |
| 6 | **Perfil** | Textos de perfil lado a lado (equipes, estilo, postura), verbatim | cartões de texto |
| 7 | **Limites da comparação** | Ressalva da aba de método, verbatim, mais as notas do Datavix (períodos sem participação, métricas sem unidade comum) | texto |
| 8 | **Síntese** | "A lidera em N métricas, B em M; empate em K", sem causa e sem veredito | — |

**Linguagem:** "tem o maior valor em", "lidera em", "vence em N de M métricas"; nunca "melhor", "superior", "por causa de".

**Exemplo esperado (critério de aceite) com `Comparativo 1989-94`**, regra: período em que ambos têm GP > 0; métricas numéricas de mesma unidade: Vitórias, Pódios, Poles, Voltas mais rápidas, Pontos oficiais; maior valor neutro:

| Temporada | Senna | Schumacher |
|---|---|---|
| 1991 | 5 (Vitórias, Pódios, Poles, Voltas, Pontos) | 0 |
| 1992 | 2 (Vitórias, Poles) | 3 (Pódios, Voltas, Pontos) |
| 1993 | 3 (Vitórias, Poles, Pontos) | 2 (Pódios, Voltas) |
| 1994 | 0 | 5 (todas; em Poles, 6 × 3) |

Com a nota: "1989 e 1990 ficaram fora: Schumacher ainda não disputava" e "1991: Schumacher disputou 6 GPs; Senna, 16".

## 6. Camada 4: pastas de trabalho com várias abas

### 6.1 Regra de ouro
Hoje: **uma aba por vez**, as outras são ignoradas. Proposto: a pasta de trabalho inteira é **um projeto**; cada aba ganha um **papel** (sugerido pelo Datavix, ajustável pela pessoa).

### 6.2 Papéis
| Papel | O que é | O que o Datavix faz |
|---|---|---|
| **Principal** | A aba que sustenta a história (mais medidas, mais linhas úteis, melhor `score` de história) | É a base do roteiro e do gráfico principal |
| **Detalhe** | Mesmo assunto em grão mais fino (ex.: por GP), com colunas-chave em comum com a principal (`Temporada`, nomes) | Aprofunda e **confere** a principal; alimenta slides de detalhe (ex.: "como foi cada GP") |
| **Perfil** | Aba toda em texto, entidades em colunas (`Sheet1`) | Cartões de perfil do modelo Face a face |
| **Fontes e método** | Poucas colunas, texto, URLs, nome de aba com `fonte`, `método`, `sobre`, `notas`, `legenda` | **Slide "Fontes e limites"**, texto e links **exatamente como estão**, sem análise |
| **Ignorar** | Vazia, rascunho, ou escolhida pela pessoa | Fora de tudo |

### 6.3 Detecção
- **Fontes:** ≤ 3 colunas, quase tudo texto, ≥ 30% das células com URL **ou** nome da aba com palavra-chave.
- **Perfil:** forma "casos" com todas as colunas em texto e 2 a 4 colunas-entidade.
- **Principal:** maior `score` de história entre as abas com ≥ 1 medida numérica; desempate pelo menor grão que ainda tem poucas linhas (a aba-resumo).
- **Detalhe:** outra aba com **chaves em comum** com a principal (mesma coluna ou mesmo conjunto de valores, ex.: `Temporada`) e **mais linhas**.
- Aba oculta ou vazia: sugerida como "ignorar".

### 6.4 Conciliação (a funcionalidade que prova o valor)
Quando principal e detalhe compartilham chaves e medidas de mesmo nome, o Datavix **soma o detalhe e compara com a principal**. Resultado mostrado na leitura e como nota no slide de limites:
- **"Conferido"** quando bate (como nesta planilha: vitórias, pódios, pontos e largadas por temporada).
- **"Não confere"** com a lista dos valores divergentes (ex.: "Vitórias 1993, Senna: resumo 5, soma dos GPs 4"). Nunca corrige sozinho.
Esse cálculo tem "ver cálculo" como qualquer achado.

### 6.5 Tela de abas
A tela "Escolha a aba" vira "**O que há nesta planilha**": uma linha por aba com nome, tamanho (linhas × colunas), papel sugerido (menu para trocar) e um resumo de uma frase ("12 linhas · Temporada, Piloto, 8 medidas"). Um botão "Continuar" usa a sugestão. Com **uma** aba só, a tela não aparece (como hoje).

### 6.6 Efeito nos modelos
- Os modelos usam **a aba Principal** para o roteiro e **Detalhe** para slides extras (ex.: "Resultado em cada GP", com o recorte da temporada).
- **Fontes** vira sempre o penúltimo slide quando existir, e o texto de "Comparabilidade/limites" dessa aba entra no slide de **Limites**.
- **Perfil** alimenta o slide de perfil do Face a face.
- O HTML exportado, o PPTX e o vídeo levam os mesmos slides.

## 7. Camada 5: galeria de modelos

Depois da leitura, em vez da janela de texto "Que história contar?" (portão 44), uma **galeria visual**, no estilo da do Google Planilhas:
- Cartões com **miniatura da sequência de slides** montada com os dados da própria planilha (não imagem genérica).
- O(s) modelo(s) que servem vêm em destaque, com "Serve para esta planilha: 2 pilotos × 5 métricas × 4 temporadas".
- Os que não servem aparecem apagados, com o motivo ("falta uma coluna de datas").
- Grupos como no Google: **Comparar** (Face a face, Comparativo), **Ao longo do tempo** (Evolução, Antes e depois), **Quem pesa** (Ranking, Composição), **Planejamento** (Meta × realizado, Funil), **Explorar** (Distribuição, Relação, Geografia), **Panorama**.
- A janela atual de texto continua existindo como "lista" para telas pequenas.

## 8. Entrega em portões (cada um local, testado, aprovado por você antes de publicar)

| Portão | Conteúdo |
|---|---|
| 48 ✅ (local) | **Higiene** (§3): sem achados sobre contagem de linhas quando não há número; roteiros "até N" sem slides vazios; nota de limites; atualiza os testes de arco. |
| 49 ✅ (local) | **Leitura do face a face** (§4): valores mistos (número + unidade, dois números, texto), "não participou", desdobramento largo e com sufixo, forma `versus`; direção da métrica (neutra por padrão). |
| 50 ✅ (local) | **Modelo Face a face** (§5): roteiro de até 8 slides, placar com regra "ambos têm registro", gráficos pareados, linguagem sem veredito; teste com as duas planilhas e a tabela de aceite. |
| 51 | **Várias abas** (§6.1 a 6.3, 6.5): projeto com abas, papéis, tela "O que há nesta planilha", slides de Fontes e de Perfil. |
| 52 | **Conciliação** (§6.4) e slides de detalhe por aba. |
| 53 | **Galeria de modelos** (§7) com miniaturas reais; a janela atual vira a versão em lista. |
| 54 | Modelos extras: **Ficha / perfil** (uma entidade, muitas métricas) e **Resumo por temporada** (a aba `Comparativo` como história de evolução por piloto). |

## 9. Critérios de aceite e testes

1. **Planilha nova (`f1-senna-schumacher.xlsx`):**
   - detecta 4 abas com papéis `Perfil` (Sheet1), `Principal` (Comparativo), `Fontes` e `Detalhe` (Resultados por GP);
   - conciliação "conferida" para vitórias, pódios, pontos e largadas por temporada (valores da seção 1);
   - Face a face com a tabela de placar da §5 **exatamente**;
   - 1989 e 1990 fora do placar, com nota; "Não participou" nunca vira zero;
   - slide de Fontes com os 17 itens e URLs idênticos aos da aba; slide de Limites com a frase de "Comparabilidade" idêntica;
   - nenhum texto com "melhor", "superior", "por causa de", "culpa".
2. **Planilha antiga (`Formula-1.xlsx`, aba única):** o mesmo Face a face a partir da aba `Sheet1`, com perfis em cartões de texto e as métricas com número (Vitórias, Poles, Pódios, Títulos, Voltas) comparadas; **nenhum** achado do tipo "X lidera: 4, 17% do total" baseado em contagem de linhas.
3. **Higiene:** nenhum plano da bateria tem slide "sem dados"; toda apresentação tem ≥ 1 slide de achado ou diz claramente "sem achados".
4. **Regressão:** bateria de 16 planilhas, planos, narrativa, caminho curto e exportações continuam passando.
5. **Várias abas:** pasta com 1 aba não mostra a tela de abas; com abas todas vazias avisa; aba oculta vem como "ignorar"; trocar o papel de uma aba refaz o roteiro.

## 10. Decisões que preciso de você

1. **Direção da métrica:** padrão neutro, com interruptor por métrica e sugestão visível para nomes como "abandonos". Aprova?
2. **Número de slides:** "até N" (3 a 8 conforme o conteúdo) em vez de sempre 10. Aprova?
3. **Ordem de entrega:** 48 e 49 primeiro (corrigem a planilha antiga e a nova), depois 50 (modelo), 51 e 52 (abas), 53 (galeria). Ou prefere a galeria visual antes?
4. **Conciliação sem corrigir:** o Datavix só **avisa** quando as abas não batem e nunca altera um número. Aprova?
5. **"Fontes e método" verbatim:** os links entram como texto clicável apenas no HTML exportado (não no PPTX/vídeo). Aprova?
6. **Mais modelos:** além de Face a face, qual modelo é o mais urgente para os seus usuários (Meta × realizado, Ficha/perfil, Pesquisa de satisfação)? Com 2 ou 3 planilhas de exemplo de cada, eu calibro a detecção.

## 11. Riscos

- **Detecção errada de entidades:** colunas de categorias parecidas podem ser lidas como entidades. Mitigação: confiança baixa mostra a tela "Como li a sua planilha" com o desdobramento proposto para confirmar.
- **Unidades:** "pontos" e "largadas" juntos na mesma métrica. Mitigação: só compara métricas de mesma unidade; o resto fica em texto.
- **Abas demais:** pastas com 10+ abas. Mitigação: papel sugerido só para as 6 maiores; o resto vem como "ignorar", com opção de ligar.
- **Escopo:** Face a face e abas são grandes. Mitigação: portões pequenos, cada um útil sozinho (o 48 já melhora todas as planilhas).
