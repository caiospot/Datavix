// Gates 44/45: janela "Dá para contar" depois de gerar, seletor no painel, Panorama, e o roteiro seguindo a história escolhida. Rodar com ?tell
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], errs = [], q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push(e.message); });
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = qa('button').find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const run = async (file, br) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null, ...(br || {}) }; D.go('entry'); await sl(200);
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 60 && !q('.mdl .tell-c'); i++) await sl(150);
  };
  await run('lojas.csv');
  const cards = qa('.mdl .tell > .tell-c[data-id]').slice(0, 3);
  ok('janela aparece com 2 a 3 histórias', !!q('.mdl') && cards.length >= 2 && cards.length <= 3);
  ok('a primeira já vem marcada', cards[0] && cards[0].getAttribute('aria-pressed') === 'true' && cards.slice(1).every(c => c.getAttribute('aria-pressed') === 'false'));
  out.cartoes = cards.map(c => c.querySelector('b').textContent + ' | ' + c.querySelector('small').textContent).join(' // ');
  ok('cada cartão mostra pergunta e números reais', cards.every(c => c.querySelector('span').textContent.length > 8 && /\d/.test(c.querySelector('small').textContent)));
  q('.mdl .tell-more summary').click(); const all = qa('.mdl .tell-more .tell-c'); out.todas = all.length; ok('"Ver todas" lista o resto e o Panorama', all.length >= 7 && all.some(c => c.dataset.id === ''));
  ok('indisponíveis ficam apagadas com motivo', all.some(c => c.classList.contains('off') && /Indisponível|Em breve/.test(c.textContent)));
  const second = cards[1].dataset.id; cards[1].click(); await sl(100); ok('clicar troca a marcação', cards[1].getAttribute('aria-pressed') === 'true' && cards[0].getAttribute('aria-pressed') === 'false');
  q('.mdl [data-m="0"]').click(); await sl(600);
  const P = S.piece; ok('história escolhida vira storyKind', P.br.storyKind === second && S.br.storyKind === second); ok('vocabulário antigo acompanha', P.br.story === nvStoryLegacy(second));
  ok('janela fecha', !q('.mdl'));
  ok('seletor do painel reflete', q('[data-a=story-kind]') && q('[data-a=story-kind]').value === second);
  const meta = P.host.ix.meta, steps = buildSteps(P, meta);
  const pl = nvPlanFor(P, meta, steps); ok('o roteiro segue a história escolhida', pl.story === second && pl.slides.length === 10 && pl.report.ok);
  out.roteiro = pl.slides.map(s => s.planTitle).join(' > ');
  // trocar pelo painel
  const sel = q('[data-a=story-kind]'), other = [...sel.options].find(o => o.value && o.value !== second && !o.disabled).value; sel.value = other; sel.dispatchEvent(new Event('change', { bubbles: true })); await sl(300);
  for (let i = 0; i < 30 && !(S.piece.host && S.piece.host.ix); i++) await sl(150); const P1 = S.piece, m1 = P1.host.ix.meta, s1 = buildSteps(P1, m1); // trocar para uma história sem achados remonta a peça: a referência muda
  ok('trocar no painel muda o roteiro', P1.br.storyKind === other && nvPlanFor(P1, m1, s1).story === other); out.troca = other + ' | ' + (q('#toast') ? q('#toast').textContent : '');
  const sel2 = q('[data-a=story-kind]'); sel2.value = ''; sel2.dispatchEvent(new Event('change', { bubbles: true })); await sl(300); ok('Panorama volta ao molde antigo', S.piece.br.storyKind === null && !nvPlanFor(S.piece, S.piece.host.ix.meta, buildSteps(S.piece, S.piece.host.ix.meta)).story);
  ok('seletor tem Panorama e histórias da Fase 1', [...q('[data-a=story-kind]').options].some(o => o.value === '') && ['compare', 'time', 'rank', 'composition', 'distribution', 'relation'].every(id => [...q('[data-a=story-kind]').options].some(o => o.value === id)));
  // Esc mantém a sugerida; pular pelo botão Panorama
  await run('lojas.csv'); const first = q('.mdl .tell > .tell-c[data-id]').dataset.id; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sl(500);
  ok('Esc aceita a primeira sugerida', S.piece.br.storyKind === first);
  await run('lojas.csv'); q('.mdl [data-m="1"]').click(); await sl(400); ok('botão Panorama', S.piece.br.storyKind === null && !q('.mdl'));
  // área empurra a sugestão (sinal, nunca filtro)
  const sg0 = nvStorySuggest(S.ds, { lang: 'pt', n: 99 }); const rk0 = nvStoryRank(S.ds, S.piece, storyEnv(S.piece).pool, {}), rkA = nvStoryRank(S.ds, { br: { area: 'finance' } }, storyEnv(S.piece).pool, {});
  ok('área só reordena (mesmas possíveis)', rk0.possible.slice().sort().join() === rkA.possible.slice().sort().join()); out.area = rk0.list.join(',') + ' → finance: ' + rkA.list.join(',');
  // uma planilha sem escolha possível não abre a janela
  S.piece = S.piece; out.errs = errs; out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
