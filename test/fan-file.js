(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  await sleep(4500);
  out.splashGone = !document.getElementById('dvs');
  const av = document.querySelector('.altview'), eng = av && av._org && av._org.engine, cv = document.querySelector('#orgcv');
  if (!eng) return 'sem motor ' + document.body.innerText.slice(0, 120);
  const rc = cv.getBoundingClientRect(), id = eng.stats().ids[12], [x0, y] = eng.tipXY(id), x = x0 + 1;
  out.lay = document.querySelector('#piece').dataset.lay;
  out.ext = performance.getEntriesByType('resource').filter(r => !r.name.startsWith('data:') && !r.name.startsWith('blob:')).map(r => r.name);
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(500);
  out.hover = document.querySelector('#pcard').className + ' | ' + document.querySelector('#pcard').innerText.slice(0, 60).replace(/\n/g, ' ');
  cv.dispatchEvent(new MouseEvent('click', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(500);
  out.pin = document.querySelector('#pcard').className; out.present = !!document.querySelector('#pctrls [data-present]'); out.list = document.querySelector('.plc').innerText;
  return JSON.stringify(out);
})()
