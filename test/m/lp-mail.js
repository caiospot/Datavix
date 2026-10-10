// Hero da página inicial: campo de e-mail + botão. Vazio e e-mail válido começam; inválido mostra o aviso e não avança; com sessão volta o botão "Novo projeto"
(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const q = s => document.querySelector(s);
  S.user = null; D.go('entry'); await sleep(500);
  out.form = !!q('#lpmail'); out.antigo = !!q('.lp-cta > [data-a=start]');
  const r = q('#lpmail').getBoundingClientRect(); out.largura = Math.round(r.width); out.altura = Math.round(r.height);
  const sub = () => q('#lpmail').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  q('#lpem').value = 'abc@'; sub(); await sleep(150); out.invalido = S.step + ' | ' + q('#lpem-h').textContent + ' | bad=' + q('#lpmail').classList.contains('bad');
  q('#lpem').value = 'ana@empresa.com'; sub(); await sleep(400); out.valido = S.step + ' user=' + JSON.stringify(S.user);
  S.user = null; D.go('entry'); await sleep(400); sub(); await sleep(400); out.vazio = S.step + ' user=' + JSON.stringify(S.user);
  D.go('entry'); await sleep(400); out.comSessao = !q('#lpmail') && !!q('.lp-cta [data-a=start]');
  out.errs = errs; return JSON.stringify(out);
})()
