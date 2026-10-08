// Planilhas bagunçadas: título acima do cabeçalho, subtotais, rodapé, períodos em colunas. Imprime o que foi arrumado e as somas para conferência
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
  const buf = await (await fetch('/dados-teste/datavix-planilha-bagunca.xlsx')).arrayBuffer();
  const load = async sh => { S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; S.ds = null; D.go('entry'); D.loadBuffer('b.xlsx', buf.slice(0), sh); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); };
  const sums = ds => Object.fromEntries(ds.columns.filter(c => c.kind === 'number').map(c => [c.name, Math.round(Array.from(c.data).reduce((a, x) => a + (Number.isNaN(x) ? 0 : x), 0) * 100) / 100]));
  const only = decodeURIComponent(location.hash.slice(1));
  for (const sh of ['Título e totais', 'Largo por mês', 'Largo por ano', 'Mês sem ano', 'Largo com meta', 'Subtotal verificado']) {
    if (only && only !== sh) continue; await load(sh); const ds = S.ds;
    if (!ds) { out[sh] = 'sem ds ' + S.error; continue; }
    out[sh] = { rows: ds.rowCount, cols: ds.columns.map(c => c.name + ':' + c.kind).join(' | '), fixes: JSON.stringify(ds.fixes), shape: S.read && S.read.shape, sums: sums(ds) };
  }
  // desfazer pela tela de leitura
  if (!only || only === 'Largo por mês') {
    await load('Largo por mês'); D.go('read'); await sl(400);
    out.undo = { before: S.ds.rowCount, hasToggle: !!document.querySelector('[data-c=rd-fix]') };
    const cb = document.querySelector('[data-c=rd-fix][data-k=unpivot]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true }));
    for (let i = 0; i < 60 && S.ds.rowCount === out.undo.before; i++) await sl(100); await sl(500);
    out.undo.after = S.ds.rowCount; out.undo.cols = S.ds.columns.length; out.undo.step = S.step;
  }
  return JSON.stringify(out, null, 1); })()
