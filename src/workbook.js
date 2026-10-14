/* Datavix: tela "O que há nesta planilha" (portão 51). Pasta de trabalho com várias abas: cada aba ganha um papel sugerido (principal, detalhe, perfil,
 * fontes e método, ignorar) que a pessoa pode trocar. A principal sustenta a apresentação; fontes e perfil entram como slides com o texto na íntegra;
 * detalhe fica guardada para os slides de detalhe e a conciliação. Tudo roda no navegador: a pasta é lida uma vez pelo leitor e nada sai dele. */

Object.assign(I18N.pt, {
  wb_t: ['O QUE HÁ', 'nesta planilha'], wb_p: 'Esta pasta de trabalho tem várias abas. Dei um papel a cada uma; você pode trocar. A principal sustenta a apresentação.', wb_go: 'Continuar', wb_none: 'Escolha uma aba Principal para continuar.',
  wb_role: { main: 'Principal', detail: 'Detalhe', profile: 'Perfil', sources: 'Fontes e método', ignore: 'Ignorar' },
  wb_note: { main: 'sustenta a apresentação', detail: 'guardada para os slides de detalhe (ainda não entra na apresentação)', profile: 'textos de perfil de cada entidade', sources: 'vira o slide Fontes e método, com o texto sem alteração', ignore: 'fica de fora' },
  wb_sum: { rows: n => `${n} ${n === 1 ? 'linha' : 'linhas'}`, cols: n => `${n} ${n === 1 ? 'coluna' : 'colunas'}`, nums: n => `${n} ${n === 1 ? 'coluna numérica' : 'colunas numéricas'}`, text: 'só texto', hidden: 'aba oculta', empty: 'aba vazia' },
  wb_panel_h: 'Abas da planilha', wb_panel_p: 'Perfil e fontes entram na apresentação com o texto da planilha, sem alteração.',
});
Object.assign(I18N.en, {
  wb_t: ['WHAT IS IN', 'this workbook'], wb_p: 'This workbook has several sheets. I gave each one a role; you can change it. The main sheet carries the presentation.', wb_go: 'Continue', wb_none: 'Pick a Main sheet to continue.',
  wb_role: { main: 'Main', detail: 'Detail', profile: 'Profile', sources: 'Sources and method', ignore: 'Ignore' },
  wb_note: { main: 'carries the presentation', detail: 'kept for the detail slides (not in the presentation yet)', profile: 'profile texts for each entity', sources: 'becomes the Sources and method slide, text unchanged', ignore: 'left out' },
  wb_sum: { rows: n => `${n} ${n === 1 ? 'row' : 'rows'}`, cols: n => `${n} ${n === 1 ? 'column' : 'columns'}`, nums: n => `${n} ${n === 1 ? 'numeric column' : 'numeric columns'}`, text: 'text only', hidden: 'hidden sheet', empty: 'empty sheet' },
  wb_panel_h: 'Workbook sheets', wb_panel_p: 'Profile and sources enter the presentation with the sheet’s own text, unchanged.',
});

const WB_ROLES = ['main', 'detail', 'profile', 'sources', 'ignore'];
const WB_KW = /fonte|source|m[eé]todo|method|sobre|about|notas?|notes|legenda|legend|refer[eê]ncia|metodologia|readme|leia[- ]?me|instru[cç]/i;
const wbNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// as duas abas compartilham uma chave: coluna de mesmo nome com pelo menos metade dos valores do menor conjunto em comum
function wbRelated(a, b) {
  for (const ka of a.keys) {
    const na = wbNorm(ka.name); if (!na) continue;
    const kb = b.keys.find(k => wbNorm(k.name) === na); if (!kb) continue;
    const sa = new Set(ka.vals), common = kb.vals.filter(v => sa.has(v)).length;
    if (common >= Math.max(2, Math.ceil(0.5 * Math.min(ka.vals.length, kb.vals.length)))) return true;
  }
  return false;
}
// papel sugerido para cada aba; infos vem do leitor (worker): { name, hidden, rows, cols, header, strShare, urlShare, numCols, keys, text? }
function wbSuggest(infos) {
  const role = infos.map(() => null);
  infos.forEach((s, i) => {
    if (s.hidden || !s.rows) role[i] = 'ignore';
    else if (s.cols <= 3 && s.strShare >= 0.8 && (s.urlShare >= 0.3 || WB_KW.test(s.name))) role[i] = 'sources';
    else if (s.cols >= 3 && s.rows <= 80 && s.strShare >= 0.7) role[i] = 'profile';
  });
  const data = infos.map((s, i) => i).filter(i => !role[i] && infos[i].numCols >= 1);
  if (data.length === 1) role[data[0]] = 'main';
  else if (data.length > 1) {
    // a principal é a de grão mais grosso que tem uma aba de grão mais fino com as mesmas chaves; sem relação, a de mais números
    const finer = i => data.filter(j => j !== i && infos[j].rows >= 2 * infos[i].rows && wbRelated(infos[i], infos[j]));
    const cands = data.filter(i => finer(i).length).sort((a, b) => infos[a].rows - infos[b].rows);
    const main = cands.length ? cands[0] : data.slice().sort((a, b) => infos[b].numCols * Math.min(infos[b].rows, 1000) - infos[a].numCols * Math.min(infos[a].rows, 1000))[0];
    role[main] = 'main'; data.forEach(j => { if (j !== main) role[j] = infos[j].rows >= 2 * infos[main].rows && wbRelated(infos[main], infos[j]) ? 'detail' : 'ignore'; });
  }
  return role.map(r => r || 'ignore');
}
function wbSummary(s) {
  const t = T('wb_sum'), bits = [];
  if (s.hidden) return t.hidden; if (!s.rows) return t.empty;
  bits.push(t.rows(fmtInt(s.rows, LANG)), t.cols(s.cols));
  if (s.strShare >= 0.75 && !s.numCols) bits.push(t.text); else if (s.numCols) bits.push(t.nums(s.numCols));
  return bits.join(' · ');
}
// o que a apresentação precisa guardar da pasta: papéis e, nas abas de texto, as linhas na íntegra (built.wbx)
function wbPack(wb) { return { file: wb.file, sheets: wb.sheets.map(s => ({ name: s.name, role: s.role, rows: s.rows, cols: s.cols, text: s.role === 'sources' || s.role === 'profile' || s.role === 'ignore' ? s.text || null : null, matrix: s.role === 'detail' ? s.matrix || null : null })) }; }

function wbScreen() {
  const v = S.wbv; if (!v) return '';
  const opts = (s, i) => WB_ROLES.map(r => `<option value="${r}"${v.roles[i] === r ? ' selected' : ''}>${esc(T('wb_role')[r])}</option>`).join('');
  const rows = v.infos.map((s, i) => `<div class="rd-row${v.roles[i] === 'ignore' ? ' off' : ''}"><div class="rd-main"><b>${esc(s.name)}</b><span class="rd-mt">${esc(wbSummary(s))}</span></div><div class="rd-smp" title="${esc(s.header.join(' · '))}">${esc(s.header.filter(Boolean).slice(0, 8).join(' · '))}</div><div><select class="rd-sel" data-c="wb-role" data-i="${i}" aria-label="${esc(T('wb_role').main)}: ${esc(s.name)}">${opts(s, i)}</select><span class="note" style="display:block;font-size:12px;margin-top:3px">${esc(T('wb_note')[v.roles[i]])}</span></div></div>`).join('');
  const ok = v.roles.includes('main');
  return `<div class="wrap-narrow" style="max-width:860px"><div class="lbl">[ ${esc(v.file)} ]</div><h2 style="margin-top:12px">${title2(T('wb_t'))}</h2><p class="sub">${esc(T('wb_p'))}</p>
    <div class="rd-cols" style="margin-top:18px">${rows}</div>
    ${ok ? '' : `<p class="note" role="status" style="color:var(--bad, #ff5c5c)">${esc(T('wb_none'))}</p>`}
    <div class="row" style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap"><button class="btn primary" data-a="wb-go"${ok ? '' : ' disabled'}>${esc(T('wb_go'))}</button><button class="btn ghost" data-a="back-to" data-v="upload">← ${esc(T('back'))}</button></div></div>`;
}
function wbStart(infos, file) {
  const live = (infos || []).filter(s => s.rows > 0 && !s.hidden);
  if (!infos || infos.length < 2 || live.length < 2) { S.wbv = null; return false; } // uma aba útil só: a tela não aparece
  S.wbv = { file, infos, roles: wbSuggest(infos) }; return true;
}
function wbGo() {
  const v = S.wbv; if (!v || !v.roles.includes('main')) return;
  S.wb = { file: v.file, sheets: v.infos.map((s, i) => ({ ...s, role: v.roles[i] })) };
  const main = v.infos[v.roles.indexOf('main')].name;
  S.loading = { stage: 'read', pct: 0.5, t0: Date.now(), size: 0, got: true }; S.step = 'upload'; render(); getWorker().postMessage({ type: 'sheet', name: main }); startLoadTicker();
}
// painel do editor: as abas e o papel de cada uma (só perfil, fontes e ignorar mudam a apresentação sem recarregar)
function wbPanelHtml(P) {
  const w = P && P.built && P.built.wbx; if (!w || !w.sheets || w.sheets.length < 2) return '';
  const rows = w.sheets.map((s, i) => { const fixed = s.role === 'main' || s.role === 'detail', canText = !!s.text, opts = (fixed ? [s.role] : ['profile', 'sources', 'ignore'].filter(r => canText || r === 'ignore' || r === s.role)).map(r => `<option value="${r}"${s.role === r ? ' selected' : ''}>${esc(T('wb_role')[r])}</option>`).join('');
    return `<div class="wbp"><span>${esc(s.name)}</span><select class="sel" data-a="wb-panel-role" data-i="${i}" aria-label="${esc(s.name)}"${fixed ? ' disabled' : ''}>${opts}</select></div>`; }).join('');
  return `<section class="s1" data-t="chart"><h3>[ ${esc(T('wb_panel_h'))} ]</h3>${rows}<p class="note" style="margin:8px 0 0">${esc(T('wb_panel_p'))}</p></section>`;
}
document.addEventListener('change', e => {
  const t = e.target; if (!t || !t.matches) return;
  if (t.matches('[data-c=wb-role]') && S.wbv) {
    const i = +t.dataset.i, v = S.wbv, r = t.value;
    if (r === 'main') v.roles = v.roles.map((x, k) => (k === i ? 'main' : x === 'main' ? 'detail' : x)); else v.roles[i] = r;
    render(); const el = document.querySelector(`[data-c=wb-role][data-i="${i}"]`); if (el) el.focus();
  } else if (t.matches('[data-a=wb-panel-role]') && S.piece && S.piece.built.wbx) {
    const s = S.piece.built.wbx.sheets[+t.dataset.i]; if (s) { s.role = t.value; markDirty(); const pn = $('#panel'); if (pn) pn.innerHTML = panel(); }
  }
});
