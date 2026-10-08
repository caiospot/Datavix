/* Datavix: análise de uso opcional (Microsoft Clarity). Só carrega no site publicado, só depois de a pessoa aceitar, e as telas do app
 * (tudo menos a página inicial) ficam marcadas para o Clarity NÃO registrar textos: a planilha e o que sai dela nunca entram na análise.
 * Recusar ou não responder = nada é carregado. A escolha fica em localStorage ("dv-analytics": "on" ou "off") e dá para mudar no rodapé. */
const ANX = {
  pt: { t: 'Podemos medir o uso do site?', p: 'Usamos o Microsoft Clarity para ver cliques, rolagem e problemas de uso, de forma anônima. Ele não registra o conteúdo da sua planilha: as telas do app ficam mascaradas. Só ativa se você aceitar.', ok: 'Aceitar', no: 'Recusar', more: 'Saiba mais', foot: 'Análise de uso', on: 'ativada', off: 'desativada' },
  en: { t: 'May we measure how the site is used?', p: 'We use Microsoft Clarity to see clicks, scrolling and usability problems, anonymously. It does not record your spreadsheet content: the app screens are masked. It only turns on if you accept.', ok: 'Accept', no: 'Decline', more: 'Learn more', foot: 'Usage analytics', on: 'on', off: 'off' }
};
const anT = () => ANX[LANG === 'en' ? 'en' : 'pt'];
const anCfg = () => { const c = window.__DV && window.__DV.clarity; return c && c.id && c.host && location.hostname === c.host ? c : null; };
const anChoice = () => lsGet('dv-analytics');
let anLoaded = false;
function anLoad() {
  const c = anCfg(); if (!c || anLoaded || anChoice() !== 'on') return;
  anLoaded = true;
  (function (w, d, a, r, i, t, y) { w[a] = w[a] || function () { (w[a].q = w[a].q || []).push(arguments); }; t = d.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = d.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', c.id);
}
function anBanner() {
  if (document.getElementById('anbar')) return; const t = anT();
  const b = document.createElement('div'); b.id = 'anbar'; b.className = 'anbar'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', t.t); b.setAttribute('data-clarity-mask', 'True');
  b.innerHTML = `<b>${esc(t.t)}</b><p>${esc(t.p)}</p><div class="an-a"><button type="button" class="btn sm" data-a="an-yes">${esc(t.ok)}</button><button type="button" class="btn ghost sm" data-a="an-no">${esc(t.no)}</button><button type="button" class="btn text sm" data-a="privacy">${esc(t.more)}</button></div>`;
  document.body.appendChild(b);
}
function anSet(v) {
  lsSet('dv-analytics', v); const b = document.getElementById('anbar'); if (b) b.remove();
  if (v === 'on') anLoad();
  else { try { if (window.clarity) window.clarity('stop'); } catch (e) { /* sem Clarity carregado */ } ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM'].forEach(n => { document.cookie = `${n}=; Max-Age=0; path=/`; }); }
  if (S.step === 'entry') render();
}
function anInit() { if (!anCfg()) return; const c = anChoice(); if (c === 'on') anLoad(); else if (c !== 'off' && S.step === 'entry') anBanner(); }
// link do rodapé: mostra o estado e permite mudar
const anFooter = () => (anCfg() ? ` · <button type="button" class="lp-fb" data-a="an-open">${esc(anT().foot)}: ${esc(anChoice() === 'on' ? anT().on : anT().off)}</button>` : '');
// páginas do app (menos a inicial) e os projetos salvos da inicial nunca têm texto registrado
function anMask(step) { const r = document.getElementById('root'); if (r) { if (step === 'entry') r.removeAttribute('data-clarity-mask'); else r.setAttribute('data-clarity-mask', 'True'); } const s = document.querySelector('.lp-saved'); if (s) s.setAttribute('data-clarity-mask', 'True');
  if (step === 'entry') anInit(); else { const b = document.getElementById('anbar'); if (b) b.remove(); } }
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a;
  if (a === 'an-yes') { e.stopPropagation(); anSet('on'); } else if (a === 'an-no') { e.stopPropagation(); anSet('off'); } else if (a === 'an-open') { e.stopPropagation(); const b = document.getElementById('anbar'); if (b) b.remove(); anBanner(); }
}, true);
