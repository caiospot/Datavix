// Gate 55: gera as apresentações exportadas (HTML único) do Resumo por temporada e da Ficha, para abrir por file:// (models-export-check.js)
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {};
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const make = async (file, sheet, kind, name) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(600);
    const P = S.piece; P.br = P.br || {}; P.br.storyKind = kind; S.br.storyKind = kind; const html = buildExportHtml(P);
    await fetch('/save?name=' + name, { method: 'POST', body: new Blob([html], { type: 'text/html' }) }); out[name] = html.length;
  };
  await make('f1-senna-schumacher.xlsx', 'Comparativo 1989-94', 'season', 'models-season.html');
  await make('ficha-municipio.csv', undefined, 'profile', 'models-ficha.html');
  await make('ficha-piloto.csv', undefined, 'profile', 'models-ficha2.html');
  return JSON.stringify(out);
} catch (e) { return 'ERRO ' + e.stack; } })()
