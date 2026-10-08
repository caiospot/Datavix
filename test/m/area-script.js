// Roteiro por área: com a área CX o roteiro segue o arco da área e as sugestões trazem o vocabulário dela. Rodar com ?find
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [], ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const J = ['Jornada A', 'jornada a', 'Jornada B', 'Jornada C', 'Sem jornada'], R = ['SIM', 'NÃO', 'Não resolvido', 'SIM', 'NÃO'];
  const rows = ['Protocolo;Data;Jornada;Resolvido;Satisfeito;Retorna;Causa;Comentário'];
  for (let i = 0; i < 120; i++) rows.push([100000 + i, `${String(1 + i % 27).padStart(2, '0')}/${String(1 + i % 6).padStart(2, '0')}/2026`, J[i % 5], R[i % 5], R[i % 5] === 'SIM' ? 'SIM' : (i % 4 ? 'NÃO' : 'SIM'), R[i % 5] === 'SIM' ? (i % 7 ? 'NÃO' : 'SIM') : (i % 3 ? 'SIM' : 'NÃO'), R[i % 5] === 'SIM' ? '' : ['Erro operacional', 'Falta de alçada', 'Regra de negócio'][i % 3], `Relato de ${['lentidão no atendimento', 'falha no pagamento', 'problema técnico recorrente', 'demora na visita'][i % 4]} e pedido de retorno formal, caso ${i}, com detalhes adicionais sobre a rotina da operação.`].join(';'));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300);
  const run = async area => {
    S.user = { guest: true }; S.br = { area, audience: 'director', decision: 'alert', time: 'full', message: '', story: null, tone: null, place: null };
    D.loadBuffer('casos.csv', new TextEncoder().encode(rows.join('\n')).buffer);
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); await sl(800);
    D.go('read'); await sl(300); document.querySelector('[data-a=to-mapping]').click(); await sl(400); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 100 && S.step !== 'find'; i++) await sl(150); await sl(500);
    document.querySelector('[data-a=fd-guide3]').click(); await sl(400);
  };
  await run('cx');
  const acts = () => S.sc.script.map(id => bCtx().by(id).act);
  out.cxScript = acts().join(','); ok('cx-arco', acts().slice(1).indexOf('c_rate') >= 0 && acts().slice(1).indexOf('c_rate') < (acts().slice(1).indexOf('c_cause') < 0 ? 99 : acts().slice(1).indexOf('c_cause')));
  ok('cx-placeholder', (document.querySelector('#sc-thesis').placeholder || '').startsWith('Ex.: Resolver'));
  ok('cx-sugestao-tese', [...document.querySelectorAll('.sb-chip')].some(b => /^Resolver bem muda|^A taxa de resolução|^O resultado varia entre jornadas/.test(b.textContent)));
  document.querySelector('[data-a=sc-next]').click(); await sl(300); document.querySelector('[data-a=sc-next]').click(); await sl(300);
  ok('cx-pedido', [...document.querySelectorAll('.sb-chip')].some(b => /Definir quem corrige os pontos da jornada com pior resolução/.test(b.textContent)));
  await run('general'); out.geralScript = acts().join(',');
  ok('geral-sem-vocabulario', ![...document.querySelectorAll('.sb-chip')].some(b => /jornada|resolução/.test(b.textContent)) && !/^Ex.: Resolver/.test(document.querySelector('#sc-thesis').placeholder));
  return JSON.stringify(out, null, 1); })()
