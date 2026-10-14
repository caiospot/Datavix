// Gate 55: tela de 420 px. As tabelas do Resumo por temporada e da Ficha cabem na tela, sem rolagem horizontal da página.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = qa('button').find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async (file, sheet, kind) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(600); const P = S.piece; P.br = P.br || {}; P.br.storyKind = kind; S.br.storyKind = kind; };
  const present = async () => { q('[data-a=present]').click(); await sl(1300); const pi = q('.pintro .pi-btns button'); if (pi) { pi.click(); await sl(700); } return S.piece.pres; };
  const fits = (k) => { const t = q('.vz-tab'); if (!t) return false; const r = t.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1 && parseFloat(getComputedStyle(t.querySelector('td')).fontSize) >= 9; };
  await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94', 'season'); let pres = await present(); out.vw = innerWidth;
  await pres.show(1); await sl(2200); ok('M: tabela do piloto (7 colunas) cabe em 420 px, com fonte legível', fits() && qa('.vz-tab thead th').length === 7); out.fontSeason = parseFloat(getComputedStyle(q('.vz-tab td')).fontSize); out.tabW = Math.round(q('.vz-tab').getBoundingClientRect().width); out.scrollW = document.documentElement.scrollWidth;
  ok('M: o destaque de maior valor continua visível', qa('.vz-tab td.hi').length === 5);
  await pres.show(3); await sl(2000); ok('M: tabela de maior valor (3 colunas) cabe na tela', fits());
  await pres.show(4); await sl(1800); ok('M: limites sem rolagem horizontal', document.documentElement.scrollWidth <= innerWidth + 1);
  try { pres.stop(); } catch (e) { /* segue */ } await sl(500);
  await load('ficha-municipio.csv', undefined, 'profile'); pres = await present(); await pres.show(1); await sl(2200); ok('M: tabela da ficha (4 colunas) cabe em 420 px', fits() && qa('.vz-tab tbody tr').length === 8); out.fontFicha = parseFloat(getComputedStyle(q('.vz-tab td')).fontSize);
  try { pres.stop(); } catch (e) { /* segue */ } await sl(500);
  await load('ficha-piloto.csv', undefined, 'profile'); pres = await present(); await pres.show(2); await sl(2000); ok('M: textos da ficha cabem em 420 px', !!q('.vz-text') && q('.vz-text').getBoundingClientRect().right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1);
  out.RESUMO = bad.length ? 'FALHOU: ' + bad.join(' | ') : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
