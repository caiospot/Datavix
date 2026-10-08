// A primeira vista do gráfico é escura quando a pessoa não escolheu estilo; o claro continua disponível no painel
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null };
  D.loadBuffer('i.xlsx', buf, 'Vendas'); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(1200);
  const P = S.piece, hex = P.bg.color || P.bg.base, [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  ok('fundo-escuro', r + g + b < 200); ok('estilo-marcado', !!document.querySelector('[data-a=tone][data-v=tech][aria-pressed=true]'));
  document.querySelector('[data-a=tone][data-v=corporate]').click(); await sl(600); const h2 = S.piece.bg.color || S.piece.bg.base; ok('claro-continua-disponivel', parseInt(h2.slice(1, 3), 16) > 200);
  return JSON.stringify(out, null, 1); })()
