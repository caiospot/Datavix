(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), D = window.__datavix, S = D.S, out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); }; window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  await sleep(2500);
  out.hasMagic = document.body.innerText.toLowerCase().includes('link mágico') || !!document.querySelector('#email');
  document.querySelector('.lp-hero [data-a=start], [data-a=start]').click(); await sleep(600);
  out.afterStart = S.step + ' modal=' + !!document.querySelector('.mdl') + ' user=' + JSON.stringify(S.user);
  const opts = () => [...document.querySelectorAll('.opt')].map(b => b.querySelector('strong').textContent);
  out.steps = document.querySelector('.prog .num').textContent;
  out.areaQ = opts().length + ' áreas'; document.querySelector('.opt[data-v=cx]').click(); await sleep(700); out.areaPicked = S.br.area + ' -> passo ' + document.querySelector('.prog .num').textContent;
  out.q1 = opts().join(' | ');
  // 1 público: "Outro" com texto reconhecível
  document.querySelector('.opt.other').click(); await sleep(200);
  out.q1other = !!document.querySelector('#ob-other') + ' resolved=' + S.br.audience;
  const inp = document.querySelector('#ob-other'); inp.value = 'reunião com o conselho'; inp.dispatchEvent(new Event('input', { bubbles: true })); out.q1res = S.br.audience;
  document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 2 decisão: "Outro" sem texto -> padrão
  out.q2 = opts().length + ' opções, última=' + opts().slice(-1)[0];
  document.querySelector('.opt.other').click(); await sleep(200); out.q2res = S.br.decision; document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 3 tempo: sem "Outro"
  out.q3 = opts().join(' | ') + ' | prog=' + document.querySelector('.prog .num').textContent;
  document.querySelector('.opt[data-v=normal]').click(); await sleep(700);
  out.final = S.step + ' br=' + JSON.stringify({ a: S.br.audience, d: S.br.decision, t: S.br.time, story: S.br.story, tone: S.br.tone, place: S.br.place, msg: S.br.message });
  out.uploadLabel = (document.querySelector('.screen .lbl') || {}).textContent;
  // sem mensagem/tom/local/história: a peça sai com título automático, tipo inferido e estilo padrão
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  out.previewLabel = (document.querySelector('.screen .lbl') || {}).textContent; D.go('mapping'); await sleep(300); out.mappingLabel = (document.querySelector('.screen .lbl') || {}).textContent; out.inferred = S.mapping.story;
  document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(1500);
  out.piece = { title: S.piece.title, type: S.piece.type, pal: S.piece.palId, big: !!S.piece.big, time: S.piece.br && S.piece.br.time };
  out.errs = errs; return JSON.stringify(out, null, 1);
})()
