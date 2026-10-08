// Planilha sintética de casos (sem dados reais): confere papéis, tipo, unificações, mapeamento por contagem e proteções
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const J = ['Jornada A', 'jornada a', 'Jornada B', 'Jornada C', 'Sem jornada'], R = ['SIM', 'NÃO', 'Não resolvido', 'SIM', 'NÃO'];
  const rows = ['Protocolo;Email;Responsável;Data;Jornada;Resolvido;Satisfeito;Retorna;Cancela;Esforço;Valor;Causa;Comentário'];
  for (let i = 0; i < 90; i++) rows.push([100000 + i, `pessoa${i}@mail.com`, ['Ana Souza', 'Bruno Lima', 'Carla Dias'][i % 3], `${String(1 + i % 27).padStart(2, '0')}/${String(1 + i % 6).padStart(2, '0')}/2026`, J[i % 5], R[i % 5], R[i % 5] === 'SIM' ? 'SIM' : (i % 4 ? 'NÃO' : 'SIM'), i % 3 ? 'NÃO' : 'SIM', i % 4 ? 'NÃO' : 'SIM', `${3 + i % 9} dias`, 100 + i, R[i % 5] === 'SIM' ? '' : ['Erro operacional', 'Falta de alçada', 'Regra de negócio'][i % 3], `O cliente relatou ${['lentidão no atendimento', 'falha no pagamento', 'problema técnico recorrente', 'demora na visita'][i % 4]} e pediu retorno formal, caso ${i}, com detalhes adicionais sobre a rotina da operação.`].join(';'));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: null, place: null };
  D.loadBuffer('casos.csv', new TextEncoder().encode(rows.join('\n')).buffer);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); await sl(900);
  const c = n => S.ds.columns.find(x => x.name === n), r = S.read;
  ok('pii-email', c('Email').role === 'pii'); ok('pii-nome', c('Responsável').role === 'pii'); ok('id', c('Protocolo').role === 'id');
  ok('flag', c('Resolvido').role === 'flag' && c('Satisfeito').role === 'flag'); ok('texto', c('Comentário').role === 'text');
  ok('esforco-numero', c('Esforço').kind === 'number'); ok('shape-casos', r.shape === 'cases');
  ok('merge-jornada', r.sug.some(x => S.ds.columns[x.col].name === 'Jornada' && x.kind === 'same' && x.on));
  ok('merge-flag-off', r.sug.some(x => S.ds.columns[x.col].name === 'Resolvido' && x.kind === 'flag' && !x.on));
  D.go('read'); await sl(300);
  ok('tela-leitura', !!document.querySelector('.rd-shl') && document.querySelectorAll('.rd-row').length >= 10);
  document.querySelector('[data-a=to-mapping]').click(); await sl(400);
  const m = S.mapping; ok('mapeamento-contagem', m.agg === 'count' && m.y === -1);
  ok('jornada-unificada', c('Jornada').dict.filter(v => /jornada a/i.test(v)).length === 1);
  ok('sem-pii-no-mapa', ![m.x, m.series].some(i => i >= 0 && S.ds.columns[i].role === 'pii'));
  document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); await sl(600);
  const P = S.piece; ok('peca', !!P);
  const cs = P.cases; ok('cases-calculado', !!cs && cs.outcome === 'Resolvido'); const kinds = cs ? cs.facts.map(f => f.k) : [];
  ok('cases-taxa', kinds.includes('rate')); ok('cases-impacto', kinds.includes('impact')); ok('cases-causa', kinds.includes('cause')); ok('cases-termos', kinds.includes('terms'));
  const rate = cs && cs.facts.find(f => f.k === 'rate'); ok('taxa-so-validas', !!rate && rate.pos === 36 && rate.neg === 54); out.rate = rate;
  const st = buildStory(P, null, []); ok('historia-casos', st.some(x => x.act === 'c_rate') && st.some(x => x.act === 'c_cause' && x.type === 'prio' && x.rank.length >= 2)); out.acts = st.map(x => x.act).join(','); const txt = (P.insights || []).map(i => i.text).join(' | ');
  ok('sem-grupo-nao-lidera', !/sem jornada/i.test(txt)); out.insights = txt;
  return JSON.stringify(out, null, 1); })()
