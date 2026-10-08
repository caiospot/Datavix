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
