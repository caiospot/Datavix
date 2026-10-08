// Fluxo novo: Guiar em 3 perguntas (tese, roteiro em cartões, decisão) com planilha sintética de casos. Rodar com ?find
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [], ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const J = ['Jornada A', 'jornada a', 'Jornada B', 'Jornada C', 'Sem jornada'], R = ['SIM', 'NÃO', 'Não resolvido', 'SIM', 'NÃO'];
  const rows = ['Protocolo;Data;Jornada;Resolvido;Satisfeito;Retorna;Causa;Comentário'];
  for (let i = 0; i < 120; i++) rows.push([100000 + i, `${String(1 + i % 27).padStart(2, '0')}/${String(1 + i % 6).padStart(2, '0')}/2026`, J[i % 5], R[i % 5], R[i % 5] === 'SIM' ? 'SIM' : (i % 4 ? 'NÃO' : 'SIM'), R[i % 5] === 'SIM' ? (i % 7 ? 'NÃO' : 'SIM') : (i % 3 ? 'SIM' : 'NÃO'), R[i % 5] === 'SIM' ? '' : ['Erro operacional', 'Falta de alçada', 'Regra de negócio'][i % 3], `Relato de ${['lentidão no atendimento', 'falha no pagamento', 'problema técnico recorrente', 'demora na visita'][i % 4]} e pedido de retorno formal, caso ${i}, com detalhes adicionais sobre a rotina da operação.`].join(';'));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null };
  D.loadBuffer('casos.csv', new TextEncoder().encode(rows.join('\n')).buffer);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); await sl(800);
  D.go('read'); await sl(300); document.querySelector('[data-a=to-mapping]').click(); await sl(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'find'; i++) await sl(150); await sl(500);
  ok('find', S.step === 'find'); ok('cta3', !!document.querySelector('[data-a=fd-guide3]') && !!document.querySelector('[data-a=fd-guide]'));
  document.querySelector('[data-a=fd-guide3]').click(); await sl(400);
  ok('script-step0', S.step === 'script' && !!document.querySelector('#sc-thesis'));
  const ta = document.querySelector('#sc-thesis'); ta.value = 'Resolver na primeira vez reduz o retorno'; ta.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('[data-a=sc-next]').click(); await sl(400);
  const cards = () => [...document.querySelectorAll('.sc-card')]; const n0 = cards().length;
  ok('cartoes', n0 >= 3); ok('efeito-respostas', !!document.querySelector('.sc-eff'));
  const ids0 = S.sc.script.slice();
  document.querySelector('[data-a=sc-down][data-v="1"]').click(); await sl(200);
  ok('reordena', S.sc.script[2] === ids0[1] && S.sc.script[1] === ids0[2]);
  const gone = S.sc.script[3]; document.querySelector('[data-a=sc-del][data-v="3"]').click(); await sl(200);
  ok('remove', !S.sc.script.includes(gone) && cards().length === n0 - 1);
  ok('volta-removido', !!document.querySelector(`[data-a=sc-add][data-v="${gone}"]`));
  const eid = S.sc.script[1]; document.querySelector(`[data-a=sc-edit][data-v="${eid}"]`).click(); await sl(200);
  const et = document.querySelector('#sc-edit-1'); et.value = 'Frase reescrita pela pessoa'; et.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('[data-a=sc-editdone]').click(); await sl(200); ok('edita', S.sc.edits[eid] === 'Frase reescrita pela pessoa' && document.body.innerText.includes('Frase reescrita pela pessoa'));
  document.querySelector('[data-a=sc-next]').click(); await sl(300);
  const ak = document.querySelector('#sc-ask'); ak.value = 'Aprovar a revisão do processo'; ak.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('[data-a=sc-finish]').click(); for (let i = 0; i < 40 && S.step !== 'editor'; i++) await sl(150); await sl(500);
  const P = S.piece; await fetch('/save?name=cases-export.html', { method: 'POST', body: new Blob([buildExportHtml(P)], { type: 'text/html' }) }); return 'saved ' + P.sb.script.length; })()