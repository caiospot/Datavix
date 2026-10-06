(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); }; window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const click = sel => document.querySelector(sel).click();
  await sleep(2000);
  for (const lang of ['PT', 'EN']) {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === lang); if (b) b.click(); await sleep(500);
    out['foot_' + lang] = document.querySelector('[data-a=privacy]').textContent;
    click('[data-a=privacy]'); await sleep(400);
    const m = document.querySelector('.mdl');
    out['modal_' + lang] = m ? m.querySelector('h3').textContent + ' | ' + m.querySelectorAll('.pv-h').length + ' seções | ' + m.querySelector('.pv-h').textContent : null;
    out['contact_' + lang] = m.querySelector('.pv').lastElementChild.textContent.slice(0, 120) + ' | href=' + (m.querySelector('.pv a') || {}).href;
    out['noRawHtml_' + lang] = !/&lt;|<li|undefined/.test(m.innerText);
    const box = m.querySelector('.mdl-box').getBoundingClientRect(); out['box_' + lang] = Math.round(box.width) + 'x' + Math.round(box.height) + ' scrollable=' + (m.querySelector('.mdl-b').scrollHeight > m.querySelector('.mdl-b').clientHeight);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(300);
    out['closed_' + lang] = !document.querySelector('.mdl');
  }
  // atalho dentro de "O que é enviado?"
  click('[data-a=feedback]'); await sleep(500);
  const more = document.querySelector('.npscard [data-n=more]'); more.click(); await sleep(400);
  const lnk = document.querySelector('.mdl [data-pv]'); out.nps_link = lnk ? lnk.textContent : null;
  lnk.click(); await sleep(400); out.stacked = document.querySelectorAll('.mdl').length + ' modais, topo=' + [...document.querySelectorAll('.mdl h3')].map(h => h.textContent).join(' / ');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(300);
  out.afterEsc = document.querySelectorAll('.mdl').length + ' modal(is)';
  out.errs = errs;
  return JSON.stringify(out, null, 1);
})();
