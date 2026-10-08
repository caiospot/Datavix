/* Datavix: áreas de atuação. A área escolhida na primeira pergunta ajusta SUGESTÕES, nunca números: sinônimos de coluna (o que é nota, taxa,
 * duração, quantidade ou valor), qual coluna é o resultado e qual é a causa em planilhas de casos, qual medida abre a história e quais fatos pesam mais.
 * Os valores da planilha não mudam e nenhum fato é inventado: sem a palavra na coluna, vale só o que os dados mostram.
 * Campos: cases (viés para "cada linha é um caso", de -2 a +2), money (medida que abre a história), outcome/cause/text (casos), id/pii (nomes de coluna),
 * measures (subtipo do número pelo nome) e boost (ajuste de prioridade por tipo de fato; negativo = mais importante). */
const AREAS = {
  cx: {
    cases: 2, money: /nps|csat|satisf|chamad|ticket|protocolo|reclama/i, outcome: /solucion|resolv|resolu|solved|sucesso|atendid|fcr/i, cause: /causa|motivo|ofensor|detrator|reason|cause|ra[zç][aã]o|dor\b|problema/i, text: /voz|verbatim|coment|feedback|relato|sugest|reclama|diagn/i,
    id: /protocolo|ticket|chamado|caso|msisdn|contrato/i, pii: /cliente|titular|contratante|assinante|solicitante/i,
    measures: { score: /nps|csat|ces\b|nota|avalia|satisf/i, duration: /tma|tme|tempo de (espera|resposta|resolu|atendimento)|sla|esfor[cç]o|prazo|tat\b/i, count: /chamad|ticket|protocolo|reclama|contatos?|atendimentos?|interac/i, attr: /taxa|fcr|churn|recontato|rechama|%/i },
    boost: { c_impact: -1, c_cause: -0.6, c_rate: -0.3, c_terms: -0.4, trend_down: -0.5 }
  },
  marketing: {
    cases: -1, money: /convers|lead|receita|revenue|invest|gasto|spend/i, outcome: /convert|ganho|fechad|mql|sql/i, cause: /motivo|origem|canal|campanha/i, text: /coment|feedback|criativo|mensagem/i,
    id: /campanha id|id da campanha|utm|cod/i, pii: /lead|contato|nome do (lead|contato)/i,
    measures: { attr: /ctr|cpc|cpa|cpl|cpm|roas|roi|taxa|rate|convers[aã]o %|%/i, count: /impress|cliques|clicks|leads?|mql|sql|sessoes|sess[õo]es|visitas|alcance|reach|engaj|seguidores/i, amount: /invest|gasto|spend|or[cç]amento|budget|custo|receita|revenue/i, score: /nps|qualidade|score/i },
    boost: { flow_conv: -1, flow_drop: -1, trend_up: -0.5, leader: -0.3, outlier: -0.3 }
  },
  growth: {
    cases: 0, money: /usu[aá]rios|users|ativos|active|mrr|arr|signups?|cadastros|receita|retenc|ativa/i, outcome: /ativ|retid|convert|upgrade|ganho/i, cause: /motivo|churn|cancel|reason/i, text: /coment|feedback|sugest/i,
    id: /user id|usu[aá]rio id|id do usu|conta id|account/i, pii: /usu[aá]rio|user|e-?mail|nome/i,
    measures: { attr: /ctr|taxa|rate|convers|churn|reten|ativa[cç][aã]o|%/i, count: /usu[aá]rios|users|sess|eventos|events|cadastros|signups?|instala|downloads|dau|mau|wau/i, amount: /mrr|arr|receita|revenue|ltv|arpu|cac\b/i, duration: /tempo|sess[aã]o|dias|time|ttv/i },
    boost: { trend_up: -1, jump_up: -0.8, flow_conv: -0.8, flow_drop: -0.6, trend_down: -0.6 }
  },
  sales: {
    cases: -1, money: /receita|venda|faturamento|valor|ticket|pipeline|revenue|sales|total/i, outcome: /ganho|fechad|won|convert|vendid/i, cause: /motivo (da )?perda|perdido|loss|reason/i, text: /observa|coment|obje[cç][aã]o|nota/i,
    id: /pedido|proposta|oportunidade|nf\b|nota fiscal|n[uú]mero|cod/i, pii: /cliente|comprador|contato|respons[aá]vel|vendedor/i,
    measures: { amount: /receita|venda|faturamento|valor|pipeline|comiss|revenue|sales|total|pre[cç]o|custo/i, count: /quant|qtd|pedidos|unidades|volume|visitas|propostas/i, attr: /margem|desconto|convers|ticket m[eé]dio|taxa|%|atingimento/i, duration: /prazo|ciclo|dias|tempo/i },
    boost: { leader: -0.6, dominant: -0.6, conc: -0.4, trend_up: -0.5, peak: -0.3, flow_conv: -0.6 }
  },
  finance: {
    cases: -2, money: /realizado|receita|revenue|despesa|saldo|caixa|valor|ebitda|lucro|resultado|custo|total/i, outcome: /aprovad|pago|liquidad|conciliad/i, cause: /motivo|natureza|centro de custo|conta cont[aá]bil/i, text: /hist[oó]rico|descri|observa|coment/i,
    id: /lan[cç]amento|documento|nf\b|nota fiscal|t[ií]tulo|conta cont|cod/i, pii: /favorecido|fornecedor|respons[aá]vel|solicitante|benefici/i,
    measures: { amount: /realizado|receita|despesa|saldo|caixa|valor|ebitda|lucro|resultado|custo|or[cç]ad|meta|forecast|previsto|total/i, attr: /margem|varia[cç][aã]o|inadimpl|taxa|juros|roi|%|desvio/i, duration: /prazo|dso|dpo|aging|dias/i, count: /quant|qtd|lan[cç]amentos|t[ií]tulos|notas/i },
    boost: { trend_up: -0.8, trend_down: -0.8, drop: -0.7, outlier: -0.7, contrib: -0.6, shift: -0.4, peak: -0.2 }
  },
  legal: {
    cases: 1, money: /valor da causa|provis|contingen|honor|condena|valor|exposi/i, outcome: /proced|ganho|[eê]xito|favor[aá]vel|vit[oó]ria|acordo/i, cause: /motivo|natureza|assunto|objeto|tese|reason/i, text: /resumo|objeto|andamento|despacho|ementa|observa|parecer/i,
    id: /processo|n[uú]mero (do )?processo|cnj|protocolo|contrato|pasta/i, pii: /parte|autor|r[eé]u|requerente|requerido|cliente|advogado|respons[aá]vel|nome/i,
    measures: { amount: /valor da causa|provis|contingen|honor|condena|custas|exposi|pagamento/i, duration: /prazo|dias|tempo|dura[cç][aã]o|idade do processo/i, count: /processos?|audi[eê]ncias|prazos|a[cç][oõ]es|quant/i, attr: /probabilidade|risco|taxa|%/i, score: /risco|score|prob/i },
    boost: { c_rate: -0.6, c_cause: -0.6, c_where: -0.5, conc: -0.6, outlier: -0.6, dominant: -0.4 }
  },
  health: {
    cases: 1, money: /atendimento|consulta|paciente|interna[cç]|exame|procedimento|leito|ocupa/i, outcome: /alta|cura|recuper|[eê]xito|efetiv|resolv|compareceu/i, cause: /motivo|diagn[oó]stico|cid|queixa|causa|reason/i, text: /queixa|evolu[cç][aã]o|observa|coment|anamnese|descri/i,
    id: /prontu[aá]rio|atendimento id|guia|protocolo|cart[aã]o|sus|cod/i, pii: /paciente|nome|m[aã]e|respons[aá]vel|benefici[aá]rio|titular|m[eé]dico|profissional|cpf/i,
    measures: { count: /atendimentos?|consultas?|pacientes?|interna[cç][oõ]es|exames?|procedimentos?|cirurgias?|leitos?|quant|qtd|visitas/i, duration: /tempo de (espera|perman[eê]ncia|atendimento)|perman[eê]ncia|espera|dias de|tma/i, attr: /taxa|ocupa[cç][aã]o|mortalidade|readmiss|absente[ií]smo|no[- ]?show|%/i, score: /nps|satisf|nota|avalia|risco|escore|score/i, amount: /custo|valor|receita|faturamento|glosa|repasse/i },
    boost: { c_rate: -0.6, c_where: -0.6, c_impact: -0.5, outlier: -0.5, trend_up: -0.3, trend_down: -0.3, peak: -0.3 }
  },
  ops: {
    cases: 0, money: /volume|quantidade|entregas?|pedidos|produ[cç][aã]o|unidades|pe[cç]as|toneladas|viagens|cargas|custo/i, outcome: /no prazo|conclu|entregue|aprovad|conforme/i, cause: /motivo|causa|ocorr[eê]ncia|falha|parada|reason|devolu/i, text: /observa|ocorr[eê]ncia|coment|descri/i,
    id: /ordem|op\b|lote|carga|pedido|nota fiscal|nf\b|rastreio|sku|cod/i, pii: /motorista|operador|respons[aá]vel|conferente|cliente|destinat[aá]rio/i,
    measures: { count: /volume|quantidade|qtd|entregas?|pedidos|pe[cç]as|unidades|viagens|cargas|paradas|ocorr[eê]ncias/i, duration: /prazo|lead ?time|tempo|ciclo|dias|horas|atraso|tat\b|setup/i, amount: /custo|frete|valor|despesa|receita/i, attr: /oee|taxa|ocupa[cç][aã]o|utiliza[cç][aã]o|otif|perda|refugo|%/i, score: /nps|nota|avalia/i },
    boost: { outlier: -0.8, flow_drop: -0.8, drop: -0.5, trend_down: -0.5, conc: -0.3, c_rate: -0.4 }
  },
  hr: {
    cases: 0, money: /headcount|colaboradores|funcion[aá]rios|contrata|admiss|folha|desligamentos|turnover/i, outcome: /aprovad|contratad|promovid|retid|conclu|ativo/i, cause: /motivo (do )?(desligamento|sa[ií]da)|causa|reason|motivo/i, text: /coment|feedback|clima|observa|sugest|justificativa/i,
    id: /matr[ií]cula|registro|id (do )?(colaborador|funcion)|cod|vaga/i, pii: /colaborador|funcion[aá]rio|nome|gestor|candidato|respons[aá]vel|cpf|sal[aá]rio|remunera/i,
    measures: { count: /headcount|colaboradores|funcion[aá]rios|contrata[cç][oõ]es|admiss[oõ]es|desligamentos|vagas|candidatos|quant|qtd/i, attr: /turnover|absente[ií]smo|taxa|%|rotatividade|reten[cç][aã]o|diversidade/i, duration: /tempo de (casa|empresa|contrata|preenchimento)|time to|dias|anos de|tenure/i, score: /enps|nps|clima|engaj|nota|avalia|satisf|score/i, amount: /folha|custo|sal[aá]rio|remunera|benef[ií]cio|treinamento|or[cç]amento/i },
    boost: { trend_down: -0.8, drop: -0.6, c_rate: -0.4, c_cause: -0.5, shift: -0.5, contrib: -0.4 }
  },
  education: {
    cases: 0, money: /matr[ií]cula|alunos|estudantes|vagas|inscri|aprova|presen[cç]a|nota|frequ/i, outcome: /aprovad|conclu|formad|ativo|presente|retid|matriculado/i, cause: /motivo|evas[aã]o|causa|reason|desist/i, text: /coment|feedback|observa|parecer|relato/i,
    id: /matr[ií]cula|ra\b|registro|turma id|cod|inep/i, pii: /aluno|estudante|nome|respons[aá]vel|professor|m[aã]e|pai|cpf/i,
    measures: { count: /matr[ií]culas?|alunos|estudantes|vagas|inscri[cç][oõ]es|turmas|aulas|quant|qtd/i, attr: /frequ[eê]ncia|presen[cç]a|evas[aã]o|aprova[cç][aã]o|reprova|taxa|%|conclus[aã]o/i, score: /nota|m[eé]dia|conceito|desempenho|enem|score|avalia|nps/i, duration: /carga hor[aá]ria|horas|dias|tempo|semestres/i, amount: /mensalidade|bolsa|custo|receita|valor|investimento/i },
    boost: { c_rate: -0.5, c_where: -0.5, trend_down: -0.6, drop: -0.4, outlier: -0.4, low: -0.3 }
  },
  public: {
    cases: 1, money: /execut|empenh|liquid|pago|despesa|or[cç]amento|atendimentos?|benefici|demandas?|solicita|popula/i, outcome: /atendid|conclu|resolv|deferid|aprovad|execut/i, cause: /motivo|assunto|tipo de demanda|natureza|reason|indeferi/i, text: /descri[cç][aã]o|solicita[cç][aã]o|relato|manifesta|observa|coment/i,
    id: /protocolo|processo|n[uú]mero|empenho|contrato|licita|cod|ibge/i, pii: /cidad[aã]o|solicitante|requerente|benefici[aá]rio|nome|respons[aá]vel|servidor|cpf/i,
    measures: { amount: /empenh|liquid|pago|despesa|or[cç]amento|dota[cç][aã]o|valor|repasse|investimento|execu[cç][aã]o/i, count: /atendimentos?|demandas?|solicita[cç][oõ]es|manifesta[cç][oõ]es|benefici[aá]rios|processos|ocorr[eê]ncias|quant|qtd|popula/i, duration: /prazo|tempo de (resposta|atendimento)|dias|espera|tma/i, attr: /taxa|execu[cç][aã]o %|cobertura|%|per capita|[ií]ndice/i, score: /nps|satisf|avalia|nota|ouvidoria/i },
    boost: { c_rate: -0.6, c_where: -0.6, c_cause: -0.5, contrib: -0.4, shift: -0.4, conc: -0.4 }
  },
  general: { cases: 0, boost: {} },
};

// área escolhida (S.br.area ou P.br.area): chave conhecida ou "general"
const areaOf = key => AREAS[key] || AREAS.general;
// o nome da coluna casa com a regra da área? (sem área ou regra, não casa)
const areaHit = (key, field, name) => { const a = AREAS[key], re = a && a[field]; return !!(re && re.test(String(name))); };
const areaMeasureType = (key, name) => { const a = AREAS[key], m = a && a.measures; if (!m) return null; for (const t of ['score', 'duration', 'count', 'attr', 'amount']) if (m[t] && m[t].test(String(name))) return t; return null; };

/* ---- textos e roteiro padrão por área (sempre sugestões, marcadas como sugestão; o fato vem dos dados) ----
 * obj: do que trata o pedido final; act/impl: ações e implicações sugeridas; thesis: prefixo da tese por tipo de fato;
 * arc: ordem em que a área costuma contar a história; ex: exemplos dos campos de tese e de pedido. */
const AREA_TXT = {
  cx: {
    arc: ['c_rate', 'c_impact', 'c_where', 'c_cause', 'c_terms', 'trend_down', 'trend_up', 'peak', 'drop'],
    pt: { obj: 'os pontos da jornada com pior resolução', act: ['Tratar a causa mais frequente com um responsável', 'Revisar a jornada com a menor taxa de resolução', 'Acompanhar o recontato após o encerramento'], impl: ['Quando o caso é resolvido, o cliente volta menos e fica mais satisfeito', 'A causa mais citada indica onde o processo falha'],
      thesis: { c_impact: 'Resolver bem muda o resultado do cliente: ', c_rate: 'A taxa de resolução: ', c_where: 'O resultado varia entre jornadas: ', c_cause: 'A causa que mais se repete: ', trend_down: 'A experiência piora: ' }, ex: { thesis: 'Ex.: Resolver na primeira vez reduz o retorno do cliente', ask: 'Ex.: Aprovar a revisão da jornada com menor taxa de resolução' } },
    en: { obj: 'the journey points with the weakest resolution', act: ['Address the most frequent cause with an owner', 'Review the journey with the lowest resolution rate', 'Track recontact after the case is closed'], impl: ['When the case is resolved, the customer comes back less and is more satisfied', 'The most cited cause shows where the process fails'],
      thesis: { c_impact: 'Resolving well changes the customer outcome: ', c_rate: 'The resolution rate: ', c_where: 'The result varies across journeys: ', c_cause: 'The cause that repeats most: ', trend_down: 'The experience is getting worse: ' }, ex: { thesis: 'E.g.: Resolving on the first contact reduces customer return', ask: 'E.g.: Approve the review of the journey with the lowest resolution rate' } }
  },
  marketing: {
    arc: ['flow_conv', 'flow_drop', 'leader', 'dominant', 'trend_up', 'trend_down', 'conc', 'contrast', 'peak', 'outlier'],
    pt: { obj: 'os canais e campanhas que mais convertem', act: ['Realocar verba para os canais que mais convertem', 'Pausar ou refazer as campanhas de pior retorno', 'Testar a mensagem do canal com maior queda'], impl: ['O resultado depende de poucos canais', 'Há uma etapa do funil que concentra a perda'],
      thesis: { flow_conv: 'A conversão do funil: ', flow_drop: 'O funil perde força em uma etapa: ', leader: 'Um canal entrega mais: ', dominant: 'Um canal domina o resultado: ', trend_up: 'O resultado cresce: ' }, ex: { thesis: 'Ex.: Dois canais respondem pela maior parte das conversões', ask: 'Ex.: Aprovar a realocação de verba para os canais com maior conversão' } },
    en: { obj: 'the channels and campaigns that convert most', act: ['Reallocate budget to the channels that convert most', 'Pause or redo the lowest-return campaigns', 'Test the message on the channel with the biggest drop'], impl: ['The result depends on a few channels', 'One funnel stage concentrates the loss'],
      thesis: { flow_conv: 'Funnel conversion: ', flow_drop: 'The funnel loses strength at one stage: ', leader: 'One channel delivers more: ', dominant: 'One channel dominates the result: ', trend_up: 'The result is growing: ' }, ex: { thesis: 'E.g.: Two channels account for most conversions', ask: 'E.g.: Approve reallocating budget to the channels with the highest conversion' } }
  },
  growth: {
    arc: ['flow_conv', 'flow_drop', 'trend_up', 'jump_up', 'trend_down', 'drop', 'leader', 'peak', 'conc'],
    pt: { obj: 'as etapas em que perdemos mais usuários', act: ['Atacar a etapa com maior perda do funil', 'Replicar o que funciona no segmento que mais cresce', 'Definir uma métrica de ativação e acompanhá-la'], impl: ['O crescimento vem de poucos segmentos ou canais', 'A perda entre etapas limita o resultado'],
      thesis: { trend_up: 'O crescimento acelera: ', jump_up: 'Houve uma virada: ', flow_drop: 'Perdemos usuários em uma etapa: ', flow_conv: 'A conversão entre etapas: ', trend_down: 'O ritmo desacelera: ' }, ex: { thesis: 'Ex.: A ativação é o gargalo do crescimento', ask: 'Ex.: Aprovar um experimento para melhorar a etapa com maior perda' } },
    en: { obj: 'the steps where we lose the most users', act: ['Tackle the funnel step with the biggest loss', 'Replicate what works in the fastest-growing segment', 'Define an activation metric and track it'], impl: ['Growth comes from a few segments or channels', 'Loss between steps limits the result'],
      thesis: { trend_up: 'Growth is accelerating: ', jump_up: 'There was a turn: ', flow_drop: 'We lose users at one step: ', flow_conv: 'Conversion between steps: ', trend_down: 'The pace is slowing: ' }, ex: { thesis: 'E.g.: Activation is the growth bottleneck', ask: 'E.g.: Approve an experiment to improve the step with the biggest loss' } }
  },
  sales: {
    arc: ['leader', 'dominant', 'conc', 'trend_up', 'trend_down', 'contrib', 'shift', 'flow_conv', 'peak', 'drop', 'outlier'],
    pt: { obj: 'as contas e canais de maior receita', act: ['Concentrar o time nas contas de maior receita', 'Investigar a queda no canal que mais perdeu', 'Rever o desconto onde a margem caiu'], impl: ['A receita depende de poucas contas ou canais', 'Há uma região ou canal ganhando participação'],
      thesis: { leader: 'A receita se concentra: ', dominant: 'Um grupo domina a receita: ', trend_up: 'A receita cresce: ', trend_down: 'A receita recua: ', contrib: 'Quem explica a mudança: ' }, ex: { thesis: 'Ex.: A receita depende de três canais', ask: 'Ex.: Aprovar o plano para proteger as contas de maior receita' } },
    en: { obj: 'the top-revenue accounts and channels', act: ['Focus the team on the top-revenue accounts', 'Investigate the drop in the channel that lost most', 'Review discounts where margin fell'], impl: ['Revenue depends on a few accounts or channels', 'A region or channel is gaining share'],
      thesis: { leader: 'Revenue is concentrated: ', dominant: 'One group dominates revenue: ', trend_up: 'Revenue is growing: ', trend_down: 'Revenue is declining: ', contrib: 'Who explains the change: ' }, ex: { thesis: 'E.g.: Revenue depends on three channels', ask: 'E.g.: Approve the plan to protect the top-revenue accounts' } }
  },
  finance: {
    arc: ['trend_up', 'trend_down', 'contrib', 'shift', 'drop', 'jump_up', 'outlier', 'peak', 'low', 'leader', 'conc'],
    pt: { obj: 'os desvios contra o previsto', act: ['Explicar o desvio com o responsável da conta', 'Rever a previsão do próximo período', 'Definir um limite de alerta para desvios'], impl: ['Poucos itens explicam a maior parte da variação', 'Um valor fora do padrão pede explicação antes do fechamento'],
      thesis: { trend_up: 'O resultado cresce: ', trend_down: 'O resultado recua: ', drop: 'Houve uma queda a explicar: ', outlier: 'Um valor fora do padrão pede explicação: ', contrib: 'Quem explica a variação: ' }, ex: { thesis: 'Ex.: Dois itens explicam a maior parte do desvio', ask: 'Ex.: Aprovar a revisão da previsão com base nos desvios' } },
    en: { obj: 'the deviations from plan', act: ['Explain the deviation with the account owner', 'Review the forecast for the next period', 'Set an alert threshold for deviations'], impl: ['A few items explain most of the variation', 'An out-of-pattern value needs an explanation before closing'],
      thesis: { trend_up: 'The result is growing: ', trend_down: 'The result is declining: ', drop: 'There was a drop to explain: ', outlier: 'An out-of-pattern value needs an explanation: ', contrib: 'Who explains the variation: ' }, ex: { thesis: 'E.g.: Two items explain most of the deviation', ask: 'E.g.: Approve the forecast review based on the deviations' } }
  },
  legal: {
    arc: ['c_rate', 'c_where', 'c_cause', 'conc', 'dominant', 'outlier', 'leader', 'trend_up', 'trend_down', 'peak'],
    pt: { obj: 'os processos de maior exposição', act: ['Priorizar os casos de maior valor ou risco', 'Revisar a provisão dos processos concentrados', 'Definir um responsável por prazo crítico'], impl: ['A exposição se concentra em poucos processos ou assuntos', 'Há prazos que dependem de decisão agora'],
      thesis: { conc: 'A exposição se concentra: ', dominant: 'Um assunto domina os processos: ', outlier: 'Um processo destoa dos demais: ', c_rate: 'A taxa de êxito: ', c_where: 'O resultado varia por assunto: ' }, ex: { thesis: 'Ex.: Poucos processos concentram a maior parte da exposição', ask: 'Ex.: Aprovar a revisão da provisão dos processos de maior valor' } },
    en: { obj: 'the highest-exposure cases', act: ['Prioritize the highest value or risk cases', 'Review the provision for the concentrated cases', 'Assign an owner for each critical deadline'], impl: ['Exposure is concentrated in a few cases or subjects', 'Some deadlines depend on a decision now'],
      thesis: { conc: 'Exposure is concentrated: ', dominant: 'One subject dominates the cases: ', outlier: 'One case stands apart from the rest: ', c_rate: 'The success rate: ', c_where: 'The result varies by subject: ' }, ex: { thesis: 'E.g.: A few cases hold most of the exposure', ask: 'E.g.: Approve the provision review for the highest-value cases' } }
  },
  health: {
    arc: ['c_rate', 'c_where', 'c_impact', 'c_cause', 'outlier', 'peak', 'trend_up', 'trend_down', 'leader', 'conc'],
    pt: { obj: 'as unidades e filas com maior espera', act: ['Reforçar a unidade ou o horário com maior demanda', 'Investigar a causa da espera mais longa', 'Acompanhar o desfecho após o atendimento'], impl: ['A demanda se concentra em poucas unidades ou horários', 'O desfecho varia entre unidades'],
      thesis: { c_rate: 'A taxa de desfecho: ', c_where: 'O desfecho varia entre unidades: ', outlier: 'Um ponto destoa do padrão de atendimento: ', peak: 'A demanda tem um pico: ', trend_up: 'A demanda cresce: ' }, ex: { thesis: 'Ex.: A espera se concentra em duas unidades', ask: 'Ex.: Aprovar o reforço das unidades com maior espera' } },
    en: { obj: 'the units and queues with the longest waits', act: ['Reinforce the unit or time slot with the highest demand', 'Investigate the cause of the longest wait', 'Track the outcome after the visit'], impl: ['Demand is concentrated in a few units or hours', 'The outcome varies between units'],
      thesis: { c_rate: 'The outcome rate: ', c_where: 'The outcome varies between units: ', outlier: 'One point stands apart from the care pattern: ', peak: 'Demand has a peak: ', trend_up: 'Demand is growing: ' }, ex: { thesis: 'E.g.: Waiting is concentrated in two units', ask: 'E.g.: Approve reinforcing the units with the longest waits' } }
  },
  ops: {
    arc: ['flow_drop', 'flow_conv', 'outlier', 'c_rate', 'conc', 'trend_down', 'drop', 'peak', 'leader', 'trend_up'],
    pt: { obj: 'os gargalos do fluxo', act: ['Atacar o gargalo com maior perda de fluxo', 'Investigar o ponto fora do padrão', 'Definir um indicador de acompanhamento do prazo'], impl: ['Uma etapa limita o resultado de todo o fluxo', 'O desvio concentra-se em poucos pontos'],
      thesis: { flow_drop: 'O gargalo está em uma etapa: ', flow_conv: 'O fluxo converte assim: ', outlier: 'Um ponto destoa do padrão: ', conc: 'O volume se concentra: ', trend_down: 'O desempenho recua: ' }, ex: { thesis: 'Ex.: Uma etapa concentra a maior parte do atraso', ask: 'Ex.: Aprovar a correção do gargalo identificado' } },
    en: { obj: 'the flow bottlenecks', act: ['Tackle the bottleneck with the biggest flow loss', 'Investigate the out-of-pattern point', 'Define an indicator to track lead time'], impl: ['One step limits the result of the whole flow', 'The deviation is concentrated in a few points'],
      thesis: { flow_drop: 'The bottleneck is in one step: ', flow_conv: 'The flow converts like this: ', outlier: 'One point stands apart from the pattern: ', conc: 'Volume is concentrated: ', trend_down: 'Performance is declining: ' }, ex: { thesis: 'E.g.: One step holds most of the delay', ask: 'E.g.: Approve fixing the identified bottleneck' } }
  },
  hr: {
    arc: ['trend_down', 'drop', 'c_rate', 'c_cause', 'shift', 'contrib', 'conc', 'leader', 'trend_up', 'outlier'],
    pt: { obj: 'as áreas com maior rotatividade', act: ['Conversar com as áreas de maior saída', 'Rever o processo de contratação onde há mais vagas abertas', 'Acompanhar o indicador de clima por área'], impl: ['A saída se concentra em poucas áreas', 'A causa mais citada indica onde agir primeiro'],
      thesis: { trend_down: 'O indicador piora: ', drop: 'Houve uma queda a entender: ', c_rate: 'A taxa: ', c_cause: 'O motivo mais citado: ', shift: 'A composição do time mudou: ' }, ex: { thesis: 'Ex.: A rotatividade se concentra em duas áreas', ask: 'Ex.: Aprovar o plano de retenção para as áreas de maior saída' } },
    en: { obj: 'the areas with the highest turnover', act: ['Talk to the areas with the most exits', 'Review hiring where most positions are open', 'Track the climate indicator by area'], impl: ['Exits are concentrated in a few areas', 'The most cited cause shows where to act first'],
      thesis: { trend_down: 'The indicator is getting worse: ', drop: 'There was a drop to understand: ', c_rate: 'The rate: ', c_cause: 'The most cited reason: ', shift: 'The team mix has changed: ' }, ex: { thesis: 'E.g.: Turnover is concentrated in two areas', ask: 'E.g.: Approve the retention plan for the areas with the most exits' } }
  },
  education: {
    arc: ['c_rate', 'c_where', 'c_cause', 'trend_down', 'drop', 'low', 'outlier', 'trend_up', 'leader', 'conc'],
    pt: { obj: 'as turmas com maior evasão', act: ['Acompanhar de perto as turmas com menor frequência', 'Rever o conteúdo onde as notas são menores', 'Contatar os alunos em risco de evasão'], impl: ['O desempenho varia muito entre turmas', 'A frequência antecipa a evasão'],
      thesis: { c_rate: 'A taxa: ', c_where: 'O resultado varia entre turmas: ', trend_down: 'O indicador cai: ', low: 'Um grupo fica abaixo dos demais: ', outlier: 'Um ponto destoa: ' }, ex: { thesis: 'Ex.: A evasão se concentra em duas turmas', ask: 'Ex.: Aprovar o plano de apoio às turmas de maior evasão' } },
    en: { obj: 'the classes with the highest dropout', act: ['Closely follow the classes with the lowest attendance', 'Review the content where grades are lower', 'Reach out to students at risk of dropping out'], impl: ['Performance varies a lot between classes', 'Attendance anticipates dropout'],
      thesis: { c_rate: 'The rate: ', c_where: 'The result varies between classes: ', trend_down: 'The indicator is falling: ', low: 'One group falls below the others: ', outlier: 'One point stands apart: ' }, ex: { thesis: 'E.g.: Dropout is concentrated in two classes', ask: 'E.g.: Approve the support plan for the classes with the highest dropout' } }
  },
  public: {
    arc: ['c_rate', 'c_where', 'c_cause', 'contrib', 'shift', 'conc', 'trend_up', 'trend_down', 'leader', 'outlier'],
    pt: { obj: 'os serviços com maior demanda reprimida', act: ['Reforçar o serviço com maior demanda', 'Investigar a causa do indeferimento mais frequente', 'Publicar o indicador de execução para acompanhamento'], impl: ['A demanda se concentra em poucos serviços ou regiões', 'A execução varia entre áreas'],
      thesis: { c_rate: 'A taxa de atendimento: ', c_where: 'O atendimento varia entre regiões: ', c_cause: 'A causa mais frequente: ', contrib: 'Quem explica a mudança: ', conc: 'A demanda se concentra: ' }, ex: { thesis: 'Ex.: A demanda se concentra em três serviços', ask: 'Ex.: Aprovar o reforço dos serviços de maior demanda' } },
    en: { obj: 'the services with the largest backlog', act: ['Reinforce the service with the highest demand', 'Investigate the cause of the most frequent denial', 'Publish the execution indicator for follow-up'], impl: ['Demand is concentrated in a few services or regions', 'Execution varies between areas'],
      thesis: { c_rate: 'The service rate: ', c_where: 'Service varies between regions: ', c_cause: 'The most frequent cause: ', contrib: 'Who explains the change: ', conc: 'Demand is concentrated: ' }, ex: { thesis: 'E.g.: Demand is concentrated in three services', ask: 'E.g.: Approve reinforcing the highest-demand services' } }
  },
};
// a área escolhida (ou nenhuma) devolve os textos no idioma da tela
const areaText = (key, lang) => { const a = AREA_TXT[key]; return a ? { ...(a[lang === 'en' ? 'en' : 'pt']), arc: a.arc } : null; };
