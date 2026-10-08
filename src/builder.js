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
    <div class="fd-actions"><button class="btn ghost" data-a="back-to" data-v="mapping">← ${esc(B.back)}</button><div class="fd-ctas"><div><button class="btn" data-a="fd-guide3">${esc(BST().guide3)} →</button><p class="note">${esc(BST().guide3Hint)}</p></div><div><button class="btn ghost" data-a="fd-quick">${esc(B.quick)}</button><p class="note">${esc(B.quickHint)}</p></div><div><button class="btn text" data-a="fd-guide">${esc(BST().detailBtn)}</button></div></div></div>
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


/* ---- roteiro em três perguntas: tese, roteiro em cartões e decisão ---- */
const BS = {
  pt: {
    lbl: 'ROTEIRO', q: [['QUAL É A', 'tese?'], ['COMO VAMOS', 'contar?'], ['O QUE VOCÊ QUER QUE', 'decidam?']],
    help: ['Uma frase que o público leve para casa. Deixe em branco para usar a frase calculada, com o número e o cálculo da planilha.', 'O roteiro já vem montado com o que mais pesa para a sua decisão. Reordene, remova ou reescreva a frase de cada cartão: o número e o cálculo continuam os da planilha.', 'O último slide: o pedido. Seja específico.'],
    thesisPh: 'Escreva a sua tese ou deixe em branco para usar a frase abaixo', centerLbl: 'Ponto central (vira a tese)', change: 'Trocar o ponto central',
    effect: (a, d, t, n, m) => `Pelo que você respondeu (${a} · ${d} · ${t}), montei ${n} slides, cerca de ${m} min, com o que mais pesa para essa decisão.`,
    card: { up: 'Subir', down: 'Descer', del: 'Remover', edit: 'Editar a frase', done: 'Pronto', reset: 'Voltar à frase original', add: 'Adicionar', thesis: 'Tese', fixed: 'abre a história', kept: 'O número em destaque e o cálculo continuam os da planilha.', ov: 'Panorama' },
    viz: { bars: 'Gráfico de barras', hi: 'Destaque no gráfico', num: 'Número e cálculo' }, removed: 'Fora do roteiro', skipT: 'Pular', 
    askPh: 'Ex.: Aprovar a revisão do processo nas jornadas com menor taxa de resolução', detail: 'Detalhar diagnóstico, prioridades e plano de ação', detailHint: 'Abre as perguntas detalhadas, mantendo este roteiro.',
    guide3: 'Guiar em 3 perguntas', guide3Hint: 'Tese, roteiro em cartões e decisão pedida.', detailBtn: 'Modo detalhado (7 perguntas)', next: 'Continuar', back: 'Voltar', finish: 'Concluir história',
    count: (n, m) => `Roteiro: ${n} slides, cerca de ${m} min`, panelDetail: 'Detalhar'
  },
  en: {
    lbl: 'OUTLINE', q: [['WHAT IS THE', 'thesis?'], ['HOW WILL WE', 'tell it?'], ['WHAT DO YOU WANT THEM TO', 'decide?']],
    help: ['One sentence the audience takes home. Leave it blank to use the calculated sentence, with the number and calculation from the spreadsheet.', 'The outline comes built with what weighs most for your decision. Reorder, remove or rewrite each card sentence: the number and calculation stay those of the spreadsheet.', 'The last slide: the ask. Be specific.'],
    thesisPh: 'Write your thesis or leave blank to use the sentence below', centerLbl: 'Central point (becomes the thesis)', change: 'Change the central point',
    effect: (a, d, t, n, m) => `From your answers (${a} · ${d} · ${t}), I built ${n} slides, about ${m} min, with what weighs most for that decision.`,
    card: { up: 'Move up', down: 'Move down', del: 'Remove', edit: 'Edit sentence', done: 'Done', reset: 'Back to the original sentence', add: 'Add', thesis: 'Thesis', fixed: 'opens the story', kept: 'The highlighted number and the calculation stay those of the spreadsheet.', ov: 'Overview' },
    viz: { bars: 'Bar chart', hi: 'Chart highlight', num: 'Number and calculation' }, removed: 'Left out of the outline', skipT: 'Skip',
    askPh: 'E.g.: Approve the process review in the journeys with the lowest resolution rate', detail: 'Detail diagnosis, priorities and action plan', detailHint: 'Opens the detailed questions, keeping this outline.',
    guide3: 'Guide me in 3 questions', guide3Hint: 'Thesis, outline cards and the ask.', detailBtn: 'Detailed mode (7 questions)', next: 'Continue', back: 'Back', finish: 'Finish story',
    count: (n, m) => `Outline: ${n} slides, about ${m} min`, panelDetail: 'Detail'
  }
};
const BST = () => BS[LANG] || BS.pt;
// roteiro padrão: o ponto central abre a história; depois entram as evidências mais pesadas para a decisão, na ordem em que a história se conta
function scDefaultScript(c, center) {
  const P = c.P, cap = { quick: 2, normal: 4, full: 7 }[(P.br && P.br.time) || 'full'], order = c.cand.facts.filter(f => f.id !== 'st-ov').map(f => f.id);
  const pick = c.cand.ranked.filter(f => f.id !== center).slice(0, cap).map(f => f.id), at = areaText(P.br && P.br.area, LANG), arc = at && at.arc ? at.arc : null;
  let rest = order.filter(id => pick.includes(id));
  if (arc) { const ix = id => { const k = arc.indexOf((c.by(id) || {}).act); return k < 0 ? 99 : k; }; rest = rest.map((id, i) => [id, i]).sort((a, b) => ix(a[0]) - ix(b[0]) || a[1] - b[1]).map(x => x[0]); } // a ordem em que a área costuma contar
  return [center, ...rest];
}
function scInit(from) {
  const c = bCtx(), sb = S.piece.sb || {}, center = sb.script && sb.script[0] ? sb.script[0] : (sb.center && c.by(sb.center) ? sb.center : (S.find && c.by(S.find.center) ? S.find.center : c.cand.center));
  return { step: 0, from: from || 'find', center, script: sb.script && sb.script.length ? sb.script.filter(id => c.by(id)) : scDefaultScript(c, center), edits: { ...(sb.edits || {}) }, thesis: sb.thesis || '', ask: sb.ask || '', edit: null };
}
function scAnswers(a) { return { script: a.script.slice(), edits: { ...a.edits }, thesis: a.thesis.trim(), center: a.script[0] || null, ev: a.script.slice(1), msg: a.thesis.trim(), diag: { fact: null, text: '' }, impl: [], prio: null, plan: [], ask: a.ask.trim(), ...(S.piece.sb && !S.piece.sb.script ? { diag: S.piece.sb.diag || { fact: null, text: '' }, impl: S.piece.sb.impl || [], prio: S.piece.sb.prio || null, plan: S.piece.sb.plan || [] } : {}) }; }
function scStory(a) { try { const c = bCtx(); return storyFromAnswers({ ...c.P, sb: scAnswers(a) }, c.meta, c.steps) || []; } catch (e) { return []; } }
function scCard(f, a, i, B) {
  const edited = a.edits[f.id] != null, head = edited ? a.edits[f.id] : f.head, first = i === 0, last = i === a.script.length - 1, editing = a.edit === f.id;
  const badge = f.viz ? B.viz.bars : f.state ? B.viz.hi : B.viz.num;
  return `<div class="sc-card${first ? ' thesis' : ''}" data-id="${esc(f.id)}"><div class="sc-n">${String(i + 1).padStart(2, '0')}</div><div class="sc-b">
    <div class="sc-k">${esc(first ? B.card.thesis : f.kick.label)}${first ? ` <small>· ${esc(B.card.fixed)}</small>` : ''}<span class="sc-vz">${esc(badge)}</span></div>
    ${editing ? `<textarea class="field sb sc-ta" id="sc-edit-${i}" maxlength="320" aria-label="${esc(B.card.edit)}">${esc(head)}</textarea><p class="note">${esc(B.card.kept)}</p>` : `<div class="sc-h">${esc(head)}</div>`}
    <div class="sc-m">${f.big ? `<span class="sc-big"><b>${esc(f.big.text)}</b> <small>${esc(f.big.label)}</small></span>` : ''}</div></div>
    <div class="sc-ctl">${first ? '' : `<button type="button" class="btn ghost sm" data-a="sc-up" data-v="${i}" aria-label="${esc(B.card.up)}"${i < 2 ? ' disabled' : ''}>↑</button><button type="button" class="btn ghost sm" data-a="sc-down" data-v="${i}" aria-label="${esc(B.card.down)}"${last ? ' disabled' : ''}>↓</button>`}
      <button type="button" class="btn ghost sm" data-a="${editing ? 'sc-editdone' : 'sc-edit'}" data-v="${esc(f.id)}">${esc(editing ? B.card.done : '✎')}</button>${edited && !editing ? `<button type="button" class="btn ghost sm" data-a="sc-reset" data-v="${esc(f.id)}" aria-label="${esc(B.card.reset)}" title="${esc(B.card.reset)}">↺</button>` : ''}${first ? '' : `<button type="button" class="btn ghost sm" data-a="sc-del" data-v="${i}" aria-label="${esc(B.card.del)}">×</button>`}</div></div>`;
}
function scBody(step) {
  const B = BST(), a = S.sc, c = bCtx(), P = c.P, center = c.by(a.script[0]), sug = storySuggest(P, center);
  if (step === 0) { const alts = c.cand.ranked.slice(0, 6);
    return `<div class="sb-center"><span class="lbl">[ ${esc(B.centerLbl)} ]</span><p>${center ? esc(center.head) : ''}</p></div>
       <textarea class="field sb" id="sc-thesis" maxlength="220" placeholder="${esc(((areaText(P.br && P.br.area, LANG) || {}).ex || {}).thesis || B.thesisPh)}" aria-label="${esc(B.q[0].join(' '))}">${esc(a.thesis)}</textarea>${sbChips(sug.msg.filter(x => x !== P.title).slice(0, 2), 'scmsg')}
      <details class="sc-alt"><summary>${esc(B.change)}</summary><div class="fd-grid sb-list">${alts.map(f => bFactCard(f, { a: 'sc-center', sel: a.script[0] === f.id })).join('')}</div></details>`; }
  if (step === 1) { const out = c.cand.ranked.filter(f => !a.script.includes(f.id)), t = T('o'), br = P.br || {}, sl = scStory(a), n = sl.length, m = Math.max(1, Math.round(n * 0.75));
    const eff = br.audience && br.decision && br.time ? `<p class="sc-eff">${esc(B.effect(((t.area || {})[br.area] ? (t.area[br.area][0] + ' · ') : '') + (t.audience[br.audience] || [''])[0], (t.decision[br.decision] || [''])[0].toLowerCase(), (t.time[br.time] || [''])[0], n, m))}</p>` : '';
    return `${eff}<div class="sc-list">${a.script.map((id, i) => { const f = c.by(id); return f ? scCard(f, a, i, B) : ''; }).join('')}</div>
      ${out.length ? `<div class="sc-out"><span class="lbl">[ ${esc(B.removed)} ]</span><div class="sc-chips">${out.map(f => `<button type="button" class="sb-chip" data-a="sc-add" data-v="${esc(f.id)}">+ ${esc(f.kick.label)}${f.big ? ` · ${esc(f.big.text)}` : ''}</button>`).join('')}</div></div>` : ''}`; }
  return `<textarea class="field sb" id="sc-ask" maxlength="200" placeholder="${esc(((areaText(P.br && P.br.area, LANG) || {}).ex || {}).ask || B.askPh)}" aria-label="${esc(B.q[2].join(' '))}">${esc(a.ask)}</textarea>${sbChips(sug.ask ? [sug.ask] : [], 'scask')}
    <div class="sc-detail"><button type="button" class="btn ghost sm" data-a="sc-detail">${esc(B.detail)}</button><p class="note">${esc(B.detailHint)}</p></div>`;
}
function scriptScreen() {
  const B = BST(), a = S.sc, n = a.step + 1, last = a.step === 2, cnt = scStory(a).length;
  return `<div class="wrap-narrow sb-screen sc-screen" style="max-width:900px"><div class="prog"><span class="lbl">[ ${B.lbl} // ${String(n).padStart(2, '0')}/03 ]</span><div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow="${n}"><i style="width:${(n / 3) * 100}%"></i></div></div>
    <h2>${title2(B.q[a.step])}</h2><p class="sb-help">${esc(B.help[a.step])}</p>${scBody(a.step)}
    <p class="note sb-count">${esc(B.count(cnt, Math.max(1, Math.round(cnt * 0.75))))}</p>
    <div class="row sb-nav"><button class="btn ghost" data-a="sc-back">← ${esc(B.back)}</button><button class="btn" data-a="${last ? 'sc-finish' : 'sc-next'}">${esc(last ? B.finish : B.next)} →</button></div></div>`;
}
function scFinish() {
  const P = S.piece, ans = scAnswers(S.sc); P.sb = ans; if (ans.thesis) P.title = ans.thesis;
  S.dirty = true; S.sc = null; S.find = null; S._bctx = null; go('editor');
  const n = (() => { try { return (storyFromAnswers(P, makeMeta(P), buildSteps(P, makeMeta(P))) || []).length; } catch (e) { return 0; } })();
  toast(BT().done(n, Math.max(1, Math.round(n * 0.75))));
}
function scStep(d) {
  const a = S.sc; if (a.step + d < 0) { const from = a.from; S.sc = null; go(from === 'editor' ? 'editor' : 'find'); return; }
  a.step = Math.max(0, Math.min(2, a.step + d)); a.edit = null; render(); window.scrollTo(0, 0);
}
function scClick(a, v, t) {
  const A = S.sc, c = bCtx(); if (!A) return false;
  if (a === 'sc-next') scStep(1); else if (a === 'sc-back') scStep(-1); else if (a === 'sc-finish') scFinish();
  else if (a === 'sc-center') { const keep = A.script.filter(id => id !== v && id !== A.script[0]); A.script = [v, ...keep]; render(); }
  else if (a === 'sc-up') { const i = +v; if (i >= 2) { [A.script[i - 1], A.script[i]] = [A.script[i], A.script[i - 1]]; render(); } }
  else if (a === 'sc-down') { const i = +v; if (i < A.script.length - 1) { [A.script[i + 1], A.script[i]] = [A.script[i], A.script[i + 1]]; render(); } }
  else if (a === 'sc-del') { A.script.splice(+v, 1); render(); }
  else if (a === 'sc-add') { const order = c.cand.facts.map(f => f.id); A.script.push(v); const head = A.script.shift(), rest = A.script.sort((x, y) => order.indexOf(x) - order.indexOf(y)); A.script = [head, ...rest]; render(); }
  else if (a === 'sc-edit') { A.edit = v; render(); } else if (a === 'sc-editdone') { A.edit = null; render(); }
  else if (a === 'sc-reset') { delete A.edits[v]; render(); }
  else if (a === 'sc-detail') { S.piece.sb = scAnswers(A); S.sb = sbInit(A.from); S.sc = null; go('story'); }
  else if (a === 'sb-sug') { const k = t.dataset.k, sug = storySuggest(c.P, c.by(A.script[0])), txt = k === 'scmsg' ? sug.msg.filter(x => x !== c.P.title).slice(0, 2)[+v] : sug.ask; if (k === 'scmsg') A.thesis = txt; else A.ask = txt; render(); }
  else return false;
  return true;
}
function scInput(e) {
  const t = e.target; if (!S.sc || !t.id || t.id.indexOf('sc-') !== 0) return; const a = S.sc;
  if (t.id === 'sc-thesis') a.thesis = t.value; else if (t.id === 'sc-ask') a.ask = t.value;
  else { const m = /^sc-edit-(\d+)$/.exec(t.id); if (m && a.script[+m[1]]) a.edits[a.script[+m[1]]] = t.value; }
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
  const script = scDefaultScript(c, center);
  P.sb = { msg: '', center, ev: script.slice(1), script, edits: {}, thesis: '', diag: { fact: null, text: '' }, impl: [], prio: null, plan: [], ask: '' };
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
  if (!/^(fd|sb|story|sc)-/.test(a)) return;
  e.stopPropagation();
  const P = S.piece;
  if (a === 'fd-pick') { S.find.center = v; document.querySelectorAll('.fd-main').forEach(b => { const on = b.dataset.v === v; b.setAttribute('aria-pressed', String(on)); b.closest('.fd-card').classList.toggle('on', on); }); }
  else if (a === 'fd-quick') fdQuick();
  else if (a === 'fd-guide') { S.sb = sbInit('find'); go('story'); }
  else if (a === 'fd-guide3') { S.sc = scInit('find'); go('script'); }
  else if (a.indexOf('sc-') === 0 || (a === 'sb-sug' && S.sc)) { scClick(a, v, t); }
  else if (a === 'story-edit') { if (!P) return; S.find = null; if (P.sb && !P.sb.script && (P.sb.diag && (P.sb.diag.fact || P.sb.diag.text) || (P.sb.impl || []).length || P.sb.prio || (P.sb.plan || []).length)) { S.sb = sbInit('editor'); go('story'); } else { S.sc = scInit('editor'); go('script'); } }
  else if (a === 'story-detail') { if (!P) return; S.find = null; S.sb = sbInit('editor'); go('story'); }
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
document.addEventListener('input', scInput);
document.addEventListener('change', scInput);
