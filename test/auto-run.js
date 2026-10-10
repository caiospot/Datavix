// Caminho curto: sobe a planilha e cai direto no editor, passando pela tela "Aguarde, estou entendendo a sua planilha". Abrir com ?auto
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [], seen = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300);
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal', 'vz']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const sheets = (new URLSearchParams(location.search).get('sheets') || 'Vendas,Casos CX,Funil,Resumo,Mapa').split(',');
  const buf0 = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  for (const sh of sheets) {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' };
    D.go('entry'); await sl(200); const steps = []; let last = '', genTxt = '';
    D.loadBuffer('ideal.xlsx', buf0.slice(0), sh);
    for (let i = 0; i < 300 && S.step !== 'editor' && S.step !== 'read'; i++) { if (S.step !== last) { last = S.step; steps.push(S.step); } if (S.step === 'gen') { const g = document.querySelector('.gen-s .tag'); if (g) genTxt = g.textContent; } await sl(100); }
    out[sh] = { steps: steps.join('>') + '>' + S.step, conf: S.read && S.read.conf, shape: S.read && S.read.shape, gen: genTxt, type: S.piece && S.piece.type };
  }
  out.errs = errs.slice(0, 5); return JSON.stringify(out, null, 1); })()
