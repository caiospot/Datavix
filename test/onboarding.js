(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), D = window.__datavix, S = D.S, out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); }; window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  await sleep(2500);
  out.hasMagic = document.body.innerText.toLowerCase().includes('link mágico') || !!document.querySelector('#email');
  document.querySelector('.lp-hero [data-a=start], [data-a=start]').click(); await sleep(600);
  out.afterStart = S.step + ' modal=' + !!document.querySelector('.mdl') + ' user=' + JSON.stringify(S.user);
  const opts = () => [...document.querySelectorAll('.opt')].map(b => b.querySelector('strong').textContent);
  out.q1 = opts().join(' | ');
  // 1 audiência: Outra coisa com texto reconhecível
  document.querySelector('.opt.other').click(); await sleep(200);
  out.q1other = !!document.querySelector('#ob-other') + ' resolved=' + S.br.audience;
  const inp = document.querySelector('#ob-other'); inp.value = 'reunião com o conselho'; inp.dispatchEvent(new Event('input', { bubbles: true })); out.q1res = S.br.audience;
  document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 2 decisão: Outra coisa sem texto -> padrão
  out.q2 = opts().length + ' opções, última=' + opts().slice(-1)[0]; out.noOtherBack = '';
  document.querySelector('.opt.other').click(); await sleep(200); out.q2res = S.br.decision; document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 3 mensagem
  const msg = document.querySelector('#msg'); msg.value = 'Mensagem de teste'; msg.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 4 história: outra coisa "funil de vendas"
  document.querySelector('.opt.other').click(); await sleep(200); const i4 = document.querySelector('#ob-other'); i4.value = 'meu funil de vendas'; i4.dispatchEvent(new Event('input', { bubbles: true })); out.q4res = S.br.story; document.querySelector('[data-a=ob-next]').click(); await sleep(300);
  // 5 tom e 6 local: sem 'Outro'
  out.q5 = opts().join(' | '); document.querySelector('.opt[data-v=tech]').click(); await sleep(600);
  out.q6 = opts().join(' | '); document.querySelector('.opt[data-v=projector]').click(); await sleep(700);
  out.final = S.step + ' br=' + JSON.stringify({ a: S.br.audience, d: S.br.decision, s: S.br.story, t: S.br.tone, p: S.br.place });
  out.errs = errs; return JSON.stringify(out, null, 1);
})()
