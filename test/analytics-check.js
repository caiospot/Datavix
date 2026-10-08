// Clarity: nada carrega sem configuração do site, sem aceite ou fora do endereço publicado; aceitar carrega; recusar não carrega; app mascarado
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(500);
  const tags = () => [...document.scripts].filter(s => /clarity\.ms/.test(s.src)).length;
  localStorage.removeItem('dv-analytics');
  D.go('entry'); await sl(400);
  ok('sem-config-sem-banner', !document.getElementById('anbar') && tags() === 0 && !document.querySelector('[data-a=an-open]'));
  window.__DV = { ...(window.__DV || {}), clarity: { id: 'TESTE123', host: 'outro-endereco.example' } }; D.go('entry'); await sl(300);
  ok('outro-endereco-sem-banner', !document.getElementById('anbar') && tags() === 0);
  window.__DV.clarity = { id: 'TESTE123', host: location.hostname }; D.go('entry'); await sl(400);
  ok('banner-sem-carregar', !!document.getElementById('anbar') && tags() === 0 && document.getElementById('anbar').getAttribute('data-clarity-mask') === 'True');
  document.querySelector('[data-a=an-no]').click(); await sl(300);
  ok('recusar', !document.getElementById('anbar') && tags() === 0 && localStorage.getItem('dv-analytics') === 'off');
  ok('rodape-mostra-estado', /desativada/.test((document.querySelector('[data-a=an-open]') || {}).textContent || ''));
  document.querySelector('[data-a=an-open]').click(); await sl(300); ok('reabrir', !!document.getElementById('anbar'));
  document.querySelector('[data-a=an-yes]').click(); await sl(300);
  const sc = [...document.scripts].find(s => /clarity\.ms/.test(s.src));
  ok('aceitar-carrega', !!sc && sc.src === 'https://www.clarity.ms/tag/TESTE123' && localStorage.getItem('dv-analytics') === 'on');
  S.user = { guest: true }; S.ob = 0; D.go('ob'); await sl(300);
  ok('app-mascarado', document.getElementById('root').getAttribute('data-clarity-mask') === 'True' && !document.getElementById('anbar'));
  D.go('entry'); await sl(300); ok('inicial-sem-mascara', !document.getElementById('root').hasAttribute('data-clarity-mask'));
  localStorage.removeItem('dv-analytics');
  return JSON.stringify(out, null, 1); })()
