// Tela "Escolha a aba": o título vem do idioma da tela (nos dois idiomas) e os nomes das abas são os do arquivo
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  for (const lang of ['pt', 'en']) {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === lang.toUpperCase()); if (b) b.click(); await sl(300);
    S.user = { guest: true }; D.go('entry'); D.loadBuffer('ideal.xlsx', buf.slice(0)); for (let i = 0; i < 100 && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    const h = document.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), p = document.querySelector('.sub').textContent;
    out['titulo_' + lang] = h; ok('titulo-' + lang, lang === 'pt' ? /ESCOLHA A aba/i.test(h) : /PICK THE sheet/i.test(h)); ok('texto-' + lang, lang === 'pt' ? /várias abas/.test(p) : /several sheets/.test(p));
    ok('abas-do-arquivo-' + lang, [...document.querySelectorAll('.opt strong')].map(x => x.textContent).join() === 'Vendas,Casos CX,Funil,Resumo,Mapa,Leia-me');
  }
  return JSON.stringify(out, null, 1); })()
