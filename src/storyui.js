/* Datavix: escolha da história na interface (portões 44 e 45). Depois que a peça é gerada, uma janela mostra "Dá para contar:" com até 3 histórias
 * que a planilha sustenta (a melhor já marcada, um clique para seguir), "Ver todas" e "Panorama" (o roteiro completo de sempre). O painel do editor
 * ganha um seletor de história. Escolher uma história só muda o roteiro (e sugere o gráfico dela); nada recalcula os dados. */
Object.assign(I18N.pt, { tell_t: ['GALERIA DE', 'modelos'], tell_k: 'Dá para contar', tell_p: 'Cada história é uma pergunta que os seus dados respondem. A primeira já está marcada.', tell_go: 'Contar esta história', tell_pan: 'Panorama (visão completa)', tell_all: 'Ver todas as histórias', tell_blocked: 'Indisponível', tell_facts: n => `${n} ${n === 1 ? 'achado' : 'achados'}`, tell_soon: 'Em breve', tell_pan_ask: 'Evolução, comparação, concentração e distribuição, tudo junto.', story_h: 'História', story_pan: 'Panorama (visão completa)', story_chart: n => `Para esta história, o gráfico sugerido é ${n}.`, story_use: 'Usar', story_set: n => `História: ${n}`, story_cut: 'Data do marco', tell_none: 'A planilha não sustenta uma história específica: segue o Panorama.' });
Object.assign(I18N.en, { tell_t: ['MODEL', 'gallery'], tell_k: 'You can tell', tell_p: 'Each story is a question your data answers. The first one is already selected.', tell_go: 'Tell this story', tell_pan: 'Overview (full picture)', tell_all: 'See all stories', tell_blocked: 'Unavailable', tell_facts: n => `${n} ${n === 1 ? 'finding' : 'findings'}`, tell_soon: 'Coming soon', tell_pan_ask: 'Change over time, comparison, concentration and distribution, all together.', story_h: 'Story', story_pan: 'Overview (full picture)', story_chart: n => `For this story, the suggested chart is ${n}.`, story_use: 'Use', story_set: n => `Story: ${n}`, story_cut: 'Milestone date', tell_none: 'The spreadsheet does not support one specific story: using the Overview.' });

function storyEnv(P) {
  if (!P || !P.host || !P.host.ix) return null;
  if (P._stEnv && P._stEnv.key === P.type + '|' + (P.br && P.br.area) + '|' + LANG) return P._stEnv;
  const meta = P.host.ix.meta, steps = buildSteps(P, meta), pool = nvpPool(P, meta, steps);
  let rk; if (S.ds) rk = nvStoryRank(S.ds, P, pool, { lang: LANG });
  else { const facts = {}, possible = NV_ST_ORDER.filter(id => NV_STORIES[id].phase === 1 && (facts[id] = nvStoryPool(pool, id).items.length) > 0); rk = { all: {}, list: possible.slice(0, 3), possible, blocked: [], facts, score: {} }; } // projeto reaberto: sem a planilha, só os achados dizem o que sustenta
  const env = { key: P.type + '|' + (P.br && P.br.area) + '|' + LANG, rk, pool }; Object.defineProperty(P, '_stEnv', { value: env, enumerable: false, configurable: true }); return env;
}
const storyName = id => (id ? nvStoryInfo(id, LANG).name : T('story_pan'));
const storyCard = (id, rk, sel) => { const i = nvStoryInfo(id, LANG), why = (rk.all[id] && rk.all[id].why) || '', n = rk.facts[id]; return `<button type="button" class="tell-c" data-id="${id}" aria-pressed="${sel === id}"><b>${esc(i.name)}</b><span>${esc(i.ask)}</span><small>${esc([why, n != null ? T('tell_facts', n) : ''].filter(Boolean).join(' · '))}</small></button>`; };

// remonta a peça com o mapeamento da história (tempo, geografia, funil…), guardando o que a pessoa já editou; devolve true se remontou
function storyRebuild(kind, force) {
  const P = S.piece; if (!P || !S.ds || !kind) return false; const lg = nvStoryLegacy(kind); if (lg === P.mstory && !force) return false;
  const prevStory = S.br.story, prevMap = S.mapping;
  try {
    S.br.story = lg; S.mapping = defaultMapping(); const np = makePiece();
    Object.assign(np, { id: P.id, saveName: P.saveName, palId: P.palId, colors: P.colors, bg: P.bg, fontPair: P.fontPair, opts: P.opts, title: P.title, subtitle: P.subtitle, foot: P.foot, hist: P.hist, hi: P.hi, sedits: P.sedits });
    np.br = { ...(P.br || {}), story: lg, storyKind: kind, cut: S.br.cut }; if (np.sb === undefined && P.sb) np.sb = P.sb;
    teardownChart(); S.piece = np; render(); storyPanelLater(); return true;
  } catch (e) { console.error(e); S.br.story = prevStory; S.mapping = prevMap; return false; }
}
// depois de remontar, a peça demora um instante para montar o gráfico; quando pronta, o painel se refaz com o estado da história (ex.: o campo da data do marco)
function storyPanelLater() { let n = 0; const tick = () => { const P = S.piece; if (S.step !== 'editor' || !P) return; if (P.host && P.host.ix && P.host.ix.meta) { const pn = $('#panel'); if (pn) pn.innerHTML = panel(); return; } if (++n < 40) setTimeout(tick, 150); }; tick(); }
function storyApply(id, opt = {}) {
  let P = S.piece; if (!P) return; const kind = id && NV_STORIES[id] ? id : null;
  if (kind && !opt.noRebuild) { const env = storyEnv(P), n = env && env.rk.facts[kind]; if ((n === 0 || n === null || n === undefined) && storyRebuild(kind)) { P = S.piece; if (!opt.silent) toast(T('story_set', storyName(kind))); } }
  P.br = P.br || {}; P.br.storyKind = kind; S.br.storyKind = kind; if (kind) { P.br.story = nvStoryLegacy(kind); S.br.story = P.br.story; }
  if (!opt.silent) { markDirty(); const pn = $('#panel'); if (pn) pn.innerHTML = panel(); } // o painel se refaz: a data do marco aparece quando a história precisa dela
  const pc = kind && NV_STORIES[kind].charts.primary;
  if (pc && pc !== P.type && P.choice.all.includes(pc) && !opt.silent) toast(T('story_chart', T('chart')[pc]), { label: `${T('story_use')} ${T('chart')[pc]}`, fn: () => pickChart(pc) });
  else if (!opt.silent && opt.toast !== false) toast(T('story_set', storyName(kind)));
}
async function showTell(opt = {}) {
  const P = S.piece; if (!P || S.step !== 'editor') return; const env = storyEnv(P); if (!env) return;
  const pn = $('#panel'); if (pn) pn.innerHTML = panel(); // agora que há achados, o seletor do painel já sabe quais histórias estão disponíveis
  const rk = env.rk, list = rk.list;
  if (!opt.force && list.length < 2) { storyApply(list[0] || null, { silent: true }); if (!list.length) toast(T('tell_none')); return; } // 0 ou 1 modelo possível: não há o que escolher (a galeria continua no painel)
  const cur = (P.br && P.br.storyKind) || '';
  let sel = opt.force ? (cur === '' || (rk.all[cur] && rk.all[cur].ok) ? cur : list[0] || '') : list[0];
  const body = mgBody(P, env, sel, mgView()); // galeria de modelos (src/modelgallery.js): miniaturas com os dados da planilha, ou a lista
  const r = await modal({ title: `${esc(T('tell_t')[0])} <b>${esc(T('tell_t')[1])}</b>`, body, wide: true, actions: [{ label: T('tell_go'), v: 'ok', kind: 'primary' }, { label: T('tell_pan'), v: 'pan', kind: 'ghost' }],
    onOpen: (m, done) => {
      const pick = id => { sel = id; m.querySelectorAll('.tell-c[data-id]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.id === sel))); };
      m.addEventListener('click', e => {
        const v = e.target.closest('[data-a=mg-view]'); if (v) { const root = m.querySelector('.mg'); if (root) root.dataset.view = v.dataset.v; m.querySelectorAll('[data-a=mg-view]').forEach(b => b.setAttribute('aria-pressed', String(b === v))); try { localStorage.setItem('dv-mg-view', v.dataset.v); } catch (err) { /* sem armazenamento: vale só agora */ } return; }
        const c = e.target.closest('.tell-c[data-id]'); if (c) pick(c.dataset.id);
      });
      m.addEventListener('dblclick', e => { const c = e.target.closest('.tell-c[data-id]'); if (c) { pick(c.dataset.id); done('ok'); } });
      const on = m.querySelector('.tell-c[aria-pressed="true"]'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    } });
  if (opt.force) { if (r && r.v === 'ok') storyApply(sel, { toast: true }); else if (r && r.v === 'pan') storyApply(null, { toast: true }); return; } // aberta pelo painel: fechar sem escolher não muda nada
  storyApply(r && r.v === 'ok' ? sel : r && r.v === 'pan' ? null : list[0], { toast: true });
}
// janela "Dá para contar" logo depois da primeira geração (espera a peça montar)
function maybeTell() {
  let n = 0; const tick = () => { const P = S.piece; if (S.step !== 'editor' || !P) return; if (P.host && P.host.ix && P.host.ix.meta) { showTell(); return; } if (++n < 40) setTimeout(tick, 150); }; tick();
}
function storyPanelHtml(P) {
  const env = P.host && P.host.ix ? storyEnv(P) : null, cur = (P.br && P.br.storyKind) || '', rk = env && env.rk;
  const opts = [`<option value=""${cur === '' ? ' selected' : ''}>${esc(T('story_pan'))}</option>`].concat(NV_ST_ORDER.filter(id => NV_STORIES[id].phase === 1 || (rk && rk.all[id] && rk.all[id].ok) || id === cur).map(id => {
    const okk = !rk || (rk.all[id] ? rk.all[id].ok : rk.possible.includes(id)); return `<option value="${id}"${cur === id ? ' selected' : ''}${okk || id === cur ? '' : ' disabled'}>${esc(storyName(id))}${okk || id === cur ? '' : ' · ' + esc(T('tell_blocked'))}</option>`; }));
  const needCut = cur === 'before_after' && rk && rk.all.before_after && rk.all.before_after.needsCut, cutV = P.br && Number.isFinite(P.br.cut) ? new Date(P.br.cut).toISOString().slice(0, 10) : '';
  const cutHtml = needCut ? `<label class="cut"><span class="lbl">${esc(T('story_cut'))}</span><input type="date" class="field" data-a="story-cut" value="${cutV}"></label>` : '';
  return `<section class="s1" data-t="chart"><h3>[ ${esc(T('story_h'))} ]</h3><select class="sel" data-a="story-kind" aria-label="${esc(T('story_h'))}">${opts.join('')}</select><p class="note" style="margin:8px 0 0">${esc(cur ? nvStoryInfo(cur, LANG).ask : T('tell_pan_ask'))}</p>${cutHtml}${S.ds ? `<button type="button" class="btn ghost" style="margin-top:10px" data-a="mg-open">${esc(T('mg_open'))}</button>` : ''}</section>`;
}
document.addEventListener('change', e => {
  const t = e.target; if (!t || !t.matches) return;
  if (t.matches('[data-a=story-kind]')) storyApply(t.value || null);
  else if (t.matches('[data-a=story-cut]') && S.piece) { const ms = t.value ? Date.parse(t.value + 'T00:00:00Z') : NaN; S.br.cut = Number.isFinite(ms) ? ms : undefined; if (S.piece.br) S.piece.br.cut = S.br.cut; if (Number.isFinite(ms) && storyRebuild('before_after', true)) toast(T('story_set', storyName('before_after'))); }
});
