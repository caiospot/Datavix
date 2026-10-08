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
