/* Datavix: peças comuns dos modelos extras (portão 55: Resumo por temporada e Ficha / perfil). Os dois montam o roteiro a partir de um pacote próprio
 * (built.vs, built.fc), não do conjunto de achados do motor: número formatado sem arredondar o que a planilha trouxe, slide final em branco para a
 * conclusão da pessoa e o ajuste ao tamanho pedido (2, 5 ou 10 slides). Nada aqui calcula um achado. */

// número como está na planilha: sem arredondar (até 6 casas), com o separador do idioma; ano não leva separador de milhar
function nvXNum(x, unit, name) {
  if (!Number.isFinite(x)) return '';
  const year = Number.isInteger(x) && x >= 1900 && x <= 2100 && /(^|[^a-zà-ú])(ano|year|desde|fundad[ao]|since|founded)([^a-zà-ú]|$)/i.test(String(name || ''));
  return new Intl.NumberFormat(LANG === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 6, useGrouping: !year }).format(x) + (unit === '%' ? '%' : '');
}
// slide final em branco: a conclusão é da pessoa, editável na apresentação
function nvXConcl(title) {
  return { id: 'vs-conclusion', act: 'vs_conclusion', role: 'conclusion', planTitle: title, kick: { n: '00', label: title }, head: '', caption: '', hl: '', big: null, calc: null, viz: null, state: null, synthetic: true, ev: null, refs: [], note: '', blank: true, noNote: true, noChart: true, lintText: '', verbatim: true };
}
// slide de texto de um modelo próprio (capa, limites): sem o gráfico geral da peça e sem avaliação de causa sobre o texto copiado
function nvXText(id, role, title, lines) { const s = nvpSynth(id, role, title, lines); s.verbatim = true; s.lintText = ''; s.noChart = true; return s; }
/* ajuste ao tamanho: `core` é [{ key, slide, pri }]; pri -1 nunca sai, os demais saem do maior pri para o menor (empate: o mais adiante no roteiro).
 * Sobra espaço para a conclusão em branco (a partir de 5 slides) e para o slide Fontes e método, quando a pasta tem essa aba. */
function nvXFit(P, core, N) {
  const withSrc = !!nvWbSourcesSlide(P) && N >= 5, room = N <= 2 ? 2 : N - (withSrc ? 1 : 0) - 1;
  let keep = core.slice();
  while (keep.length > room) {
    const drop = keep.filter(x => x.pri >= 0).sort((a, b) => b.pri - a.pri || core.indexOf(b) - core.indexOf(a))[0];
    if (!drop) break; keep = keep.filter(x => x !== drop);
  }
  return keep;
}
// monta o plano final: slides mantidos na ordem do roteiro, mais a conclusão em branco quando há espaço
function nvXFinish(P, N, story, keep, core, concl) {
  const order = core.map(x => x.slide), picked = keep.map(x => x.slide).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const plan = [...picked, ...(N >= 5 && concl ? [concl] : [])].slice(0, Math.max(1, N));
  const out = nvFinishPlan(P, plan, N, { items: [] }, null); out.story = story; return out;
}
// nome do arquivo sem extensão, como último recurso para chamar a entidade
const nvXStem = f => String(f || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim();
