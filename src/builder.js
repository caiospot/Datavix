/* Datavix: construtor de história. Depois de ler a planilha, o app mostra "O que encontrei" (fatos com número e cálculo) e, se a pessoa quiser,
 * conduz sete perguntas: mensagem, evidências, diagnóstico, implicações, prioridades, plano de ação e decisão pedida.
 * O app prova os fatos; o julgamento (diagnóstico, prioridades, plano) é da pessoa, e as sugestões vêm sempre marcadas como sugestão. */
const BLD = {
  pt: {
    fdLbl: 'DESCOBERTA', fdH: ['O QUE EU', 'encontrei'], fdP: 'Li a sua planilha e calculei os fatos abaixo. Escolha o que será o centro da sua história; os outros viram evidência.',
    rec: 'Sugerido para a sua decisão', calc: 'ver cálculo', quick: 'Montar rápido', guide: 'Guiar minha história', quickHint: 'O Datavix monta o roteiro com o fato escolhido e as melhores evidências.',
    guideHint: 'Sete perguntas curtas: mensagem, evidências, diagnóstico, implicações, prioridades, plano e decisão.', none: 'Não encontrei fatos suficientes para montar uma história. Você ainda pode apresentar o gráfico.',
    stLbl: 'HISTÓRIA', skip: 'Pular', next: 'Continuar', finish: 'Concluir história', back: 'Voltar', sug: 'Sugestões (edite à vontade)', centerLbl: 'Centro da história',
    q: [['QUAL É A MENSAGEM', 'central?'], ['QUAIS DADOS', 'embasam?'], ['QUAL O', 'diagnóstico?'], ['O QUE ISSO', 'significa?'], ['COMO', 'priorizar?'], ['QUAL O PLANO', 'de ação?'], ['O QUE VOCÊ PRECISA QUE', 'decidam?']],
    help: ['Uma frase que o público leve para casa. Parta do fato escolhido ou escreva a sua.', 'Marque as evidências que sustentam a mensagem. Cada uma vira um slide com o número e o cálculo.', 'O que os números sustentam. A planilha mostra o quê, não o porquê: o diagnóstico é a sua leitura.', 'Até 3 implicações, nas suas palavras. As sugestões são só ponto de partida.', 'Escolha o critério; o Datavix ordena os grupos com o número ao lado. Você decide até onde priorizar.', 'Até 3 ações. Em "acompanha", escolha o número da planilha que mostra se a ação está funcionando.', 'O último slide: o pedido. Seja específico.'],
    msgPh: 'Ex.: Eletrônicos puxa o resultado, mas o total depende de poucos itens', evCount: (n, s) => `${n} selecionada(s). Para o seu tempo, o sugerido é ${s}.`, evNone: 'Não há outras evidências além do fato central.',
    dNote: 'Interpretação sua. O Datavix só mostra o que os números sustentam, não as causas.', dPh: 'Ou escreva o seu diagnóstico em uma frase', dOwn: 'Seu diagnóstico (opcional)',
    iPh: ['Implicação 1', 'Implicação 2', 'Implicação 3'], pN: 'Quantos entram', pNone: 'Esta planilha não tem grupos suficientes para ordenar.',
    pl: { a: 'Ação', o: 'Quem', d: 'Quando', m: 'Acompanha', none: '(sem número)', add: '+ Adicionar ação', del: 'Remover' }, askPh: 'Ex.: Aprovar o investimento nas três primeiras prioridades até o fim do mês',
    soFar: n => `Roteiro até aqui: ${n} slides`, done: (n, m) => `História pronta: ${n} slides, cerca de ${m} min.`, pr: { top: 'Onde concentrar', low: 'O que rever', growth: 'Onde cresce mais', drop: 'Onde cai mais' },
    panelH: 'História', panelBtn: 'Editar história', panelFind: 'Ver o que encontrei', panelNote: 'Mensagem, evidências, diagnóstico, prioridades, plano e decisão: o roteiro da apresentação e do vídeo.',
  },
  en: {
    fdLbl: 'DISCOVERY', fdH: ['WHAT I', 'found'], fdP: 'I read your spreadsheet and calculated the facts below. Pick the one that will be the center of your story; the others become evidence.',
    rec: 'Suggested for your decision', calc: 'see calculation', quick: 'Build it fast', guide: 'Guide my story', quickHint: 'Datavix builds the outline with the chosen fact and the best evidence.',
    guideHint: 'Seven short questions: message, evidence, diagnosis, implications, priorities, plan and decision.', none: 'I did not find enough facts to build a story. You can still present the chart.',
    stLbl: 'STORY', skip: 'Skip', next: 'Continue', finish: 'Finish story', back: 'Back', sug: 'Suggestions (edit freely)', centerLbl: 'Center of the story',
    q: [['WHAT IS THE CENTRAL', 'message?'], ['WHICH DATA', 'support it?'], ['WHAT IS THE', 'diagnosis?'], ['WHAT DOES IT', 'mean?'], ['HOW TO', 'prioritize?'], ['WHAT IS THE', 'action plan?'], ['WHAT DO YOU NEED THEM TO', 'decide?']],
    help: ['One sentence the audience takes home. Start from the chosen fact or write your own.', 'Tick the evidence that supports the message. Each becomes a slide with the number and the calculation.', 'What the numbers support. The spreadsheet shows what, not why: the diagnosis is your reading.', 'Up to 3 implications, in your own words. Suggestions are only a starting point.', 'Pick the criterion; Datavix sorts the groups with the number beside them. You decide how far to prioritize.', 'Up to 3 actions. Under "tracks", pick the spreadsheet number that shows whether the action works.', 'The last slide: the ask. Be specific.'],
    msgPh: 'E.g.: Electronics drives the result, but the total depends on a few items', evCount: (n, s) => `${n} selected. For your time, ${s} is suggested.`, evNone: 'There is no other evidence besides the central fact.',
    dNote: 'Your interpretation. Datavix only shows what the numbers support, not the causes.', dPh: 'Or write your diagnosis in one sentence', dOwn: 'Your diagnosis (optional)',
    iPh: ['Implication 1', 'Implication 2', 'Implication 3'], pN: 'How many to include', pNone: 'This spreadsheet does not have enough groups to sort.',
    pl: { a: 'Action', o: 'Who', d: 'When', m: 'Tracks', none: '(no number)', add: '+ Add action', del: 'Remove' }, askPh: 'E.g.: Approve the investment in the first three priorities by the end of the month',
    soFar: n => `Outline so far: ${n} slides`, done: (n, m) => `Story ready: ${n} slides, about ${m} min.`, pr: { top: 'Where to concentrate', low: 'What to review', growth: 'Where it grows most', drop: 'Where it falls most' },
    panelH: 'Story', panelBtn: 'Edit story', panelFind: 'See what I found', panelNote: 'Message, evidence, diagnosis, priorities, plan and decision: the outline of the presentation and the video.',
  },
};
const BT = () => BLD[LANG] || BLD.pt;

// contexto (fatos, centro sugerido, passos) calculado sem o editor montado; guarda por peça e idioma
function bCtx() {
  const P = S.piece, key = `${P.id}|${LANG}|${(P.insights || []).length}|${P.type}`;
  if (S._bctx && S._bctx.key === key) return S._bctx;
  const meta = makeMeta(P), steps = buildSteps(P, meta), cand = storyCandidates(P, meta, steps);
  return (S._bctx = { key, P, meta, steps, cand, by: id => cand.facts.find(x => x.id === id) });
}
const bFactCard = (f, o = {}) => `<div class="fd-card${o.sel ? ' on' : ''}"><button type="button" class="fd-main" data-a="${o.a}" data-v="${esc(f.id)}" aria-pressed="${!!o.sel}">${o.badge ? `<span class="fd-badge">${esc(o.badge)}</span>` : ''}<span class="fd-kick">${esc(o.kick || f.kick.label)}</span><span class="fd-head">${esc(f.head)}</span>${f.big ? `<span class="fd-big"><b>${esc(f.big.text)}</b><small>${esc(f.big.label)}</small></span>` : ''}</button>${f.calc ? `<details class="fd-calc"><summary>${esc(BT().calc)}</summary><div class="fd-cb"><b>${esc(f.calc.title)}</b><span>${esc(f.calc.formula)}</span>${f.calc.rows.map(r => `<div><span>${esc(r.k)}</span><b>${esc(r.v)}</b></div>`).join('')}</div></details>` : ''}</div>`;

/* ---- tela "O que encontrei" ---- */
function findScreen() {
  const B = BT(), c = bCtx(), cand = c.cand, ranked = cand.ranked;
  if (!ranked.length) return `<div class="wrap-narrow" style="max-width:760px"><div class="lbl">[ ${B.fdLbl} ]</div><h2 style="margin-top:12px">${title2(B.fdH)}</h2><p class="sub">${esc(B.none)}</p><div class="row" style="margin-top:26px"><button class="btn" data-a="fd-quick">${esc(B.quick)} →</button></div></div>`;
  if (!S.find || !c.by(S.find.center)) S.find = { center: cand.center };
  const rec = cand.center;
  return `<div class="wrap-narrow fd" style="max-width:1000px">
    <div class="lbl">[ ${B.fdLbl} ]</div><h2 style="margin-top:12px">${title2(B.fdH)}</h2><p class="sub">${esc(B.fdP)}</p>
    <div class="fd-grid" role="radiogroup" aria-label="${esc(B.centerLbl)}">${ranked.map(f => bFactCard(f, { a: 'fd-pick', sel: S.find.center === f.id, badge: f.id === rec ? B.rec : '' })).join('')}</div>
    <div class="fd-actions"><button class="btn ghost" data-a="back-to" data-v="mapping">← ${esc(B.back)}</button><div class="fd-ctas"><div><button class="btn" data-a="fd-guide">${esc(B.guide)} →</button><p class="note">${esc(B.guideHint)}</p></div><div><button class="btn ghost" data-a="fd-quick">${esc(B.quick)}</button><p class="note">${esc(B.quickHint)}</p></div></div></div>
  </div>`;
}

/* ---- construtor: sete perguntas ---- */
const SB_N = 7;
function sbInit(from) {
  const c = bCtx(), sb = S.piece.sb || {};
  return { step: 0, from: from || 'find', msg: sb.msg || '', center: sb.center || (S.find && c.by(S.find.center) ? S.find.center : c.cand.center), ev: sb.ev ? sb.ev.slice() : c.cand.ev.slice(),
    diag: sb.diag ? { ...sb.diag } : { fact: null, text: '' }, impl: sb.impl ? [...sb.impl, '', '', ''].slice(0, 3) : ['', '', ''], prio: sb.prio ? { ...sb.prio } : null,
    plan: sb.plan && sb.plan.length ? sb.plan.map(r => ({ ...r })) : [{ a: '', o: '', d: '', m: '' }], ask: sb.ask || '' };
}
const sbAnswers = a => ({ msg: a.msg.trim(), center: a.center, ev: a.ev.filter(id => id !== a.center), diag: { fact: a.diag.fact || null, text: (a.diag.text || '').trim() }, impl: a.impl.map(x => x.trim()).filter(Boolean), prio: a.prio && a.prio.crit ? { crit: a.prio.crit, n: a.prio.n || 3 } : null, plan: a.plan.filter(r => (r.a || '').trim()), ask: a.ask.trim() });
function sbCount() { try { const c = bCtx(), P2 = { ...c.P, sb: sbAnswers(S.sb) }; return (storyFromAnswers(P2, c.meta, c.steps) || []).length; } catch (e) { return 0; } }
const sbChips = (arr, kind) => arr.length ? `<div class="sb-sugs"><span class="note">${esc(BT().sug)}</span>${arr.map((t, i) => `<button type="button" class="sb-chip" data-a="sb-sug" data-k="${kind}" data-v="${i}">${esc(t)}</button>`).join('')}</div>` : '';

function sbBody(step) {
  const B = BT(), a = S.sb, c = bCtx(), P = c.P, center = c.by(a.center), sug = storySuggest(P, center), L = STORY_TXT[LANG] || STORY_TXT.pt;
  if (step === 0) return `<div class="sb-center"><span class="lbl">[ ${esc(B.centerLbl)} ]</span><p>${center ? esc(center.head) : ''}</p></div>
    <textarea class="field sb" id="sb-msg" maxlength="200" placeholder="${esc(B.msgPh)}" aria-label="${esc(B.q[0].join(' '))}">${esc(a.msg || P.title || '')}</textarea>${sbChips(sug.msg, 'msg')}`;
  if (step === 1) { const others = c.cand.ranked.filter(f => f.id !== a.center), sugN = { quick: 1, normal: 2, full: 3 }[(P.br && P.br.time) || 'full'];
    return others.length ? `<p class="note">${esc(B.evCount(a.ev.filter(id => id !== a.center).length, sugN))}</p><div class="fd-grid sb-list">${others.map(f => bFactCard(f, { a: 'sb-ev', sel: a.ev.includes(f.id) })).join('')}</div>` : `<p class="note">${esc(B.evNone)}</p>`; }
  if (step === 2) { const rd = storyReadings(P, c.cand.facts);
    return `<p class="note">${esc(B.dNote)}</p><div class="fd-grid sb-list">${rd.map(r => `<div class="fd-card${a.diag.fact === r.id ? ' on' : ''}"><button type="button" class="fd-main" data-a="sb-diag" data-v="${esc(r.id)}" aria-pressed="${a.diag.fact === r.id}"><span class="fd-kick">${esc(r.label)}</span><span class="fd-head">${esc(r.head)}</span>${r.big ? `<span class="fd-big"><b>${esc(r.big.text)}</b><small>${esc(r.big.label)}</small></span>` : ''}</button></div>`).join('')}</div>
      <label class="sb-own"><span class="lbl">${esc(B.dOwn)}</span><textarea class="field sb" id="sb-dtext" maxlength="220" placeholder="${esc(B.dPh)}">${esc(a.diag.text || '')}</textarea></label>`; }
  if (step === 3) return `<div class="sb-inputs">${[0, 1, 2].map(k => `<input class="field sb" id="sb-impl-${k}" maxlength="160" value="${esc(a.impl[k] || '')}" placeholder="${esc(B.iPh[k])}" aria-label="${esc(B.iPh[k])}">`).join('')}</div>${sbChips(sug.impl, 'impl')}`;
  if (step === 4) { const pr = storyPriority(P, a.prio && a.prio.crit); if (!pr.avail.length) return `<p class="note">${esc(B.pNone)}</p>`; const n = Math.max(1, Math.min(5, (a.prio && a.prio.n) || 3)), cur = a.prio ? a.prio.crit : null;
    return `<div class="sb-crit" role="radiogroup">${pr.avail.map(k => `<button type="button" class="sb-opt" data-a="sb-crit" data-v="${k}" aria-pressed="${cur === k}"><strong>${esc(B.pr[k])}</strong><small>${esc(L.critF[k])}</small></button>`).join('')}</div>
      ${cur ? `<div class="sb-n"><span class="lbl">${esc(B.pN)}</span><button type="button" class="btn ghost sm" data-a="sb-n" data-v="-1" aria-label="−">−</button><b class="num">${n}</b><button type="button" class="btn ghost sm" data-a="sb-n" data-v="1" aria-label="+">+</button></div><ol class="sb-rank">${pr.list.slice(0, n).map((x, i) => `<li><i>${i + 1}</i><span>${esc(x.label)}</span><b>${esc(pr.crit === 'growth' || pr.crit === 'drop' ? csPct(x.growth, LANG) : pr.f(x.value))}</b></li>`).join('')}</ol>` : ''}`; }
  if (step === 5) { const mets = storyMetrics(P, c.cand.facts);
    return `<div class="sb-plan">${a.plan.map((r, i) => `<div class="sb-row"><input class="field sb" id="sb-pa-${i}" maxlength="140" value="${esc(r.a)}" placeholder="${esc(B.pl.a)}" aria-label="${esc(B.pl.a)}"><input class="field sb" id="sb-po-${i}" maxlength="60" value="${esc(r.o)}" placeholder="${esc(B.pl.o)}" aria-label="${esc(B.pl.o)}"><input class="field sb" id="sb-pd-${i}" maxlength="40" value="${esc(r.d)}" placeholder="${esc(B.pl.d)}" aria-label="${esc(B.pl.d)}"><select class="field sb" id="sb-pm-${i}" aria-label="${esc(B.pl.m)}"><option value="">${esc(B.pl.none)}</option>${mets.map(m => `<option value="${esc(m.id)}"${r.m === m.id ? ' selected' : ''}>${esc(m.text)}</option>`).join('')}</select>${a.plan.length > 1 ? `<button type="button" class="btn ghost sm" data-a="sb-plan-del" data-v="${i}" aria-label="${esc(B.pl.del)}">×</button>` : ''}</div>`).join('')}</div>
      ${a.plan.length < 3 ? `<button type="button" class="btn ghost sm" data-a="sb-plan-add">${esc(B.pl.add)}</button>` : ''}${sbChips(sug.act, 'act')}`; }
  return `<textarea class="field sb" id="sb-ask" maxlength="200" placeholder="${esc(B.askPh)}" aria-label="${esc(B.q[6].join(' '))}">${esc(a.ask)}</textarea>${sbChips(sug.ask ? [sug.ask] : [], 'ask')}`;
}
function storyScreen() {
  const B = BT(), a = S.sb, n = a.step + 1, last = a.step === SB_N - 1;
  return `<div class="wrap-narrow sb-screen" style="max-width:860px"><div class="prog"><span class="lbl">[ ${B.stLbl} // ${String(n).padStart(2, '0')}/${String(SB_N).padStart(2, '0')} ]</span><div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="${SB_N}" aria-valuenow="${n}"><i style="width:${(n / SB_N) * 100}%"></i></div></div>
    <h2>${title2(B.q[a.step])}</h2><p class="sb-help">${esc(B.help[a.step])}</p>${sbBody(a.step)}
    <p class="note sb-count">${esc(B.soFar(sbCount()))}</p>
    <div class="row sb-nav"><button class="btn ghost" data-a="sb-back">← ${esc(B.back)}</button>${a.step > 0 ? `<button class="btn text" data-a="sb-skip">${esc(B.skip)}</button>` : ''}<button class="btn" data-a="${last ? 'sb-finish' : 'sb-next'}">${esc(last ? B.finish : B.next)} →</button></div></div>`;
}

function sbFinish() {
  const P = S.piece, ans = sbAnswers(S.sb); P.sb = ans;
  if (ans.msg) { P.title = ans.msg; }
  S.dirty = true; S.sb = null; S.find = null; S._bctx = null; go('editor');
  const n = (() => { try { return (storyFromAnswers(P, makeMeta(P), buildSteps(P, makeMeta(P))) || []).length; } catch (e) { return 0; } })();
  toast(BT().done(n, Math.max(1, Math.round(n * 0.75))));
}
function fdQuick() {
  const P = S.piece, c = bCtx(), center = (S.find && c.by(S.find.center)) ? S.find.center : c.cand.center, cap = { quick: 1, normal: 2, full: 3 }[(P.br && P.br.time) || 'full'];
  P.sb = { msg: '', center, ev: c.cand.ranked.filter(f => f.id !== center).slice(0, cap).map(f => f.id), diag: { fact: null, text: '' }, impl: [], prio: null, plan: [], ask: '' };
  S.dirty = true; S.find = null; go('editor');
}
function sbStep(d) {
  const a = S.sb; if (a.step + d < 0) { if (a.from === 'editor') { S.sb = null; go('editor'); } else { S.sb = null; go('find'); } return; }
  a.step = Math.max(0, Math.min(SB_N - 1, a.step + d)); render(); window.scrollTo(0, 0);
}
function sbSkip() { // pular limpa a resposta desta pergunta
  const a = S.sb; if (a.step === 1) a.ev = []; else if (a.step === 2) a.diag = { fact: null, text: '' }; else if (a.step === 3) a.impl = ['', '', '']; else if (a.step === 4) a.prio = null; else if (a.step === 5) a.plan = [{ a: '', o: '', d: '', m: '' }]; else if (a.step === 6) a.ask = '';
  if (a.step === SB_N - 1) sbFinish(); else sbStep(1);
}
function builderClick(e) {
  const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a, v = t.dataset.v;
  if (!/^(fd|sb|story)-/.test(a)) return;
  e.stopPropagation();
  const P = S.piece;
  if (a === 'fd-pick') { S.find.center = v; document.querySelectorAll('.fd-main').forEach(b => { const on = b.dataset.v === v; b.setAttribute('aria-pressed', String(on)); b.closest('.fd-card').classList.toggle('on', on); }); }
  else if (a === 'fd-quick') fdQuick();
  else if (a === 'fd-guide') { S.sb = sbInit('find'); go('story'); }
  else if (a === 'story-edit') { if (!P) return; S.find = null; S.sb = sbInit('editor'); go('story'); }
  else if (a === 'story-find') { if (!P) return; S.find = null; go('find'); }
  else if (!S.sb) return;
  else if (a === 'sb-next') sbStep(1);
  else if (a === 'sb-back') sbStep(-1);
  else if (a === 'sb-skip') sbSkip();
  else if (a === 'sb-finish') sbFinish();
  else if (a === 'sb-ev') { const i = S.sb.ev.indexOf(v); if (i >= 0) S.sb.ev.splice(i, 1); else if (S.sb.ev.length < 5) S.sb.ev.push(v); render(); }
  else if (a === 'sb-diag') { S.sb.diag.fact = S.sb.diag.fact === v ? null : v; render(); }
  else if (a === 'sb-crit') { S.sb.prio = { crit: v, n: (S.sb.prio && S.sb.prio.n) || 3 }; render(); }
  else if (a === 'sb-n') { const p = S.sb.prio || { crit: null, n: 3 }; p.n = Math.max(1, Math.min(5, (p.n || 3) + +v)); S.sb.prio = p; render(); }
  else if (a === 'sb-plan-add') { if (S.sb.plan.length < 3) S.sb.plan.push({ a: '', o: '', d: '', m: '' }); render(); }
  else if (a === 'sb-plan-del') { S.sb.plan.splice(+v, 1); if (!S.sb.plan.length) S.sb.plan.push({ a: '', o: '', d: '', m: '' }); render(); }
  else if (a === 'sb-sug') {
    const c = bCtx(), sug = storySuggest(c.P, c.by(S.sb.center)), k = t.dataset.k, txt = k === 'msg' ? sug.msg[+v] : k === 'impl' ? sug.impl[+v] : k === 'act' ? sug.act[+v] : sug.ask;
    if (k === 'msg') S.sb.msg = txt; else if (k === 'ask') S.sb.ask = txt;
    else if (k === 'impl') { const i = S.sb.impl.findIndex(x => !x.trim()); S.sb.impl[i >= 0 ? i : 2] = txt; }
    else { const r = S.sb.plan.find(x => !(x.a || '').trim()) || (S.sb.plan.length < 3 ? S.sb.plan[S.sb.plan.push({ a: '', o: '', d: '', m: '' }) - 1] : S.sb.plan[2]); r.a = txt; }
    render();
  }
}
function builderInput(e) {
  const t = e.target; if (!S.sb || !t.id || t.id.indexOf('sb-') !== 0) return; const a = S.sb;
  if (t.id === 'sb-msg') a.msg = t.value; else if (t.id === 'sb-dtext') a.diag.text = t.value; else if (t.id === 'sb-ask') a.ask = t.value;
  else if (/^sb-impl-\d$/.test(t.id)) a.impl[+t.id.slice(-1)] = t.value;
  else { const m = /^sb-p([aodm])-(\d)$/.exec(t.id); if (m && a.plan[+m[2]]) a.plan[+m[2]][m[1]] = t.value; }
  const cnt = $('.sb-count'); if (cnt && e.type === 'change') cnt.textContent = BT().soFar(sbCount());
}
document.addEventListener('click', builderClick, true);
document.addEventListener('input', builderInput);
document.addEventListener('change', builderInput);
