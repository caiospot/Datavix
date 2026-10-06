(async () => {
  const D = window.__datavix, S = D.S;
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/unidades.csv')).arrayBuffer();
  D.loadBuffer('unidades.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await new Promise(r => setTimeout(r, 100));
  const m = S.mapping.cs && S.mapping.cs.rays;
  D.go('mapping'); await new Promise(r => setTimeout(r, 300));
  const mapTxt = [...document.querySelectorAll('.csmap')].map(e => e.innerText.replace(/\n/g, '|')).join(' ## ');
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await new Promise(r => setTimeout(r, 150));
  await new Promise(r => setTimeout(r, 3800));
  const P = S.piece, av = document.querySelector('.altview'), org = av && av._org, eng = org && org.engine;
  return JSON.stringify({ step: S.step, sug: m, type: P.type, all: P.choice.all, hasOrg: !!org, n: eng && eng.nVis, R: eng && Math.round(eng.R), mapTxt: mapTxt.slice(0, 300), card: (document.querySelector('#pcard') || {}).innerText && document.querySelector('#pcard').innerText.slice(0, 160).replace(/\n/g, '|') });
})()
