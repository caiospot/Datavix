/* Datavix: landing page (página inicial). Só da interface do produto. Imagens são placeholders até haver arte final. */

const LP = {
  pt: {
    nav: [['como', 'Como funciona'], ['graficos', 'Gráficos'], ['diferenciais', 'Diferenciais'], ['faq', 'FAQ']],
    start: 'Começar agora', newp: 'Novo projeto', how_cta: 'Ver como funciona',
    fr: { t: 'Vendas por estado', src: 'Fonte: exemplo-vendas.csv · dados fictícios', ins: '{u} lidera com {p} da receita.', lead: 'Maior UF', share: 'Participação', calc: 'ver cálculo', ov: 'Visão geral', det: 'Detalhe', rows: 'Registros', ufs: 'UF', cats: 'Categorias', big: 'Maior', hover: 'Passe o mouse numa bolha para ver os detalhes.', hover2: 'Passe o mouse no gráfico para destacar.', same: 'A mesma planilha, outros gráficos', list: 'Lista', per: 'Período', cat: 'Categoria', by: 'Receita por ano', bys: 'Receita por UF', unsaved: 'Não salvo', save: 'Salvar projeto', present: 'Apresentar', howto: 'Como usar', yr: 'Ano', rev: 'Receita', total: 'Total' },
    hw: { drop: 'Arraste a planilha ou escolha um arquivo', file: 'vendas.csv', rows: '{n} linhas', det: 'Colunas reconhecidas', num: 'número', cat: 'categoria', tabs: ['Gráfico', 'Estilo', 'Exportar'], font: 'Tipografia', prev: 'Passo anterior', next: 'Próximo passo', pick: 'Ir para o passo', cli: 'Cliente' },
    em_ph: 'Qual é o seu e-mail?', em_btn: 'Começar de graça', em_bad: 'Esse e-mail parece incompleto. Confira e tente de novo.', em_req: 'Digite o seu e-mail para começar.',
    hero_k: 'Tudo vira dado.', hero_h: ['Da planilha ao', 'storytelling'],
    hero_p: 'O Datavix transforma a sua planilha em dataviz executivo animado e interativo. Tudo acontece no seu navegador: a planilha não sai do seu computador.',
    chips: ['XLSX · XLS · CSV', 'Exporta HTML offline', 'PT / EN'], hero_cap: 'Árvore radial com dados fictícios. Passe o mouse.', hero_cap2: '{c} com dados fictícios. Passe o mouse.',
    how_k: 'Como funciona', how_h: ['Quatro passos até o', 'Storytelling'],
    steps: [
      ['Responda 4 perguntas', 'Área, público, decisão e tempo. Depois da planilha, o Datavix mostra o que achou e escolhe o gráfico.', 'opções de público na primeira pergunta do Datavix'],
      ['Suba a planilha', 'Excel ou CSV com dezenas de milhares de linhas. Reconhecemos colunas, datas e formatos brasileiros.', 'área para arrastar ou escolher a planilha'],
      ['Veja a animação', 'O gráfico entra animado. Todo insight vem com cálculo, e o “ver cálculo” mostra a conta.', 'detalhe da árvore radial animada: períodos, ramos e cada registro como uma bolha'],
      ['Edite e exporte', 'Troque gráfico, paleta, fundo e fontes. Exporte HTML offline, PNG ou ZIP com um PNG por etapa.', 'painel de exportação: apresentar, HTML, PNG e ZIP'],
    ],
    ch_k: 'Gráficos', ch_h: ['Um gráfico para cada', 'história'], ch_p: 'A sugestão segue o formato dos seus dados. Você escolhe entre a principal e as alternativas.',
    avail: 'Disponível', soon: 'Em breve', ch_more: 'Também: barras, linhas, áreas, treemap, bolhas, dispersão, calendário e indicadores.',
    charts: [
      ['Árvore radial', 'Período, entidades e cada registro no mesmo gráfico. Passe o mouse e leia a linha da planilha.', true],
      ['Raios radiais', 'Um raio por item, comprimento pelo valor e cor por grupo.', true],
      ['Rio vertical', 'Como as categorias crescem e encolhem ao longo do tempo.', true],
      ['Leque de barras', 'Centenas de itens ordenados, lidos de uma vez.', true],
      ['Cordilheira isométrica', 'Séries comparadas em relevo, lado a lado.', true],
      ['Fluxo em funil', 'Onde os itens entram, passam e saem em cada etapa.', true],
    ],
    df_k: 'Diferenciais', df_h: ['Feito para quem precisa', 'provar'], df_h2: 'o número',
    diffs: [
      ['Sua planilha não sai do navegador', 'Leitura, cálculo e desenho acontecem no seu computador. Sem upload e sem servidor.'],
      ['HTML que abre offline', 'Um único arquivo, sem internet e sem dependências. Pronto para anexar ao e-mail e abrir na sala de reunião.'],
      ['Insight com a conta à vista', 'Cada destaque mostra o cálculo por trás. Se os dados não sustentam a frase, ela não aparece.'],
      ['Cartão com o texto da linha', 'Colunas explicativas viram um cartão ao lado do gráfico, com os dados e os textos longos separados.'],
      ['Animação que conta a história', 'Transições orquestradas e modo apresentação com uma etapa por período.'],
      ['Contraste e idioma', 'Paletas com contraste AA, três pares de fontes e interface em português e inglês.'],
    ],
    au_k: 'Para quem', aud: [
      ['Analistas e cientistas de dados', 'Entregue em minutos a visualização que levaria dias de design.'],
      ['Diretoria e liderança', 'Uma história clara, com o número verificável por trás.'],
      ['Consultorias e agências', 'Um HTML por cliente, com a identidade visual do projeto.'],
    ],
    faq_k: 'Perguntas frequentes', faq: [
      ['Minha planilha é enviada para algum servidor?', 'Não. O arquivo é lido e processado no seu navegador e nunca é enviado.'],
      ['Quais formatos são aceitos?', 'XLSX, XLS, CSV e TSV, com datas e números em português ou inglês.'],
      ['Posso usar o resultado sem internet?', 'Sim. O HTML exportado é um único arquivo e não precisa de internet.'],
      ['O Datavix inventa insights?', 'Não. Só mostramos o que sai de um cálculo sobre os seus dados, e você pode ver a conta.'],
      ['Quantas linhas aguenta?', 'Dezenas de milhares. Acima de 3.000 linhas a árvore radial reúne os registros por período, entidade e categoria.'],
    ],
    cta_h: ['Transforme a próxima planilha em', 'história'], foot: 'Seus dados ficam no seu navegador.', mine: 'Meus projetos',
    saved_k: 'Projetos salvos', saved_h: ['Continue de onde', 'parou'], all: 'Ver todos', proj_h: 'Projetos salvos', confirm: 'Confirmar?', none: 'Nenhum projeto salvo ainda. Use “Salvar projeto” no editor.', saved_note: 'Ficam salvos só neste navegador.',
    ph: 'IMAGEM', login_t: 'Entrar no Datavix',
  },
  en: {
    nav: [['como', 'How it works'], ['graficos', 'Charts'], ['diferenciais', 'Why Datavix'], ['faq', 'FAQ']],
    start: 'Get started', newp: 'New project', how_cta: 'See how it works',
    fr: { t: 'Sales by state', src: 'Source: sales-example.csv · sample data', ins: '{u} leads with {p} of revenue.', lead: 'Largest state', share: 'Share', calc: 'see calculation', ov: 'Overview', det: 'Detail', rows: 'Rows', ufs: 'States', cats: 'Categories', big: 'Largest', hover: 'Hover a bubble to see the details.', hover2: 'Hover the chart to highlight.', same: 'The same spreadsheet, other charts', list: 'List', per: 'Period', cat: 'Category', by: 'Revenue by year', bys: 'Revenue by state', unsaved: 'Not saved', save: 'Save project', present: 'Present', howto: 'How to use', yr: 'Year', rev: 'Revenue', total: 'Total' },
    hw: { drop: 'Drag the spreadsheet or pick a file', file: 'sales.csv', rows: '{n} rows', det: 'Detected columns', num: 'number', cat: 'category', tabs: ['Chart', 'Style', 'Export'], font: 'Typography', prev: 'Previous step', next: 'Next step', pick: 'Go to step', cli: 'Client' },
    em_ph: 'What\'s your email?', em_btn: 'Start for free', em_bad: 'That email looks incomplete. Check it and try again.', em_req: 'Enter your email to get started.',
    hero_k: 'Everything becomes data.', hero_h: ['From spreadsheet to', 'storytelling'],
    hero_p: 'Datavix turns your spreadsheet into animated, interactive executive dataviz. Everything happens in your browser: the spreadsheet never leaves your computer.',
    chips: ['XLSX · XLS · CSV', 'Exports offline HTML', 'PT / EN'], hero_cap: 'Radial tree with sample data. Hover it.', hero_cap2: '{c} with sample data. Hover it.',
    how_k: 'How it works', how_h: ['Four steps to', 'Storytelling'],
    steps: [
      ['Answer 4 questions', 'Area, audience, decision and time. After the spreadsheet, Datavix shows what it found and picks the chart.', 'audience options on the first Datavix question'],
      ['Upload the spreadsheet', 'Excel or CSV with tens of thousands of rows. We detect columns, dates and number formats.', 'area to drag or pick the spreadsheet'],
      ['Watch it animate', 'The chart enters animated. Every insight comes with its math, and “see calculation” shows it.', 'detail of the animated radial tree: periods, branches and each record as a bubble'],
      ['Edit and export', 'Change chart, palette, background and fonts. Export offline HTML, PNG or a ZIP with a PNG per step.', 'export panel: present, HTML, PNG and ZIP'],
    ],
    ch_k: 'Charts', ch_h: ['A chart for every', 'story'], ch_p: 'The suggestion follows the shape of your data. You choose between the main one and the alternatives.',
    avail: 'Available', soon: 'Coming soon', ch_more: 'Also: bars, lines, areas, treemap, bubbles, scatter, calendar and KPI cards.',
    charts: [
      ['Radial tree', 'Period, entities and every record in one chart. Hover and read the spreadsheet row.', true],
      ['Radial spokes', 'One spoke per item, length by value and color by group.', true],
      ['Vertical river', 'How categories grow and shrink over time.', true],
      ['Bar fan', 'Hundreds of ordered items, read at once.', true],
      ['Isometric ridgeline', 'Series compared in relief, side by side.', true],
      ['Funnel flow', 'Where items enter, pass and drop out at each stage.', true],
    ],
    df_k: 'Why Datavix', df_h: ['Built for people who must', 'prove'], df_h2: 'the number',
    diffs: [
      ['Your spreadsheet stays in the browser', 'Reading, calculation and drawing happen on your computer. No upload and no server.'],
      ['HTML that opens offline', 'A single file, no internet and no dependencies. Ready to attach to an email and open in the meeting room.'],
      ['Insights with the math in sight', 'Every highlight shows the calculation behind it. If the data does not support the sentence, it does not appear.'],
      ['A card with the row text', 'Explanatory columns become a card beside the chart, with data and long texts kept apart.'],
      ['Animation that tells the story', 'Orchestrated transitions and a presentation mode with one step per period.'],
      ['Contrast and language', 'AA-contrast palettes, three font pairs and an interface in Portuguese and English.'],
    ],
    au_k: 'Who it is for', aud: [
      ['Data analysts and scientists', 'Deliver in minutes the visualization that would take days of design.'],
      ['Executives and leadership', 'A clear story, with a verifiable number behind it.'],
      ['Consultancies and agencies', 'One HTML per client, with the project’s visual identity.'],
    ],
    faq_k: 'Frequently asked questions', faq: [
      ['Is my spreadsheet sent to a server?', 'No. The file is read and processed in your browser and never sent anywhere.'],
      ['Which formats are accepted?', 'XLSX, XLS, CSV and TSV, with dates and numbers in Portuguese or English.'],
      ['Can I use the result without internet?', 'Yes. The exported HTML is a single file and needs no internet.'],
      ['Does Datavix make up insights?', 'No. We only show what comes from a calculation on your data, and you can see the math.'],
      ['How many rows can it take?', 'Tens of thousands. Above 3,000 rows the radial tree groups records by period, entity and category.'],
    ],
    cta_h: ['Turn your next spreadsheet into a', 'story'], foot: 'Your data stays in your browser.', mine: 'My projects',
    saved_k: 'Saved projects', saved_h: ['Pick up where you', 'left off'], all: 'See all', proj_h: 'Saved projects', confirm: 'Confirm?', none: 'No saved projects yet. Use “Save project” in the editor.', saved_note: 'Saved in this browser only.',
    ph: 'IMAGE', login_t: 'Sign in to Datavix',
  },
};
const LPT = () => LP[LANG] || LP.pt;

const lpTitle = (a, b, c) => `${esc(a)} <b>${esc(b)}</b>${c ? ' ' + esc(c) : ''}`;
// captura de tela real do produto (seção Como funciona); o fundo escuro do quadro faz a moldura sumir em torno de imagens de proporção diferente
const lpShot = (src, label) => `<figure class="shot"><img src="${src}" alt="${esc(label)}" loading="lazy" decoding="async" draggable="false"></figure>`;
// o mesmo desenho do menu de gráficos da ferramenta, em tamanho grande, ilustra cada gráfico da seção Gráficos
const LP_CH_ICON = ['organism', 'rays', 'river', 'fan', 'ridge', 'flow'];
const lpPh = (label, ratio = '16/10', k) => `<figure class="ph" style="aspect-ratio:${ratio}"><div class="ph-in"><span class="lbl">[ ${LPT().ph}${k ? ' ' + k : ''} ]</span><em>${esc(label)}</em></div></figure>`;

function landingHtml() {
  const L = LPT(), mine = S.user;
  const cta = mine ? `<button class="btn" data-a="start">${L.newp} →</button>` : `<button class="btn" data-a="start">${L.start} →</button>`;
  // cadastro: o e-mail é obrigatório para começar (hero e chamada final). Quem já tem sessão vê "Novo projeto". O e-mail lembrado neste navegador já vem preenchido
  let known = ''; try { known = (JSON.parse(localStorage.getItem('dv-signup')) || {}).email || ''; } catch (e) { known = ''; }
  const mailForm = k => `<div class="lp-mailbox"><form class="lp-mail" novalidate><label class="sr" for="lpem-${k}">${esc(L.em_ph)}</label><input class="lp-em" id="lpem-${k}" name="email" type="email" inputmode="email" autocomplete="email" required value="${esc(known)}" placeholder="${esc(L.em_ph)}" aria-describedby="lpem-h-${k}"><button class="btn" type="submit">${esc(L.em_btn)}</button></form><p class="lp-em-h" id="lpem-h-${k}" role="alert"></p></div>`;
  const reg = !mine && !!known, startBtn = `<button class="btn" data-a="start">${L.start} →</button>`; // já se cadastrou neste navegador: só "Começar agora"
  const heroCta = mine ? cta : reg ? startBtn : mailForm('a');
  return `<div class="lp">
  <section class="lp-hero" id="top">
    <div class="lp-glow" aria-hidden="true"></div>
    <div class="lp-copy">
      <div class="lp-titlebox"><div class="lp-eyebrow">${esc(L.hero_k)}</div>
      <h1 class="lp-h1">${lpTitle(L.hero_h[0], L.hero_h[1])}</h1></div>
      <div class="lp-side"><p class="lp-sub">${esc(L.hero_p)}</p>
        <div class="lp-cta${mine || reg ? '' : ' lp-cta-mail'}">${heroCta}${mine ? `<a class="btn ghost" href="#como" data-a="anchor">${L.how_cta}</a>` : ''}</div>
        <div class="lp-meta">${L.chips.map(c => `<span>${esc(c)}</span>`).join('<i></i>')}</div></div>
    </div>
    ${lpFrame(L)}
    <p class="lp-capline" id="lp-cap">${esc(L.hero_cap)}</p>
  </section>
  ${(S.recents || []).length ? `<section class="lp-sec lp-saved" id="salvos"><div class="lbl">[ ${esc(L.saved_k)} ]</div><h2>${lpTitle(L.saved_h[0], L.saved_h[1])}</h2><div class="pj-grid">${projCards(6)}</div><div class="row pj-more">${S.recents.length > 6 ? `<button class="btn ghost sm" data-a="projects">${L.all} (${S.recents.length})</button>` : ''}<span class="note">${esc(L.saved_note)}</span></div></section>` : ''}
  <section class="lp-sec lp-how" id="como">${lpHow(L)}</section>
  <section class="lp-sec lp-how lp-gr" id="graficos">${lpGraficos(L)}
    <p class="lp-also"><span>${esc(T('lp_also'))}</span>${['bars', 'hbars', 'stacked100', 'treemap', 'pie', 'donut', 'pies', 'donuts', 'packed', 'cols', 'lines', 'radial', 'radar', 'box', 'words', 'bubmap', 'isomap', 'race', 'line', 'area', 'calendar', 'scatter', 'bubble', 'kpi'].map(t => `<b>${chartIcon(t)}${esc(T('chart')[t])}</b>`).join('')}</p></section>
  <section class="lp-sec" id="diferenciais"><div class="lp-split"><div class="lp-split-h"><div class="lbl">[ ${esc(L.df_k)} ]</div><h2>${lpTitle(L.df_h[0], L.df_h[1], L.df_h2)}</h2></div>
    <div class="lp-dlist">${L.diffs.map((d, i) => `<article class="lp-df" data-rv><div class="lbl">${String(i + 1).padStart(2, '0')}</div><div><h3>${esc(d[0])}</h3><p>${esc(d[1])}</p></div></article>`).join('')}</div></div></section>
  <section class="lp-sec lp-who">${lpWho(L)}</section>
  <section class="lp-sec lp-faq" id="faq"><div class="lbl">[ ${esc(L.faq_k)} ]</div>
    <div>${L.faq.concat(npsOn() ? [[T('nps_faq_q'), T('nps_faq_a')]] : []).map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div></section>
  <section class="lp-final"><h2>${lpTitle(L.cta_h[0], L.cta_h[1])}</h2><div class="lp-final-cta">${mine ? cta : reg ? startBtn : mailForm('b')}</div></section>
  <footer class="lp-foot"><span class="brand-s"><i></i>DATAVIX</span><span class="note"><a class="lp-site" href="https://${DV_SITE}" target="_blank" rel="noopener">${DV_SITE}</a> · ${esc(L.hero_k)} · ${esc(L.foot)} · <button type="button" class="lp-fb" data-a="privacy">${esc(privT().link)}</button>${npsOn() ? ` · <button type="button" class="lp-fb" data-a="feedback">${esc(T('nps_fb'))}</button>` : ''}${anFooter()}</span></footer></div>`;
}

/* ---- árvore radial ao vivo no hero (dados fictícios, mesmo motor do produto) ---- */
function landingData() {
  const rnd = orgRand(42), yrs = [2018, 2019, 2020, 2021, 2022, 2023, 2024], ents = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'PE', 'CE', 'GO', 'DF', 'ES'];
  const cols = (LANG === 'pt' ? ['Moda', 'Casa', 'Mercado', 'Eletrônicos', 'Beleza', 'Esportes'] : ['Fashion', 'Home', 'Grocery', 'Electronics', 'Beauty', 'Sports']).map(l => ({ label: l, v: 0, n: 0 }));
  const hubs = yrs.map(y => ({ label: String(y), v: 0, n: 0 })), leaves = [];
  hubs.forEach((_, h) => ents.forEach((_, e) => { if (rnd() < 0.62) { const k = 1 + Math.floor(rnd() * 3); for (let j = 0; j < k; j++) leaves.push([h, e, Math.floor(rnd() * cols.length), 10 + Math.pow(rnd(), 3) * 900, 1, '', null]); } }));
  return { hubName: LANG === 'pt' ? 'Ano' : 'Year', entName: LANG === 'pt' ? 'UF' : 'State', colName: LANG === 'pt' ? 'Categoria' : 'Category', sizeName: LANG === 'pt' ? 'Receita' : 'Revenue', unit: null, grain: 'year', perRow: false, rowsUsed: leaves.length, rowsTotal: leaves.length, hubs, ents: ents.map(l => ({ label: l, v: 0, n: 0 })), cols, leaves, fields: [] };
}
/* ---- quadro da ferramenta no hero: o mesmo layout do produto, com os números calculados dos mesmos dados fictícios da árvore ---- */
const LP_PAL = () => PALETTES.cosmos.slice();
const LP_CHARTS = ['organism', 'rays', 'river', 'ridge'];
// os mesmos registros fictícios como planilha de verdade (colunas Ano, UF, Categoria, Receita, Data), para que cada gráfico use o construtor real do produto
function lpDs(cats) {
  const D = landingData(), rows = D.leaves.filter(l => !cats || cats.has(l[2])), yrs = D.hubs.map(h => +h.label);
  const cat = (name, dict, f) => ({ name, kind: 'category', unit: null, dict, distinct: dict.length, codes: Int32Array.from(rows, f) });
  const dates = Float64Array.from(rows, (l, i) => Date.UTC(yrs[l[0]], (l[1] * 5 + l[2] * 3 + i) % 12, 2 + (i % 26)));
  const columns = [cat(D.hubName, D.hubs.map(h => h.label), l => l[0]), cat(D.entName, D.ents.map(e => e.label), l => l[1]), cat(D.colName, D.cols.map(c => c.label), l => l[2]),
    { name: D.sizeName, kind: 'number', unit: null, data: Float64Array.from(rows, l => l[3]) }, { name: LANG === 'pt' ? 'Data' : 'Date', kind: 'date', unit: null, data: dates, min: Math.min(...dates), max: Math.max(...dates) }];
  return { columns, rowCount: rows.length };
}
const LP_MAP = { fan: { value: 3, label: -1, cat: 2, agg: 'sum' }, flow: { s1: 2, s2: 1, s3: 0, value: 3, agg: 'sum' }, rays: { entity: 1, group: 2, value: 3, agg: 'sum', details: [] }, river: { period: 0, cat: 2, value: 3, agg: 'sum' }, ridge: { time: 4, ent: 1, value: 3, comp: 2, agg: 'sum' } };
function lpEngine(id, th, cats) {
  if (id === 'organism') { const D = landingData(); return new OrgEngine(D, th, { rm: RM }); }
  const B = { rays: raysBuild, river: riverBuild, ridge: ridgeBuild, fan: fanBuild, flow: flowBuild }[id], C = { rays: RaysEngine, river: RiverEngine, ridge: RidgeEngine, fan: FanEngine, flow: FlowEngine }[id];
  const d = B(lpDs(cats), LP_MAP[id], { lang: LANG, nullPolicy: 'ignore' }); return d ? new C(d, th, { rm: RM }) : null;
}
function lpStats() {
  const D = landingData(), pal = LP_PAL(), f = x => fmtNum(x, null, LANG);
  const yearTot = D.hubs.map(() => 0), catTot = D.cols.map(() => 0), entTot = D.ents.map(() => 0); let total = 0;
  D.leaves.forEach(l => { yearTot[l[0]] += l[3]; entTot[l[1]] += l[3]; catTot[l[2]] += l[3]; total += l[3]; });
  const top = D.leaves.map((l, i) => ({ i, h: l[0], e: l[1], c: l[2], v: l[3] })).sort((x, y) => y.v - x.v).slice(0, 14);
  const big = entTot.reduce((m, v, i) => (v > entTot[m] ? i : m), 0), g = yearTot[yearTot.length - 1] / yearTot[0] - 1;
  return { D, pal, f, yearTot, catTot, entTot, total, top, big, g, n: D.leaves.length };
}
function lpFrame(L) {
  const F = L.fr, st = lpStats(), { D, pal, f } = st, y0 = D.hubs[0].label, y1 = D.hubs[D.hubs.length - 1].label, c = i => pal[i % pal.length];
  const sh = st.entTot[st.big] / st.total, shTxt = `${Math.round(sh * 100)}%`, mx = Math.max(...st.yearTot), mn = Math.min(...st.yearTot), W = 100, H = 40;
  const pts = st.yearTot.map((v, i) => [i / (st.yearTot.length - 1) * W, H - 4 - (v - mn) / ((mx - mn) || 1) * (H - 10)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const ents = st.entTot.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 5), em = ents[0][0];
  const row = t => `<button type="button" class="lpf-row" data-leaf="${t.i}" style="--c:${c(t.c)}"><i></i><span class="t"><b>${esc(D.ents[t.e].label)}</b><small>${esc(D.cols[t.c].label)} · ${esc(D.hubs[t.h].label)}</small></span><span>${f(t.v)}</span></button>`;
  return `<div class="lp-framewrap"><div class="lp-frame" id="lpframe" role="group" aria-label="${esc(L.hero_cap)}" data-total="${st.total.toFixed(2)}">
    <div class="lpf-bar" aria-hidden="true"><span class="lpf-dots"><i></i><i></i><i></i></span><span>DATAVIX</span><span class="sp"></span><span class="lpf-warn">● ${esc(F.unsaved)}</span><span class="lpf-pill">${esc(F.save)}</span></div>
    <div class="lpf-body">
      <aside class="lpf-left">
        <div><h3 class="lpf-title">${esc(F.t)}</h3><p class="lpf-src">${esc(F.src)} · ${y0} – ${y1}</p></div>
        <div class="lpf-ins"><div class="lpf-lbl">[ INSIGHT // 01 ]</div><p>${esc(F.ins.replace('{u}', D.ents[st.big].label).replace('{p}', shTxt))}</p>
          <details><summary>${esc(F.calc)}</summary><dl><dt>${esc(D.ents[st.big].label)}</dt><dd>${f(st.entTot[st.big])}</dd><dt>${esc(F.total)}</dt><dd>${f(st.total)}</dd><dt>${esc(F.share)}</dt><dd>${shTxt}</dd></dl></details></div>
        <div class="lpf-per"><div class="lpf-lbl">${esc(F.per)}</div><div class="yrs"><span>${y0}</span><span>${y1}</span></div><div class="trk"><i id="lpf-now" style="left:0%"></i></div></div>
        <div><div class="lpf-lbl">${esc(F.cat)}</div><div class="lpf-cats">${D.cols.map((k, i) => `<button type="button" class="lpf-chip" data-cat="${i}" aria-pressed="true" style="--c:${c(i)}"><i></i>${esc(k.label)}</button>`).join('')}</div></div>
        <div class="lpf-spark"><div class="lpf-lbl">${esc(F.by)}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="${line} L${W} ${H} L0 ${H} Z"/><path d="${line}"/><circle id="lpf-dot" cx="${pts[0][0]}" cy="${pts[0][1].toFixed(1)}" r="1.6"/></svg></div>
        <div><div class="lpf-lbl">${esc(F.bys)}</div><div class="lpf-bars">${ents.map(([v, i]) => `<div><span>${esc(D.ents[i].label)}</span><b style="--w:${Math.round(v / em * 100)}%"></b><span>${f(v)}</span></div>`).join('')}</div></div>
      </aside>
      <section class="lpf-mid">
        <div class="lpf-ov" id="lpf-ov" aria-live="polite"></div>
        <div class="lpf-list"><div class="h lpf-lbl">[ ${esc(F.list)} · ${fmtInt(st.n, LANG)} ]</div><div class="lpf-rows">${st.top.map(row).join('')}</div></div>
      </section>
      <div class="lpf-stage"><div class="lpf-tabs" role="tablist" aria-label="${esc(F.same)}">${LP_CHARTS.map((id, i) => `<button type="button" role="tab" class="lpf-tab" data-ch="${id}" aria-selected="${i === 0}">${esc(T('chart')[id])}</button>`).join('')}<span class="lpf-tools" aria-hidden="true"><span>▶ ${esc(F.present)}</span><span>? ${esc(F.howto)}</span></span></div><div class="lpf-cvw"><canvas id="lpcv" aria-label="${esc(L.hero_cap)}" role="img"></canvas></div></div>
    </div></div></div>`;
}

/* ---- Como funciona: carrossel de 4 cartões, cada um com um pedaço real da ferramenta ---- */
const lpIco = k => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{ q: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>', up: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>', play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>', ex: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>' }[k]}</svg>`;
function lpHow(L) {
  const st = lpStats(), { D, pal, f } = st, H = L.hw, O = I18N[LANG].o, F = L.fr, N = L.steps.length, pn = T('pal'), sh = Math.round(st.entTot[st.big] / st.total * 100);
  const v1 = `<div class="v1"><div class="xdots"><i class="on"></i><i></i><i></i><i></i></div><div class="xq">${esc(T('q_audience')[0])} <b>${esc(T('q_audience')[1])}</b></div><div class="xopts">${['board', 'clevel', 'director', 'team'].map(k => `<span class="${k === 'director' ? 'on' : ''}"><b>${esc(O.audience[k][0])}</b><small>${esc(O.audience[k][1])}</small></span>`).join('')}</div></div>`;
  const cols = [[D.hubName, H.cat], [D.entName, H.cat], [D.colName, H.cat], [D.sizeName, H.num]];
  const v2 = `<div class="v2"><div class="xdrop"><b>${esc(H.drop)}</b><small>.xlsx · .xls · .csv</small></div><div class="xfile"><span>${esc(H.file)}</span><em>${esc(H.rows.replace('{n}', fmtInt(st.n, LANG)))}</em><i class="xbar"><u></u></i></div><div class="xdet"><div class="lpf-lbl">${esc(H.det)}</div><div class="xcols">${cols.map(c => `<span>${esc(c[0])}<small>${esc(c[1])}</small></span>`).join('')}</div></div></div>`;
  const v3 = `<div class="v3"><canvas id="lphcv" aria-hidden="true"></canvas><div class="xins"><div class="lpf-lbl">[ INSIGHT // 01 ]</div><p>${esc(F.ins.replace('{u}', D.ents[st.big].label).replace('{p}', sh + '%'))}</p><details><summary>${esc(F.calc)}</summary><dl><dt>${esc(D.ents[st.big].label)}</dt><dd>${f(st.entTot[st.big])}</dd><dt>${esc(F.total)}</dt><dd>${f(st.total)}</dd><dt>${esc(F.share)}</dt><dd>${sh}%</dd></dl></details></div></div>`;
  const sw = ['cosmos', 'corporate', 'editorial', 'tech', 'vibrant'], ex = [['▶', T('present')], ['&lt;/&gt;', T('ex_html')], ['▣', T('ex_png')], ['⇩', T('ex_steps')]];
  const v4 = `<div class="v4"><div class="xtabs">${H.tabs.map((t, i) => `<span class="${i === 2 ? 'on' : ''}">${esc(t)}</span>`).join('')}</div><div class="xpal"><div class="lpf-lbl">${esc(T('pal_h'))}</div>${sw.map((k, i) => `<div class="pr${i === 0 ? ' on' : ''}"><span>${esc(pn[k])}</span><i>${PALETTES[k].slice(0, 5).map(c => `<u style="background:${c}"></u>`).join('')}</i></div>`).join('')}</div><div class="xexp">${ex.map(e => `<span><b>${e[0]}</b>${esc(e[1])}</span>`).join('')}</div></div>`;
  const vis = [v1, v2, v3, v4], ic = ['q', 'up', 'play', 'ex'];
  const card = i => `<article class="lph-card c${i + 1}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${N}"><div class="lph-h"><span class="lph-ic">${lpIco(ic[i])}</span><h3>${esc(L.steps[i][0])}</h3><span class="lph-n num">0${i + 1}</span></div><p>${esc(L.steps[i][1])}</p><div class="lph-vis" role="img" aria-label="${esc(L.steps[i][2])}">${vis[i]}</div></article>`;
  return `<div class="lph-top"><div><div class="lbl">[ ${esc(L.how_k)} ]</div><h2>${lpTitle(L.how_h[0], L.how_h[1])}</h2></div>
</div>
    <div class="lph-track" tabindex="0" aria-roledescription="carousel" aria-label="${esc(L.how_k)}">${L.steps.map((_, i) => card(i)).join('')}</div>
    <div class="lph-foot"><span class="lph-count"><b class="lph-cur">01</b> / 0${N}</span><div class="lph-btns"><button type="button" class="lph-btn" data-dir="-1" aria-label="${esc(H.prev)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" class="lph-btn" data-dir="1" aria-label="${esc(H.next)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>`;
}

/* ---- Para quem: três cartões, cada um com um pedaço do produto ---- */
function lpWho(L) {
  const st = lpStats(), { D, f } = st, F = L.fr, H = L.hw, pn = T('pal'), sh = Math.round(st.entTot[st.big] / st.total * 100);
  const top = st.entTot.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 5), mx = top[0][0];
  const a1 = `<div class="va1"><div class="xsheet">${top.map(([v, i]) => `<span>${esc(D.ents[i].label)}</span><span>${f(v)}</span>`).join('')}</div><svg viewBox="0 0 10 10" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M1 5h7M5.5 2.5L8 5 5.5 7.5"/></svg><div class="xbars">${top.map(([v]) => `<b style="--h:${Math.round(v / mx * 100)}%"></b>`).join('')}</div></div>`;
  const a2 = `<div class="va2"><div class="xins"><div class="lpf-lbl">[ INSIGHT // 01 ]</div><p>${esc(F.ins.replace('{u}', D.ents[st.big].label).replace('{p}', sh + '%'))}</p><div class="xcalc"><span>${esc(F.calc)}</span><span>${f(st.entTot[st.big])} / ${f(st.total)}</span></div></div></div>`;
  const a3 = `<div class="va3">${['corporate', 'editorial', 'vibrant'].map((k, i) => `<div><span>${esc(H.cli)} ${'ABC'[i]}</span><i>${PALETTES[k].slice(0, 5).map(c => `<u style="background:${c}"></u>`).join('')}</i><small>${esc(pn[k])}</small></div>`).join('')}</div>`;
  return `<div class="lbl">[ ${esc(L.au_k)} ]</div><div class="lpa-grid">${L.aud.map((a, i) => `<article class="lpa-card" data-rv><div class="lpa-vis" aria-hidden="true">${[a1, a2, a3][i]}</div><h3>${esc(a[0])}</h3><p>${esc(a[1])}</p></article>`).join('')}</div>`;
}

/* ---- Gráficos: carrossel de cartões (o mesmo desenho do "Como funciona"), cada um com a ilustração do gráfico ---- */
function lpGraficos(L) {
  const H = L.hw, N = L.charts.length, tints = ['106, 92, 255', '2, 184, 204', '212, 255, 0', '255, 92, 138', '255, 138, 61', '76, 201, 240'];
  const card = (c, i) => `<article class="lph-card lpg-card" style="--tint:${tints[i % tints.length]}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${N}"><div class="lph-h"><span class="lph-ic lpg-ic">${chartIcon(LP_CH_ICON[i])}</span><h3>${esc(c[0])}</h3><span class="tag${c[2] ? ' on' : ''}">${c[2] ? L.avail : L.soon}</span></div><p>${esc(c[1])}</p><div class="lph-vis lpg-vis" role="img" aria-label="${esc(c[0])}"><div class="lpg-art">${chartIcon(LP_CH_ICON[i])}<canvas class="lpg-cv" data-ch="${LP_CH_ICON[i]}" aria-hidden="true"></canvas></div></div></article>`;
  return `<div class="lph-top"><div><div class="lbl">[ ${esc(L.ch_k)} ]</div><h2>${lpTitle(L.ch_h[0], L.ch_h[1])}</h2><p class="sub">${esc(L.ch_p)}</p></div>
</div>
    <div class="lph-track" tabindex="0" aria-roledescription="carousel" aria-label="${esc(L.ch_k)}">${L.charts.map(card).join('')}</div>
    <div class="lph-foot"><span class="lph-count"><b class="lph-cur">01</b> / 0${N}</span><div class="lph-btns"><button type="button" class="lph-btn" data-dir="-1" aria-label="${esc(H.prev)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" class="lph-btn" data-dir="1" aria-label="${esc(H.next)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>`;
}
let _lp = null;
function landingMount() {
  landingUnmount();
  const cv = $('#lpcv'), fr = $('#lpframe'); if (!cv || !fr) return;
  const L = LPT(), F = L.fr, st = lpStats(), { D, pal, f } = st, nY = D.hubs.length, dark = S.ui === 'dark';
  const th = { base: dark ? '#0b0d0a' : '#eef0eb', fg: dark ? '#eef0eb' : '#0b0d0a', colors: pal, font: "Geist, system-ui, sans-serif" };
  const ov = $('#lpf-ov'), now = $('#lpf-now'), dot = $('#lpf-dot'), rows = $$('.lpf-row', fr), chips = $$('.lpf-chip', fr), cats = new Set(D.cols.map((_, i) => i));
  const pts = (() => { const mx = Math.max(...st.yearTot), mn = Math.min(...st.yearTot); return st.yearTot.map((v, i) => [i / (nY - 1) * 100, 40 - 4 - (v - mn) / ((mx - mn) || 1) * 30]); })();
  let eng = null, focus = null, hover = -1, visible = false, idle = true;
  // cartão "Visão geral": período todo, um ano em foco ou o registro sob o mouse; tudo calculado dos dados do gráfico
  const showOv = () => {
    const sel = [...cats]; let yrs = focus === null ? [0, nY - 1] : [focus, focus], rowsN = 0, tot = 0, ents = new Set();
    D.leaves.forEach(l => { if (l[0] >= yrs[0] && l[0] <= yrs[1] && cats.has(l[2])) { rowsN++; tot += l[3]; ents.add(l[1]); } });
    if (hover >= 0) {
      const l = D.leaves[hover], k = D.cols[l[2]];
      ov.innerHTML = `<div class="h"><div><span class="lpf-lbl">${esc(F.det)}</span><b>${esc(D.ents[l[1]].label)} · ${esc(D.hubs[l[0]].label)}</b></div><em>${f(l[3])}</em></div><div class="b"><div><span>${esc(F.cat)}</span><b><i style="background:${pal[l[2] % pal.length]}"></i>${esc(k.label)}</b></div><div><span>${esc(F.ufs)}</span><b>${esc(D.ents[l[1]].label)}</b></div><div><span>${esc(F.yr)}</span><b>${esc(D.hubs[l[0]].label)}</b></div><div><span>${esc(F.rev)}</span><b>${f(l[3])}</b></div></div><div class="f">${esc(F.hover)}</div>`; return;
    }
    const big = (() => { const t = D.ents.map(() => 0); D.leaves.forEach(l => { if (l[0] >= yrs[0] && l[0] <= yrs[1] && cats.has(l[2])) t[l[1]] += l[3]; }); const i = t.reduce((m, v, j) => (v > t[m] ? j : m), 0); return t[i] > 0 ? D.ents[i].label + ' · ' + f(t[i]) : '—'; })();
    ov.innerHTML = `<div class="h"><div><span class="lpf-lbl">${esc(F.ov)}</span><b>${focus === null ? esc(D.hubs[0].label) + ' – ' + esc(D.hubs[nY - 1].label) : esc(D.hubs[focus].label)}</b></div><em>${f(tot)}</em></div><div class="b"><div><span>${esc(F.rows)}</span><b>${fmtInt(rowsN, LANG)}</b></div><div><span>${esc(F.ufs)}</span><b>${ents.size}</b></div><div><span>${esc(F.cats)}</span><b>${sel.length}</b></div><div><span>${esc(F.big)}</span><b>${esc(big)}</b></div></div><div class="f">${esc(chart === 'organism' ? F.hover : F.hover2)}</div>`;
  };
  let chart = 'organism', picked = false; const tabs = $$('.lpf-tab', fr);
  const setFocus = h => { if (chart !== 'organism') h = null; focus = h; if (now) now.style.left = (h === null ? 0 : h / (nY - 1) * 100) + '%'; if (dot) { const p = pts[h === null ? 0 : h]; dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1].toFixed(1)); } if (eng && chart === 'organism') eng.setState({ focus: h }); if (hover < 0) showOv(); };
  const setHover = i => { if (chart !== 'organism') i = -1; if (i === hover) return; hover = i; rows.forEach(r => r.classList.toggle('on', +r.dataset.leaf === i)); if (eng && chart === 'organism') { eng.hov.leaf = i; eng.kick(); } cv.style.cursor = i >= 0 ? 'pointer' : 'default'; idle = i < 0; showOv(); };
  showOv();
  // o gráfico nasce (e cresce) quando o quadro aparece na tela e pausa quando sai dela; as abas trocam o gráfico mantendo a mesma planilha
  const fit = () => { if (!eng) return; const w = Math.max(240, cv.clientWidth), h = Math.max(240, cv.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); eng.resize(w, h, dpr); };
  const ro = new ResizeObserver(fit);
  const filt = () => (cats.size === D.cols.length ? null : cats);
  const useChart = id => {
    const ne = lpEngine(id, th, filt()); if (!ne) return false;
    if (eng) eng.stop(); eng = ne; chart = id; eng.ctx = cv.getContext('2d'); eng.hov = eng.hov || {}; _lp.eng = eng; hover = -1; focus = null; rows.forEach(r => r.classList.remove('on'));
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.ch === id))); if (id === 'organism' && filt()) eng.setState({ colors: [...cats] });
    const cap = $('#lp-cap'); if (cap) cap.textContent = L.hero_cap2.replace('{c}', T('chart')[id]);
    fit(); if (RM) eng.snap(); setFocus(null); showOv(); return true;
  };
  const boot = () => { ro.observe(cv); useChart('organism'); };
  let t = 0, t2 = 0;
  const timer = RM ? 0 : setInterval(() => {
    if (!visible || document.hidden) return;
    t2++; if (!picked && idle && t2 % 3 === 0) { const nxt = LP_CHARTS[(LP_CHARTS.indexOf(chart) + 1) % LP_CHARTS.length]; if (useChart(nxt)) return; } // a cada ~10 s o gráfico muda, até a pessoa escolher um
    if (chart !== 'organism' || !idle) return; t++; const ph = t % (nY + 2); setFocus(ph < nY ? ph : null);
  }, 3400);
  tabs.forEach(b => b.addEventListener('click', () => { picked = true; if (b.dataset.ch !== chart) useChart(b.dataset.ch); }));
  cv.addEventListener('mousemove', e => {
    if (!eng) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (chart !== 'organism') { const id = eng.pick(x, y); idle = id === null || id === undefined; if (eng.setHover) eng.setHover(idle ? null : id); cv.style.cursor = idle ? 'default' : 'pointer'; return; }
    const hit = eng.pick(x, y); idle = !hit; eng.hov.hub = hit && hit.type === 'hub' ? hit.i : -1;
    if (hit && hit.type === 'leaf') setHover(hit.i); else { setHover(-1); eng.hov.leaf = -1; eng.kick(); cv.style.cursor = hit ? 'pointer' : 'default'; }
  });
  cv.addEventListener('mouseleave', () => { idle = true; if (!eng) return; if (chart === 'organism') { eng.hov.hub = -1; setHover(-1); } else if (eng.setHover) eng.setHover(null); });
  rows.forEach(r => { const i = +r.dataset.leaf; r.addEventListener('mouseenter', () => { idle = false; setHover(i); }); r.addEventListener('mouseleave', () => { idle = true; setHover(-1); }); r.addEventListener('focus', () => setHover(i)); r.addEventListener('blur', () => setHover(-1)); });
  chips.forEach(b => b.addEventListener('click', () => { const i = +b.dataset.cat, on = cats.has(i); if (on && cats.size === 1) return; on ? cats.delete(i) : cats.add(i); b.setAttribute('aria-pressed', String(!on)); if (eng) { if (chart === 'organism') eng.setState({ colors: filt() ? [...cats] : null }); else useChart(chart); } if (hover < 0) showOv(); }));
  _lp = { eng: null, ro, timer, io2: null };
  let io = null;
  if (window.IntersectionObserver) { io = new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) { if (!eng) boot(); else eng.kick(); } else if (eng) eng.stop(); }), { threshold: 0.2 }); io.observe(fr); }
  else { visible = true; boot(); }
  _lp.io2 = io;
  const top = $('.top'); let ticking = false;
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; if (top) top.classList.toggle('at-top', scrollY < 8); }); };
  window.addEventListener('scroll', onScroll, { passive: true }); _lp.onScroll = onScroll; onScroll();
  // carrosséis ("Como funciona" e "Gráficos"): botões, pílulas e contador seguem a rolagem; a árvore do passo 3 só roda quando o cartão aparece
  $$('.lp-how').forEach(sec => {
    const trk = $('.lph-track', sec); if (!trk) return;
    const cards = $$('.lph-card', trk), pills = $$('.lph-pill', sec), cur = $('.lph-cur', sec);
    const pad = () => parseFloat(getComputedStyle(trk).paddingLeft) || 0;
    let force = -1; // passo escolhido por botão/pílula: vale até a pessoa rolar sozinha (no fim da rolagem dois cartões cabem na tela)
    const pos = () => { let b = 0, bd = 1e9; cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft - trk.scrollLeft - pad()); if (d < bd) { bd = d; b = i; } }); if (trk.scrollLeft + trk.clientWidth >= trk.scrollWidth - 4) b = cards.length - 1; return b; };
    const idx = () => (force >= 0 ? force : pos());
    const sync = () => { const i = idx(); pills.forEach((p, k) => p.setAttribute('aria-pressed', String(k === i))); if (cur) cur.textContent = '0' + (i + 1); };
    const go = i => { i = Math.max(0, Math.min(cards.length - 1, i)); force = i; trk.scrollTo({ left: cards[i].offsetLeft - pad(), behavior: RM ? 'auto' : 'smooth' }); sync(); };
    ['wheel', 'touchstart', 'pointerdown'].forEach(ev => trk.addEventListener(ev, () => { force = -1; }, { passive: true }));
    trk.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    pills.forEach(p => p.addEventListener('click', () => go(+p.dataset.go)));
    $$('.lph-btn', sec).forEach(b => b.addEventListener('click', () => go(idx() + +b.dataset.dir)));
    trk.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); } });
  });
  {
    const hc = $('#lphcv');
    if (hc) {
      let he = null; const hfit = () => { if (!he) return; const w = Math.max(160, hc.clientWidth), h = Math.max(160, hc.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); hc.width = Math.round(w * dpr); hc.height = Math.round(h * dpr); he.resize(w, h, dpr); };
      const hro = new ResizeObserver(hfit); _lp.hro = hro;
      const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (!he) { he = lpEngine('rays', th, null) || new OrgEngine(D, th, { rm: RM }); he.ctx = hc.getContext('2d'); hro.observe(hc); hfit(); if (RM) he.snap(); } else he.kick(); } else if (he) he.stop(); }), { threshold: 0.5 });
      hio.observe(hc); _lp.hio = hio; _lp.hEng = () => he;
    }
  }
  // seção Gráficos: cada cartão roda o gráfico real da ferramenta (mesmos dados fictícios), só enquanto aparece na tela
  const gcv = $$('.lpg-cv');
  if (gcv.length) {
    const gEng = new Map(), gfit = (cv, en) => { const w = Math.max(160, cv.clientWidth), h = Math.max(120, cv.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); en.resize(w, h, dpr); };
    const gro = new ResizeObserver(es => es.forEach(e => { const en = gEng.get(e.target); if (en) gfit(e.target, en); }));
    const gio = new IntersectionObserver(es => es.forEach(e => {
      const cv = e.target; let en = gEng.get(cv);
      if (e.isIntersecting) {
        if (!en) { try { en = lpEngine(cv.dataset.ch, th, null); } catch (err) { en = null; } if (!en) return; en.ctx = cv.getContext('2d'); gEng.set(cv, en); gro.observe(cv); gfit(cv, en); cv.closest('.lpg-art').classList.add('live'); if (RM) en.snap(); } else en.kick();
      } else if (en) en.stop();
    }), { threshold: 0.45 });
    gcv.forEach(cv => {
      gio.observe(cv); const org = cv.dataset.ch === 'organism';
      cv.addEventListener('mousemove', e => { const en = gEng.get(cv); if (!en) return; const r = cv.getBoundingClientRect(), hit = en.pick(e.clientX - r.left, e.clientY - r.top); if (org) { en.hov.leaf = hit && hit.type === 'leaf' ? hit.i : -1; en.hov.hub = hit && hit.type === 'hub' ? hit.i : -1; en.kick(); cv.style.cursor = hit ? 'pointer' : 'default'; } else { const id = hit === undefined ? null : hit; if (en.setHover) en.setHover(id); cv.style.cursor = id === null ? 'default' : 'pointer'; } });
      cv.addEventListener('mouseleave', () => { const en = gEng.get(cv); if (!en) return; if (org) { en.hov.leaf = -1; en.hov.hub = -1; en.kick(); } else if (en.setHover) en.setHover(null); });
    });
    _lp.gio = gio; _lp.gro = gro; _lp.gEng = gEng;
  }
  // entrada suave das seções ao rolar
  const rv = $$('[data-rv]');
  if (RM || !window.IntersectionObserver) rv.forEach(n => n.classList.add('in'));
  else { const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } }), { threshold: 0.12 }); rv.forEach(n => io2.observe(n)); _lp.io = io2; }
}
function landingUnmount() { if (!_lp) return; window.removeEventListener('scroll', _lp.onScroll); const tp = $('.top'); if (tp) tp.classList.remove('at-top'); if (_lp.eng) _lp.eng.stop(); _lp.ro.disconnect(); if (_lp.timer) clearInterval(_lp.timer); if (_lp.io) _lp.io.disconnect(); if (_lp.io2) _lp.io2.disconnect(); if (_lp.hio) _lp.hio.disconnect(); if (_lp.gio) _lp.gio.disconnect(); if (_lp.gro) _lp.gro.disconnect(); if (_lp.gEng) _lp.gEng.forEach(e => e.stop()); if (_lp.hro) _lp.hro.disconnect(); if (_lp.hEng && _lp.hEng()) _lp.hEng().stop(); _lp = null; }

/* ---- projetos salvos (neste navegador): cartões na página inicial e lista no modal ---- */
function projMeta(p) {
  const fmt = t => new Date(t).toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return `${esc(fmt(p.updated))} · ${esc(p.fileName || '')} · ${esc((I18N[LANG].chart || {})[p.type] || p.type || '')}${p.rows ? ' · ' + esc(fmtInt(p.rows, LANG)) + ' ' + T('org_rows') : ''}`;
}
function projCards(limit) {
  const L = LPT();
  return (S.recents || []).slice(0, limit).map(p => `<article class="pj" data-rv><div class="pj-t">${esc(p.name || p.title || p.fileName)}</div><div class="pj-m">${projMeta(p)}</div><div class="pj-a"><button class="btn sm" data-a="open-rec" data-id="${esc(p.id)}">${T('rec_open')} →</button><button class="btn text sm" data-a="del-rec" data-id="${esc(p.id)}" data-lbl="${esc(T('rec_del'))}" data-cf="${esc(L.confirm)}">${T('rec_del')}</button></div></article>`).join('');
}
function projectsModalBody() {
  const L = LPT(), r = S.recents || [];
  if (!r.length) return `<p class="note" style="margin:0">${esc(L.none)}</p>`;
  return `<div class="pj-list">${r.map(p => `<div class="pjr"><div class="pjr-t"><b>${esc(p.name || p.title || p.fileName)}</b><span>${projMeta(p)}</span></div><div class="pj-a"><button class="btn sm" data-a="open-rec" data-id="${esc(p.id)}">${T('rec_open')} →</button><button class="btn text sm" data-a="del-rec" data-id="${esc(p.id)}" data-lbl="${esc(T('rec_del'))}" data-cf="${esc(L.confirm)}">${T('rec_del')}</button></div></div>`).join('')}</div><p class="note" style="margin:14px 0 0">${esc(L.saved_note)}</p>`;
}
function openProjects() {
  const L = LPT(); S.projModal = true;
  modal({ title: L.proj_h, wide: false, body: projectsModalBody(), actions: [{ label: T('org_card_close'), v: null, kind: 'text' }] }).then(() => { S.projModal = false; });
}
function refreshProjects() { const b = $('.mdl .mdl-b'); if (S.projModal && b) b.innerHTML = projectsModalBody(); if (S.step === 'entry') render(); }
