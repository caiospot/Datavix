# Especificação: histórias do Datavix (storytelling por pergunta)

Status: **implementada localmente nos portões 42 a 47** (13/out/2026), aguardando aprovação para publicar. Escrita em 12/out/2026.

**Diferenças entre o que foi especificado e o que foi construído**
- A janela "Dá para contar" aparece **depois de gerar a peça** (e não antes de gerar), porque só então os achados existem: a história sem nenhum achado deixa de ser sugerida e as com vários sobem. O caminho continua de um clique.
- **Panorama** (o roteiro de sempre) é a 11ª opção, na janela e no painel; sem escolha, tudo segue como antes.
- Escolher uma história que pede outro mapeamento (tempo, geografia, funil) **remonta a peça** com o mapeamento dela, mantendo título, paleta, fundo e textos editados.
- A data do marco de "Antes e depois" é um campo no painel (a coluna de fase é detectada sozinha).
- Documentação dos portões: `docs/gate-42-…`, `docs/gate-43-45-…` (inclui 46 e 47).

## 1. Problema

Hoje a pergunta "Que história seus dados contam?" oferece 7 opções (`time`, `compare`, `composition`, `distribution`, `relation`, `flow`, `geo`). Elas misturam duas coisas:

- **o que a pessoa quer responder** (comparar, ver evolução, achar concentração);
- **o formato dos dados** (geografia, fluxo).

O resultado é um roteiro que mistura achados de tipos diferentes (por exemplo, uma história de comparação que cita um outlier e uma tendência), e uma pergunta que o usuário não sabe responder. O motor narrativo (gates 32–36) já produz achados sólidos e roteiros de 2, 5 e 10 slides; falta um **eixo editorial** que diga qual achado pertence a qual história e em que ordem.

## 2. Princípio

> **Uma história = uma pergunta de negócio.** A pessoa escolhe a pergunta (ou aceita a sugestão do Datavix). A história decide quais achados entram, em que ordem, com quais gráficos e com que linguagem. O formato dos dados deixa de ser uma "história": vira só o critério que diz se a história é **possível** com aquela planilha.

Regras que não mudam (herdadas do produto): todo número vem da planilha; todo insight tem "ver cálculo"; nada sai do navegador; PT e EN; sem hipótese de causa ("varia junto", nunca "causou").

## 3. Catálogo de histórias

Identificadores novos em `S.br.story`. A coluna "Antes" mostra o valor antigo que migra para ele (compatibilidade com projetos salvos).

| id | Nome (PT / EN) | Pergunta | Antes |
|---|---|---|---|
| `compare` | Comparativo / Comparison | Quem é maior, menor, melhor? Como A se compara a B? | `compare` |
| `time` | Evolução no tempo / Change over time | Como mudou? Cresceu, caiu, oscilou? | `time` |
| `before_after` | Antes e depois / Before and after | O que mudou depois de um marco? | novo |
| `rank` | Ranking e concentração / Ranking and concentration | Quem puxa o resultado? Poucos fazem muito? | novo (parte de `compare`) |
| `composition` | Composição / Composition | Do que o total é feito? | `composition` |
| `goal` | Meta e desempenho / Goal and performance | Atingimos o planejado? | novo |
| `funnel` | Funil e conversão / Funnel and conversion | Onde perdemos itens ao longo das etapas? | `flow` |
| `distribution` | Distribuição e anomalias / Distribution and anomalies | O que é normal? O que foge do padrão? | `distribution` |
| `relation` | Relação entre medidas / Relationship | Uma coisa varia junto com a outra? | `relation` |
| `geo` | Geografia / Geography | Onde as coisas acontecem? | `geo` |

**Fases de entrega**
- **Fase 1 (6 histórias, já suportadas pelos achados e gráficos atuais):** `compare`, `time`, `rank`, `composition`, `distribution`, `relation`.
- **Fase 2 (reaproveitam gráficos existentes):** `geo` (mapas de bolhas e isolinhas), `funnel` (gráfico de funil).
- **Fase 3 (pedem colunas específicas e achados novos):** `goal`, `before_after`.

## 4. Elegibilidade (a planilha sustenta a história?)

Cada história tem uma função `eligibility(cols, meta)` que devolve `{ ok, score, why }`.
- `ok` é **regra dura**: sem ela a história não é oferecida como possível; aparece apagada com o motivo (mesmo padrão dos gráficos "Need other data").
- `score` (0–1) ordena as possíveis para a sugestão.
- `why` é a frase mostrada ao usuário, em PT/EN, tirada dos dados ("12 lojas em 36 meses").

Termos usados abaixo: **medida** = coluna numérica que não é identificador (`isMeasure`); **grupo** = coluna categórica utilizável (`isGroupDim`); **período** = coluna de data com ao menos 4 períodos distintos no grão escolhido (`riverGrain`). Limiares são valores iniciais, a calibrar com a bateria de planilhas (seção 9).

| História | Regra dura (`ok`) | Pontua mais quando | Nunca oferecer quando |
|---|---|---|---|
| `compare` | ≥1 grupo com 2–12 valores e 1 medida (ou contagem) | 2 a 6 valores no grupo; medida clara | grupo com 1 valor só |
| `time` | período (≥4) e 1 medida (ou contagem) | ≥8 períodos; dados completos nos períodos | datas só do mesmo mês |
| `rank` | grupo com **≥6** valores e medida | 15+ valores; cauda longa; um grupo domina | menos de 6 grupos |
| `composition` | medida **aditiva** (soma faz sentido) e grupo com 2–12 partes; sem negativos relevantes | poucas partes; unidade de dinheiro, quantidade, tempo | medida de razão/percentual/nota média; muitos negativos |
| `distribution` | medida com ≥30 linhas (`NV_ROWS.min`) e variação real | milhares de linhas; assimetria ou outliers | medida quase constante; <30 linhas |
| `relation` | 2 medidas não-identificador, ≥30 pares, com variação | correlação moderada ou forte (|ρ| ≥ 0,4) | uma das colunas é um código (CEP, telefone, matrícula) ou há relação mecânica (executado ≈ múltiplo do orçado) |
| `geo` (F2) | coluna de UF/estado/município reconhecida **ou** latitude+longitude, e medida (ou contagem) | UF completas; lat/long com ≥20 pontos | texto livre que só parece local |
| `funnel` (F2) | 2–5 colunas de etapa em sequência (preenchimento decrescente ou categorias de estágio) | volume decrescente coerente entre etapas | etapas independentes sem ordem |
| `goal` (F3) | par realizado+meta reconhecido por nome (orçado/meta/planejado/target/budget) e por tipo | meta por item e por período | não existe coluna de meta (nunca inventar) |
| `before_after` (F3) | período e um corte: data escolhida pela pessoa, ou coluna de fase/campanha/antes-depois | corte no meio da série; ≥4 períodos de cada lado | corte sugerido sozinho sem confirmação |

**Sugestão automática:** ordenar as histórias com `ok` por `score` e mostrar as **3 primeiras** como "Dá para contar:". O `score` combina o ajuste aos dados (tabela acima) com o sinal da **área de atuação** (seção 8). Empate: preferir a que usa mais colunas relevantes.

## 5. Estrutura de cada história

Para cada uma: arco do roteiro em 2, 5 e 10 slides, famílias de achado permitidas (`NV_CLASS`), gráficos permitidos e o que **não** entra.

Convenções: `ctx` = contexto da base; `over` = visão geral; `finding` = achado principal; `evidence` = evidência; `exploration` = ponto a explorar; `implication` = implicação/pedido final; `synthesis` = síntese e limites. Os papéis seguem o plano atual (`nvPlan`); o que muda é **quais achados podem ocupar cada papel**.

Famílias (`NV_CLASS`): `top`, `bottom`, `spread`, `conc`, `change`, `trend`, `atypical`, `assoc`, `contrib`, `shift`, `dist`, `dimgap`, `atypical-rows`, `ratio`, `drop`, `gap`, `overview`.

### 5.1 Comparativo (`compare`)
- **Pergunta-guia:** "Quem está na frente e por quanto?"
- **Arco 2 slides:** (1) quem lidera e a distância para o segundo; (2) implicação.
- **Arco 5:** contexto → líder e distância (`top`, `spread`) → quem fica atrás (`bottom`, `gap`) → o que diferencia os extremos (`dimgap`) → implicação.
- **Arco 10:** contexto → visão geral → líder (`top`) → distância (`spread`) → o último (`bottom`) → diferença entre grupos em outra coluna (`dimgap`, `ratio`) → exceção (se houver `shift`) → o que não dá para afirmar → síntese → implicação.
- **Famílias permitidas:** `top`, `bottom`, `spread`, `gap`, `ratio`, `dimgap`, `shift`, `overview`.
- **Gráficos:** barras horizontais (principal), colunas, leque, raios, corrida de barras; alternativa para 2 itens: barras empilhadas 100%.
- **Não entra:** tendência, outlier de linhas, correlação, distribuição.

### 5.2 Evolução no tempo (`time`)
- **Pergunta-guia:** "Para onde isto está indo e quando virou?"
- **Arco 2:** (1) variação entre início e fim; (2) implicação.
- **Arco 5:** contexto → variação total (`change`) → tendência (`trend`, só se significativa) → pico e vale (`top`/`bottom` no tempo) → implicação.
- **Arco 10:** contexto → visão geral → variação total → tendência → sazonalidade (se houver, 12+ períodos) → ponto de virada (`shift`/`drop`) → quem puxou a variação (`contrib`) → o que não dá para afirmar → síntese → implicação.
- **Famílias permitidas:** `change`, `trend`, `shift`, `drop`, `contrib`, `top`/`bottom` (períodos), `overview`.
- **Gráficos:** linha (principal), área, rio vertical, cordilheira, calendário (dia/semana), colunas por período.
- **Não entra:** ranking de grupos sem tempo, correlação, distribuição de valores.
- **Salvaguardas já existentes:** Mann-Kendall para tendência; grão mensal quando as datas são dia 1; nada de "crescimento" com 2 pontos.

### 5.3 Ranking e concentração (`rank`)
- **Pergunta-guia:** "Quem puxa o resultado? Poucos fazem muito?"
- **Arco 2:** (1) concentração do topo ("3 itens = X%"); (2) implicação.
- **Arco 5:** contexto → concentração (`conc`) → líder dominante (`top`) → cauda (`bottom`, `dist` da participação) → implicação.
- **Arco 10:** contexto → visão geral → concentração → líder → segundo e terceiro → cauda longa → quanto o topo pesa por período (`contrib`) → risco de dependência (pergunta de investigação, nunca causa) → síntese → implicação.
- **Famílias permitidas:** `conc`, `top`, `bottom`, `contrib`, `ratio`, `overview`.
- **Gráficos:** barras horizontais ordenadas (principal), leque, raios, treemap, bolhas agrupadas, corrida de barras.
- **Não entra:** tendência de um item isolado, correlação.
- **Regra:** só com ≥6 grupos; o rótulo "Outros"/"Sem informação" nunca lidera (`isPlaceholderLabel`).

### 5.4 Composição (`composition`)
- **Pergunta-guia:** "Do que o total é feito?"
- **Arco 2:** (1) a maior parte e sua fatia; (2) implicação.
- **Arco 5:** contexto → fatia dominante (`top`/`conc`) → partes pequenas juntas (`bottom`) → como a composição mudou no tempo, se houver período (`shift`) → implicação.
- **Arco 10:** contexto → visão geral → fatia dominante → ordem das partes → a menor fatia relevante → mudança de mix entre início e fim (`shift`, `contrib`) → por grupo em outra dimensão (`dimgap`) → limites → síntese → implicação.
- **Famílias permitidas:** `top`, `conc`, `bottom`, `shift`, `contrib`, `dimgap`, `overview`.
- **Gráficos:** pizza, rosca, barras empilhadas 100%, treemap, bolhas agrupadas, várias pizzas/roscas (por período).
- **Não entra:** comparações de valor absoluto entre grupos fora da parte, correlação.
- **Regra:** só medidas aditivas; negativos explicados ou história indisponível.

### 5.5 Distribuição e anomalias (`distribution`)
- **Pergunta-guia:** "O que é normal e o que foge do padrão?"
- **Arco 2:** (1) valor típico (mediana) e dispersão; (2) implicação.
- **Arco 5:** contexto → valor típico e faixa (`dist`) → assimetria/cauda → linhas atípicas (`atypical-rows`, `atypical`) → implicação.
- **Arco 10:** contexto → visão geral → mediana e quartis → forma (assimétrica? cauda longa?) → quantos pontos fora do padrão e onde → grupo que se desvia (`dimgap`) → o que olhar a seguir (investigação) → limites → síntese → implicação.
- **Famílias permitidas:** `dist`, `atypical`, `atypical-rows`, `dimgap`, `overview`.
- **Gráficos:** box & whisker (principal), histograma, dispersão, nuvem de palavras (só para texto livre categorizado).
- **Não entra:** ranking, evolução, correlação entre medidas.
- **Regra:** anomalia nunca vira acusação ("outlier", não "erro" ou "fraude").

### 5.6 Relação entre medidas (`relation`)
- **Pergunta-guia:** "Uma medida varia junto com a outra?"
- **Arco 2:** (1) força e sentido da relação; (2) implicação.
- **Arco 5:** contexto → relação (`assoc`) → vale para todos os grupos? (`dimgap`) → casos fora da relação (`atypical-rows`) → implicação.
- **Arco 10:** contexto → visão geral → relação principal → segunda relação → separada por grupo → pontos que fogem → o que a relação **não** prova → limites → síntese → implicação.
- **Famílias permitidas:** `assoc`, `atypical-rows`, `dimgap`, `ratio`, `overview`.
- **Gráficos:** dispersão (principal), bolhas, mapa de calor do calendário não se aplica.
- **Não entra:** ranking, evolução, composição.
- **Regra de linguagem:** "varia junto", "anda com". Nunca "causa", "explica", "provoca". Relação mecânica (um valor derivado do outro) é descartada e vira nota de limite.

### 5.7 Geografia (`geo`) — Fase 2
- **Pergunta-guia:** "Onde as coisas acontecem?"
- **Arco 5:** contexto → região líder (`top`, `conc`) → regiões fracas (`bottom`) → diferença entre regiões (`spread`/`dimgap`) → implicação.
- **Famílias:** `top`, `bottom`, `conc`, `spread`, `dimgap`.
- **Gráficos:** mapa de bolhas por UF, mapa de isolinhas (só com lat/long), barras horizontais como alternativa.
- **Não entra:** tendência temporal (a menos que seja combinada).

### 5.8 Funil e conversão (`funnel`) — Fase 2
- **Pergunta-guia:** "Onde perdemos itens ao longo das etapas?"
- **Arco 5:** contexto → entrada e saída (`ratio`) → maior queda (`drop`) → quem escapa do padrão (`dimgap`) → implicação.
- **Famílias:** `drop`, `ratio`, `dimgap`, `top`, `bottom`.
- **Gráficos:** fluxo em funil (principal), barras por etapa.
- **Regra:** etapas só em ordem reconhecida; "perda" é descrição, não culpa.

### 5.9 Meta e desempenho (`goal`) — Fase 3
- **Pergunta-guia:** "Atingimos o planejado?"
- **Arco 5:** contexto → atingimento total (realizado/meta) → quem superou e quem ficou aquém → maior desvio → implicação.
- **Famílias novas:** `attain` (realizado ÷ meta), `variance` (desvio absoluto e %), reaproveitando `gap`/`ratio`.
- **Gráficos:** barras com marcador de meta (a criar), colunas agrupadas (realizado × meta).
- **Regra:** sem coluna de meta, a história não existe; o Datavix nunca assume uma meta.

### 5.10 Antes e depois (`before_after`) — Fase 3
- **Pergunta-guia:** "O que mudou depois do marco?"
- **Arco 5:** contexto → corte → variação média depois × antes → o que acompanhou a mudança (`dimgap`, só descrição) → implicação.
- **Famílias novas:** `step` (diferença de nível entre dois blocos de tempo, com teste e intervalo).
- **Regra de linguagem:** "depois de", nunca "por causa de". O corte é escolhido pela pessoa (data ou coluna de fase).

## 6. Mudança no fluxo do usuário

1. **Perguntas** (já existentes): área, público, decisão e tempo. A pergunta "Que história seus dados contam?" **sai do início** (hoje ela força uma decisão antes de ver a planilha).
2. **Subir a planilha**, como hoje.
3. **"Dá para contar:"** após a leitura da planilha (tela "Aguarde, estou entendendo"), até 3 cartões com: nome da história, a pergunta que ela responde e o `why` com números reais da planilha. Botões: escolher uma, "Ver todas" (as 10, com as impossíveis apagadas e o motivo) ou "Deixar o Datavix escolher" (pega a de maior `score`).
4. **Roteiro** segue o arco da história escolhida.
5. **No editor**, o painel História tem um seletor com as histórias possíveis; trocar de história refaz o roteiro (mantendo títulos digitados) e sugere o gráfico principal dela.
6. **Uma história por apresentação** por padrão; "Adicionar outra história" fica para uma fase posterior.

Impacto no "caminho curto" (gate 31): continua com 4 perguntas; a escolha da história passa a vir **depois** da leitura, com a sugestão já marcada, então o caminho "clicar em Continuar" permanece de um clique.

## 7. Como o motor aplica a história

Novo módulo `src/storykinds.js` (ou dentro de `storyplan.js`) com uma tabela declarativa:

```js
NV_STORIES = {
  compare: {
    name: { pt: 'Comparativo', en: 'Comparison' }, ask: { pt: '…', en: '…' },
    eligible: (cols, meta) => ({ ok, score, why }),
    allow: ['top','bottom','spread','gap','ratio','dimgap','shift','overview'],
    arc: { 2: [...], 5: [...], 10: [...] },         // lista de papéis e classes preferidas por papel
    charts: { primary: 'hbars', alts: ['cols','fan','rays','race'] },
  }, …
}
```

- `nvScore` ganha um **peso de pertencimento**: achado cuja classe não está em `allow` é descartado; achado preferido para o papel do slide recebe bônus.
- `nvPlan` deixa de ter um molde único de slots e passa a ler `arc[N]` da história. O molde atual de 10 slides (evolução, comparação, concentração, distribuição) vira a história "Visão completa" e **continua disponível** como opção "Panorama" para quem não quer escolher.
- `nvValidatePlan` passa a conferir: nenhum achado fora de `allow`; papel obrigatório preenchido ou marcado como "não sustentado" (comportamento atual).
- `chooseChart` usa `charts.primary` da história como sugestão, respeitando os dados (fit).
- Projetos antigos: `S.br.story` com valores antigos mapeia pela coluna "Antes" da seção 3.

## 8. Área de atuação como sinal (não como filtro)

As 12 áreas ajustam o `score` da sugestão, nunca bloqueiam. Valores iniciais:

| Área | Histórias impulsionadas |
|---|---|
| Vendas | `goal`, `rank`, `time` |
| Marketing | `funnel`, `relation`, `compare` |
| Growth | `funnel`, `time`, `before_after` |
| CX (pesquisas) | `compare`, `distribution`, `rank` |
| Finanças | `goal`, `time`, `composition` |
| Operações | `distribution`, `time`, `funnel` |
| RH | `distribution`, `compare`, `composition` |
| Saúde | `distribution`, `time`, `geo` |
| Educação | `relation`, `distribution`, `compare` |
| Setor público | `goal`, `geo`, `composition` |
| Jurídico | `time`, `rank`, `compare` |
| Geral | nenhuma (usa só o ajuste aos dados) |

## 9. Critérios de aceite e testes

Usar a bateria sintética (`dados-teste/bateria`, 16 planilhas com o que foi plantado em `bateria.json`) como gabarito. Para cada planilha, a sugestão (3 primeiras) e a lista de impossíveis devem ser:

| Planilha | Deve sugerir (ordem livre) | Deve marcar como impossível |
|---|---|---|
| `vendas_sazonal` | `time`, `compare`, `composition`, `relation` (Quantidade × Receita, ρ ≈ 0,86) | `geo` |
| `vendas_plana` | `compare`, `time` (descrevendo estabilidade) | — (e **nenhuma** afirmação de tendência) |
| `nps_pesquisa` | `compare`, `distribution` | `rank` (4 grupos) |
| `rh_folha` | `distribution`, `compare` | `relation` com `Matrícula` |
| `marketing_campanhas` | `relation`, `compare` | — |
| `saude_atendimentos` | `distribution`, `compare`, `time` | `relation` |
| `educacao_notas` | `relation`, `distribution` | relação com `Aluno` |
| `publico_orcamento` | `compare`, `rank` | `relation` (orçado × executado é mecânica) |
| `armadilha_ids` | `compare` pela `Situação` | `relation` e `rank` com CEP, telefone, código |
| `pequena` (12 linhas) | `compare` | `distribution`, `relation` |
| `dados_faltantes` | `time`, `compare` com aviso de 35% vazio | — |
| `negativos_zero` | `compare`, `time` | `composition` |
| `concentrado` | `rank` (cliente dominante), `composition` | — |
| `formato_brasil` | `time`, `compare` | — |
| `pivot_largo` | `time`, `compare` | — |
| `texto_livre` | `compare` (por canal), `rank` de categorias do comentário | `relation`, `distribution` |

Testes novos (padrão `test/m/*.js`, Chrome headless):
1. **elegibilidade** (`stories-elig.js`): roda as 10 funções sobre a bateria e compara com a tabela acima.
2. **pertencimento** (`stories-allow.js`): para cada história e planilha, nenhum slide traz achado fora de `allow`.
3. **arcos** (`stories-arc.js`): 2, 5 e 10 slides por história, todos passando `nvValidatePlan`, sem número fora da planilha.
4. **linguagem** (`stories-lang.js`): nenhum texto de `relation`/`before_after`/`funnel` contém "causa", "provoca", "devido a", "culpa".
5. **migração** (`stories-migrate.js`): projetos salvos com `story` antigo abrem e geram o mesmo roteiro-base.
6. **interface**: tela "Dá para contar:" (PT e EN), apagadas com motivo, "Deixar o Datavix escolher", troca no editor mantendo títulos digitados.

Critério geral: o que é **afirmado** continua verificável (cada slide com "ver cálculo"); onde a história não é sustentada, o slide diz isso em vez de preencher.

## 10. Entrega em portões (cada um local, testado e aprovado por você antes de publicar)

| Portão | Conteúdo |
|---|---|
| 42 | Tabela `NV_STORIES` com identificadores, nomes, perguntas e `allow`; funções de elegibilidade das 6 histórias da Fase 1; migração de `S.br.story`; testes 1 e 5. |
| 43 | Arcos de 2, 5 e 10 slides das 6 histórias, `nvPlan` lendo `arc[N]`, validação de pertencimento; testes 2, 3 e 4. |
| 44 | Interface: sai a pergunta inicial, entra "Dá para contar:", seletor no editor, sugestão do gráfico principal; ajuste do caminho curto. |
| 45 | Área de atuação como sinal de `score`; opção "Panorama" (molde atual). |
| 46 | Fase 2: `geo` e `funnel`. |
| 47 | Fase 3: `goal` e `before_after` (achados novos `attain`, `variance`, `step`), com marcador de meta no gráfico. |

## 11. Decisões que preciso de você

1. **Aprova o catálogo de 10 histórias e as 3 fases?** Ou prefere outro corte (por exemplo, `goal` já na Fase 1 se for o caso mais comum dos seus usuários)?
2. **Aprova tirar a pergunta "Que história seus dados contam?" do início** e mostrá-la depois da leitura da planilha, com a sugestão já marcada?
3. **"Panorama"** (o molde atual de 10 slides) deve continuar como 11ª opção?
4. **Os nomes** (Comparativo, Evolução no tempo, Ranking e concentração…) estão bons para o seu público, ou prefere termos mais curtos (ex.: "Quem lidera", "Como mudou", "Quem pesa mais")?
5. **Uma história por apresentação** é o padrão certo, ou já quer permitir combinar duas?

## 12. Riscos

- **Roteiros mais enxutos:** filtrar por pertencimento deixa menos achados por história. Mitigação: o slide "não sustentado" e a opção Panorama.
- **Sugestão errada:** se a sugestão automática errar, o usuário perde confiança. Mitigação: sempre mostrar o `why` com números e permitir trocar em um clique.
- **Limiares:** os valores desta especificação são iniciais. Mitigação: calibrar na bateria e, antes de publicar, com 3 a 5 planilhas reais suas (pendência já existente).
- **Escopo:** Fases 2 e 3 pedem achados e gráficos novos. Mitigação: entregar a Fase 1 sozinha e validar com usuários antes de seguir.
