/* Datavix: landing page (página inicial). Só da interface do produto. Imagens são placeholders até haver arte final. */

const LP = {
  pt: {
    nav: [['como', 'Como funciona'], ['graficos', 'Gráficos'], ['diferenciais', 'Diferenciais'], ['faq', 'FAQ']],
    start: 'Começar agora', newp: 'Novo projeto', how_cta: 'Ver como funciona',
    hero_k: 'Tudo vira dado.', hero_h: ['Da planilha ao', 'storytelling'],
    hero_p: 'O Datavix transforma a sua planilha em dataviz executivo animado e interativo. Tudo acontece no seu navegador: a planilha não sai do seu computador.',
    chips: ['XLSX · XLS · CSV', 'Exporta HTML offline', 'PT / EN'], hero_cap: 'Árvore radial com dados fictícios. Passe o mouse.',
    how_k: 'Como funciona', how_h: ['Quatro passos, zero', 'designer'],
    steps: [
      ['Responda 4 perguntas', 'Qual é a sua área, para quem é, que decisão você quer provocar e quanto tempo tem. Depois da planilha, o Datavix mostra o que encontrou e escolhe o gráfico.', 'opções de público na primeira pergunta do Datavix'],
      ['Suba a planilha', 'Excel ou CSV com dezenas de milhares de linhas. Reconhecemos colunas, datas, números em formato brasileiro e a qualidade dos dados.', 'área para arrastar ou escolher a planilha'],
      ['Veja a animação', 'O gráfico entra com animação orquestrada. Insights só aparecem com cálculo que os sustente, e o “ver cálculo” mostra a conta.', 'detalhe da árvore radial animada: períodos, ramos e cada registro como uma bolha'],
      ['Edite e exporte', 'Troque gráfico, paleta, fundo e fontes. Exporte HTML interativo que abre offline, PNG ou um ZIP com um PNG por etapa.', 'painel de exportação: apresentar, HTML, PNG e ZIP'],
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
    hero_k: 'Everything becomes data.', hero_h: ['From spreadsheet to', 'storytelling'],
    hero_p: 'Datavix turns your spreadsheet into animated, interactive executive dataviz. Everything happens in your browser: the spreadsheet never leaves your computer.',
    chips: ['XLSX · XLS · CSV', 'Exports offline HTML', 'PT / EN'], hero_cap: 'Radial tree with sample data. Hover it.',
    how_k: 'How it works', how_h: ['Four steps, zero', 'designers'],
    steps: [
      ['Answer 4 questions', 'Which area you work in, who it is for, which decision you want to trigger and how much time you have. After the spreadsheet, Datavix shows what it found and picks the chart.', 'audience options on the first Datavix question'],
      ['Upload the spreadsheet', 'Excel or CSV with tens of thousands of rows. We detect columns, dates, number formats and data quality.', 'area to drag or pick the spreadsheet'],
      ['Watch it animate', 'The chart enters with orchestrated animation. Insights only appear when a calculation supports them, and “see calculation” shows the math.', 'detail of the animated radial tree: periods, branches and each record as a bubble'],
      ['Edit and export', 'Change chart, palette, background and fonts. Export interactive HTML that opens offline, a PNG, or a ZIP with one PNG per step.', 'export panel: present, HTML, PNG and ZIP'],
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
const lpChart = (id, label) => `<figure class="ch-art" role="img" aria-label="${esc(label)}">${chartIcon(id)}</figure>`;
const lpPh = (label, ratio = '16/10', k) => `<figure class="ph" style="aspect-ratio:${ratio}"><div class="ph-in"><span class="lbl">[ ${LPT().ph}${k ? ' ' + k : ''} ]</span><em>${esc(label)}</em></div></figure>`;

function landingHtml() {
  const L = LPT(), mine = S.user;
  const cta = mine ? `<button class="btn" data-a="start">${L.newp} →</button>` : `<button class="btn" data-a="start">${L.start} →</button>`;
  return `<div class="lp">
  <section class="lp-hero" id="top"><div class="lp-stick">
    <div class="lp-glow" aria-hidden="true"></div>
    <div class="lp-clip"><div class="lp-treewrap"><canvas id="lpcv" aria-label="${esc(L.hero_cap)}" role="img"></canvas></div></div>
    <div class="lp-copy">
      <div class="lp-eyebrow">${esc(L.hero_k)}</div>
      <h1 class="lp-h1">${lpTitle(L.hero_h[0], L.hero_h[1])}</h1>
      <p class="lp-sub">${esc(L.hero_p)}</p>
      <div class="lp-cta">${cta}<a class="btn ghost" href="#como" data-a="anchor">${L.how_cta}</a></div>
      <div class="lp-meta">${L.chips.map(c => `<span>${esc(c)}</span>`).join('<i></i>')}</div>
    </div>
    <div class="lp-capline" aria-hidden="true">${esc(L.hero_cap)}</div>
    <div class="lp-cue" aria-hidden="true"><i></i></div>
  </div></section>
  ${(S.recents || []).length ? `<section class="lp-sec lp-saved" id="salvos"><div class="lbl">[ ${esc(L.saved_k)} ]</div><h2>${lpTitle(L.saved_h[0], L.saved_h[1])}</h2><div class="pj-grid">${projCards(6)}</div><div class="row pj-more">${S.recents.length > 6 ? `<button class="btn ghost sm" data-a="projects">${L.all} (${S.recents.length})</button>` : ''}<span class="note">${esc(L.saved_note)}</span></div></section>` : ''}
  <section class="lp-sec" id="como"><div class="lbl">[ ${esc(L.how_k)} ]</div><h2>${lpTitle(L.how_h[0], L.how_h[1])}</h2>
    <div class="lp-steps">${L.steps.map((s, i) => `<article class="lp-step" data-rv><div class="lp-n num">${String(i + 1).padStart(2, '0')}</div>${lpShot(LP_IMGS[i], s[2])}<h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></article>`).join('')}</div></section>
  <section class="lp-sec" id="graficos"><div class="lbl">[ ${esc(L.ch_k)} ]</div><h2>${lpTitle(L.ch_h[0], L.ch_h[1])}</h2><p class="sub">${esc(L.ch_p)}</p>
    <div class="lp-charts">${L.charts.map((c, i) => `<article class="lp-ch" data-rv>${lpChart(LP_CH_ICON[i], c[0])}<div class="lp-ch-b"><div class="lp-ch-h"><h3>${esc(c[0])}</h3><span class="tag${c[2] ? ' on' : ''}">${c[2] ? L.avail : L.soon}</span></div><p>${esc(c[1])}</p></div></article>`).join('')}</div>
    <p class="lp-also"><span>${esc(T('lp_also'))}</span>${['bars', 'hbars', 'stacked100', 'treemap', 'pie', 'donut', 'pies', 'donuts', 'packed', 'race', 'line', 'area', 'calendar', 'scatter', 'bubble', 'kpi'].map(t => `<b>${chartIcon(t)}${esc(T('chart')[t])}</b>`).join('')}</p></section>
  <section class="lp-sec" id="diferenciais"><div class="lbl">[ ${esc(L.df_k)} ]</div><h2>${lpTitle(L.df_h[0], L.df_h[1], L.df_h2)}</h2>
    <div class="lp-diffs">${L.diffs.map((d, i) => `<article class="lp-df" data-rv><div class="lbl">${String(i + 1).padStart(2, '0')}</div><h3>${esc(d[0])}</h3><p>${esc(d[1])}</p></article>`).join('')}</div></section>
  <section class="lp-sec"><div class="lbl">[ ${esc(L.au_k)} ]</div>
    <div class="lp-aud">${L.aud.map(a => `<article data-rv><h3>${esc(a[0])}</h3><p>${esc(a[1])}</p></article>`).join('')}</div></section>
  <section class="lp-sec lp-faq" id="faq"><div class="lbl">[ ${esc(L.faq_k)} ]</div>
    <div>${L.faq.concat(npsOn() ? [[T('nps_faq_q'), T('nps_faq_a')]] : []).map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div></section>
  <section class="lp-final"><h2>${lpTitle(L.cta_h[0], L.cta_h[1])}</h2><div class="row" style="justify-content:center;margin-top:26px">${cta}</div></section>
  <footer class="lp-foot"><span class="brand-s"><i></i>DATAVIX</span><span class="note">${esc(L.hero_k)} · ${esc(L.foot)} · <button type="button" class="lp-fb" data-a="privacy">${esc(privT().link)}</button>${npsOn() ? ` · <button type="button" class="lp-fb" data-a="feedback">${esc(T('nps_fb'))}</button>` : ''}${anFooter()}</span></footer></div>`;
}

/* ---- árvore radial ao vivo no hero (dados fictícios, mesmo motor do produto) ---- */
function landingData() {
  const rnd = orgRand(42), yrs = [2018, 2019, 2020, 2021, 2022, 2023, 2024], ents = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'PE', 'CE', 'GO', 'DF', 'ES'];
  const cols = (LANG === 'pt' ? ['Moda', 'Casa', 'Mercado', 'Eletrônicos', 'Beleza', 'Esportes'] : ['Fashion', 'Home', 'Grocery', 'Electronics', 'Beauty', 'Sports']).map(l => ({ label: l, v: 0, n: 0 }));
  const hubs = yrs.map(y => ({ label: String(y), v: 0, n: 0 })), leaves = [];
  hubs.forEach((_, h) => ents.forEach((_, e) => { if (rnd() < 0.62) { const k = 1 + Math.floor(rnd() * 3); for (let j = 0; j < k; j++) leaves.push([h, e, Math.floor(rnd() * cols.length), 10 + Math.pow(rnd(), 3) * 900, 1, '', null]); } }));
  return { hubName: LANG === 'pt' ? 'Ano' : 'Year', entName: LANG === 'pt' ? 'UF' : 'State', colName: LANG === 'pt' ? 'Categoria' : 'Category', sizeName: LANG === 'pt' ? 'Receita' : 'Revenue', unit: null, grain: 'year', perRow: false, rowsUsed: leaves.length, rowsTotal: leaves.length, hubs, ents: ents.map(l => ({ label: l, v: 0, n: 0 })), cols, leaves, fields: [] };
}
let _lp = null;
function landingMount() {
  landingUnmount();
  const cv = $('#lpcv'); if (!cv) return;
  const dark = S.ui === 'dark', th = { base: dark ? '#0b0d0a' : '#eef0eb', fg: dark ? '#eef0eb' : '#0b0d0a', colors: PALETTES.cosmos.slice(), font: "Geist, system-ui, sans-serif" };
  const eng = new OrgEngine(landingData(), th, { rm: RM }); eng.ctx = cv.getContext('2d');
  const fit = () => { const w = Math.max(240, cv.clientWidth), h = Math.max(240, cv.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); eng.resize(w, h, dpr); };
  const ro = new ResizeObserver(fit); ro.observe(cv); fit(); if (RM) eng.snap();
  let t = 0, idle = true;
  const timer = RM ? 0 : setInterval(() => { if (!idle || document.hidden) return; t++; const n = eng.D.hubs.length, ph = t % (n + 2); eng.setState({ focus: ph < n ? ph : null }); }, 3200);
  const mv = e => { const r = cv.getBoundingClientRect(), hit = eng.pick(e.clientX - r.left, e.clientY - r.top); idle = !hit; eng.hov.leaf = hit && hit.type === 'leaf' ? hit.i : -1; eng.hov.hub = hit && hit.type === 'hub' ? hit.i : -1; cv.style.cursor = hit ? 'pointer' : 'default'; eng.kick(); };
  const lv = () => { idle = true; eng.hov.leaf = -1; eng.hov.hub = -1; eng.kick(); };
  cv.addEventListener('mousemove', mv); cv.addEventListener('mouseleave', lv);
  _lp = { eng, ro, timer };
  // rolagem ligada à animação: o texto recua e a árvore sobe e se revela (só no desktop e sem movimento reduzido)
  const hero = $('.lp-hero'), top = $('.top'), narrow = () => innerWidth < 860 || RM;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false; if (top) top.classList.toggle('at-top', scrollY < 8);
      if (!hero) return; const max = hero.offsetHeight - innerHeight, p = narrow() || max <= 0 ? 0 : Math.max(0, Math.min(1, scrollY / max));
      hero.style.setProperty('--p', p.toFixed(4)); idle = p > 0.15 ? idle : true;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); _lp.onScroll = onScroll; onScroll();
  // entrada suave das seções ao rolar
  const rv = $$('[data-rv]');
  if (RM || !window.IntersectionObserver) rv.forEach(n => n.classList.add('in'));
  else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }); rv.forEach(n => io.observe(n)); _lp.io = io; }
}
function landingUnmount() { if (!_lp) return; window.removeEventListener('scroll', _lp.onScroll); window.removeEventListener('resize', _lp.onScroll); const tp = $('.top'); if (tp) tp.classList.remove('at-top'); _lp.eng.stop(); _lp.ro.disconnect(); if (_lp.timer) clearInterval(_lp.timer); if (_lp.io) _lp.io.disconnect(); _lp = null; }

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
