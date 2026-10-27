// Renderização das páginas do site: cabeçalho, blocos de conteúdo, rodapé, dados estruturados (JSON-LD). Sem JavaScript no navegador.

export const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = o => JSON.stringify(o).replace(/</g, '\\u003c');

// texto corrido: **negrito**, `código`, [texto](destino). Destino: page:id, page:id#ancora, app, #ancora, /caminho ou https://…
export function md(s, ctx) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, dest) => {
    let href;
    if (dest === 'app') href = ctx.appUrl;
    else if (dest.startsWith('page:')) { const [id, hash] = dest.slice(5).split('#'); href = ctx.url(id) + (hash ? '#' + hash : ''); }
    else href = dest.replace(/&amp;/g, '&');
    const ext = /^https?:\/\//.test(href) ? ' rel="noopener" target="_blank"' : '';
    return `<a href="${esc(href)}"${ext}>${txt}</a>`;
  });
  return t;
}

function img(ctx, b) {
  const m = ctx.images[b.img];
  if (!m) throw new Error(`imagem "${b.img}" não existe em site/assets/img/manifest.json`);
  const vs = m.variants, big = vs.find(v => v.w >= 1000) || vs[vs.length - 1];
  const srcset = vs.length > 1 ? ` srcset="${vs.map(v => `${ctx.asset('img/' + v.file)} ${v.w}w`).join(', ')}" sizes="${esc(b.sizes || (b.hero ? '(min-width: 1308px) 1260px, calc(100vw - 48px)' : b.narrow ? '(max-width: 420px) calc(100vw - 42px), 378px' : '(min-width: 1120px) 1080px, calc(100vw - 40px)'))}"` : '';
  return `<img src="${ctx.asset('img/' + big.file)}"${srcset} width="${big.w}" height="${big.h}" alt="${esc(b.alt)}"${b.eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

function renderBlock(b, ctx) {
  const m = s => md(s, ctx);
  switch (b.t) {
    case 'h2': return `<h2${b.id ? ` id="${esc(b.id)}"` : ''}>${m(b.x)}</h2>`;
    case 'h3': return `<h3>${m(b.x)}</h3>`;
    case 'p': return `<p>${m(b.x)}</p>`;
    case 'ul': case 'ol': return `<${b.t}>${b.items.map(i => `<li>${m(i)}</li>`).join('')}</${b.t}>`;
    case 'note': return `<div class="note"><p>${m(b.x)}</p></div>`;
    case 'cards': return `<div class="grid">${b.items.map(c => { const inner = `${c.k ? `<span class="k">${esc(c.k)}</span>` : ''}<h3>${esc(c.h)}</h3><p>${m(c.x)}</p>`; return c.href ? `<a class="card" href="${esc(c.href.startsWith('page:') ? ctx.url(c.href.slice(5)) : c.href)}">${inner}</a>` : `<div class="card">${inner}</div>`; }).join('')}</div>`;
    case 'steps': return `<ol class="steps">${b.items.map(c => `<li><h3>${esc(c.h)}</h3><p>${m(c.x)}</p></li>`).join('')}</ol>`;
    case 'dl': return `<dl class="dl">${b.items.map(c => `<div><dt>${c.id ? `<span id="${esc(c.id)}"></span>` : ''}${m(c.t)}</dt><dd>${m(c.x)}${c.s ? `<small>${m(c.s)}</small>` : ''}</dd></div>`).join('')}</dl>`;
    case 'howcards': return renderHow(b, ctx);
    case 'chartcards': return renderCharts(b, ctx);
    case 'numbers': return `<ul class="nums">${b.items.map(i => `<li><b class="num">${esc(i.n)}</b><span>${m(i.l)}</span>${i.s ? `<small>${m(i.s)}</small>` : ''}</li>`).join('')}</ul>`;
    case 'whocards': return renderWho(b, ctx);
    case 'qtiles': return `<ul class="qt">${b.items.map((i, k) => `<li class="qtile t${k + 1}"><span class="k">${esc(i.h)}</span><p>${m(i.x)}</p></li>`).join('')}</ul>`;
    case 'fig': return `<figure class="${b.hero ? 'stage' : 'fig' + (b.narrow ? ' narrow' : '')}">${img(ctx, b)}${b.cap ? `<figcaption>${m(b.cap)}</figcaption>` : ''}</figure>`;
    case 'table': return `<div class="tbl" role="region" tabindex="0" aria-label="${esc(b.label || '')}"><table>${b.cap ? `<caption class="sr">${esc(b.cap)}</caption>` : ''}<thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${m(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'faq': return `<div class="faq">${b.items.map(q => `<details><summary>${esc(q.q)}</summary>${(Array.isArray(q.a) ? q.a : [q.a]).map(a => `<p>${m(a)}</p>`).join('')}</details>`).join('')}</div>`;
    case 'charts': return `<dl class="dl">${(b.ids || ctx.catalog.charts.map(c => c.id)).map(id => { const c = ctx.catalog.chartById[id]; if (!c) throw new Error(`gráfico "${id}" não existe no catálogo`); const d = ctx.chartText[id]; if (!d) throw new Error(`gráfico "${id}" sem descrição em ${ctx.lang}`); return `<div><dt id="g-${id}">${esc(c.name[ctx.L])}</dt><dd>${m(d)}<small>${esc(c.needs[ctx.L])}</small></dd></div>`; }).join('')}</dl>`;
    case 'stories': return `<dl class="dl">${ctx.catalog.stories.map(s => { const d = ctx.storyText[s.id]; if (!d) throw new Error(`modelo "${s.id}" sem descrição em ${ctx.lang}`); const ch = s.primary ? `${ctx.ui.mainChart}: ${ctx.catalog.chartById[s.primary].name[ctx.L]}${s.alts.length ? ` · ${ctx.ui.altCharts}: ${s.alts.map(a => ctx.catalog.chartById[a].name[ctx.L]).join(', ')}` : ''}` : ''; return `<div><dt id="m-${s.id}">${esc(s.name[ctx.L])}</dt><dd><strong>${esc(s.ask[ctx.L])}</strong><br>${m(d)}${ch ? `<small>${esc(ch)}</small>` : ''}</dd></div>`; }).join('')}</dl>`;
    case 'raw': return b.html(ctx);
    default: throw new Error('bloco desconhecido: ' + b.t);
  }
}
export const renderBlocks = (blocks, ctx) => blocks.map(b => renderBlock(b, ctx)).join('\n');

function renderSection(s, ctx) {
  if (s.chapter) return renderChapter(s, ctx);
  const m = x => md(x, ctx);
  return `<section class="sec${s.alt ? ' alt' : ''}"${s.id ? ` id="${esc(s.id)}"` : ''}><div class="wide sec-h">${s.k ? `<p class="k">${esc(s.k)}</p>` : ''}<h2>${m(s.h2)}</h2>${s.intro ? `<p class="lead">${m(s.intro)}</p>` : ''}</div><div class="wide">${renderBlocks(s.body || [], ctx)}${s.more ? `<p class="sec-more"><a class="lnk" href="${esc(ctx.url(s.more.page))}">${esc(s.more.label)}</a></p>` : ''}</div></section>`;
}

// ---- cartões do Datavix (os da landing do app) com os mini-visuais em HTML: texto e dados vêm da própria landing (src/landing.js, src/i18n*.js)
const IC = { q: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>', up: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>', play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>', ex: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>' };
const ico = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const XI = { present: '<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>', html: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>', png: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>', zip: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>' };
const xi = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XI[k]}</svg>`;
// ---- clipe de um gráfico real do app: imagem de abertura (poster) + iframe preguiçoso com o vídeo. O iframe só carrega quando o cartão chega perto da tela (sem JavaScript);
// quem pede menos movimento fica só com a imagem. O vídeo é gravado sobre fundo preto e somado ao brilho do cartão (mix-blend-mode: screen).
function art(ctx, key, alt, cls = '') {
  const c = ctx.clips[ctx.L === 'en' && ctx.clips[key + '-en'] ? key + '-en' : key];
  if (!c) throw new Error(`clipe "${key}" não existe (rode scripts/make-clips.mjs)`);
  return `<div class="art${cls ? ' ' + cls : ''}"><img class="poster" src="${c.poster}" width="${c.w}" height="${c.h}" alt="${esc(alt)}" loading="lazy" decoding="async"><iframe class="clip" src="${c.doc}" title="${esc(alt)}" width="${c.w}" height="${c.h}" loading="lazy" scrolling="no" tabindex="-1" aria-hidden="true"></iframe></div>`;
}
const ALSO = ['bars', 'hbars', 'stacked100', 'treemap', 'pie', 'donut', 'pies', 'donuts', 'packed', 'cols', 'lines', 'radial', 'radar', 'box', 'words', 'bubmap', 'isomap', 'race', 'line', 'area', 'calendar', 'scatter', 'bubble', 'kpi'];
function renderCharts(b, ctx) {
  ctx.state.icons = true; const L = ctx.L, I = ctx.icons.icon, cat = ctx.catalog.chartById;
  const cards = b.items.map((it, i) => { const c = cat[it.id], d = ctx.chartText[it.id]; if (!c || !d) throw new Error(`gráfico "${it.id}" sem texto`); const nm = c.name[L];
    return `<li class="sc gc t${i + 1}"><div class="sc-top"><span class="sc-ic cw">${I(it.id)}</span><span class="sc-k">${esc(it.k)}</span></div><h3>${esc(nm)}</h3><p>${md(d, ctx)}</p>${art(ctx, it.id, `${nm}: ${ctx.ui.chartAlt}`)}</li>`; }).join('');
  const pills = ALSO.map(id => `<a class="pill" href="${ctx.url('charts')}#g-${id}">${I(id)}${esc(cat[id].name[L])}</a>`).join('');
  return `<ol class="tiles c3" tabindex="0" aria-label="${esc(b.label || '')}">${cards}</ol><p class="pills"><span class="k">${esc(ctx.ui.also)}</span>${pills}</p>`;
}

// ---- "Para quem": três cartões com um pedaço do produto (os da landing do app)
const WHO_PAL = [['corporate', ['#1f5fa8', '#e07b39', '#4a9d6f', '#8b6bb1', '#c0504d']], ['editorial', ['#b5391b', '#d9962b', '#3d7a57', '#2f5d8a', '#8a6d9e']], ['vibrant', ['#ff3d71', '#ffb800', '#00c2ff', '#8b5cf6', '#00e676']]];
function renderWho(b, ctx) {
  const { I18N, LP } = ctx.landing, I = I18N[ctx.L], F = LP[ctx.L].fr, H = LP[ctx.L].hw, en = ctx.L === 'en', e = esc;
  const nf = n => en ? n.toFixed(1) + 'K' : n.toFixed(1).replace('.', ',') + ' mil', rows = [['SC', 3.5], ['ES', 2.9], ['PE', 2.3], ['BA', 1.9], ['MG', 1.9]];
  const va1 = `<div class="va1"><div class="xsheet">${rows.map(([u, v]) => `<span>${u}</span><span>${nf(v)}</span>`).join('')}</div><svg viewBox="0 0 10 10" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M1 5h7M5.5 2.5L8 5 5.5 7.5"/></svg><div class="xbars"><b class="h1"></b><b class="h2"></b><b class="h3"></b><b class="h4"></b><b class="h5"></b></div></div>`;
  const va2 = `<div class="va2"><div class="xins"><div class="xlbl">[ INSIGHT // 01 ]</div><p>${e(F.ins.replace('{u}', 'SC').replace('{p}', '16%'))}</p><div class="xcalc"><span>${e(F.calc)}</span><span>${nf(3.5)} / ${nf(22.4)}</span></div></div></div>`;
  const va3 = `<div class="va3">${WHO_PAL.map(([k, cols], i) => `<div><span>${e(H.cli)} ${'ABC'[i]}</span><svg viewBox="0 0 63 10" aria-hidden="true">${cols.map((c, j) => `<circle cx="${5 + j * 13}" cy="5" r="5" fill="${c}"/>`).join('')}</svg><small>${e(I.pal[k])}</small></div>`).join('')}</div>`;
  return `<ul class="qc-grid">${b.items.map((it, i) => `<li class="qcard"><div class="qvis" aria-hidden="true">${[va1, va2, va3][i]}</div><h3>${e(it.h)}</h3><p>${md(it.x, ctx)}</p></li>`).join('')}</ul>`;
}

// ---- capítulos grandes (a frase de 64 px, o texto, três fatos e um visual), como os capítulos das páginas de produto da Apple
function chapVisual(v, ctx) {
  const m = x => md(x, ctx);
  if (v.kind === 'slide') return `<figure class="display">${img(ctx, { img: v.img, alt: v.alt, sizes: v.sizes || '(min-width: 1308px) 1260px, calc(100vw - 48px)' })}${v.cap ? `<figcaption>${m(v.cap)}</figcaption>` : ''}</figure>`;
  if (v.kind === 'deck') return `<div class="deck" role="group" aria-label="${esc(v.label || '')}">${img(ctx, { img: v.imgs[1], alt: v.alts[1], sizes: '(min-width: 1069px) 44vw, calc(100vw - 80px)' }).replace('<img', '<img class="back"')}${img(ctx, { img: v.imgs[0], alt: v.alts[0], sizes: '(min-width: 1069px) 44vw, calc(100vw - 80px)' }).replace('<img', '<img class="front"')}${(v.chips || []).map((c, i) => `<span class="chip c${i + 1}">${esc(c)}</span>`).join('')}</div>`;
  if (v.kind === 'phones') return `<div class="phones">${v.imgs.map((n, i) => `<figure class="phone">${img(ctx, { img: n, alt: v.alts[i], sizes: '(min-width: 1069px) 290px, 44vw' })}</figure>`).join('')}</div>${v.cap ? `<p class="vcap">${m(v.cap)}</p>` : ''}`;
  if (v.kind === 'diagram') { const d = v; return `<div class="dg" role="img" aria-label="${esc(d.label)}"><div class="dg-row"><div class="dg-n"><b>${esc(d.a.t)}</b><small>${esc(d.a.s)}</small></div><span class="dg-ar"></span><div class="dg-n win"><i class="dots"><u></u><u></u><u></u></i><b>${esc(d.b.t)}</b><ul>${d.b.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><span class="dg-ar"></span><div class="dg-n"><b>${esc(d.c.t)}</b><small>${esc(d.c.s)}</small></div></div><div class="dg-srv"><span>${esc(d.srv.t)}</span><b>${esc(d.srv.s)}</b></div></div>`; }
  throw new Error('visual desconhecido: ' + v.kind);
}
function renderChapter(s, ctx) {
  const m = x => md(x, ctx), facts = s.facts ? `<ul class="facts">${s.facts.map(f => `<li>${m(f)}</li>`).join('')}</ul>` : '';
  const text = `<div class="chap-t">${s.k ? `<p class="k">${esc(s.k)}</p>` : ''}<h2>${m(s.h2)}</h2><p class="lead">${m(s.lead)}</p>${facts}${s.more ? `<p class="sec-more"><a class="lnk" href="${esc(ctx.url(s.more.page))}">${esc(s.more.label)}</a></p>` : ''}</div>`;
  return `<section class="sec chap ${s.layout || 'split'}${s.alt ? ' alt' : ''}"${s.id ? ` id="${esc(s.id)}"` : ''}><div class="wide chap-in">${text}<div class="chap-v">${chapVisual(s.visual, ctx)}</div></div></section>`;
}

function renderHow(b, ctx) {
  const { I18N, LP, PALETTES } = ctx.landing, I = I18N[ctx.L], H = LP[ctx.L].hw, aud = I.o.audience, e = esc;
  const cols = (ctx.L === 'en' ? ['Year', 'State', 'Category', 'Revenue'] : ['Ano', 'UF', 'Categoria', 'Receita']).map((n, i) => [n, i < 3 ? H.cat : H.num]);
  const v1 = `<div class="v1"><div class="xdots"><i class="on"></i><i></i><i></i><i></i></div><div class="xq">${e(I.q_audience[0])} <b>${e(I.q_audience[1])}</b></div><div class="xopts">${['board', 'clevel', 'director', 'team'].map(k => `<span${k === 'director' ? ' class="on"' : ''}><b>${e(aud[k][0])}</b><small>${e(aud[k][1])}</small></span>`).join('')}</div></div>`;
  const v2 = `<div class="v2"><div class="xdrop"><b>${e(H.drop)}</b><small>.xlsx · .xls · .csv</small></div><div class="xfile"><span>${e(H.file)}</span><em>${e(H.rows.replace('{n}', '93'))}</em><i class="xbar"><u></u></i></div><div><div class="xlbl">${e(H.det)}</div><div class="xcols">${cols.map(c => `<span>${e(c[0])}<small>${e(c[1])}</small></span>`).join('')}</div></div></div>`;
  const v3 = b.clip ? art(ctx, b.clip, b.imgAlt, 'v3') : img(ctx, { img: b.img, alt: b.imgAlt });
  const sw = ['cosmos', 'corporate', 'editorial', 'tech', 'vibrant'], ex = [['present', I.present], ['html', I.ex_html], ['png', I.ex_png], ['zip', I.ex_steps]];
  const v4 = `<div class="v4"><div class="xtabs">${H.tabs.map((t, i) => `<span${i === 2 ? ' class="on"' : ''}>${e(t)}</span>`).join('')}</div><div class="xpal"><div class="xlbl">${e(I.pal_h)}</div>${sw.map((k, i) => `<div class="pr${i === 0 ? ' on' : ''}"><span>${e(I.pal[k])}</span><svg viewBox="0 0 67 11" aria-hidden="true">${PALETTES[k].slice(0, 5).map((c, j) => `<circle cx="${5.5 + j * 14}" cy="5.5" r="5.5" fill="${c}"/>`).join('')}</svg></div>`).join('')}</div><div class="xexp">${ex.map(([k, t]) => `<span>${xi(k)}${e(t)}</span>`).join('')}</div></div>`;
  const vis = [v1, v2, v3, v4];
  return `<ol class="tiles" tabindex="0" aria-label="${e(b.label || '')}">${b.items.map((it, i) => `<li class="sc t${i + 1}"><div class="sc-top"><span class="sc-ic">${ico(['q', 'up', 'play', 'ex'][i])}</span><span class="sc-n">0${i + 1}</span></div><h3>${e(it.h)}</h3><p>${md(it.x, ctx)}</p><div class="vis"${i === 2 ? '' : ' aria-hidden="true"'}>${vis[i]}</div></li>`).join('')}</ol>`;
}

function header(ctx) {
  const { ui, page } = ctx, alt = ctx.alt(page.id);
  const links = (opt) => ui.nav.map(([id, label, o]) => `<a href="${ctx.url(id)}"${id === page.id ? ' aria-current="page"' : ''}${opt && o ? ' class="opt"' : ''}>${esc(label)}</a>`).join('');
  return `<header class="gn"><div class="gn-in"><a class="brand" href="${ctx.url('home')}" aria-label="Datavix"><i></i>DATAVIX</a>
<nav class="gn-links" aria-label="${esc(ui.navLabel)}">${links(true)}</nav>
<div class="gn-act">${alt ? `<a class="lang" href="${alt.path}" hreflang="${alt.hreflang}" lang="${alt.hreflang}" title="${esc(ui.langTitle)}">${esc(ui.langShort)}</a>` : ''}<a class="btn sm" href="${ctx.appUrl}">${esc(ui.cta)}</a>
<details class="gn-menu"><summary aria-label="${esc(ui.menu)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></summary><nav class="gn-list" aria-label="${esc(ui.navLabel)}">${links(false)}<a class="btn" href="${ctx.appUrl}">${esc(ui.cta)}</a></nav></details></div></div></header>`;
}

function footer(ctx) {
  const { ui } = ctx, f = ui.footer;
  return `<footer class="foot"><div class="wrap"><div><a class="brand" href="${ctx.url('home')}" aria-label="Datavix"><i></i>DATAVIX</a><p>${esc(f.tagline)} ${esc(f.about)}</p></div>
${f.cols.map(c => `<div><h2>${esc(c.h)}</h2><ul>${c.ids.map(id => `<li><a href="${ctx.url(id)}">${esc(ctx.pageLabel(id))}</a></li>`).join('')}${c.extra ? c.extra.map(([l, h]) => `<li><a href="${esc(h)}" rel="noopener" target="_blank">${esc(l)}</a></li>`).join('') : ''}</ul></div>`).join('')}
<p class="fine">${esc(f.fine)}${ctx.alt('home') ? ` <a href="${ctx.alt('home').path}" hreflang="${ctx.alt('home').hreflang}" lang="${ctx.alt('home').hreflang}">${esc(ui.langName)}</a>` : ''}</p></div></footer>`;
}

function crumbs(ctx) {
  const { ui, page } = ctx; if (page.id === 'home') return '';
  return `<nav aria-label="${esc(ui.crumbsLabel)}"><ol class="crumbs"><li><a href="${ctx.url('home')}">${esc(ui.homeCrumb)}</a></li><li aria-current="page">${esc(ctx.pageLabel(page.id))}</li></ol></nav>`;
}

function structured(ctx) {
  const { page, origin, lang } = ctx, url = origin + ctx.url(page.id), orgId = origin + '/#org', siteId = origin + '/#website', appId = origin + '/#app';
  const logo = { '@type': 'ImageObject', '@id': origin + '/#logo', url: origin + '/icons/icon-512.png', width: 512, height: 512 };
  const sameAs = ['https://github.com/caiospot/Datavix', ...(ctx.sameAs || [])];
  const g = [];
  g.push({ '@type': 'Organization', '@id': orgId, name: 'Datavix', url: origin + '/', logo, sameAs, ...(ctx.contactEmail ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: ctx.contactEmail, availableLanguage: ['pt-BR', 'en'] } } : {}) });
  g.push({ '@type': 'WebSite', '@id': siteId, url: origin + '/', name: 'Datavix', inLanguage: ['pt-BR', 'en'], publisher: { '@id': orgId } });
  g.push({ '@type': 'WebApplication', '@id': appId, name: 'Datavix', url: origin + '/app/', applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser', browserRequirements: 'Requires a modern browser with JavaScript enabled', inLanguage: ['pt-BR', 'en'], isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }, description: ctx.appDesc, featureList: ctx.featureList, publisher: { '@id': orgId } });
  const pageType = page.ld === 'article' ? 'Article' : page.ld === 'faq' ? 'FAQPage' : page.ld === 'collection' ? 'CollectionPage' : 'WebPage';
  const wp = { '@type': pageType, '@id': url + '#webpage', url, name: page.title, description: page.desc, inLanguage: lang, isPartOf: { '@id': siteId }, about: { '@id': appId }, primaryImageOfPage: { '@type': 'ImageObject', url: origin + '/og/' + page.og + '.png', width: 1200, height: 630 }, datePublished: page.published || page.updated, dateModified: page.updated };
  if (pageType === 'Article') { wp.headline = page.h1; wp.image = origin + '/og/' + page.og + '.png'; wp.author = { '@id': orgId }; wp.publisher = { '@id': orgId }; wp.mainEntityOfPage = url; }
  if (page.id !== 'home') wp.breadcrumb = { '@id': url + '#breadcrumb' };
  const faq = ctx.faqItems(page);
  if (faq.length && pageType === 'FAQPage') wp.mainEntity = faq.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: (Array.isArray(q.a) ? q.a : [q.a]).map(plain).join(' ') } }));
  g.push(wp);
  if (page.id !== 'home') g.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: ctx.ui.homeCrumb, item: origin + ctx.url('home') }, { '@type': 'ListItem', position: 2, name: ctx.pageLabel(page.id), item: url }] });
  // perguntas da página inicial: FAQPage próprio, só quando a página não é, ela mesma, a de perguntas
  if (faq.length && pageType !== 'FAQPage') g.push({ '@type': 'FAQPage', '@id': url + '#faq', url, inLanguage: lang, mainEntity: faq.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: (Array.isArray(q.a) ? q.a : [q.a]).map(plain).join(' ') } })) });
  return `<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@graph': g })}</script>`;
}
// texto sem marcação (para o JSON-LD e o llms.txt)
export const plain = s => String(s).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

export function renderPage(ctx) {
  const { page, ui, origin } = ctx, url = origin + ctx.url(page.id), og = `${origin}/og/${page.og}.png`;
  const alts = ctx.hreflangs(page.id);
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.desc)}">`,
    `<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}">`,
    `<link rel="canonical" href="${url}">`,
    ...alts.map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${origin}${a.path}">`),
    '<meta name="color-scheme" content="dark light">',
    '<meta name="theme-color" content="#0b0d0a" media="(prefers-color-scheme: dark)"><meta name="theme-color" content="#f8f9f5" media="(prefers-color-scheme: light)">',
    '<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">',
    `<link rel="preload" href="${ctx.fontUrl.geist}" as="font" type="font/woff2" crossorigin><link rel="preload" href="${ctx.fontUrl.mono}" as="font" type="font/woff2" crossorigin>`,
    `<meta property="og:type" content="website"><meta property="og:site_name" content="Datavix"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${ui.ogLocale}">${alts.filter(a => a.hreflang !== ctx.lang && a.hreflang !== 'x-default').map(a => `<meta property="og:locale:alternate" content="${a.ogLocale}">`).join('')}`,
    `<meta property="og:image" content="${og}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(page.ogAlt || page.title)}">`,
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(page.title)}"><meta name="twitter:description" content="${esc(page.desc)}"><meta name="twitter:image" content="${og}"><meta name="twitter:image:alt" content="${esc(page.ogAlt || page.title)}">`,
    ...(page.id === 'home' && ctx.gsc ? [`<meta name="google-site-verification" content="${esc(ctx.gsc)}">`] : []),
    ...(page.id === 'home' && ctx.bing ? [`<meta name="msvalidate.01" content="${esc(ctx.bing)}">`] : []),
    `<meta http-equiv="Content-Security-Policy" content="${esc(ctx.csp)}">`,
    ctx.noLd ? '' : structured(ctx),
    `<style>${ctx.css}</style>`,
  ].filter(Boolean).join('\n');

  let body;
  if (page.id === 'home') {
    body = `<main id="main"><section class="hero"><div class="wrap"><p class="eyebrow">${esc(page.kicker)}</p><h1>${md(page.h1, ctx)}</h1><p class="lead">${md(page.lead, ctx)}</p>
<div class="cta"><a class="btn" href="${ctx.appUrl}">${esc(ui.cta)}</a><a class="lnk" href="#${esc(page.sections[0].id)}">${esc(page.secondary)}</a></div>
<ul class="chips">${page.chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>${renderBlocks([page.hero], ctx)}</section>
${page.sections.map(s => renderSection(s, ctx)).join('\n')}
<section class="band"><div class="wrap"><h2>${md(page.cta.h, ctx)}</h2><p>${md(page.cta.x, ctx)}</p><div class="cta"><a class="btn" href="${ctx.appUrl}">${esc(page.cta.btn || ui.cta)}</a></div></div></section></main>`;
  } else {
    if (['faq', 'privacy'].includes(page.id)) {
      const rel = (page.related || []).map(id => `<a class="card" href="${ctx.url(id)}"><span class="k">${esc(ui.readMore)}</span><h3>${esc(ctx.pageLabel(id))}</h3><p>${esc(ctx.pageSummary(id))}</p></a>`).join('');
      body = `<main id="main" class="page"><div class="wrap">${crumbs(ctx)}<h1>${esc(page.h1)}</h1><p class="lead">${md(page.lead, ctx)}</p>${page.noDate ? '' : `<p class="upd">${esc(ui.updated)} <time datetime="${page.updated}">${esc(ctx.dateText(page.updated))}</time></p>`}
<div class="prose">${renderBlocks(page.blocks, ctx)}</div>
${rel ? `<aside class="rel" aria-labelledby="rel-h"><h2 id="rel-h">${esc(ui.related)}</h2><div class="grid">${rel}</div></aside>` : ''}</div>
${page.cta ? `<section class="band"><div class="wrap"><h2>${md(page.cta.h, ctx)}</h2><p>${md(page.cta.x, ctx)}</p><div class="cta"><a class="btn" href="${ctx.appUrl}">${esc(page.cta.btn || ui.cta)}</a></div></div></section>` : ''}</main>`;
    } else {
      // página de produto: os blocos viram capítulos (um por h2), em faixas que se alternam, com sub-navegação fixa
      const intro = [], chs = []; for (const b of page.blocks) { if (b.t === 'h2') chs.push({ id: b.id, h: b.x, blocks: [] }); else (chs.length ? chs[chs.length - 1].blocks : intro).push(b); }
      const sub = `<nav class="sub" aria-label="${esc(ui.onPage)}"><div class="wide sub-in"><span class="sub-t">${esc(ctx.pageLabel(page.id))}</span><ul>${chs.filter(c => c.id).map(c => `<li><a href="#${esc(c.id)}">${md(c.h.replace(/^\d+\.\s*/, ''), ctx)}</a></li>`).join('')}</ul><a class="btn sm" href="${ctx.appUrl}">${esc(ui.cta)}</a></div></nav>`;
      const chap = (c, k) => `<section class="sec pc${k % 2 ? ' alt' : ''}"${c.id ? ` id="${esc(c.id)}"` : ''}><div class="wide pc-in"><div class="pc-h"><p class="k">${String(k + 1).padStart(2, '0')}</p><h2>${md(c.h, ctx)}</h2></div><div class="prose">${renderBlocks(c.blocks, ctx)}</div></div></section>`;
      const rel = (page.related || []).map((id, k) => `<li class="qtile t${k + 1} rc"><span class="k">${esc(ui.readMore)}</span><div><p><a href="${ctx.url(id)}">${esc(ctx.pageLabel(id))}</a></p><small>${esc(ctx.pageSummary(id))}</small></div></li>`).join('');
      body = `<main id="main" class="pp"><section class="phero"><div class="wide">${crumbs(ctx)}<h1>${esc(page.h1)}</h1><p class="lead">${md(page.lead, ctx)}</p><div class="cta"><a class="btn" href="${ctx.appUrl}">${esc(ui.cta)}</a></div>${page.noDate ? '' : `<p class="upd">${esc(ui.updated)} <time datetime="${page.updated}">${esc(ctx.dateText(page.updated))}</time></p>`}</div></section>
${sub}
${intro.length ? `<section class="sec"><div class="wide"><div class="prose">${renderBlocks(intro, ctx)}</div></div></section>` : ''}
${chs.map(chap).join('\n')}
${rel ? `<section class="sec${chs.length % 2 ? ' alt' : ''}" aria-labelledby="rel-h"><div class="wide"><h2 id="rel-h" class="rel-h">${esc(ui.related)}</h2><ul class="qt rq">${rel}</ul></div></section>` : ''}
${page.cta ? `<section class="band"><div class="wrap"><h2>${md(page.cta.h, ctx)}</h2><p>${md(page.cta.x, ctx)}</p><div class="cta"><a class="btn" href="${ctx.appUrl}">${esc(page.cta.btn || ui.cta)}</a></div></div></section>` : ''}</main>`;
    }
  }
  return `<!doctype html>\n<html lang="${ctx.lang}">\n<head>\n${head}\n</head>\n<body>\n<a class="skip" href="#main">${esc(ui.skip)}</a>\n${ctx.state.icons ? ctx.icons.defs() + '\n' : ''}${header(ctx)}\n${body}\n${footer(ctx)}\n</body>\n</html>\n`;
}
