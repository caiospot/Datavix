// Landing: carrossel "Como funciona" (4 cartões, botões, pílulas, árvore do passo 3 viva) e cartões de "Para quem"
(async () => { try {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const pt = qa('button').find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sleep(300);
  S.user = null; D.go('entry'); await sleep(800);
  out.titulo = q('#como h2').textContent.replace(/\s+/g, ' ').trim(); out.cartoes = qa('.lph-card').length; out.pilulas = qa('.lph-pill').length;
  q('#como').scrollIntoView(); await sleep(1500);
  const cv = q('#lphcv'); await sleep(1500); const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 3; i < px.length; i += 4 * 97) if (px[i]) lit++; out.arvoreViva = lit > 30;
  const trk = q('#lph-track'); q('.lph-btn[data-dir="1"]').click(); await sleep(900); out.depoisProximo = q('#lph-cur').textContent + ' left=' + trk.scrollLeft;
  q('.lph-pill[data-go="3"]').click(); await sleep(1000); out.pilula4 = q('#lph-cur').textContent + ' pressed=' + q('.lph-pill[data-go="3"]').getAttribute('aria-pressed');
  q('.lph-btn[data-dir="-1"]').click(); await sleep(900); out.voltou = q('#lph-cur').textContent;
  out.paraQuem = qa('.lpa-card').length + ' cartões | ' + qa('.lpa-card h3').map(h => h.textContent).join(' / ');
  out.larg = document.documentElement.scrollWidth + '/' + innerWidth; out.errs = errs; return JSON.stringify(out);
} catch (e) { return 'ERRO ' + e.stack; } })()
