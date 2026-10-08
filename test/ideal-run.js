// Planilha ideal: lê cada aba, mostra papéis/tipo e confere os 17 gráficos na aba Vendas
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  const only = decodeURIComponent(location.hash.slice(1));
  for (const sh of ['Vendas', 'Casos CX', 'Funil', 'Resumo']) {
    if (only && only !== sh) continue;
    S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' };
    D.go('entry'); D.loadBuffer('ideal.xlsx', buf.slice(0), sh);
    for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(1500);
    if (!S.ds) { out[sh] = 'sem ds ' + S.step + ' ' + S.error; continue; }
    const cols = S.ds.columns, r = S.read, m = S.mapping, o = { rows: S.ds.rowCount, shape: r.shape + '/' + r.conf, roles: cols.map(c => c.name + '=' + c.role + (c.mtype ? ':' + c.mtype : '')).join(' | '), merges: r.sug.length, map: m.kind + ' x=' + (cols[m.x] || {}).name + ' y=' + (cols[m.y] || {}).name + ' s=' + (cols[m.series] || {}).name + ' agg=' + m.agg };
    D.go('read'); await sl(300); document.querySelector('[data-a=to-mapping]').click(); await sl(400); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); await sl(1500);
    if (S.step === 'find') { D.go('editor'); await sl(500); }
    const P = S.piece; if (!P) { o.err = 'sem peça ' + S.step + ' ' + S.error; out[sh] = o; continue; }
    o.type = P.type; o.available = P.choice.all.join(','); o.cases = P.cases ? P.cases.facts.map(f => f.k).join(',') : null; o.insights = P.insights.length;
    if (sh === 'Vendas') {
      const btns = () => [...document.querySelectorAll('#panel .type')], res = {};
      o.panelTypes = btns().length; o.off = btns().filter(b => b.classList.contains('off')).map(b => b.dataset.v).join(',');
      for (const t of ['organism', 'line', 'area', 'bars', 'hbars', 'stacked100', 'treemap', 'race', 'calendar', 'kpi', 'scatter', 'bubble', 'river', 'fan', 'ridge', 'rays', 'flow']) {
        const b = btns().find(x => x.dataset.v === t); if (b) b.click(); await sl(2600); const md = document.querySelector('.mdl .mm'); if (md) { const x = document.querySelector('.mdl [data-m="1"]'); if (x) x.click(); await sl(300); }
        res[t] = S.piece.type === t ? 'ok' : 'foi p/ ' + S.piece.type;
      }
      o.charts = res;
    }
    out[sh] = o;
  }
  out.errs = errs.slice(0, 6); return JSON.stringify(out, null, 1); })()
