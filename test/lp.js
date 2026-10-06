(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  await sleep(1500);
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); pt.click(); await sleep(500);
  out.h1 = document.querySelector('.lp-h1').innerText.replace(/\n/g, ' ');
  document.querySelector('.lp-cta [data-a=start]').click(); await sleep(400);
  out.modal = !!document.querySelector('.mdl #login');
  document.querySelector('.mdl [data-a=guest]').click(); await sleep(400);
  out.step = S.step + ' modal=' + !!document.querySelector('.mdl') + ' user=' + JSON.stringify(S.user) + ' top=' + [...document.querySelectorAll('.top-r button')].map(b => b.textContent.trim()).join('|');
  document.querySelector('[data-a=home]').click(); await sleep(400);
  out.home = S.step + ' | cta=' + document.querySelector('.lp-cta .btn').textContent.trim();
  return JSON.stringify(out);
})()
