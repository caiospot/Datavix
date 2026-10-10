// "Editar história", "Detalhar" e "Ver o que encontrei" abrem num modal sobre o editor, com Fechar
(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('vendas.csv', await (await fetch('/dados-teste/vendas.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  const host0 = S.piece.host, layer = () => document.getElementById('layer'), btn = a => document.querySelector('#panel [data-a=' + a + ']');
  for (const [act, name] of [['story-edit', 'script'], ['story-detail', 'story'], ['story-find', 'find']]) {
    btn(act).click(); await sl(500);
    ok(act + ' abre modal', !!layer() && S.layer === name && S.step === 'editor'); out[act + ' título'] = layer() && layer().querySelector('#layer-t').textContent;
    ok(act + ' tem Fechar', !!layer() && [...layer().querySelectorAll('[data-a=layer-close]')].some(b => /Fechar|Close/.test(b.textContent) || b.classList.contains('mdl-x')));
    ok(act + ' editor segue por baixo', !!document.querySelector('#piece') && S.piece.host === host0);
    layer().querySelector('.layer-foot [data-a=layer-close]').click(); await sl(300); ok(act + ' Fechar volta ao editor', !layer() && !S.layer && S.step === 'editor' && !document.querySelector('.mdl'));
  }
  // Esc fecha
  btn('story-edit').click(); await sl(400); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sl(300); ok('Esc fecha', !layer());
  // fluxo completo do roteiro dentro do modal
  btn('story-edit').click(); await sl(500); layer().querySelector('#sc-title').value = 'Meu tema'; layer().querySelector('#sc-title').dispatchEvent(new Event('input', { bubbles: true }));
  layer().querySelector('[data-a=sc-next]').click(); await sl(300); ok('passo 2 dentro do modal', !!layer() && !!layer().querySelector('.sc-card')); layer().querySelector('[data-a=sc-next]').click(); await sl(300);
  layer().querySelector('[data-a=sc-back]').click(); await sl(300); ok('voltar dentro do modal', !!layer() && !!layer().querySelector('.sc-list'));
  layer().querySelector('[data-a=sc-next]').click(); await sl(300); layer().querySelector('[data-a=sc-finish]').click(); await sl(900);
  ok('concluir fecha o modal e grava', !layer() && S.piece.title === 'Meu tema' && !!S.piece.sb && S.piece.host === host0 && document.getElementById('ptitle').textContent === 'Meu tema');
  // voltar no passo 1 fecha
  btn('story-edit').click(); await sl(500); layer().querySelector('[data-a=sc-back]').click(); await sl(300); ok('Voltar no passo 1 fecha', !layer());
  // "ver o que encontrei" -> guiar em 3 perguntas dentro do modal
  btn('story-find').click(); await sl(500); const g = layer().querySelector('[data-a=fd-guide3]'); ok('find tem guiar em 3', !!g); if (g) { g.click(); await sl(400); ok('find -> roteiro no mesmo modal', S.layer === 'script' && !!layer()); }
  layer() && layer().querySelector('.mdl-x').click(); await sl(300); ok('× fecha', !layer());
  out.errs = errs.slice(0, 4); return JSON.stringify(out, null, 1); })()
