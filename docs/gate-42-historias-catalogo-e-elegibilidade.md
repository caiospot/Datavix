# Gate 42 — Catálogo de histórias e elegibilidade (local, aguardando aprovação)

Especificação: `docs/especificacao-historias.md`. Este portão **não muda nenhuma tela**: entrega a base que os próximos usam.

## O que foi feito (`src/stories.js`, no bundle compartilhado)
- **Catálogo `NV_STORIES`** com as 10 histórias: nome e pergunta em PT/EN, fase (1, 2 ou 3), famílias de achado permitidas (`allow`) e gráficos (principal e alternativos). Fase 1 = Comparativo, Evolução, Ranking e concentração, Composição, Distribuição, Relação. Fase 2 = Geografia, Funil. Fase 3 = Meta, Antes e depois.
- **Elegibilidade das 6 da Fase 1** (`nvStoryEligibility(ds, {lang})`): cada história devolve `{ ok, score, why, cols }`. `ok` é regra dura; `score` ordena; `why` é uma frase com números reais da planilha ("Loja: 10 valores · Receita"); quando bloqueada, `why` diz o motivo ("falta uma coluna de datas com pelo menos 4 períodos"). As da Fase 2/3 voltam `planned` ("em breve").
- **Sugestão** (`nvStorySuggest`): até 3 histórias possíveis com score ≥ 0,45, mais a lista de possíveis e a de bloqueadas.
- **Regras de dados reaproveitadas do motor:** medida sem identificador, grupos sem rótulos "sem informação/outros", período com ≥4 pontos no grão do rio, ≥30 linhas (`NV_ROWS.min`), relação mecânica descartada (`derived`), correlação só com |ρ| ≥ 0,4 e |ρ|·√(n−1) ≥ 3,5, composição só com medida que soma e sem negativos (>5% das linhas).
- **Entidades no Ranking:** colunas de nomes em que cada linha é um item (ex.: Município) entram só no Ranking; códigos, protocolos, CEP e telefone não.
- **Migração:** `nvStoryNorm` (antigo → novo: `flow`→`funnel`, o resto igual) e `nvStoryLegacy` (novo → vocabulário antigo: `rank`→`compare`, `before_after`→`time`, `goal`→`compare`, `funnel`→`flow`). `suggestMapping`, `chooseChart` e o aviso da tela de mapeamento aceitam os dois vocabulários, então nada que já existe quebra e projetos salvos continuam abrindo.

## Testes
- `test/m/stories-elig.js`: as 16 planilhas da bateria contra o gabarito da especificação (§9): histórias possíveis, bloqueadas e pelo menos uma esperada entre as 3 sugeridas. **Tudo conforme.**
- `test/m/stories-migrate.js`: 18 verificações (catálogo coerente, famílias e gráficos existentes, ida e volta dos 7 ids antigos, mapeamento e escolha de gráfico idênticos, plano de 5 slides válido com id antigo e novo). **Tudo certo.**
- Regressão do motor (bateria, planos, narrativa): ver o fim do documento.

## Ajuste ao gabarito da especificação
`vendas_sazonal` tem **duas** medidas (Quantidade e Receita, ρ ≈ 0,86): Relação é possível de verdade. A tabela do §9 dizia que não; corrigi no teste e na especificação.

## Limitações conhecidas (para calibrar no portão 45)
- Muitos scores saturam em 1,00 (ex.: Comparativo, Evolução e Composição empatam em planilhas comuns); o desempate hoje é a ordem do catálogo. Falta um critério mais fino (ex.: quantas colunas relevantes a história usa e o sinal da área).
- Composição aparece como possível em quase toda planilha com categorias (conta linhas quando a medida é média); pode ficar menos sugerida que Comparativo.
- Os limiares são iniciais; falta validar com 3 a 5 planilhas reais.
- Regressão do motor: `battery-run` (16 planilhas, sem falhas), `plan-run` (validador de plano) e `narrative-run` (sem falhas); o `index.html` abre por `file://` com a CSP estrita sem erros.
