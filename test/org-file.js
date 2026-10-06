(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(3500);
  const av = document.querySelector('.altview'), eng = av && av._org && av._org.engine, cv = document.querySelector('#orgcv');
  if (!eng) return 'sem organismo: ' + document.body.innerText.slice(0, 200);
  const big = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[6], [x, y] = eng.leafXY(big.i), rc = cv.getBoundingClientRect();
  const tutor = !!document.querySelector('.orgtut');
  const ext = performance.getEntriesByType('resource').filter(r => !r.name.startsWith('data:') && !r.name.startsWith('blob:')).map(r => r.name);
  if (location.hash === '#hover') { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(600); }
  return JSON.stringify({ tutor, ext, card: document.querySelector('#orgtip').hidden ? 'oculto' : document.querySelector('#orgtip').innerText.slice(0, 120), pres: !!document.querySelector('#orgpres') });
})()
