/* Datavix: inicialização do HTML exportado. Roda sem internet, sem servidor. */
(async function () {
  const P = JSON.parse(document.getElementById('dv-data').textContent);
  LANG = P.lang;
  P.opts = { ...DEFAULT_OPTS, ...(P.opts || {}) }; P.fontPair = P.fontPair || 'modern';
  document.title = P.title;
  document.getElementById('app').innerHTML = pieceHtml(P, {});
  applyPieceCss(P);
  document.body.style.background = bgBase(P.bg);
  const root = document.getElementById('piece'), box = document.getElementById('vz');
  try {
    let host = null;
    host = await createChartHost({
      P, root,
      hooks: {
        types: P.choice.all, getType: () => P.type, getSort: () => P.sort,
        onType: t => host.setType(t),
        onSort: m => { P.sort = m; host.resort(); },
        onPresent: () => startPresentation({ root, ix: host.ix, P, host }),
      },
    });
    if (window.dvSplash) window.dvSplash.set(LANG === 'pt' ? 'Montando a visualização…' : 'Building the visualization…');
    await host.mount(1.8);
  } catch (e) {
    box.textContent = String(e && e.message || e);
  }
  if (window.dvSplash) setTimeout(window.dvSplash.done, Math.max(250, 900 - performance.now()));
})();
