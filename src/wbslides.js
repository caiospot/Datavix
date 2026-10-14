/* Datavix: pastas de trabalho com várias abas (portão 51), lado dos slides. A pasta guarda, em built.wbx, uma lista de abas com o papel de cada uma
 * (principal, detalhe, perfil, fontes, ignorar) e, nas abas de texto, as linhas na íntegra. Daqui saem: o slide "Fontes e método" (penúltimo, texto
 * copiado sem alteração), as ressalvas da aba de método (entram nos limites) e o perfil de cada entidade do Face a face. Nada é reescrito nem interpretado. */

const NV_WB_CAVEAT = /limite|comparabil|ressalva|aviso|cuidado|aten[cç][aã]o|limitation|caveat/i;
const NVW = {
  pt: { t: 'Fontes e método', head: (n, s) => `${n} ${n === 1 ? 'item copiado' : 'itens copiados'} da aba “${s}”, sem alteração`, big: 'ITENS DA ABA' },
  en: { t: 'Sources and method', head: (n, s) => `${n} ${n === 1 ? 'item copied' : 'items copied'} from the “${s}” sheet, unchanged`, big: 'ITEMS IN THE SHEET' },
};
const nvwNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const NVW_NUMLIKE = /^\s*[+-]?\d[\d.,]*\s*(%|º|°|ª)?\s*[\p{L}.]{0,20}\s*(\(.*\))?\s*$/u; // "32 anos", "4º colocado (50 pontos)": número com unidade, não é texto de perfil

// linhas de uma aba de texto: [{ k, t }]; a primeira linha é o cabeçalho
function nvWbRows(sheet) {
  const tx = sheet && sheet.text; if (!tx || !tx.length) return [];
  const body = tx.length > 1 ? tx.slice(1) : tx, out = [];
  body.forEach(r => { const cells = r.map(c => String(c)); if (!cells.some(c => c.trim())) return; out.push(cells.length > 1 ? { k: cells[0], t: cells.slice(1).filter(c => c.trim()).join(' · ') } : { k: '', t: cells[0] }); });
  return out;
}
function nvWbDerive(wbx) {
  const sheets = (wbx && wbx.sheets) || [], sources = sheets.filter(s => s.role === 'sources').map(s => ({ sheet: s.name, rows: nvWbRows(s) })).filter(s => s.rows.length);
  return { sources, caveats: sources.flatMap(s => s.rows.filter(r => NV_WB_CAVEAT.test(r.k))), profile: sheets.find(s => s.role === 'profile' && s.text && s.text.length > 1) || null };
}
// slide "Fontes e método": o texto das células, exatamente como está, ao lado; à esquerda só a contagem
function nvWbSourcesSlide(P) {
  const d = nvWbDerive(P && P.built && P.built.wbx), X = NVW[LANG] || NVW.pt; if (!d.sources.length) return null;
  const items = d.sources.flatMap(s => s.rows), name = d.sources.map(s => s.sheet).join(', '), head = X.head(items.length, name);
  return { id: 'wb-sources', act: 'wb_sources', type: undefined, role: 'sources', planTitle: X.t, kick: { n: '00', label: X.t }, head, caption: head, hl: '', big: { text: String(items.length), label: X.big }, calc: null, viz: { kind: 'text', title: name, items }, state: null, synthetic: true, ev: null, refs: [], note: '', lintText: '', verbatim: true };
}
// penúltimo slide quando houver: com o plano cheio, sai o slide de apoio menos importante; planos de 2 slides ficam como estão
function nvWbInsert(P, slides, N) {
  if (N < 5 || !slides.length) return slides; const s = nvWbSourcesSlide(P); if (!s) return slides;
  const out = slides.slice();
  if (out.length >= N) { let drop = -1; for (let i = out.length - 2; i >= 0; i--) if (['over', 'exploration', 'extra', 'evidence', 'vs_profile'].includes(out[i].role)) { drop = i; break; } if (drop < 0) return slides; out.splice(drop, 1); }
  out.splice(out.length - 1, 0, s); return out;
}
// perfil de cada entidade a partir da aba de perfil: colunas com o nome das entidades; só entram linhas em que pelo menos duas entidades têm texto (não número com unidade)
function nvWbProfile(P, ents) {
  const d = nvWbDerive(P && P.built && P.built.wbx), sh = d.profile; if (!sh || !ents || ents.length < 2) return null;
  const head = sh.text[0].map(h => nvwNorm(h)), colOf = ents.map(e => { const ne = nvwNorm(e); return head.findIndex(h => h.length >= 3 && (h === ne || h.includes(ne) || ne.includes(h))); });
  if (colOf.some(c => c < 0) || new Set(colOf).size !== colOf.length) return null;
  const others = head.map((h, i) => i).filter(i => !colOf.includes(i));
  const lab = others.find(i => /estat|metric|indic|atribut|aspect|item|crit|tema/.test(head[i])) ?? others[0], per = others.find(i => i !== lab && NV_VS_PERIOD.test(sh.text[0][i]));
  const isText = v => !!String(v || '').trim() && !NVW_NUMLIKE.test(String(v));
  const out = []; sh.text.slice(1).forEach(r => {
    const t = colOf.map(c => (isText(r[c]) ? String(r[c]) : null)); if (t.filter(x => x !== null).length < 2) return;
    out.push({ name: String(r[lab] || '').trim(), p: per !== undefined ? String(r[per] || '').trim() : '', t });
  });
  return out.length ? out : null;
}
