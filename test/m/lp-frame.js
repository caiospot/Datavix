// Landing, portão 1: quadro da ferramenta no hero com o gráfico vivo e números calculados; cadastro lembrado vira "Começar agora"
(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  try { localStorage.removeItem('dv-signup'); } catch (e) { /* segue */ }
  S.user = null; D.go('entry'); await sleep(3500);
  out.quadro = !!q('#lpframe'); out.formEmail = qa('.lp-mail').length;
  const cv = q('#lpcv'), c = cv.getContext('2d'), px = c.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < px.length; i += 4 * 97) if (px[i]) lit++; out.canvasDesenhado = lit > 40;
  const ov0 = q('#lpf-ov').innerText.replace(/\n+/g, ' | '); out.overview = ov0.slice(0, 90);
  const row = qa('.lpf-row')[0]; row.dispatchEvent(new Event('mouseenter')); await sleep(200); out.detalhe = q('#lpf-ov').innerText.replace(/\n+/g, ' | ').slice(0, 90); out.rowOn = row.classList.contains('on');
  row.dispatchEvent(new Event('mouseleave')); await sleep(200);
  const chip = qa('.lpf-chip')[0]; chip.click(); await sleep(200); out.chipOff = chip.getAttribute('aria-pressed') + ' | ' + /Categor\w+\s*\n?\s*5/.test(q('#lpf-ov').innerText);
  chip.click(); await sleep(100);
  const l0 = q('#lpf-now').style.left; await sleep(3600); out.focoMudou = l0 + ' -> ' + q('#lpf-now').style.left;
  out.larg = document.documentElement.scrollWidth + '/' + innerWidth;
  // cadastro lembrado: só "Começar agora", sem campo
  localStorage.setItem('dv-signup', JSON.stringify({ email: 'ana@empresa.com' })); D.go('entry'); await sleep(500);
  out.lembrado = { forms: qa('.lp-mail').length, botoes: qa('.lp-cta [data-a=start], .lp-final [data-a=start]').map(b => b.textContent.trim()) };
  q('.lp-cta [data-a=start]').click(); await sleep(500); out.depois = S.step + ' user=' + JSON.stringify(S.user);
  localStorage.removeItem('dv-signup'); out.errs = errs; return JSON.stringify(out);
})()
