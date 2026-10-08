# Gate 24 · Pergunta de área de atuação (passo 1 da inteligência por área)

A primeira pergunta do Datavix passou a ser **"Em que área você vai apresentar?"**, com 12 opções, e a landing diz "4 perguntas". A área **ajusta sugestões, nunca números**: nenhum valor da planilha muda, nenhum fato é inventado, e "Outra área ou geral" mantém o comportamento anterior.

## As 12 áreas
Experiência do cliente (CX), Marketing, Growth e produto, Vendas e comercial, Finanças, Jurídico, Saúde, Operações e logística, Pessoas e RH, Educação, Setor público, Outra área ou geral.

## O que a área ajusta (src/areas.js, compartilhado)
Cada área tem um dicionário de nomes de coluna, aplicado **depois** dos padrões de valor:
- **Tipo do número pelo nome:** nota, taxa/atributo (usa média), duração (média), quantidade ou valor (soma). Ex.: em Marketing, CTR e CPC são médias e impressões e leads somam; em Saúde, "tempo de espera" é duração e "atendimentos" soma.
- **Medida que abre a história:** em Saúde, atendimentos (e não o custo); em Marketing, leads/conversões; em Finanças, realizado.
- **Identificador e dado pessoal pelo nome** (prontuário, processo, matrícula; paciente, aluno, parte, colaborador), sempre com confirmação pelos valores (precisa parecer nome de pessoa).
- **Planilha de casos:** vocabulário do resultado (resolvido, procedente, alta, aprovado...), da causa (motivo, natureza, assunto...) e do texto livre (voz do cliente, queixa, parecer...). Soma-se ao genérico.
- **Inclinação para "casos"** (de −2 a +2): CX +2; Jurídico, Saúde e Setor público +1; Finanças −2; Vendas e Marketing −1. Só desempata a leitura do tipo; a pessoa continua podendo trocar.
- **Peso dos fatos:** a área empurra a prioridade de certos tipos de fato (tendência em Growth; queda e fora da curva em Finanças; taxa, impacto e causas em CX; gargalo em Operações...). Nenhum fato é escondido, só muda a ordem sugerida.

## Onde aparece
Leitura da planilha, escolha da medida e do gráfico inicial, análise de casos, ordem dos fatos em "O que encontrei" e o corte por tempo na apresentação. A linha "efeito das respostas" do roteiro inclui a área.

## Testes
`test/area-check.js`: Saúde (paciente é dado pessoal, prontuário é identificador, tempo de espera é duração, atendimentos abre a história, e "geral" volta a custo), Marketing (CTR média, impressões somam, leads abre), pesos de prioridade e a planilha ideal com CX, Finanças e Marketing. `test/onboarding.js` agora passa pela pergunta de área. Regressão dos demais testes igual ao gate 23.

## Próximos passos
2) roteiro e textos padrão por área (tese, pedido final e termos); 3) despivotar planilhas largas, cabeçalho deslocado e detecção de "resumo já somado".

---

# Passo 2 · Roteiro e textos padrão por área

A área passou a conduzir também o **roteiro** e os **textos sugeridos** (`AREA_TXT` em `src/areas.js`). Tudo continua sendo sugestão marcada como tal: o fato e o número vêm dos dados; o julgamento é da pessoa.

- **Ordem do roteiro (arco da área):** ao montar o roteiro (rápido ou nas 3 perguntas), as evidências entram na ordem em que a área costuma contar. CX: taxa → impacto → onde varia → causas. Finanças: tendência → quem explica a variação → quem ganhou participação → queda → fora da curva. Marketing: conversão do funil → gargalo → líder. Em "Outra área ou geral" vale a ordem de antes.
- **Escolha do ponto central:** os pesos da área (passo 1) decidem o fato sugerido. Na planilha ideal, Finanças abre com "E-commerce explica 44% da alta do período", enquanto sem área abre com o pico.
- **Sugestões de tese:** prefixo por tipo de fato e por área ("Resolver bem muda o resultado do cliente: …", "Quem explica a variação: …", "A conversão do funil: …").
- **Pedido final:** modelo da decisão escolhida com o objeto da área ("Definir quem corrige os pontos da jornada com pior resolução e até quando", "Aprovar a revisão da previsão com base nos desvios").
- **Ações e implicações sugeridas** por área, à frente das genéricas (no modo rápido, nas 3 perguntas e no modo detalhado).
- **Exemplos nos campos** de tese e de pedido, na linguagem da área.
- Tudo em português e inglês. As 11 áreas têm textos; "Outra área ou geral" usa os genéricos.

Teste: `test/m/area-script.js` (CX com arco, placeholder, sugestão de tese e pedido; geral sem vocabulário) e verificação da planilha ideal com Finanças, Vendas, Geral e Marketing.
