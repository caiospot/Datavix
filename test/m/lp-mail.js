// Cadastro na página inicial: o e-mail é obrigatório (hero e chamada final), inválido não avança, válido grava na fila e começa; menu sem "Começar"; com sessão volta "Novo projeto"
(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  try { localStorage.removeItem('dv-signup'); } catch (e) { /* segue */ }
  S.user = null; D.go('entry'); await sleep(500);
  out.forms = qa('.lp-mail').length; out.antigo = qa('.lp-cta > [data-a=start], .lp-final [data-a=start]').length; out.semGet = !q('.top-r [data-a=start], .top-m [data-a=start]'); out.semLink = !q('.lp-cta a.ghost');
  out.semTexto = qa('.lp-em-h').every(h => !h.textContent && getComputedStyle(h).display === 'none');
  const sub = f => f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), hero = qa('.lp-mail')[0], fin = qa('.lp-mail')[1];
  hero.elements.email.value = ''; sub(hero); await sleep(150); out.vazio = S.step + ' | ' + hero.parentNode.querySelector('.lp-em-h').textContent;
  hero.elements.email.value = 'abc@'; sub(hero); await sleep(150); out.invalido = S.step + ' | ' + hero.parentNode.querySelector('.lp-em-h').textContent + ' | bad=' + hero.classList.contains('bad');
  hero.elements.email.value = 'a'; hero.elements.email.dispatchEvent(new Event('input', { bubbles: true })); out.limpaAoDigitar = !hero.classList.contains('bad');
  fin.elements.email.value = ''; sub(fin); await sleep(150); out.finalVazio = S.step;
  fin.elements.email.value = 'Ana@Empresa.com'; sub(fin); await sleep(600); out.valido = S.step + ' user=' + JSON.stringify(S.user);
  out.lembrado = (localStorage.getItem('dv-signup') || '').slice(0, 40);
  S.user = null; D.go('entry'); await sleep(500); out.preenchido = qa('.lp-em')[0].value; // mesmo e-mail de novo: entra, mas não reenvia
  sub(qa('.lp-mail')[0]); await sleep(500); out.denovo = S.step;
  S.user = { guest: true }; D.go('entry'); await sleep(400); out.comSessao = !q('.lp-mail') && qa('.lp-cta [data-a=start], .lp-final [data-a=start]').length === 2;
  const t = await (await fetch('/nps')).text(); out.enviados = t.split('\n').filter(l => /"ev":"signup"/.test(l)).map(l => { const j = JSON.parse(l); return j.email + '|' + j.lang + '|' + !!j.token; });
  out.errs = errs; return JSON.stringify(out);
})()
