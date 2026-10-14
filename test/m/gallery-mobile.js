// Gate 54: em tela pequena a galeria abre como lista (sem miniaturas); a escolha continua funcionando. Rodar com ?tell e largura de 600 px ou menos.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1'); try { localStorage.removeItem('dv-mg-view'); } catch (e) { /* segue */ }
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200);
  D.loadBuffer('lojas.csv', await (await fetch('/dados-teste/lojas.csv')).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100);
  D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
  for (let i = 0; i < 60 && !q('.mdl .mg'); i++) await sl(150); await sl(500);
  ok('largura pequena', innerWidth < 760); out.w = innerWidth;
  const root = q('.mdl .mg'); ok('abre como lista', !!root && root.dataset.view === 'list' && getComputedStyle(q('.mdl .mg-thumb')).display === 'none' && getComputedStyle(q('.mdl .mg-seq')).display === 'none');
  const cards = qa('.mdl .tell > .tell-c[data-id]'); ok('os recomendados continuam como cartões de texto, um por linha', cards.length >= 2 && cards.every(c => c.querySelector('b') && c.querySelector('.mg-ask') && c.querySelector('.mg-fit')) && new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size === 1);
  ok('a janela cabe na tela (sem rolagem horizontal)', document.documentElement.scrollWidth <= innerWidth + 1 && q('.mdl-box').getBoundingClientRect().width <= innerWidth + 1);
  q('.mdl [data-a=mg-view][data-v=gallery]').click(); await sl(250); ok('dá para trocar para a galeria e as miniaturas cabem na largura', q('.mdl .mg').dataset.view === 'gallery' && q('.mdl .mg-thumb').getBoundingClientRect().width <= innerWidth && q('.mdl .mg-thumb').getBoundingClientRect().width > 150);
  cards[1].click(); await sl(150); ok('escolher um cartão e confirmar', cards[1].getAttribute('aria-pressed') === 'true'); q('.mdl [data-m="0"]').click(); await sl(600); ok('aplica a história', !q('.mdl') && S.piece.br.storyKind === cards[1].dataset.id);
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
