// Gate 51: pasta de trabalho com várias abas. Papéis sugeridos, tela "O que há nesta planilha", slide Fontes e método, ressalvas, perfil e painel.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const start = async file => { S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('upload'); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'sheet' && !(S.ds && S.fileName) && S.step !== 'upload-error'; i++) await sl(100); await sl(500); };
  const gen = async () => { for (let i = 0; i < 100 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(400); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); } };
  const FORBID = /\b(melhor|melhores|superior|inferior|por causa|culpa|devido|causou|better|best|because)\b/i;
  // ---- F1: quatro abas, cada uma com o seu papel
  await start('f1-senna-schumacher.xlsx');
  ok('F1: a tela de abas aparece', S.step === 'sheet' && !!S.wbv && !!q('[data-c=wb-role]'));
  const roles = () => S.wbv.infos.map((s, i) => s.name + ':' + S.wbv.roles[i]).join(' | '); out.roles = roles();
  ok('F1: papéis sugeridos (Perfil, Principal, Fontes, Detalhe)', S.wbv.roles.join() === 'profile,main,sources,detail');
  ok('F1: uma linha por aba, com papel e resumo', document.querySelectorAll('.rd-row').length === 4 && /23 linhas/.test(q('.screen').innerText) && /8 colunas numéricas/.test(q('.screen').innerText));
  // trocar o papel na tela: outra aba como Principal rebaixa a anterior a Detalhe
  { const sel = q('[data-c=wb-role][data-i="3"]'); sel.value = 'main'; sel.dispatchEvent(new Event('change', { bubbles: true })); await sl(200);
    ok('Trocar a Principal rebaixa a anterior a Detalhe', S.wbv.roles.filter(r => r === 'main').length === 1 && S.wbv.roles[3] === 'main' && S.wbv.roles[1] === 'detail');
    const s2 = q('[data-c=wb-role][data-i="3"]'); s2.value = 'detail'; s2.dispatchEvent(new Event('change', { bubbles: true })); await sl(200); ok('Sem Principal, o botão fica desligado e avisa', q('[data-a=wb-go]').disabled && /Principal/.test(q('.screen').innerText));
    const s3 = q('[data-c=wb-role][data-i="1"]'); s3.value = 'main'; s3.dispatchEvent(new Event('change', { bubbles: true })); await sl(200); const s4 = q('[data-c=wb-role][data-i="3"]'); s4.value = 'detail'; s4.dispatchEvent(new Event('change', { bubbles: true })); await sl(200); }
  ok('F1: papéis de volta ao sugerido', S.wbv.roles.join() === 'profile,main,detail,detail' || S.wbv.roles.join() === 'profile,main,sources,detail' || S.wbv.roles[1] === 'main'); S.wbv.roles = ['profile', 'main', 'sources', 'detail']; render(); await sl(200);
  q('[data-a=wb-go]').click(); await gen();
  const P = S.piece, wbx = P.built.wbx; ok('F1: a peça guarda os papéis e os textos (built.wbx)', !!wbx && wbx.sheets.map(s => s.role).join() === 'profile,main,sources,detail' && wbx.sheets[2].text.length >= 17 && !wbx.sheets[1].text); out.nText = wbx.sheets[2].text.length;
  ok('F1: Principal é o Comparativo (12 linhas) e vira face a face', S.ds.rowCount === 12 && !!P.built.vs && P.built.vs.form === 'entity-long');
  const meta = P.host.ix.meta, steps = buildSteps(P, meta), plans = {}; for (const N of [2, 5, 10]) plans[N] = nvPlan(P, meta, steps, N, 'versus');
  const src = plans[10].slides.find(s => s.id === 'wb-sources'), srcRows = nvWbRows(wbx.sheets[2]);
  ok('Fontes: penúltimo slide do roteiro de 10', !!src && plans[10].slides.length - 2 === plans[10].slides.indexOf(src) && plans[10].report.ok); out.len10 = plans[10].slides.map(s => s.id).join(' > ');
  ok('Fontes: todos os itens e links idênticos aos da aba', srcRows.length === wbx.sheets[2].text.length - 1 && src.viz.items.length === srcRows.length && src.viz.items.every((it, i) => it.k === srcRows[i].k && it.t === srcRows[i].t) && src.viz.items.some(it => /https:\/\/www\.formula1\.com\/en\/results\/1989\/drivers/.test(it.t)));
  const lim = plans[10].slides.find(s => s.id === 'vs-limits'), comp = srcRows.find(r => r.k === 'Comparabilidade');
  ok('Limites: a frase de Comparabilidade idêntica à da aba', !!comp && lim.lines.some(l => l === 'Comparabilidade: ' + comp.t));
  const prof = plans[10].slides.find(s => s.id === 'vs-profile'); ok('Perfil: textos da aba de perfil, sem alteração', !!prof && prof.lines.some(l => /Tricampeão Mundial \(1988, 1990, 1991\)/.test(l)) && prof.lines.some(l => /^Equipes/.test(l)));
  ok('Roteiro de 5: Fontes é o penúltimo e o plano cabe em 5', plans[5].slides.length <= 5 && plans[5].slides[plans[5].slides.length - 2].id === 'wb-sources' && plans[5].report.ok); out.len5 = plans[5].slides.map(s => s.id).join(' > ');
  ok('Roteiro de 2: sem Fontes', plans[2].slides.every(s => s.id !== 'wb-sources') && plans[2].report.ok);
  const mine = pl => pl.slides.filter(s => s.id !== 'wb-sources').flatMap(s => [s.head, s.big && s.big.label, s.calc && s.calc.formula].filter(Boolean)).join(' | ').replace(new RegExp(comp.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  ok('Textos do Datavix sem palavras de veredito ou causa (fora o texto copiado da planilha)', !FORBID.test(mine(plans[10]).replace(/Tricampeão[^|]*|Equipes[^|]*|Estilo[^|]*|Postura[^|]*|Status[^|]*/g, ''))); out.forbid = (mine(plans[10]).match(FORBID) || [])[0] || null;
  // painel: trocar o papel de Fontes para Ignorar refaz o roteiro
  const pn = document.querySelector('#panel'); ok('Painel mostra as abas e o papel de cada uma', !!pn && /Abas da planilha/i.test(pn.textContent) && pn.querySelectorAll('[data-a=wb-panel-role]').length === 4);
  { const sel = pn.querySelector('[data-a=wb-panel-role][data-i="2"]'); sel.value = 'ignore'; sel.dispatchEvent(new Event('change', { bubbles: true })); await sl(300);
    const p2 = nvPlan(P, meta, steps, 10, 'versus'); ok('Fontes para Ignorar: o slide some e a Comparabilidade também', p2.slides.every(s => s.id !== 'wb-sources') && !p2.slides.find(s => s.id === 'vs-limits').lines.some(l => /^Comparabilidade/.test(l)) && p2.report.ok);
    const sel2 = document.querySelector('#panel').querySelector('[data-a=wb-panel-role][data-i="2"]'); sel2.value = 'sources'; sel2.dispatchEvent(new Event('change', { bubbles: true })); await sl(300);
    ok('Fontes de volta: o slide volta', nvPlan(P, meta, steps, 10, 'versus').slides.some(s => s.id === 'wb-sources')); }
  P.br = P.br || {}; P.br.storyKind = 'versus'; S.br.storyKind = 'versus'; const deck = pxDeck(P), xml = deck.slides.map(s => s.sh.join('')).join('');
  ok('PPTX: slide Fontes e método com o texto das fontes', /name="Fontes"/.test(xml) && /formula1\.com\/en\/results\/1992\/drivers/.test(xml)); out.pptx = deck.slides.length;
  // ---- pasta com aba oculta, aba vazia e notas
  await start('pasta-abas.xlsx');
  ok('Pasta com oculta e vazia: Vendas principal, Rascunho e Vazia ignoradas, Notas fontes', S.step === 'sheet' && S.wbv.roles.join() === 'main,ignore,ignore,sources'); out.roles2 = S.wbv ? roles() : null;
  // ---- uma aba útil só (as outras vazias): segue direto, sem a tela
  await start('pasta-vazia.xlsx'); ok('Pasta só com abas vazias não gera a tela de papéis (volta ao seletor simples ou avisa)', !S.wbv);
  // ---- planilhas de uma aba só e CSV: sem a tela
  await start('lojas.csv'); ok('CSV: sem tela de abas', S.step !== 'sheet' && !S.wbv && !!S.ds);
  await start('datavix-planilha-ideal.xlsx'); out.ideal = S.step + ' ' + (S.wbv ? roles() : '-');
  await start('financeiro.xlsx'); out.fin = S.step + ' ' + (S.wbv ? roles() : '-');
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
