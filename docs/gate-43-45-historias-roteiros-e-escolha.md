# Gates 43, 44 e 45 — Roteiros por história, escolha na interface e sinal da área (local, aguardando aprovação)

## Gate 43 — arcos e pertencimento (`src/stories.js`, `src/storyplan.js`)
- **Arcos de 2, 5 e 10 slides** para as 6 histórias da Fase 1 (`NV_ARCS`): cada passo é contexto, visão geral, achado de uma lista de classes (em ordem de preferência), síntese ou implicação. Os títulos dos slides são da história ("Quem lidera", "Tendência", "Concentração", "Maior parte do total", "Valor típico e faixa", "Relação principal"…), em PT e EN.
- **Pertencimento:** `nvStoryPool` só deixa passar achados cuja família está em `allow` da história (achados de "casos" entram por equivalência: taxa → razão, onde → diferença entre grupos). Relações entre achados são recortadas junto.
- **Sem base não se preenche:** se não há achado da classe, entra um complementar da mesma história; se nem isso, o slide diz "sem dados para esta análise".
- **Validador:** `nvPlanStory` confere tamanho, regras antigas (causa, acusação, ressalva, repetição) e o novo erro `out-of-story`.
- **Compatibilidade:** `nvPlan(P, meta, steps, N, storyId)`; `nvPlanFor` usa `P.br.storyKind` (vazio = Panorama, o roteiro de sempre). Apresentação, vídeo e PPTX passam a seguir a história escolhida.
- Teste `test/m/stories-arc.js`: 16 planilhas × 6 histórias × 3 tamanhos = **288 planos, 1.632 slides**, todos válidos, nenhum achado fora da história, nenhuma linguagem proibida (a palavra "explica" em contribuição/mudança é a exceção que o próprio motor já tem). Tudo conforme.

## Gate 44 — escolha da história na interface (`src/storyui.js`)
- Depois de gerar a peça aparece **"Que história contar?"** com até 3 histórias que a planilha sustenta, a melhor já marcada (um clique em "Contar esta história"). Cada cartão mostra a pergunta, os números reais ("Mês: 36 períodos · Receita") e quantos achados existem. **"Ver todas as histórias"** lista as outras (as impossíveis apagadas, com o motivo) e o **Panorama**. Esc aceita a primeira; botão "Panorama (visão completa)" mantém o roteiro de sempre.
- Se só uma (ou nenhuma) é possível, não pergunta nada.
- **No editor**, a aba Gráfico ganhou o seletor **História** (Panorama + histórias disponíveis; indisponíveis apagadas). Trocar muda o roteiro e sugere o gráfico principal da história com um botão "Usar".
- O ranking usa os achados já calculados (`nvStoryRank`): história sem achado nenhum não é sugerida; achado firme sobe, só exploratório desce.
- No build de teste a janela só aparece com `?tell` ou `?auto` (como o caminho curto), para não quebrar os testes antigos.
- Teste `test/m/stories-ui.js` (21 verificações): janela, marcação, números reais, "ver todas", escolha, seletor, roteiro seguindo a história, Panorama, Esc. Tudo certo.

## Gate 45 — a área de atuação é sinal, nunca filtro
- `nvStoryAreaBoost`: a tabela da especificação §8 empurra a sugestão (+0,08, +0,05, +0,03 para as três histórias da área). O teste confirma que a área só **reordena** (as histórias possíveis são as mesmas): Vendas sobe Evolução; Finanças também.
- O Panorama é a 11ª opção, na janela e no painel.

## Gate 46 — Geografia e Funil (Fase 2)
- **Geografia** é possível com coluna de estado/município reconhecida (mapa de bolhas por UF) ou latitude + longitude com 20+ pontos (mapa de isolinhas). **Funil** exige 2 a 5 colunas de etapas que **parecem** etapas: o nome diz (etapa, fase, proposta, resultado…) ou o preenchimento cai de uma etapa para a próxima. Isso barra o falso positivo de duas colunas de categoria quaisquer (ex.: Loja → Segmento).
- **Arcos de 2, 5 e 10 slides** para as duas ("Maior perda entre etapas", "Quanto passa de uma etapa à outra", "Quem lidera", "Concentração"…).
- **Remontagem:** os achados de uma história que pede outro mapeamento (geo, funil, tempo) só existem depois de remontar a peça. Escolher uma história sem achados na peça atual remonta os dados com o mapeamento dela (mantendo título, paleta, fundo e textos editados) e sugere o gráfico dela (mapa de bolhas, funil).
- Teste `test/m/stories-geo-funnel.js`: funil (leads com etapas), UF (planilha ideal), latitude/longitude, e uma planilha sem nenhum dos dois. Tudo certo. Na bateria, Geografia/Funil só aparecem onde existem (publico_orcamento tem UF).

## Gate 47 — Meta e desempenho, Antes e depois (Fase 3)
**Achados novos, com evidência e recálculo independente** (`NV_CALC`: `attain`, `varc`, `step`; classes `attain`, `variance`, `step`), validados pelo mesmo `nvCheckItem` dos demais:
- **Meta e desempenho:** exige uma coluna de meta reconhecida pelo nome (meta, orçado, planejado, previsto, target, budget, forecast…) e uma medida de realizado. Achados: atingimento total (realizado ÷ meta, com os totais à vista), quem mais superou e quem mais ficou aquém (por grupo, só com 3+ grupos e desvio ≥ 5%). **Sem coluna de meta, a história não existe e nada é inventado.**
- **Antes e depois:** o marco vem de uma coluna de fase com duas categorias (Antes/Depois, Pré/Pós) ou de uma **data escolhida pela pessoa** no painel (campo "Data do marco"). O degrau compara a média por período dos dois lados, no grão mais grosso com 6+ períodos de cada lado (mínimo 4), e só vira achado com **t de Welch ≥ 2**; períodos que misturam os dois lados ficam de fora. Linguagem: "depois do marco", nunca causa. Sem fase e sem data, a história aparece como possível mas **nunca é sugerida sozinha**.
- **Arcos** de 2, 5 e 10 slides para as duas, com o slide "O que não dá para afirmar".
- **Sugestão:** meta e antes/depois (com fase) pontuam alto e, em empate, a história específica vence a genérica (Meta sobe para a 1ª posição na planilha de metas).
- A data do marco fica na peça (`P.br.cut`), vai para o exportado e remonta o degrau ao mudar.
- Dados de teste: `dados-teste/metas.csv`, `antes-depois.csv`, `serie-sem-fase.csv`. Teste `test/m/stories-goal.js` (26 verificações, inclui degrau pequeno recusado pelo validador, marco que deixa poucos períodos e ausência de meta).

## Resumo dos testes (portões 43 a 47)
Tudo passou em localhost, sem erros de página: `stories-elig` (16 planilhas contra o gabarito), `stories-migrate` (18 verificações), `stories-arc` (288 planos, 1.632 slides), `stories-ui`, `stories-geo-funnel`, `stories-goal` (26 verificações), e a regressão do que já existia: `battery-run` (16 planilhas, zero falhas), `narrative-run`, `plan-run`, `auto-run` (caminho curto), `layer-run`, `pptx-ui`; o `index.html` abre por `file://` com a CSP estrita sem erros.
