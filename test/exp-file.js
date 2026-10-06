(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  out.splashEarly = !!document.getElementById('dvs');
  await sleep(3500);
  out.splashGone = !document.getElementById('dvs');
  const av = document.querySelector('.altview'), eng = av && av._org && av._org.engine, cv = document.querySelector('#orgcv');
  if (!eng) return 'sem organismo ' + document.body.innerText.slice(0, 100);
  const rc = cv.getBoundingClientRect(), big = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[6], [x, y] = eng.leafXY(big.i);
  out.lay = document.querySelector('#piece').dataset.lay;
  out.ext = performance.getEntriesByType('resource').filter(r => !r.name.startsWith('data:') && !r.name.startsWith('blob:')).map(r => r.name);
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(400);
  out.hover = document.querySelector('#pcard').className + ' | ' + document.querySelector('#pcard').innerText.slice(0, 70).replace(/\n/g, ' ');
  cv.dispatchEvent(new MouseEvent('click', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(600);
  out.pin = document.querySelector('#pcard').className;
  out.present = !!document.querySelector('#pctrls [data-present]');
  return JSON.stringify(out);
})()
