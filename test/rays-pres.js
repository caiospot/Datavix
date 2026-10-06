(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S;
  S.br = { audience: 'director', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/unidades.csv')).arrayBuffer();
  D.loadBuffer('unidades.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await new Promise(r => setTimeout(r, 100));
  D.go('mapping'); await new Promise(r => setTimeout(r, 300));
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await new Promise(r => setTimeout(r, 150));
  await new Promise(r => setTimeout(r, 3600));
  const P = S.piece, out = { ins: P.insights.map(i => i.text) };
  // apresentação
  const pres = D.startPresentation ? null : null;
  document.querySelector('[data-a=present]').click();
  await new Promise(r => setTimeout(r, 900));
  const caps = [], eng = document.querySelector('.altview')._org.engine;
  for (let k = 0; k < 14; k++) {
    caps.push((document.querySelector('#pcap').innerText || '').slice(0, 70) + ' | vis=' + eng.nVis + ' spot=' + eng.spot);
    const cnt = document.querySelector('#pcount').innerText;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise(r => setTimeout(r, 650));
    if (k === 2 && location.hash.includes('shot')) { out.shotAt = 1; }
  }
  out.caps = caps;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 700));
  out.after = document.querySelector('#piece').classList.contains('presenting');
  // PNG
  const blob = await window.__datavix.renderPng(S.piece, {}); out.png = blob.size;
  // HTML
  out.html = window.__datavix.buildExportHtml(S.piece).length;
  return JSON.stringify(out, null, 1);
})()
