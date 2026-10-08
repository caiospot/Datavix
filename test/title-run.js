// Título do tema: peça nasce sem título (placeholder), aviso antes de apresentar/exportar, campo de título no roteiro e no cartão. Abrir com ?asktitle
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [], ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300);
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal', 'vz']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(); D.loadBuffer('ideal.xlsx', buf, 'Vendas');
  for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); D.go('mapping'); await sl(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(1500);
  const P = S.piece, h1 = () => document.querySelector('#ptitle');
  ok('titulo vazio', P.title === '' && h1().textContent === ''); ok('sugerido existe', !!P.autoTitle);
  out.ph = getComputedStyle(h1(), '::before').content; ok('placeholder', /Digite o título aqui/.test(out.ph));
  // apresentar sem título: aviso
  document.querySelector('[data-a=present]').click(); await sl(600);
  ok('aviso ao apresentar', !!document.querySelector('.mdl') && /título/i.test(document.querySelector('.mdl h3').textContent));
  const ink = document.querySelector('#mdl-input'); out.inputPh = ink && ink.placeholder;
  document.querySelector('.mdl [data-m="0"]').click(); await sl(300); ok('Continuar sem texto não passa', !!document.querySelector('.mdl') && !document.querySelector('.piece.presenting'));
  ink.value = 'Resultado 2026 da loja'; document.querySelector('.mdl [data-m="0"]').click(); await sl(1500);
  ok('apresentação abriu', !!document.querySelector('.piece.presenting')); ok('título digitado no slide 1', (document.querySelector('.pi-title') || {}).textContent === 'Resultado 2026 da loja'); ok('h1 atualizado', h1().textContent === 'Resultado 2026 da loja');
  document.querySelector('[data-p=exit]').click(); await sl(500);
  // usar o sugerido
  P.title = ''; h1().textContent = ''; document.querySelector('[data-a=ex][data-v=png]').click(); await sl(500);
  ok('aviso ao exportar', !!document.querySelector('.mdl')); const use = [...document.querySelectorAll('.mdl .btn')].find(b => /sugerido/i.test(b.textContent)); out.useLabel = use && use.textContent; use.click(); await sl(1500);
  ok('sugerido aplicado', P.title === P.autoTitle && !!P.title); ok('sem aviso depois', !document.querySelector('.mdl'));
  // roteiro: campos de título
  P.title = ''; document.querySelector('[data-a=story-edit]').click(); await sl(800);
  ok('tela do roteiro', S.step === 'script'); const ti = document.querySelector('#sc-title'); ok('campo título', !!ti && ti.value === '' && /Digite o título/.test(ti.placeholder));
  const chip = document.querySelector('.sb-chip[data-k=sctitle]'); ok('chip sugestão', !!chip); chip.click(); await sl(300); ok('chip preenche', document.querySelector('#sc-title').value === P.autoTitle);
  const t2 = document.querySelector('#sc-title'); t2.value = 'Plano de vendas do trimestre'; t2.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('[data-a=sc-next]').click(); await sl(500);
  const c1 = document.querySelector('#sc-ttl-1'); ok('campo por cartão', !!c1 && /Digite o título/.test(c1.placeholder)); c1.value = 'Onde está o dinheiro'; c1.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('[data-a=sc-next]').click(); await sl(400); document.querySelector('[data-a=sc-finish]').click(); await sl(1500);
  ok('voltou ao editor', S.step === 'editor'); ok('título gravado', S.piece.title === 'Plano de vendas do trimestre'); out.titles = JSON.stringify(S.piece.sb.titles);
  ok('título do cartão gravado', Object.values(S.piece.sb.titles).includes('Onde está o dinheiro'));
  document.querySelector('[data-a=present]').click(); await sl(1500); document.querySelector('.pi-go').click(); await sl(900);
  const kicks = []; for (let i = 0; i < 6; i++) { kicks.push((document.querySelector('.ps-kick') || {}).textContent); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sl(1000); }
  out.kicks = kicks.join(' | '); ok('rótulo do slide trocado', kicks.some(k => /Onde está o dinheiro/.test(k || '')));
  ok('nenhum slide mostra o placeholder', !kicks.some(k => /Digite o título/.test(k || '')) && !/Digite o título/.test(document.body.innerText.split('Digite')[0] ? '' : ''));
  out.errs = errs.slice(0, 5); return JSON.stringify(out, null, 1); })()
