// Landing, portão 3: o quadro troca de gráfico (Árvore radial, Raios, Rio, Cordilheira) com a mesma planilha; abas, troca automática, chips refazem o gráfico
(async () => { try {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const origErr = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  S.user = null; D.go('entry'); await sleep(3000);
  const lit = () => { const cv = q('#lpcv'), px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < px.length; i += 4 * 97) if (px[i]) n++; return n; };
  out.abas = qa('.lpf-tab').map(b => b.textContent.trim()); out.organism = lit();
  for (const id of ['rays', 'river', 'ridge', 'organism']) { q(`.lpf-tab[data-ch=${id}]`).click(); await sleep(3200); out[id] = lit() + ' sel=' + q(`.lpf-tab[data-ch=${id}]`).getAttribute('aria-selected'); }
  q('.lpf-tab[data-ch=river]').click(); await sleep(800); const chip = qa('.lpf-chip')[0]; chip.click(); await sleep(2800); out.chipRio = chip.getAttribute('aria-pressed') + ' px=' + lit(); chip.click(); await sleep(300);
  const cv = q('#lpcv'), r = cv.getBoundingClientRect(); cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); await sleep(200); out.hoverOk = true;
  out.larg = document.documentElement.scrollWidth + '/' + innerWidth; out.errs = errs; return JSON.stringify(out);
} catch (e) { return 'ERRO ' + e.stack; } })()
